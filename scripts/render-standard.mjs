#!/usr/bin/env node
// Renders the standards site into the visual language defined by DESIGN.md.
//
//   mise run standard:render                 # everything
//   node scripts/render-standard.mjs FILE    # one file
//
// Two document classes reach the site. **Standards** (`standards/`) carry
// numbered clauses and requirement levels; rendering them is also the
// conformance check, because the renderer refuses to emit a page for a document
// that does not satisfy STD-001. **Guides** (`best-practices/`) carry
// explanation and no clauses at all, and are rendered subordinate to the
// standards they belong to — visibly non-normative, per STD-001 §4.
//
// A guide that fails STD-006 does not render either. Same rule, different
// checklist: if it appears on the site, it conforms.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { splitFrontmatter, parseYaml } from "./lib/yaml.mjs";
import { tokensToCss, ROOT } from "./lib/design-tokens.mjs";
import { pageCss } from "./lib/page-css.mjs";
import { blocks, renderBlock, inline, esc } from "./lib/markdown.mjs";

const STD_DIR = join(ROOT, "standards");
const GUIDE_DIR = join(ROOT, "best-practices");
const OUT_DIR = join(ROOT, "out", "standards");

const REQUIRED = ["standard", "title", "category", "status", "issued", "revision", "applies-to", "author"];
// Guide was removed as a category in STD-001 R2 — a guide is a document
// kind under STD-006, not a weaker standard. (STD-001 §3.17)
const CATEGORIES = ["Practice", "Process"];
const STATUSES = ["Draft", "In force", "Obsoleted"];
const GUIDE_REQUIRED = ["title", "kind", "issued", "author", "status"];
const GUIDE_STATUSES = ["Current", "Superseded"];
const SHELL_LANGS = new Set(["sh", "bash", "zsh", "shell", "console"]);
const LEVELS = [
  ["MUST NOT", "must"], ["MUST", "must"],
  ["SHOULD NOT", "should"], ["SHOULD", "should"],
  ["MAY", "may"],
];

// The bundle lifts each page's body out of its document shell. A marker is used
// rather than a match on the opening tag, so adding a class to the sheet cannot
// silently break the bundle.
const SHEET_OPEN = "<!--sheet-->";
const SHEET_CLOSE = "<!--/sheet-->";
const innerSheet = (html) => html.split(SHEET_OPEN)[1].split(SHEET_CLOSE)[0];

/* ---------------- parse a standard ---------------- */
export function parseStandard(src, file) {
  const errors = [];
  const { yaml, body } = splitFrontmatter(src, file);
  const meta = parseYaml(yaml);

  for (const k of REQUIRED) {
    if (meta[k] === undefined || meta[k] === null || meta[k] === "") errors.push(`missing frontmatter: ${k}`);
  }
  if (meta.category && !CATEGORIES.includes(meta.category)) {
    errors.push(`unknown category "${meta.category}" (expected ${CATEGORIES.join(" | ")})`);
  }
  if (meta.status && !STATUSES.includes(meta.status)) {
    errors.push(`unknown status "${meta.status}" (expected ${STATUSES.join(" | ")})`);
  }

  // walk blocks, intercepting clause headings
  const toks = blocks(body);
  const nodes = [];
  let clause = null;
  const clauses = [];

  const closeClause = () => {
    if (!clause) return;
    if (!clause.level) {
      errors.push(
        `§${clause.ref}: no requirement level. The normative sentence must contain ` +
        `MUST / MUST NOT / SHOULD / SHOULD NOT / MAY, or the heading must be marked DEPRECATED.`
      );
    }
    clauses.push(clause);
    nodes.push({ type: "clause", clause });
    clause = null;
  };

  for (const t of toks) {
    if (t.type === "code" && t.unterminated) {
      errors.push("unterminated code fence — it swallows the rest of the document. Quote a fenced example with a longer fence (````).");
    }
    if (t.type === "heading" && t.level === 3) {
      const m = t.text.match(/^(\d+\.\d+)(?:\s+(DEPRECATED))?\s*$/);
      if (m) {
        closeClause();
        clause = { ref: m[1], deprecated: Boolean(m[2]), level: m[2] ? "dep" : null, norm: "", notes: [], cmds: [] };
        continue;
      }
    }
    if (t.type === "heading" && t.level <= 2) closeClause();

    if (clause) {
      if (t.type === "paragraph") {
        if (!clause.norm) {
          clause.norm = t.text;
          if (!clause.deprecated) {
            // The level is the FIRST keyword by position, not by list order —
            // a clause reading "MUST ... and MUST NOT ..." is a MUST. Where two
            // keywords start at the same index (MUST inside MUST NOT), the
            // longer one wins.
            let best = null;
            for (const [kw, cls] of LEVELS) {
              const at = t.text.search(new RegExp(`\\b${kw}\\b`));
              if (at === -1) continue;
              if (!best || at < best.at || (at === best.at && kw.length > best.kw.length)) {
                best = { at, kw, cls };
              }
            }
            if (best) { clause.level = best.cls; clause.keyword = best.kw; }
          }
        } else clause.notes.push(t);
      } else if (t.type === "code") {
        // Only a shell block is the command that satisfies the clause. A block
        // in any other language illustrates it, and must not be dressed as
        // something the reader can run. (STD-001 §3.7)
        if (SHELL_LANGS.has((t.lang || "").toLowerCase())) clause.cmds.push(t);
        else clause.notes.push(t);
      } else {
        clause.notes.push(t);
      }
      continue;
    }
    nodes.push({ type: "block", block: t });
  }
  closeClause();

  if (clauses.length === 0) {
    errors.push(`category ${meta.category} requires at least one clause (### N.N), found none`);
  }
  return { meta, nodes, clauses, errors };
}

/* ---------------- parse a guide ---------------- */
// A guide has no clauses, so there is nothing to intercept: the whole body is
// prose. What is checked is that it declares itself under STD-006, and that it
// does not smuggle in normative language — a sentence with MUST in it belongs
// in a standard where it can be cited, not in a walkthrough where it cannot.
export function parseGuide(src, file) {
  const errors = [];
  let yaml, body;
  try {
    ({ yaml, body } = splitFrontmatter(src, file));
  } catch {
    return { meta: {}, nodes: [], errors: [`no frontmatter. STD-006 §3.1 requires title, kind, issued, author, status.`] };
  }
  const meta = parseYaml(yaml);

  for (const k of GUIDE_REQUIRED) {
    if (meta[k] === undefined || meta[k] === null || meta[k] === "") errors.push(`missing frontmatter: ${k} (STD-006 §3.1)`);
  }
  if (meta.kind && meta.kind !== "guide") {
    errors.push(`kind is "${meta.kind}" but best-practices/ holds guides (STD-006 §4)`);
  }
  if (meta.status && !GUIDE_STATUSES.includes(meta.status)) {
    errors.push(`unknown status "${meta.status}" (expected ${GUIDE_STATUSES.join(" | ")})`);
  }

  const toks = blocks(body);
  const nodes = [];
  let droppedTitle = false;
  // Most guides open with a blockquote saying where their rules went. That is
  // the guide's standing, not its content, so it is lifted into the status memo
  // instead of being printed just below a memo that says the same thing. The
  // source keeps it — read as raw markdown, which is how agents read these,
  // there is no memo to carry it.
  const provenance = toks[0]?.type === "quote" ? toks.shift() : null;
  for (const t of toks) {
    if (t.type === "code" && t.unterminated) {
      errors.push("unterminated code fence — it swallows the rest of the document. Quote a fenced example with a longer fence (````).");
    }
    // The page prints `title` from the frontmatter, so the body's own H1 would
    // be the same words twice. Drop the first one; a later H1 is a real section
    // break and is demoted rather than discarded.
    if (t.type === "heading" && t.level === 1) {
      if (!droppedTitle) { droppedTitle = true; continue; }
      nodes.push({ ...t, level: 2 });
      continue;
    }
    nodes.push(t);
  }

  // Which standards this guide sits under. Read from the prose rather than
  // declared in frontmatter: a guide that stops mentioning a standard has
  // stopped being about it, and the site should say so without being told.
  const relates = [...new Set((body.match(/\bSTD-\d{3}\b/g) || []))].sort();

  return { meta, nodes, relates, provenance, errors };
}

/* ---------------- render: shared pieces ---------------- */
const levelLabel = (c) => (c.deprecated ? "DEPRECATED" : c.keyword);

function renderClause(c) {
  const noteHtml = c.notes.map(renderBlock).join("\n");
  const cmdHtml = c.cmds
    .map((k) => `<div class="agent-head">Agent · satisfy with</div><pre class="cmd"><code>${esc(k.text)}</code></pre>`)
    .join("\n");
  return `<section class="clause" id="s${c.ref}">
  <div class="band">
    <span class="tab ${c.level || "may"}">${levelLabel(c) || "—"}</span>
    <span class="ref">§${c.ref}</span>
  </div>
  <div class="clause-body">
    <p class="norm">${inline(c.norm)}</p>
    ${noteHtml}
    ${cmdHtml}
  </div>
</section>`;
}

// A list of the documents on the other side of the relationship. Emitted as
// chrome, not as a numbered section, because it is generated rather than
// written and must not be mistaken for part of the document.
function relatedBlock(label, items) {
  if (!items.length) return "";
  return `<aside class="related">
  <span class="lbl">${esc(label)}</span>
  <ul>${items.map((i) =>
    `<li><span class="kindmark">${esc(i.mark)}</span><a href="${esc(i.href)}">${esc(i.text)}</a></li>`
  ).join("")}</ul>
</aside>`;
}

function page({ title, bodyHtml, cssVars, extraCss = "", sheetClass = "" }) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
${pageCss(cssVars, extraCss)}
</style>
</head><body>
<main class="sheet${sheetClass ? " " + sheetClass : ""}">
${SHEET_OPEN}
${bodyHtml}
${SHEET_CLOSE}
</main>
</body></html>`;
}

/* ---------------- render a standard ---------------- */
function headerBlock(meta) {
  // A field with no value is omitted, never rendered empty. (DESIGN.md, Components)
  const left = [
    `<b>The Focus AI Standards</b>`,
    `Standard: ${meta.standard}`,
    meta.obsoletes ? `Obsoletes: ${meta.obsoletes}` : null,
    `Category: ${meta.category}`,
    `Status: ${meta.status}`,
    `Applies to: ${meta["applies-to"]}`,
  ].filter(Boolean);
  const right = [meta.author, "The Focus AI", meta.issued, `Revision ${meta.revision}`].filter(Boolean);
  return `<div class="rfc-head">
  <div>${left.join("<br>")}</div>
  <div class="right">${right.join("<br>")}</div>
</div>`;
}

export function renderStandard(parsed, cssVars, guides = []) {
  const { meta, nodes } = parsed;
  const bodyHtml = nodes
    .map((n) => (n.type === "clause" ? renderClause(n.clause) : renderBlock(n.block)))
    .join("\n");
  const related = relatedBlock(
    "Guides under this standard",
    guides.map((g) => ({ mark: "Guide", href: g.file, text: g.title }))
  );

  return page({
    title: `${esc(String(meta.standard))} — ${esc(meta.title)}`,
    cssVars,
    bodyHtml: `${headerBlock(meta)}\n<h1>${esc(meta.title)}</h1>\n${bodyHtml}\n${related}`,
  });
}

/* ---------------- render a guide ---------------- */
function guideHeaderBlock(meta, relates) {
  const left = [
    `<b>The Focus AI Standards</b>`,
    `Guide: ${meta.title}`,
    `Status: ${meta.status}`,
    relates.length ? `Relates to: ${relates.join(", ")}` : null,
  ].filter(Boolean);
  const right = [
    meta.author, "The Focus AI", meta.issued,
    meta.verified ? `Verified ${meta.verified}` : null,
  ].filter(Boolean);
  return `<div class="stamp">Guide · not normative</div>
<div class="rfc-head guide-head">
  <div>${left.join("<br>")}</div>
  <div class="right">${right.join("<br>")}</div>
</div>`;
}

// Generated, not written. Every guide gets the same sentence about what a guide
// is, in the same place, so a reader who lands on one from a search result
// learns its standing before reading a word of it.
function guideMemo(relates, provenance) {
  const cite = relates.length
    ? `The rules in this area are <b>${relates.join("</b>, <b>")}</b>; where this
       document and a standard disagree, the standard is the authority.`
    : `No standard has been written for this area yet, so nothing here binds
       anything.`;
  const own = provenance
    ? blocks(provenance.text).map(renderBlock).join("\n")
    : "";
  return `<div class="status-memo">
  <span class="lbl">Status of this guide</span>
  <p>This is a <b>guide</b>: explanation, walkthrough and reference
     implementation. It contains <b>no clauses and binds nothing</b>
     (<code>STD-001 §4</code>). ${cite}</p>
  <p>When a guide turns out to contain a rule, the rule moves to a standard
     where it can be cited and checked, and the guide keeps the explanation.</p>
  ${own}
</div>`;
}

export function renderGuide(parsed, cssVars, standards = []) {
  const { meta, nodes, relates, provenance } = parsed;
  const bodyHtml = nodes.map(renderBlock).join("\n");
  const related = relatedBlock(
    "Standards this guide sits under",
    standards.map((s) => ({ mark: s.category, href: s.file, text: `${s.id} — ${s.title}` }))
  );

  return page({
    title: `Guide — ${esc(meta.title)}`,
    cssVars,
    bodyHtml: `${guideHeaderBlock(meta, relates)}
<h1>${esc(meta.title)}</h1>
${guideMemo(relates, provenance)}
${bodyHtml}
${related}`,
  });
}

/* ---------------- the register ---------------- */
// The index DESIGN.md describes: every standard, its category, status and what
// it binds, in one page — and beneath it, the guides, visibly subordinate.
// A field with no value is omitted, never placeholdered.
function renderRegister(entries, guides, cssVars) {
  const row = (e) => {
    const cls = e.status === "Obsoleted" ? "is-attn" : e.status === "Draft" ? "is-muted" : "is-force";
    return `<tr>
      <td><a href="${esc(e.file)}">${esc(e.id)}</a></td>
      <td>${esc(e.title)}</td>
      <td>${esc(e.category)}</td>
      <td>${esc(e.applies)}</td>
      <td><span class="pip ${cls}">${esc(e.status)}</span></td>
      <td class="num">${e.clauses || "—"}</td>
    </tr>`;
  };
  const guideRow = (g) => `<tr>
      <td><a href="${esc(g.file)}">${esc(g.slug)}</a></td>
      <td>${esc(g.title)}</td>
      <td>${g.relates.length ? g.relates.map(esc).join(", ") : "—"}</td>
      <td><span class="pip ${g.status === "Superseded" ? "is-attn" : "is-agent"}">${esc(g.status)}</span></td>
    </tr>`;

  const inForce = entries.filter((e) => e.status === "In force").length;
  const drafts = entries.filter((e) => e.status === "Draft").length;

  const guideSection = guides.length ? `<h2>Guides</h2>
<p>Guides carry explanation, walkthroughs and reference implementations. They
   are <b>not standards</b> and bind nothing (<code>STD-001 §4</code>). Where a
   guide turns out to contain a rule, the rule moves to a standard and the guide
   keeps the explanation.</p>
<div class="table-scroll"><table class="reg">
  <thead><tr><th>Guide</th><th>Title</th><th>Relates to</th><th>Status</th></tr></thead>
  <tbody>${guides.map(guideRow).join("")}</tbody>
</table></div>` : "";

  return page({
    title: "The Focus AI Standards — the register",
    cssVars,
    bodyHtml: `<div class="rfc-head">
  <div><b>The Focus AI Standards</b><br>The register<br>Standards: ${entries.length}<br>In force: ${inForce}<br>Draft: ${drafts}<br>Guides: ${guides.length}</div>
  <div class="right">The Focus AI<br>standards.thefocus.ai</div>
</div>
<h1>The register</h1>
<div class="status-memo">
  <span class="lbl">Status of this register</span>
  <p>Every standard The Focus AI has issued, with what it binds and whether it is
     in force. A standard in <b>Draft</b> binds nothing: it reflects current
     understanding and is awaiting ratification, which only a person can give
     (<code>STD-001 §3.14</code>).</p>
  <p>This page is generated from the documents themselves. A standard that does
     not conform to <code>STD-001</code>, or a guide that does not conform to
     <code>STD-006</code>, does not render, and so does not appear here.</p>
</div>
<h2>Standards</h2>
<div class="table-scroll"><table class="reg">
  <thead><tr><th>Ref</th><th>Title</th><th>Category</th><th>Applies to</th><th>Status</th><th>Clauses</th></tr></thead>
  <tbody>${entries.map(row).join("")}</tbody>
</table></div>
${guideSection}`,
  });
}

/* ---------------- one-file bundle ---------------- */
// The whole corpus as a single self-contained page: the register, every
// standard, every guide, and hash routing between them. For sharing and preview
// where two dozen separate files cannot travel together. `standard:render`
// still emits the real multi-page site alongside it.
function renderBundle(entries, guides, cssVars, registerHtml) {
  const all = [...entries, ...guides];
  const nav = entries.map((e) =>
    `<a class="reg-link" href="#${e.anchor}" data-doc="${e.anchor}">${e.id}</a>`).join("");
  const guideNav = guides.length
    ? `<div class="railbar rail-guides"><span class="raillbl">Guides</span>${
        guides.map((g) => `<a class="reg-link" href="#${g.anchor}" data-doc="${g.anchor}">${esc(g.slug)}</a>`).join("")
      }</div>`
    : "";

  // Inside one page every document is a fragment, so links to another
  // document's file become hash links. The anchor is looked up rather than
  // derived from the filename — a standard's page is
  // `STD-001-how-a-standard-is-written.html` but its panel is `STD-001`. A
  // section fragment on such a link is dropped, because in the bundle the hash
  // selects the panel and cannot also select a heading.
  const anchors = new Map(all.map((d) => [d.file, d.anchor]));
  const toHash = (html) => html.replace(/href="([^"#]+\.html)(?:#[^"]*)?"/g,
    (full, file) => (anchors.has(file) ? `href="#${anchors.get(file)}"` : full));

  const panels = all.map((d) => `<div class="panel" id="${d.anchor}" hidden>
      <a class="back" href="#register">← the register</a>
      ${toHash(innerSheet(d.html))}
    </div>`).join("\n");

  const registerBody = toHash(innerSheet(registerHtml));

  const extraCss = `
body { padding: 0 1rem 3rem; }
.sheet { border-radius: 0; }
.railbar { max-width:58rem; margin:0 auto; padding:1rem 0 .9rem;
  display:flex; flex-wrap:wrap; gap:.4rem .55rem; align-items:baseline; }
.railbar.rail-guides { padding:0 0 1rem; }
.railbar .home { font-family:var(--font-display); font-weight:var(--fw-display);
  letter-spacing:var(--ls-display); text-transform:uppercase; font-size:1rem;
  color:var(--color-ink); text-decoration:none; margin-right:.5rem; }
.raillbl { font-family:var(--font-mono); font-size:var(--size-micro); font-weight:700;
  letter-spacing:var(--ls-mono); text-transform:uppercase; color:var(--color-agent);
  margin-right:.35rem; }
.reg-link { font-family:var(--font-mono); font-size:.68rem; letter-spacing:.06em;
  color:var(--color-muted); text-decoration:none; padding:.15rem .3rem; }
.reg-link:hover { color:var(--color-action); }
.reg-link[aria-current="true"] { color:var(--color-action); font-weight:700; }
.back { font-family:var(--font-mono); font-size:.68rem; letter-spacing:.06em;
  color:var(--color-action); text-decoration:none; display:inline-block; margin-bottom:1.2rem; }
@media print { .railbar, .back { display:none; } }`;

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Focus AI Standards</title>
<style>
${pageCss(cssVars, extraCss)}
</style>
</head><body>
<nav class="railbar"><a class="home" href="#register">The Focus AI Standards</a>${nav}</nav>
${guideNav}
<main class="sheet">
<div class="panel" id="register">${registerBody}</div>
${panels}
</main>
<script>
const panels = [...document.querySelectorAll(".panel")];
function show() {
  const id = (location.hash || "#register").slice(1);
  const target = document.getElementById(id) ? id : "register";
  panels.forEach((p) => { p.hidden = p.id !== target; });
  document.querySelectorAll(".reg-link").forEach((a) => {
    a.setAttribute("aria-current", String(a.dataset.doc === target));
  });
  window.scrollTo(0, 0);
}
addEventListener("hashchange", show);
show();
</script>
</body></html>`;
}

/* ---------------- links between documents ---------------- */
// The documents link to each other the way they sit on disk — `./clerk.md`,
// `best-practices/skills.md`. On the site those paths do not exist, so they are
// rewritten to the page that was actually emitted. A link that resolves to no
// rendered document is left alone rather than guessed at.
function linkMap(standards, guides) {
  const m = new Map();
  for (const g of guides) m.set(`${g.slug}.md`, g.file);
  for (const s of standards) m.set(s.file.replace(/\.html$/, ".md"), s.file);
  return m;
}

function rewriteLinks(html, map) {
  return html.replace(/href="([^"]+)"/g, (full, href) => {
    if (/^([a-z]+:|#)/i.test(href)) return full;
    const [path, frag] = href.split("#");
    const base = path.replace(/^\.\//, "").replace(/^(best-practices|standards)\//, "");
    const hit = map.get(base);
    return hit ? `href="${hit}${frag ? "#" + frag : ""}"` : full;
  });
}

// These documents cite each other in running prose as code spans — `STD-007`,
// `vercel-deployment.md` — because that is how they read as markdown. On the
// site those are the navigation, so they become links. Fenced blocks are left
// alone: a filename inside a command is an argument, not a reference.
function crossLinkSpans(html, map, stds, self) {
  // Fenced blocks and existing links are held out: a filename inside a command
  // is an argument, and an anchor inside an anchor is not HTML.
  const parts = html.split(/(<pre[\s\S]*?<\/pre>|<a\b[\s\S]*?<\/a>)/);
  return parts.map((part, i) => {
    if (i % 2) return part;
    return part
      .replace(/<code>(STD-\d{3})([^<]*)<\/code>/g, (full, id, rest) => {
        const file = stds.get(id);
        return !file || file === self ? full : `<a href="${file}"><code>${id}${rest}</code></a>`;
      })
      .replace(/<code>([\w./-]+\.md)<\/code>/g, (full, name) => {
        const file = map.get(name.replace(/^(best-practices|standards)\//, ""));
        return !file || file === self ? full : `<a href="${file}"><code>${name}</code></a>`;
      });
  }).join("");
}

/* ---------------- cli ---------------- */
const listMd = (dir) => {
  try { return readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => join(dir, f)); }
  catch { return []; }
};

function main() {
  const args = process.argv.slice(2);
  const stdFiles = args.length
    ? args.filter((f) => !f.includes("best-practices"))
    : listMd(STD_DIR);
  const guideFiles = args.length
    ? args.filter((f) => f.includes("best-practices"))
    : (existsSync(GUIDE_DIR) ? listMd(GUIDE_DIR) : []);

  if (!stdFiles.length && !guideFiles.length) {
    console.error("no documents found to render");
    process.exit(1);
  }

  const cssVars = tokensToCss();
  mkdirSync(OUT_DIR, { recursive: true });

  let failed = 0;

  // Guides first: a standard's page lists the guides that sit under it, so the
  // relationships have to be known before either side is rendered.
  const guides = [];
  for (const f of guideFiles) {
    const slug = basename(f).replace(/\.md$/, "");
    const parsed = parseGuide(readFileSync(f, "utf8"), basename(f));
    if (parsed.errors.length) {
      failed++;
      console.log(`\n  x best-practices/${basename(f)} — does not conform to STD-006`);
      for (const e of parsed.errors) console.log(`      ${e}`);
      continue;
    }
    guides.push({
      parsed, slug, title: parsed.meta.title, status: parsed.meta.status,
      relates: parsed.relates, file: `guide-${slug}.html`, anchor: `guide-${slug}`,
    });
  }

  const standards = [];
  for (const f of stdFiles) {
    const parsed = parseStandard(readFileSync(f, "utf8"), basename(f));
    const name = basename(f).replace(/\.md$/, ".html");
    if (parsed.errors.length) {
      failed++;
      console.log(`\n  x ${basename(f)} — does not conform to STD-001`);
      for (const e of parsed.errors) console.log(`      ${e}`);
      continue;
    }
    const id = `STD-${parsed.meta.standard}`;
    standards.push({
      parsed, id, title: parsed.meta.title,
      category: parsed.meta.category, status: parsed.meta.status,
      applies: parsed.meta["applies-to"], clauses: parsed.clauses.length,
      file: name, anchor: id,
    });
  }

  // now that both sides are known, render each with its cross-references
  const links = linkMap(standards, guides);
  const stdLinks = new Map(standards.map((s) => [s.id, s.file]));
  const wire = (html, self) => crossLinkSpans(rewriteLinks(html, links), links, stdLinks, self);
  for (const s of standards) {
    const mine = guides.filter((g) => g.relates.includes(s.id));
    s.html = wire(renderStandard(s.parsed, cssVars, mine), s.file);
    writeFileSync(join(OUT_DIR, s.file), s.html);
    const levels = s.parsed.clauses.reduce((a, c) => {
      const k = c.deprecated ? "DEPRECATED" : c.keyword;
      a[k] = (a[k] || 0) + 1;
      return a;
    }, {});
    const summary = Object.entries(levels).map(([k, n]) => `${n} ${k}`).join(", ") || "no clauses";
    console.log(`  ok ${s.file.replace(/\.html$/, ".md").padEnd(42)} ${String(s.category).padEnd(9)} ${summary}`);
  }
  for (const g of guides) {
    const mine = standards.filter((s) => g.relates.includes(s.id));
    g.html = wire(renderGuide(g.parsed, cssVars, mine), g.file);
    writeFileSync(join(OUT_DIR, g.file), g.html);
    console.log(`  ok ${(g.slug + ".md").padEnd(42)} ${"Guide".padEnd(9)} ${
      mine.length ? `under ${mine.map((s) => s.id).join(", ")}` : "under no standard"}`);
  }

  standards.sort((a, b) => a.id.localeCompare(b.id));
  guides.sort((a, b) => a.slug.localeCompare(b.slug));
  const registerHtml = wire(renderRegister(standards, guides, cssVars), "index.html");
  writeFileSync(join(OUT_DIR, "index.html"), registerHtml);
  writeFileSync(join(OUT_DIR, "standards.html"), renderBundle(standards, guides, cssVars, registerHtml));
  console.log(
    `\n  rendered to out/standards/ — index.html lists ${standards.length} standard(s) ` +
    `and ${guides.length} guide(s), standards.html bundles them`
  );
  if (failed) {
    console.log(`  ${failed} document(s) did not conform.`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
