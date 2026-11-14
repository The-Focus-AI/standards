import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { parseYaml, splitFrontmatter } from "./yaml.mjs";
import { blocks, slugify, renderBlock } from "./markdown.mjs";
import { readLock } from "../restore-skills.mjs";

export const SITE_URL = "https://standards.thefocus.ai";
export const sourceUrl = (path, directory = false) =>
  `https://github.com/The-Focus-AI/standards/${directory ? "tree" : "blob"}/main/${path}`;
export const pageUrl = (path) => path === "CHANGELOG.md" ? "changelog.html" : path.replace(/\.md$/, ".html");

const CATEGORY_ROOTS = new Set(["handbook", "recipes", "evidence", "skills", "templates"]);

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

function* walkBlocks(items) {
  for (const block of items) {
    yield block;
    if (block.children) yield* walkBlocks(block.children);
    if (block.items) for (const item of block.items) yield* walkBlocks(item);
  }
}

function plainText(markdown) {
  return String(markdown)
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1")
    .replace(/<(https?:\/\/[^\s<>]+?)>/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[\s(])\*([^*]+)\*/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

export function parsePage(text, file) {
  const { yaml, body } = splitFrontmatter(text, file);
  const meta = parseYaml(yaml);
  for (const key of ["title", "summary", "status"]) {
    if (typeof meta[key] !== "string" || !meta[key].trim()) throw new Error(`${file}: missing ${key}`);
  }
  if (!["Draft", "In force", "Reference", "Evidence"].includes(meta.status)) {
    throw new Error(`${file}: unknown status ${meta.status}`);
  }
  if (meta.status === "Evidence" && !validDate(meta.checked)) throw new Error(`${file}: evidence needs a real checked date`);
  if (meta.status === "In force" && (typeof meta["approved-by"] !== "string" ||
      !meta["approved-by"].trim() || !validDate(meta["approved-on"]))) {
    throw new Error(`${file}: In force needs human approval attribution and date`);
  }
  const tokens = blocks(body);
  const flat = [...walkBlocks(tokens)];
  if (flat.some(b => b.unterminated)) throw new Error(`${file}: unclosed code fence`);
  const counts = new Map();
  for (const block of flat) {
    if (block.type !== "heading") continue;
    const slug = slugify(block.text);
    const count = counts.get(slug) ?? 0;
    block.id = `${slug}${count ? `-${count}` : ""}`;
    counts.set(slug, count + 1);
  }
  return { ...meta, path: file, body, tokens, headings: flat.filter(b => b.type === "heading") };
}

export function parseChangelog(text, file = "CHANGELOG.md") {
  const { yaml, body } = splitFrontmatter(text, file);
  const meta = parseYaml(yaml);
  for (const key of ["title", "summary"]) {
    if (typeof meta[key] !== "string" || !meta[key].trim()) throw new Error(`${file}: missing ${key}`);
  }
  const tokens = blocks(body);
  const flat = [...walkBlocks(tokens)];
  if (flat.some(b => b.unterminated)) throw new Error(`${file}: unclosed code fence`);
  if (flat.some(b => b.type === "heading" && b.level === 1)) throw new Error(`${file}: unexpected level-1 heading`);
  const intro = [];
  const entries = [];
  const counts = new Map();
  const nextId = raw => {
    const slug = slugify(raw).replace(/-+/g, "-");
    if (!slug) throw new Error(`${file}: empty heading slug`);
    const count = counts.get(slug) ?? 0;
    counts.set(slug, count + 1);
    return `${slug}${count ? `-${count}` : ""}`;
  };
  let prevDate = "";
  for (const block of tokens) {
    if (block.type === "heading" && block.level === 2) {
      const m = block.text.match(/^(\d{4}-\d{2}-\d{2})\s+(?:—|--|:)\s+(.+)$/);
      if (!m) throw new Error(`${file}: entry heading must match 'YYYY-MM-DD — Title': ${block.text}`);
      const [, date, rawTitle] = m;
      const title = rawTitle.trim();
      if (!validDate(date)) throw new Error(`${file}: invalid entry date ${date}`);
      if (prevDate && date > prevDate) {
        throw new Error(`${file}: entries must be newest-first (${date} after ${prevDate})`);
      }
      prevDate = date;
      block.id = nextId(`${date}-${title}`);
      entries.push({ date, title, heading: block.text, id: block.id, tokens: [] });
      continue;
    }
    if (!entries.length) {
      if (block.type === "heading") throw new Error(`${file}: heading before first dated entry`);
      intro.push(block);
      continue;
    }
    for (const sub of walkBlocks([block])) {
      if (sub.type === "heading") sub.id = nextId(sub.text);
    }
    entries[entries.length - 1].tokens.push(block);
  }
  if (!entries.length) throw new Error(`${file}: needs at least one dated entry`);
  const dayCounts = new Map();
  for (const entry of entries) {
    if (!entry.tokens.length) throw new Error(`${file}: empty entry ${entry.heading}`);
    const [y, m, d] = entry.date.split("-").map(Number);
    const idx = dayCounts.get(entry.date) ?? 0;
    dayCounts.set(entry.date, idx + 1);
    entry.pubDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0) - idx * 60_000).toUTCString();
    const firstParagraph = [...walkBlocks(entry.tokens)].find(b => b.type === "paragraph");
    entry.summary = (firstParagraph ? plainText(firstParagraph.text) : "") || entry.title;
  }
  return { ...meta, path: file, body, intro, entries, headings: flat.filter(b => b.type === "heading") };
}

export function readHandbook(root) {
  const pages = ["handbook", "recipes", "evidence"].flatMap(dir =>
    readdirSync(join(root, dir)).filter(f => f.endsWith(".md")).sort().map(file => {
      const path = `${dir}/${file}`;
      return parsePage(readFileSync(join(root, path), "utf8"), path);
    }));
  const byPath = new Map(pages.map(p => [p.path, p]));
  const changelogFile = join(root, "CHANGELOG.md");
  if (!existsSync(changelogFile)) throw new Error("CHANGELOG.md: missing changelog");
  const changelog = parseChangelog(readFileSync(changelogFile, "utf8"), "CHANGELOG.md");
  byPath.set("CHANGELOG.md", changelog);
  const navigation = JSON.parse(readFileSync(join(root, "handbook/navigation.json"), "utf8"));
  if (!Array.isArray(navigation) || !navigation.length) throw new Error("Navigation must contain sections");
  const included = new Set();
  for (const group of navigation) {
    if (!group.title || !group.summary || !Array.isArray(group.pages) || !group.pages.length) {
      throw new Error("Each navigation section needs title, summary, and pages");
    }
    group.pages = group.pages.map(slug => {
      const path = `handbook/${slug}.md`;
      if (included.has(path)) throw new Error(`Navigation repeats ${path}`);
      included.add(path);
      const page = byPath.get(path);
      if (!page) throw new Error(`Navigation points to missing ${path}`);
      return page;
    });
  }
  for (const page of pages) {
    if (page.path.startsWith("handbook/") && !included.has(page.path)) {
      throw new Error(`Navigation omits ${page.path}`);
    }
    // Check the links readers see, not hypothetical links in code examples.
    for (const block of page.tokens) {
      for (const match of renderBlock(block).matchAll(/href="([^"]+)"/g)) {
        resolveLink(root, page.path, match[1].replace(/&amp;/g, "&"), byPath);
      }
    }
  }
  for (const block of changelog.intro) {
    for (const match of renderBlock(block).matchAll(/href="([^"]+)"/g)) {
      resolveLink(root, "CHANGELOG.md", match[1].replace(/&amp;/g, "&"), byPath);
    }
  }
  for (const entry of changelog.entries) {
    const categories = new Set();
    const links = [];
    for (const block of entry.tokens) {
      for (const match of renderBlock(block).matchAll(/href="([^"]+)"/g)) {
        const rawHref = match[1].replace(/&amp;/g, "&");
        const resolved = resolveLink(root, "CHANGELOG.md", rawHref, byPath);
        if (!/^(https?:|mailto:)/.test(rawHref)) {
          const [pathname] = rawHref.split("#");
          const target = pathname ? relative(root, resolve(root, decodeURI(pathname))) : "CHANGELOG.md";
          const top = target.split("/")[0];
          if (CATEGORY_ROOTS.has(top)) categories.add(top);
          else if (target === "skills-lock.json") categories.add("skills");
          else if (target === "DESIGN.md" || top === "scripts") categories.add("site");
        }
        const canonical = /^(https?:|mailto:)/.test(resolved) ? resolved : `${SITE_URL}/${resolved}`;
        if (/^https?:/.test(canonical) && !links.includes(canonical)) links.push(canonical);
      }
    }
    entry.categories = [...categories];
    entry.links = links;
  }
  const prompt = byPath.get("handbook/update-project.md")?.tokens.find(b => b.type === "code" && b.lang === "text")?.text;
  if (!prompt?.trim()) throw new Error("Update a project needs a copyable text prompt");
  return { pages, byPath, navigation, prompt, changelog };
}

export function resolveLink(root, from, link, byPath) {
  if (/^(https?:|mailto:)/.test(link)) return link;
  if (/^[a-z][\w+.-]*:/i.test(link) || link.startsWith("//")) throw new Error(`${from}: unsafe link ${link}`);
  const [pathname, fragment] = link.split("#");
  const target = pathname ? relative(root, resolve(root, dirname(from), decodeURI(pathname))) : from;
  if (target.startsWith("../") || !existsSync(join(root, target))) throw new Error(`${from}: broken link ${link}`);
  const page = byPath.get(target);
  if (page) {
    if (fragment && !page.headings.some(h => h.id === fragment)) throw new Error(`${from}: missing heading ${link}`);
    return pageUrl(target) + (fragment ? `#${fragment}` : "");
  }
  return sourceUrl(target, statSync(join(root, target)).isDirectory()) + (fragment ? `#${fragment}` : "");
}

export function readCatalog(root) {
  const lock = readLock(join(root, "skills-lock.json"));
  const owned = new Map(readdirSync(join(root, "skills"))
    .filter(name => existsSync(join(root, "skills", name, "SKILL.md")))
    .map(name => [name, parseYaml(splitFrontmatter(readFileSync(join(root, "skills", name, "SKILL.md"), "utf8")).yaml)]));
  const selectsOwned = (name, entry) => entry?.source === "The-Focus-AI/standards" &&
    entry.skillPath === `skills/${name}/SKILL.md`;
  const result = Object.entries(lock.skills).map(([name, entry]) => ({
    name, source: entry.source, path: entry.skillPath, ref: entry.ref, selection: "Default",
    description: selectsOwned(name, entry) ? owned.get(name)?.description ?? "" : "",
    url: `https://github.com/${entry.source}/blob/${entry.ref}/${entry.skillPath}`,
  }));
  for (const [name, skill] of owned) {
    if (selectsOwned(name, lock.skills[name])) continue;
    result.push({ name, source: "The-Focus-AI/standards", path: `skills/${name}/SKILL.md`,
      selection: "Optional", description: skill.description, url: sourceUrl(`skills/${name}/SKILL.md`) });
  }
  return result.sort((a, b) => a.source.localeCompare(b.source) || a.name.localeCompare(b.name));
}
