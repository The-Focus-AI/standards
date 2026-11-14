#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { readHandbook, readCatalog, resolveLink, pageUrl, sourceUrl, SITE_URL } from "./lib/handbook.mjs";
import { tokensToCss } from "./lib/design-tokens.mjs";
import { renderBlock, inline, esc } from "./lib/markdown.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const OUT = join(ROOT, "out/handbook");
const corpus = readHandbook(ROOT);
const catalog = readCatalog(ROOT);
const css = tokensToCss() + readFileSync(join(ROOT, "scripts/handbook.css"), "utf8");
const script = readFileSync(join(ROOT, "scripts/handbook-client.js"), "utf8");
const attr = value => esc(String(value)).replace(/"/g, "&quot;");
const xml = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const cdata = value => `<![CDATA[${String(value).replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
const search = corpus.pages.map(p => ({ title: p.title, summary: p.summary, path: pageUrl(p.path),
  text: `${p.title} ${p.summary} ${p.body}`.toLowerCase() }));

function renderTokens(tokens, sourcePath, toHref) {
  return tokens.map(block => {
    let html = block.type === "heading"
      ? `<h${block.level} id="${attr(block.id)}">${inline(block.text)}</h${block.level}>`
      : renderBlock(block);
    if (block.type !== "code") html = html.replace(/href="([^"]+)"/g, (_, href) => {
      const resolved = resolveLink(ROOT, sourcePath, href.replace(/&amp;/g, "&"), corpus.byPath);
      return `href="${attr(toHref(resolved))}"`;
    });
    return html;
  }).join("\n");
}

function shell(file, title, body, current = "") {
  const prefix = relative(dirname(file), ".");
  const href = target => attr(`${prefix ? `${prefix}/` : ""}${target}`);
  const nav = corpus.navigation.map(g => `<section><h2>${esc(g.title)}</h2>${g.pages.map(p =>
    `<a href="${href(pageUrl(p.path))}"${p.path === current ? ' aria-current="page"' : ""}>${esc(p.title)}</a>`).join("")}</section>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Focus engineering handbook</title><meta name="description" content="Practical guidance for building, connecting, and shipping Focus projects.">
<link rel="stylesheet" href="${href("handbook.css")}"><link rel="alternate" type="application/rss+xml" title="Focus engineering handbook changelog" href="${href("feed.xml")}"></head><body data-prefix="${attr(prefix ? prefix + "/" : "")}">
<a class="skip" href="#main">Skip to content</a><header class="topbar"><a class="brand" href="${href("index.html")}">THE FOCUS<span>Engineering handbook</span></a>
<nav aria-label="Site"><a href="${href("index.html")}"${file === "index.html" ? ' aria-current="page"' : ""}>Handbook</a><a href="${href("skills.html")}"${file === "skills.html" ? ' aria-current="page"' : ""}>Skills</a><a href="${href("changelog.html")}"${file === "changelog.html" ? ' aria-current="page"' : ""}>Changelog</a><a href="https://github.com/The-Focus-AI/standards">Source ↗</a></nav></header>
<div class="layout"><aside class="sidebar"><div class="search" data-enhancement hidden><label for="search">Find a topic</label><input id="search" type="search" placeholder="Search the handbook…" autocomplete="off" aria-controls="search-results"></div>
<details class="nav-menu" open><summary>Browse handbook</summary><nav aria-label="Topics">${nav}<a class="catalog-link" href="${href("skills.html")}"${file === "skills.html" ? ' aria-current="page"' : ""}>All skills ↗</a><a href="${href("changelog.html")}"${current === "CHANGELOG.md" ? ' aria-current="page"' : ""}>Changelog ↗</a></nav></details>
<p class="nav-note">Proposals stay Draft.<br>Adoption needs a person.</p></aside>
<main id="main"><section id="search-results" hidden aria-label="Search results"><h1>Search results</h1><p id="search-count" role="status"></p><div id="search-list"></div></section>
<div id="page-content">${body}</div></main></div>
<footer><span>The Focus AI · Engineering handbook</span><span><a href="${href("feed.xml")}">RSS feed</a> · <a href="${href("handbook.md")}" download>Download for an agent ↓</a></span></footer>
<script id="search-data" type="application/json">${JSON.stringify(search).replace(/</g, "\\u003c")}</script><script src="${href("handbook-client.js")}" defer></script></body></html>`;
}

function renderPage(page) {
  const from = pageUrl(page.path);
  const content = renderTokens(page.tokens, page.path,
    resolved => /^https?:|^mailto:/.test(resolved) ? resolved : relative(dirname(from), resolved));
  const notices = { Draft: "Proposed guidance. Not ratified; respect the project's adopted policy and exceptions.",
    "In force": `Approved by ${page["approved-by"]} on ${page["approved-on"]}.`,
    Reference: "Procedure, not independent policy. Check the cited versions and verification limits before use.",
    Evidence: `Checked ${page.checked}. Dated evidence, not proof of the current deployment.` };
  return shell(from, page.title, `<div class="page-top"><p class="eyebrow">${esc(page.path.split("/")[0])} / <span>${esc(page.status)}</span></p>
<h1>${esc(page.title)}</h1><p class="lede">${esc(page.summary)}</p><p class="notice">${esc(notices[page.status])}</p></div>
<div class="reading"><article>${content}<p class="source-link"><a href="${sourceUrl(page.path)}">Read or edit the source ↗</a></p></article>
<aside class="toc" aria-label="On this page"><h2>On this page</h2>${page.headings.filter(h => h.level === 2).map(h =>
    `<a href="#${attr(h.id)}">${inline(h.text)}</a>`).join("")}</aside></div>`, page.path);
}

const home = `<section class="hero"><p class="eyebrow">The Focus AI / How we build</p><h1>Start with the work.</h1>
<p class="lede">Set up a project. Connect an agent. Ship a verified change.<br> One place for the decisions, the procedures, and their limits.</p>
<div class="prompt-box"><div><h2>Bring a repo up to date</h2><p>Give your coding agent the handbook and a safe starting point.</p></div><button type="button" data-copy="update-prompt" data-enhancement hidden>Copy prompt</button>
<details><summary>Read the prompt</summary><pre id="update-prompt">${esc(corpus.prompt)}</pre></details><span class="copy-status" role="status"></span></div></section>
<div class="section-heading"><h2>What are you working on?</h2><span>Guidance is Draft unless marked otherwise.</span></div>
<div class="topic-grid">${corpus.navigation.map((g, i) => `<section class="topic-card"><span class="index">0${i + 1}</span><h3>${esc(g.title)}</h3><p>${esc(g.summary)}</p>
${g.pages.map(p => `<a href="${pageUrl(p.path)}">${esc(p.title)} <span aria-hidden="true">↗</span></a>`).join("")}</section>`).join("")}</div>
<section class="support"><h2>Go deeper when you need to</h2><p>Platform commands and dated implementation evidence stay behind the topic they explain.</p>
<div class="support-grid">${["recipes", "evidence"].map(dir => `<div><h3>${dir === "recipes" ? "Platform & implementation recipes" : "Evidence & implementation records"}</h3>${corpus.pages.filter(p => p.path.startsWith(dir + "/")).map(p => `<a href="${pageUrl(p.path)}">${esc(p.title)}</a>`).join("")}</div>`).join("")}</div></section>`;

const sources = [...new Set(catalog.map(s => s.source))];
const catalogBody = `<div class="page-top"><p class="eyebrow">Capabilities / Generated from source</p><h1>Find the right skill.</h1>
<p class="lede">${catalog.filter(s => s.selection === "Default").length} default selections. ${catalog.filter(s => s.selection === "Optional").length} optional owned skills. No second inventory to keep in sync.</p>
<p>Names, canonical paths, and pins come from the lock; optional capabilities come from this repository. <a href="handbook/skills.html">Installation and source choices ↗</a></p></div>
<div class="skill-controls" data-enhancement hidden><label>Search skills<input id="skill-search" type="search" placeholder="Name, source, or capability…"></label>
<label>Selection<select id="skill-selection"><option value="">All skills</option><option>Default</option><option>Optional</option></select></label>
<label>Source<select id="skill-source"><option value="">All sources</option>${sources.map(s => `<option>${esc(s)}</option>`).join("")}</select></label></div>
<p id="skill-count" role="status">${catalog.length} skills</p><div class="skill-groups">${sources.map(source => `<section class="skill-group"><h2>${esc(source)}${source === "cursor/plugins" ? " <small>pstack</small>" : ""}</h2>
${catalog.filter(s => s.source === source).map(s => `<article class="skill-row" data-skill="${attr(`${s.name} ${s.source} ${s.path} ${s.description}`.toLowerCase())}" data-selection="${s.selection}" data-source="${s.source}">
<div><a class="skill-name" href="${attr(s.url)}">${esc(s.name)} ↗</a>${s.description ? `<p>${esc(s.description)}</p>` : ""}<code>${esc(s.path)}</code></div><div class="skill-meta"><span>${s.selection}</span>${s.ref ? `<a href="https://github.com/${s.source}/commit/${s.ref}">${s.ref.slice(0, 7)}</a>` : '<span>Owned here</span>'}</div></article>`).join("")}</section>`).join("")}</div>`;

const rootHref = resolved => resolved;
const absoluteHref = resolved => /^https?:|^mailto:/.test(resolved) ? resolved : `${SITE_URL}/${resolved}`;
const changelogBody = `<div class="page-top"><p class="eyebrow">Updates / <a href="feed.xml">RSS feed</a></p><h1>${esc(corpus.changelog.title)}</h1>` +
  `<p class="lede">${esc(corpus.changelog.summary)}</p>${renderTokens(corpus.changelog.intro, "CHANGELOG.md", rootHref)}</div>` +
  `<div class="reading"><article>${corpus.changelog.entries.map(e =>
    `<section class="changelog-entry"><p class="eyebrow"><time datetime="${attr(e.date)}">${esc(e.date)}</time>${e.categories.length ? ` · ${esc(e.categories.join(" · "))}` : ""}</p>` +
    `<h2 id="${attr(e.id)}"><a href="#${attr(e.id)}">${esc(e.title)}</a></h2>` +
    `${renderTokens(e.tokens, "CHANGELOG.md", rootHref)}</section>`).join("\n")}` +
  `<p class="source-link"><a href="${sourceUrl("CHANGELOG.md")}">Read or edit the source ↗</a></p></article>` +
  `<aside class="toc" aria-label="On this page"><h2>Recent entries</h2>${corpus.changelog.entries.map(e =>
    `<a href="#${attr(e.id)}"><span class="toc-date">${esc(e.date)}</span>${esc(e.title)}</a>`).join("")}</aside></div>`;

const feedXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
  "  <channel>",
  `    <title>${xml(`Focus engineering handbook ${corpus.changelog.title.toLowerCase()}`)}</title>`,
  `    <link>${SITE_URL}/changelog.html</link>`,
  `    <description>${xml(corpus.changelog.summary)}</description>`,
  "    <language>en-us</language>",
  `    <lastBuildDate>${xml(corpus.changelog.entries[0].pubDate)}</lastBuildDate>`,
  `    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />`,
  ...corpus.changelog.entries.map(e => {
    const permalink = `${SITE_URL}/changelog.html#${e.id}`;
    return [
      "    <item>",
      `      <title>${xml(e.title)}</title>`,
      `      <link>${xml(permalink)}</link>`,
      `      <guid isPermaLink="true">${xml(permalink)}</guid>`,
      `      <pubDate>${xml(e.pubDate)}</pubDate>`,
      ...e.categories.map(c => `      <category>${xml(c)}</category>`),
      ...e.links.map(u => `      <atom:link href="${xml(u)}" rel="related" />`),
      `      <description>${xml(e.summary)}</description>`,
      `      <content:encoded>${cdata(renderTokens(e.tokens, "CHANGELOG.md", absoluteHref))}</content:encoded>`,
      "    </item>",
    ].join("\n");
  }),
  "  </channel>",
  "</rss>",
  "",
].join("\n");

// Generate everything before replacing output, so bad metadata or links leave the last build intact.
const readingOrder = [...corpus.navigation.flatMap(g => g.pages),
  ...corpus.pages.filter(p => !p.path.startsWith("handbook/"))];
const bundle = readingOrder.map(p => `# ${p.title}\n\nStatus: ${p.status}\n` +
  (p.checked ? `Checked: ${p.checked}\n` : "") +
  (p.status === "In force" ? `Approved by: ${p["approved-by"]} on ${p["approved-on"]}\n` : "") +
  `Source: ${sourceUrl(p.path)}\nRelative links below resolve from ${p.path}.\n\n${p.body}`)
  .join("\n\n---\n\n");
const outputs = new Map([["index.html", shell("index.html", "Start with the work", home)],
  ["skills.html", shell("skills.html", "Skills", catalogBody)],
  ["changelog.html", shell("changelog.html", corpus.changelog.title, changelogBody, "CHANGELOG.md")],
  ["feed.xml", feedXml], ["handbook.css", css], ["handbook-client.js", script],
  ["handbook.md", bundle]]);
for (const page of corpus.pages) outputs.set(pageUrl(page.path), renderPage(page));
for (const file of ["barlow-condensed-latin-600-normal.woff2", "OFL.txt"]) {
  outputs.set(`fonts/${file}`, readFileSync(join(ROOT, "scripts/assets/fonts", file)));
}
rmSync(OUT, { recursive: true, force: true });
for (const [file, value] of outputs) {
  mkdirSync(dirname(join(OUT, file)), { recursive: true });
  writeFileSync(join(OUT, file), value);
}
console.log(`Built ${corpus.pages.length} pages, ${corpus.changelog.entries.length} changelog entries, and ${catalog.length} catalog entries in out/handbook`);
