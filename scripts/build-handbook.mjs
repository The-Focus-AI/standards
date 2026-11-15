#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { readHandbook, readCatalog, resolveLink, pageUrl, sourceUrl, SITE_URL } from "./lib/handbook.mjs";
import { tokensToCss } from "./lib/design-tokens.mjs";
import { renderBlock, inline, esc } from "./lib/markdown.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const OUT = join(ROOT, "out/handbook");
const FONTS = [
  "source-serif-4-latin-400-normal.woff2",
  "source-serif-4-latin-400-italic.woff2",
  "source-serif-4-latin-500-normal.woff2",
  "source-serif-4-latin-600-normal.woff2",
  "courier-prime-latin-400-normal.woff2",
  "courier-prime-latin-700-normal.woff2",
  "OFL.txt",
];

const corpus = readHandbook(ROOT);
const catalog = readCatalog(ROOT);
const css = tokensToCss() + "\n" + readFileSync(join(ROOT, "scripts/handbook.css"), "utf8");
const script = readFileSync(join(ROOT, "scripts/handbook-client.js"), "utf8");
const attr = value => esc(String(value)).replace(/"/g, "&quot;");
const xml = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const cdata = value => `<![CDATA[${String(value).replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const plain = md => String(md)
  .replace(/`([^`]+)`/g, "$1")
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1")
  .replace(/\*\*([^*]+)\*\*/g, "$1")
  .replace(/\*([^*]+)\*/g, "$1")
  .trim();

const search = corpus.pages.map(p => ({
  title: p.title,
  summary: p.summary,
  path: pageUrl(p.path),
  text: `${p.title} ${p.summary} ${p.body}`.toLowerCase(),
}));

const recipePages = corpus.pages.filter(p => p.path.startsWith("recipes/"));
const evidencePages = corpus.pages.filter(p => p.path.startsWith("evidence/"));
const readingOrder = [
  ...corpus.navigation.flatMap(g => g.pages),
  ...corpus.pages.filter(p => !p.path.startsWith("handbook/")),
];

// Assign monograph section numbers (01..N for handbook tasks, then recipes and evidence)
const rulerGroups = corpus.navigation.map((g, gi) => ({
  num: String(gi + 1).padStart(2, "0"),
  title: g.title,
  summary: g.summary,
  pages: g.pages.map((p, pi) => ({ ...p, code: `${gi + 1}.${pi + 1}` })),
}));
const recipesGroupNum = String(rulerGroups.length + 1).padStart(2, "0");
if (recipePages.length) {
  rulerGroups.push({
    num: recipesGroupNum,
    title: "Platform recipes",
    summary: "Concrete CLI and platform setup procedures behind handbook topics.",
    pages: recipePages.map((p, i) => ({ ...p, code: `R.${i + 1}` })),
  });
}
const evidenceGroupNum = String(rulerGroups.length + 1).padStart(2, "0");
if (evidencePages.length) {
  rulerGroups.push({
    num: evidenceGroupNum,
    title: "Dated evidence",
    summary: "Dated deployment and integration observations kept distinct from policy.",
    pages: evidencePages.map((p, i) => ({ ...p, code: `E.${i + 1}` })),
  });
}
const metaGroupNum = String(rulerGroups.length + 1).padStart(2, "0");

const pageMetaByPath = new Map();
for (const g of rulerGroups) {
  for (const p of g.pages) {
    pageMetaByPath.set(p.path, { code: p.code, groupNum: g.num, groupTitle: g.title });
  }
}

function renderTokens(tokens, sourcePath, toHref, linkCodePaths = false) {
  return tokens.map(block => {
    let html = block.type === "heading"
      ? `<h${block.level} id="${attr(block.id)}">${inline(block.text)}</h${block.level}>`
      : renderBlock(block);
    if (block.type !== "code") {
      html = html.replace(/href="([^"]+)"/g, (_, href) => {
        const resolved = resolveLink(ROOT, sourcePath, href.replace(/&amp;/g, "&"), corpus.byPath);
        return `href="${attr(toHref(resolved))}"`;
      });
      if (linkCodePaths) {
        html = html.replace(
          /<a\b[^>]*>[\s\S]*?<\/a>|<code>((?:handbook|recipes|evidence)\/[a-z0-9-]+\.md|CHANGELOG\.md)<\/code>/g,
          (match, docPath) => {
            if (!docPath) return match;
            if (docPath === "CHANGELOG.md") {
              return `<a class="code-link" href="${attr(toHref("changelog.html"))}"><code>${esc(docPath)}</code></a>`;
            }
            if (corpus.byPath.has(docPath)) {
              return `<a class="code-link" href="${attr(toHref(pageUrl(docPath)))}"><code>${esc(docPath)}</code></a>`;
            }
            return match;
          },
        );
      }
    }
    return html;
  }).join("\n");
}

function renderStaticLattice() {
  const cols = 25, rows = 5, spacingX = 23, spacingY = 20, ox = 22, oy = 18;
  const circles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = ox + c * spacingX;
      const by = oy + r * spacingY;
      const isVermilion = (r + c) % 9 === 0;
      const isPetrol = !isVermilion && (r * 3 + c) % 5 === 0;
      const fill = isVermilion ? "var(--color-attention)" : (isPetrol ? "var(--color-action)" : "var(--color-line-strong)");
      const rad = isVermilion || isPetrol ? 2.6 : 1.75;
      circles.push(`<circle cx="${bx}" cy="${by}" r="${rad}" data-bx="${bx}" data-by="${by}" fill="${fill}"/>`);
    }
  }
  return circles.join("");
}

function renderSubticks(subticks) {
  if (!subticks || !subticks.length) return "";
  return `<div class="ruler-subticks">${subticks.map((h, i) =>
    `<a class="ruler-subtick${i === 0 ? " is-current" : ""}" href="#${attr(h.id)}" data-subtick="${i}" data-hid="${attr(h.id)}">${esc(h.label)}</a>`
  ).join("")}</div>`;
}

function shell(file, title, body, current = "", subticks = []) {
  const prefix = relative(dirname(file), ".");
  const href = target => attr(`${prefix ? `${prefix}/` : ""}${target}`);
  const meta = pageMetaByPath.get(current);
  const caliperLabel = meta
    ? `§ ${meta.code} · ${title}`
    : (file === "skills.html"
      ? `§ ${metaGroupNum}.1 · ${catalog.length} Skills`
      : (file === "changelog.html" ? `§ ${metaGroupNum}.2 · Changelog` : "§ 00 · Overview"));

  const isOverview = file === "index.html";
  const isSkills = file === "skills.html";
  const isChangelog = file === "changelog.html";
  const isHandbookSection = !isSkills && !isChangelog;

  const groupsHtml = rulerGroups.map(g => `<section class="ruler-sec" id="ruler-group-${g.num}">
    <h2 class="ruler-sec-label" data-ov-label="${g.num}">${g.num} · ${esc(g.title)}</h2>
    ${g.pages.map(p => {
      const active = p.path === current;
      const shortStatus = p.status === "Reference" ? "Ref" : (p.status === "Evidence" ? "Evid" : p.status);
      return `<div class="ruler-item"${active ? " data-ruler-active-block" : ""}>
        <a class="ruler-tick${active ? " is-active" : ""}" href="${href(pageUrl(p.path))}"${active ? ' aria-current="page" data-ruler-active-row' : ""}><span>${esc(p.title)}</span><em class="tick-status" data-status="${attr(p.status)}">${esc(shortStatus)}</em></a>
        ${active ? renderSubticks(subticks) : ""}
      </div>`;
    }).join("")}
  </section>`).join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · TheFocus.AI engineering handbook</title><meta name="description" content="Practical guidance for building, connecting, and shipping TheFocus.AI projects.">
<link rel="stylesheet" href="${href("handbook.css")}"><link rel="alternate" type="application/rss+xml" title="Focus engineering handbook changelog" href="${href("feed.xml")}"></head><body data-prefix="${attr(prefix ? prefix + "/" : "")}" data-page-kind="${isOverview ? "overview" : "document"}">
<a class="skip" href="#main">Skip to content</a>
<header class="topbar"><div class="topbar-inner">
  <a class="brand" href="${href("index.html")}"><span class="brand-mark" aria-hidden="true"></span>TheFocus.AI <span>Engineering handbook</span></a>
  <nav aria-label="Site">
    <button type="button" class="cmd-trigger" id="open-cmd" data-enhancement hidden><span>Search…</span><kbd>⌘K</kbd></button>
    <a href="${href("index.html")}"${isHandbookSection ? ' aria-current="page"' : ""}>Handbook</a>
    <a href="${href("skills.html")}"${isSkills ? ' aria-current="page"' : ""}>Skills</a>
    <a href="${href("changelog.html")}"${isChangelog ? ' aria-current="page"' : ""}>Changelog</a>
    <a class="rss-pill" href="${href("feed.xml")}"><span class="rss-dot" aria-hidden="true"></span>RSS</a>
    <a href="https://github.com/The-Focus-AI/standards">Source ↗</a>
  </nav>
</div></header>
<div class="layout">
  <aside class="sidebar" aria-label="Handbook navigation">
    <div class="sidebar-rail">
      <div class="search" data-enhancement hidden>
        <label class="sr-only" for="search">Find a topic</label>
        <input id="search" type="search" placeholder="Filter ${corpus.pages.length} docs…" autocomplete="off" aria-controls="search-results">
        <kbd class="search-kbd" aria-hidden="true">/</kbd>
      </div>
      <div class="ruler-caliper" aria-hidden="true">
        <span class="ruler-readout" id="ruler-readout">${esc(caliperLabel.toUpperCase())}</span>
        <span class="ruler-pct" id="ruler-pct">TOP</span>
      </div>
      <div class="ruler-scroll" id="ruler-scroll">
        <details class="nav-menu" open>
          <summary><span class="summary-label">Browse handbook</span><span class="summary-current">${esc(caliperLabel)}</span></summary>
          <nav class="ruler-inner" id="ruler-inner" aria-label="Topics">
            <div class="ruler-track" aria-hidden="true"></div>
            <div class="ruler-active-span" id="ruler-span" aria-hidden="true"></div>
            <div class="ruler-bead" id="ruler-bead" aria-hidden="true"></div>
            <section class="ruler-sec" id="ruler-group-00">
              <h2 class="ruler-sec-label" data-ov-label="00">00 · Frontmatter</h2>
              <div class="ruler-item"${isOverview ? " data-ruler-active-block" : ""}>
                <a class="ruler-tick${isOverview ? " is-active" : ""}" href="${href("index.html")}"${isOverview ? ' aria-current="page" data-ruler-active-row' : ""} id="ruler-row-overview"><span>Start with the work</span></a>
              </div>
            </section>
            ${groupsHtml}
            <section class="ruler-sec" id="ruler-group-${metaGroupNum}">
              <h2 class="ruler-sec-label">${metaGroupNum} · Reference &amp; feed</h2>
              <div class="ruler-item"${isSkills ? " data-ruler-active-block" : ""}>
                <a class="ruler-tick catalog-link${isSkills ? " is-active" : ""}" href="${href("skills.html")}"${isSkills ? ' aria-current="page" data-ruler-active-row' : ""}><span>All skills (${catalog.length})</span></a>
                ${isSkills ? renderSubticks(subticks) : ""}
              </div>
              <div class="ruler-item"${isChangelog ? " data-ruler-active-block" : ""}>
                <a class="ruler-tick${isChangelog ? " is-active" : ""}" href="${href("changelog.html")}"${isChangelog ? ' aria-current="page" data-ruler-active-row' : ""}><span>Changelog &amp; RSS</span></a>
                ${isChangelog ? renderSubticks(subticks) : ""}
              </div>
            </section>
          </nav>
        </details>
      </div>
      <div class="sidebar-foot">
        <p class="nav-note">Proposals stay Draft · Adoption needs a person.</p>
        <a class="bundle-link" href="${href("handbook.md")}" download>handbook.md ↓</a>
      </div>
    </div>
  </aside>
  <main id="main">
    <section id="search-results" hidden aria-label="Search results">
      <div class="page-top"><p class="eyebrow">Instant filter</p><h1>Search results</h1><p id="search-count" class="lede" role="status"></p></div>
      <div id="search-list"></div>
    </section>
    <div id="page-content">${body}</div>
  </main>
</div>
<footer>
  <span>TheFocus.AI · Engineering handbook</span>
  <span><a href="${href("skills.html")}">Skills catalog</a> · <a href="${href("changelog.html")}">Changelog</a> · <a href="${href("feed.xml")}">RSS feed</a> · <a href="${href("handbook.md")}" download>Download for an agent ↓</a></span>
</footer>
<div class="cmd-backdrop" id="cmd-modal" hidden>
  <div class="cmd-dialog" role="dialog" aria-modal="true" aria-label="Search handbook">
    <div class="cmd-input-row">
      <span class="cmd-glyph" aria-hidden="true">§</span>
      <label class="sr-only" for="cmd-input">Search handbook</label>
      <input class="cmd-input" id="cmd-input" type="search" placeholder="Jump to any handbook topic, recipe, evidence record, or catalog…" autocomplete="off">
      <button type="button" class="cmd-esc" id="close-cmd">ESC</button>
    </div>
    <div class="cmd-list" id="cmd-list" role="listbox"></div>
  </div>
</div>
<script id="search-data" type="application/json">${JSON.stringify(search).replace(/</g, "\\u003c")}</script><script src="${href("handbook-client.js")}" defer></script></body></html>`;
}

function renderPage(page) {
  const from = pageUrl(page.path);
  const toRel = resolved => /^https?:|^mailto:/.test(resolved) ? resolved : relative(dirname(from), resolved);
  const content = renderTokens(page.tokens, page.path, toRel, true);
  const notices = {
    Draft: "Proposed guidance. Not ratified; respect the project's adopted policy and exceptions.",
    "In force": `Approved by ${page["approved-by"]} on ${page["approved-on"]}.`,
    Reference: "Procedure, not independent policy. Check the cited versions and verification limits before use.",
    Evidence: `Checked ${page.checked}. Dated evidence, not proof of the current deployment.`,
  };
  const meta = pageMetaByPath.get(page.path);
  const h2s = page.headings.filter(h => h.level === 2);
  const subticks = h2s.map(h => ({ id: h.id, label: plain(h.text) }));
  const orderIdx = readingOrder.findIndex(p => p.path === page.path);
  const prev = orderIdx > 0 ? readingOrder[orderIdx - 1] : null;
  const next = orderIdx >= 0 && orderIdx < readingOrder.length - 1 ? readingOrder[orderIdx + 1] : null;

  const pager = `<nav class="pager" aria-label="Adjacent pages">
    ${prev
      ? `<a class="chip" href="${attr(toRel(pageUrl(prev.path)))}">← ${esc(prev.title)}</a>`
      : `<a class="chip" href="${attr(toRel("index.html"))}">← Monograph overview</a>`}
    ${next
      ? `<a class="chip" href="${attr(toRel(pageUrl(next.path)))}">${esc(next.title)} →</a>`
      : `<a class="chip" href="${attr(toRel("skills.html"))}">Skills catalog →</a>`}
  </nav>`;

  return shell(from, page.title, `<div class="reading">
    <div class="reading-main">
      <div class="page-top">
        <p class="eyebrow">${meta ? `§ ${esc(meta.groupNum)} · ${esc(meta.groupTitle)}` : esc(page.path.split("/")[0])} / <span class="status-pill" data-status="${attr(page.status)}">${esc(page.status)}</span> <code class="path-tag">${esc(page.path)}</code></p>
        <h1>${esc(page.title)}</h1>
        <p class="lede">${esc(page.summary)}</p>
        <p class="notice"><span>${esc(notices[page.status])}</span><a class="notice-source" href="${sourceUrl(page.path)}">Source .md ↗</a></p>
      </div>
      <article class="prose">${content}${pager}<p class="source-link"><a href="${sourceUrl(page.path)}">Read or edit the source ↗</a></p></article>
    </div>
    <aside class="toc" aria-label="On this page">
      <h2>On this page${meta ? ` · § ${esc(meta.code)}` : ""}</h2>
      ${h2s.length
        ? h2s.map((h, i) => `<a href="#${attr(h.id)}" class="sidenote${i === 0 ? " is-lit" : ""}" data-toc-link="${i}"><span class="toc-num">SECTION ${esc(meta ? meta.code : "1")}.${i + 1}</span><strong>${inline(h.text)}</strong></a>`).join("")
        : `<div class="sidenote is-static"><span class="toc-num">${esc(page.status)}</span><strong>Single-section topic</strong></div>`}
    </aside>
  </div>`, page.path, subticks);
}

const statusCounts = {
  Draft: corpus.pages.filter(p => p.status === "Draft").length,
  "In force": corpus.pages.filter(p => p.status === "In force").length,
  Reference: corpus.pages.filter(p => p.status === "Reference").length,
  Evidence: corpus.pages.filter(p => p.status === "Evidence").length,
};
const hasMaintaining = corpus.byPath.has("handbook/maintaining.md");
const hasRelease = corpus.byPath.has("handbook/release.md");

const home = `<div class="reading">
  <div class="reading-main">
    <section class="hero">
      <div class="artwork-box">
        <svg class="artwork-svg" id="ink-lattice" viewBox="0 0 620 120" role="img" aria-label="Repository corpus lattice">${renderStaticLattice()}</svg>
        <div class="artwork-meta">
          <span>FIG. 01 — REPOSITORY CORPUS (${corpus.pages.length} DOCUMENTS · ${catalog.length} SKILLS)</span>
          <span>${statusCounts.Draft} DRAFT · ${statusCounts["In force"]} IN FORCE · ${statusCounts.Reference} REF · ${statusCounts.Evidence} EVID</span>
        </div>
      </div>
      <p class="eyebrow">TheFocus.AI · How we build</p>
      <h1>Start with the <em>work</em>.</h1>
      <p class="lede">Set up a project. Connect an agent. Ship a verified change. One place for the <span class="ink-mark">decisions, the procedures, and their limits</span> — guidance stays Draft unless a person ratifies it.</p>
      <div class="prompt-box">
        <div class="prompt-head">
          <div>
            <h2>Bring a repo up to date</h2>
            <p>Give your coding agent the handbook and a safe starting point from <a class="code-link" href="handbook/update-project.html"><code>handbook/update-project.md</code></a>.</p>
          </div>
          <button type="button" data-copy="update-prompt" data-enhancement hidden>Copy prompt</button>
        </div>
        <details><summary>Read the prompt</summary><pre id="update-prompt">${esc(corpus.prompt)}</pre></details>
        <span class="copy-status" role="status"></span>
      </div>
      <div class="governance-grid" aria-label="Document authority and project maturity">
        <div class="gov-card">
          <div class="gov-head">
            <h3>Document authority</h3>
            ${hasMaintaining ? `<a href="handbook/maintaining.html#authority-stays-explicit">handbook/maintaining.md →</a>` : ""}
          </div>
          <dl class="gov-list">
            <div><dt><span class="status-pill" data-status="Draft">Draft (${statusCounts.Draft})</span></dt><dd>Proposed guidance; adopt per project in local docs.</dd></div>
            <div><dt><span class="status-pill" data-status="In force">In force (${statusCounts["In force"]})</span></dt><dd>Human-ratified policy (<code>approved-by</code> + date).</dd></div>
            <div><dt><span class="status-pill" data-status="Reference">Reference (${statusCounts.Reference})</span></dt><dd>Platform or CLI procedure behind an owning topic.</dd></div>
            <div><dt><span class="status-pill" data-status="Evidence">Evidence (${statusCounts.Evidence})</span></dt><dd>Dated observation with explicit verification limits.</dd></div>
          </dl>
        </div>
        <div class="gov-card">
          <div class="gov-head">
            <h3>Project maturity model</h3>
            ${hasRelease ? `<a href="handbook/release.html#name-who-can-release">handbook/release.md →</a>` : ""}
          </div>
          <dl class="gov-list">
            <div><dt><code>unassessed</code></dt><dd>Default when omitted in <code>AGENTS.md</code>; never implicit <code>alpha</code>.</dd></div>
            <div><dt><code>alpha</code></dt><dd>Lint, tests, smoke check; owner may delegate bounded releases.</dd></div>
            <div><dt><code>client-testing</code></dt><dd>Alpha + client scenarios; named owner accepts visible changes.</dd></div>
            <div><dt><code>production</code></dt><dd>Regression, auth/isolation/migration, smoke + recovery owner.</dd></div>
          </dl>
        </div>
      </div>
    </section>
    <div class="prose">
      ${corpus.navigation.map((g, i) => {
        const num = String(i + 1).padStart(2, "0");
        return `<section class="ov-section" id="ov-${num}">
          <h2><span>${esc(g.title)}</span><small>§ ${num}</small></h2>
          <p>${esc(g.summary)}</p>
          <div class="chip-links">${g.pages.map(p => `<a class="chip" href="${pageUrl(p.path)}"><span>${esc(p.title)}</span><em class="chip-tag" data-status="${attr(p.status)}">${esc(p.status)}</em></a>`).join("")}</div>
        </section>`;
      }).join("")}
      ${recipePages.length ? `<section class="ov-section" id="ov-${recipesGroupNum}">
        <h2><span>Platform &amp; implementation recipes</span><small>§ ${recipesGroupNum}</small></h2>
        <p>Concrete CLI and platform setup procedures behind the handbook topics.</p>
        <div class="chip-links">${recipePages.map(p => `<a class="chip" href="${pageUrl(p.path)}"><span>${esc(p.title)}</span><em class="chip-tag" data-status="Reference">Ref</em></a>`).join("")}</div>
      </section>` : ""}
      ${evidencePages.length ? `<section class="ov-section" id="ov-${evidenceGroupNum}">
        <h2><span>Evidence &amp; implementation records</span><small>§ ${evidenceGroupNum}</small></h2>
        <p>Dated deployment and integration observations kept distinct from ratified policy.</p>
        <div class="chip-links">${evidencePages.map(p => `<a class="chip" href="${pageUrl(p.path)}"><span>${esc(p.title)}</span><em class="chip-tag" data-status="Evidence">${esc(p.checked)}</em></a>`).join("")}</div>
      </section>` : ""}
    </div>
  </div>
  <aside class="toc" aria-label="Recent updates">
    <h2>Recent changelog &amp; RSS</h2>
    ${corpus.changelog.entries.slice(0, 5).map(e => `<a href="changelog.html#${attr(e.id)}" class="sidenote">
      <span class="toc-date">${esc(e.date)}${e.categories.length ? ` · ${esc(e.categories.join(" / "))}` : ""}</span>
      <strong>${esc(e.title)}</strong>
      <span class="sidenote-summary">${esc(e.summary)}</span>
    </a>`).join("")}
    <a class="sidenote-more" href="changelog.html">All ${corpus.changelog.entries.length} changelog entries →</a>
  </aside>
</div>`;

const sources = [...new Set(catalog.map(s => s.source))];
const skillSubticks = sources.map(source => ({ id: `source-${slug(source)}`, label: source }));
const catalogBody = `<div class="reading">
  <div class="reading-main">
    <div class="page-top">
      <p class="eyebrow">Capabilities / <span class="status-pill">${catalog.length} skills</span></p>
      <h1>Find the right <em>skill</em>.</h1>
      <p class="lede">${catalog.filter(s => s.selection === "Default").length} default selections. ${catalog.filter(s => s.selection === "Optional").length} optional owned skills. No second inventory to keep in sync.</p>
      <p class="catalog-intro">Names, canonical paths, and pins come from the lock; optional capabilities come from this repository. <a href="handbook/skills.html">Installation and source choices →</a></p>
    </div>
    <div class="skill-controls" data-enhancement hidden>
      <label>Search skills<input id="skill-search" type="search" placeholder="Name, source, or capability…"></label>
      <label>Selection<select id="skill-selection"><option value="">All skills</option><option>Default</option><option>Optional</option></select></label>
      <label>Source<select id="skill-source"><option value="">All sources</option>${sources.map(s => `<option>${esc(s)}</option>`).join("")}</select></label>
    </div>
    <p id="skill-count" role="status">${catalog.length} skills</p>
    <div class="skill-groups">${sources.map(source => `<section class="skill-group">
      <h2 id="source-${attr(slug(source))}"><span>${esc(source)}${source === "cursor/plugins" ? " <small>pstack</small>" : ""}</span><small class="group-total">${catalog.filter(s => s.source === source).length}</small></h2>
      ${catalog.filter(s => s.source === source).map(s => `<article class="skill-row" data-skill="${attr(`${s.name} ${s.source} ${s.path} ${s.description}`.toLowerCase())}" data-selection="${s.selection}" data-source="${s.source}">
        <div><a class="skill-name" href="${attr(s.url)}">${esc(s.name)} ↗</a>${s.description ? `<p>${esc(s.description)}</p>` : ""}<code>${esc(s.path)}</code></div>
        <div class="skill-meta"><span>${s.selection}</span>${s.ref ? `<a href="https://github.com/${s.source}/commit/${s.ref}">${s.ref.slice(0, 7)}</a>` : "<span>Owned here</span>"}</div>
      </article>`).join("")}
    </section>`).join("")}</div>
  </div>
  <aside class="toc" aria-label="Skill sources">
    <h2>Skill sources (${sources.length})</h2>
    ${sources.map((source, i) => `<a href="#source-${attr(slug(source))}" class="sidenote${i === 0 ? " is-lit" : ""}" data-toc-link="${i}">
      <span class="toc-num">${catalog.filter(s => s.source === source).length} SKILLS</span>
      <strong>${esc(source)}</strong>
    </a>`).join("")}
  </aside>
</div>`;

const rootHref = resolved => resolved;
const absoluteHref = resolved => /^https?:|^mailto:/.test(resolved) ? resolved : `${SITE_URL}/${resolved}`;
const changelogSubticks = corpus.changelog.entries.map(e => ({ id: e.id, label: `${e.date.slice(5)} · ${e.title}` }));
const changelogBody = `<div class="reading">
  <div class="reading-main">
    <div class="page-top">
      <p class="eyebrow">Updates / <span class="status-pill">RSS 2.0</span> · <a href="feed.xml">feed.xml</a></p>
      <h1>${esc(corpus.changelog.title)}</h1>
      <p class="lede">${esc(corpus.changelog.summary)}</p>
      <div class="prose changelog-intro">${renderTokens(corpus.changelog.intro, "CHANGELOG.md", rootHref, true)}</div>
    </div>
    <article class="prose">
      ${corpus.changelog.entries.map(e =>
        `<section class="changelog-entry"><p class="eyebrow"><time datetime="${attr(e.date)}">${esc(e.date)}</time>${e.categories.length ? ` · ${esc(e.categories.join(" · "))}` : ""}</p>` +
        `<h2 id="${attr(e.id)}"><a href="#${attr(e.id)}">${esc(e.title)}</a></h2>` +
        `${renderTokens(e.tokens, "CHANGELOG.md", rootHref, true)}</section>`).join("\n")}
      <p class="source-link"><a href="${sourceUrl("CHANGELOG.md")}">Read or edit the source ↗</a></p>
    </article>
  </div>
  <aside class="toc" aria-label="On this page">
    <h2>Entries (${corpus.changelog.entries.length})</h2>
    ${corpus.changelog.entries.map((e, i) =>
      `<a href="#${attr(e.id)}" class="sidenote${i === 0 ? " is-lit" : ""}" data-toc-link="${i}"><span class="toc-date">${esc(e.date)}</span><strong>${esc(e.title)}</strong></a>`).join("")}
  </aside>
</div>`;

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
      `      <content:encoded>${cdata(renderTokens(e.tokens, "CHANGELOG.md", absoluteHref, false))}</content:encoded>`,
      "    </item>",
    ].join("\n");
  }),
  "  </channel>",
  "</rss>",
  "",
].join("\n");

// Generate everything before replacing output, so bad metadata or missing font assets leave the last build intact.
const bundle = readingOrder.map(p => `# ${p.title}\n\nStatus: ${p.status}\n` +
  (p.checked ? `Checked: ${p.checked}\n` : "") +
  (p.status === "In force" ? `Approved by: ${p["approved-by"]} on ${p["approved-on"]}\n` : "") +
  `Source: ${sourceUrl(p.path)}\nRelative links below resolve from ${p.path}.\n\n${p.body}`)
  .join("\n\n---\n\n");

const outputs = new Map([
  ["index.html", shell("index.html", "Start with the work", home)],
  ["skills.html", shell("skills.html", "Skills", catalogBody, "", skillSubticks)],
  ["changelog.html", shell("changelog.html", corpus.changelog.title, changelogBody, "CHANGELOG.md", changelogSubticks)],
  ["feed.xml", feedXml],
  ["handbook.css", css],
  ["handbook-client.js", script],
  ["handbook.md", bundle],
]);
for (const page of corpus.pages) outputs.set(pageUrl(page.path), renderPage(page));
for (const file of FONTS) {
  outputs.set(`fonts/${file}`, readFileSync(join(ROOT, "scripts/assets/fonts", file)));
}

rmSync(OUT, { recursive: true, force: true });
for (const [file, value] of outputs) {
  mkdirSync(dirname(join(OUT, file)), { recursive: true });
  writeFileSync(join(OUT, file), value);
}
console.log(`Built ${corpus.pages.length} pages, ${corpus.changelog.entries.length} changelog entries, and ${catalog.length} catalog entries in out/handbook`);
