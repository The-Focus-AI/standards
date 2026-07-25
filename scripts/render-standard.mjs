#!/usr/bin/env node
// Renders a conforming standard into the visual language defined by DESIGN.md.
//
//   mise run standard:render                 # every standard in standards/
//   node scripts/render-standard.mjs FILE    # one file
//
// This is also the conformance check. The renderer refuses to emit a page for a
// document that does not satisfy STD-001: missing frontmatter, a clause with no
// requirement level, an unknown category. If it renders, it conforms.

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { splitFrontmatter, parseYaml } from "./lib/yaml.mjs";
import { tokensToCss, ROOT } from "./lib/design-tokens.mjs";
import { blocks, renderBlock, inline, esc } from "./lib/markdown.mjs";

const STD_DIR = join(ROOT, "standards");
const OUT_DIR = join(ROOT, "out", "standards");

const REQUIRED = ["standard", "title", "category", "status", "issued", "revision", "applies-to", "author"];
const CATEGORIES = ["Practice", "Process", "Guide"];
const STATUSES = ["Draft", "In force", "Obsoleted"];
const SHELL_LANGS = new Set(["sh", "bash", "zsh", "shell", "console"]);
const LEVELS = [
  ["MUST NOT", "must"], ["MUST", "must"],
  ["SHOULD NOT", "should"], ["SHOULD", "should"],
  ["MAY", "may"],
];

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

  if (meta.category !== "Guide" && clauses.length === 0) {
    errors.push(`category ${meta.category} requires at least one clause (### N.N), found none`);
  }
  return { meta, nodes, clauses, errors };
}

/* ---------------- render ---------------- */
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

export function renderStandard(parsed, cssVars) {
  const { meta, nodes } = parsed;
  const statusClass = meta.status === "Obsoleted" ? "is-attn" : meta.status === "Draft" ? "is-muted" : "is-force";
  const bodyHtml = nodes
    .map((n) => (n.type === "clause" ? renderClause(n.clause) : renderBlock(n.block)))
    .join("\n");

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(String(meta.standard))} — ${esc(meta.title)}</title>
<style>
${cssVars}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--color-page); color: var(--color-ink);
  font-family: var(--font-body); line-height: var(--lh-body);
  padding: 1.5rem 1rem 3rem;
}
*:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }
.sheet {
  background: var(--color-sheet); max-width: 58rem; margin: 0 auto;
  border: 1px solid var(--color-line-strong); border-radius: var(--radius-sheet);
  padding: 2.25rem 2.5rem 3rem;
}
.rfc-head {
  font-family: var(--font-mono); font-size: var(--size-mono-block); line-height: 1.75;
  display: grid; grid-template-columns: 1fr auto; gap: 0 1.5rem;
  border-bottom: 2px solid var(--color-ink); padding-bottom: .9rem;
}
.rfc-head .right { text-align: right; }
h1 {
  font-family: var(--font-display); font-weight: var(--fw-display);
  letter-spacing: var(--ls-display); text-transform: uppercase; line-height: var(--lh-display);
  font-size: var(--size-title); text-align: center; margin: 2rem 0 1.75rem; text-wrap: balance;
}
h2 {
  font-family: var(--font-display); font-weight: var(--fw-display);
  letter-spacing: var(--ls-display); text-transform: uppercase; line-height: var(--lh-display);
  font-size: var(--size-section); margin: 2.25rem 0 .75rem;
}
h3 {
  font-family: var(--font-body); font-size: var(--size-subsection); font-weight: 700;
  margin: 1.4rem 0 .5rem;
}
p { margin: 0 0 .85rem; font-size: var(--size-body); max-width: 68ch; }
ul, ol { max-width: 68ch; font-size: var(--size-body); }
li { margin-bottom: .3rem; }
a { color: var(--color-action); }
blockquote {
  margin: 1.1rem 0; padding: .9rem 1.05rem;
  background: rgba(20,26,23,.03); border: 1px solid var(--color-line);
}
blockquote p:last-child { margin-bottom: 0; }
hr { border: none; border-top: 1px solid var(--color-line); margin: 2rem 0; }
code { font-family: var(--font-mono); font-size: .88em; }
pre.code {
  font-family: var(--font-mono); font-size: var(--size-mono-block); line-height: 1.7;
  background: rgba(20,26,23,.05); border: 1px solid var(--color-line);
  padding: .6rem .75rem; overflow-x: auto;
}
/* Mermaid renders to an SVG where a renderer is present and stays readable as
   source where it is not, so centre the figure without centring the text. */
pre.mermaid {
  font-family: var(--font-mono); font-size: var(--size-mono-block); line-height: 1.7;
  background: var(--color-sheet); border: 1px solid var(--color-line-strong);
  padding: 1rem; overflow-x: auto;
}
pre.mermaid svg { display: block; margin: 0 auto; height: auto; max-width: 100%; }
.table-scroll { overflow-x: auto; }
table { width: 100%; min-width: 30rem; border-collapse: collapse; font-size: .8125rem; margin-bottom: 1.1rem; }
th {
  text-align: left; font-family: var(--font-mono); font-size: var(--size-micro); font-weight: 700;
  letter-spacing: var(--ls-mono); text-transform: uppercase; color: var(--color-muted);
  padding: .4rem .5rem; border-bottom: 1px solid var(--color-line-strong);
}
td { padding: .5rem; border-bottom: 1px solid var(--color-line); vertical-align: top; }

/* --- clause: the level band --- */
.clause { margin: 1.5rem 0; border: 1px solid var(--color-line); }
.band {
  display: flex; flex-wrap: wrap; align-items: stretch;
  border-bottom: 1px solid var(--color-line); background: rgba(20,26,23,.035);
}
.band .tab {
  font-family: var(--font-display); font-weight: var(--fw-display); font-size: .95rem;
  letter-spacing: .1em; text-transform: uppercase; line-height: 1;
  padding: .55rem .8rem; color: var(--color-sheet); display: flex; align-items: center;
}
.band .tab.must { background: var(--color-ink); }
.band .tab.should { background: var(--color-action); }
.band .tab.may { background: transparent; color: var(--color-ink); border-right: 1px solid var(--color-line); }
.band .tab.dep { background: var(--color-attention); }
.band .ref {
  font-family: var(--font-mono); font-size: .68rem; padding: .55rem .8rem;
  color: var(--color-muted); display: flex; align-items: center;
}
.clause-body { padding: .95rem 1rem 1.05rem; }
.clause-body > *:last-child { margin-bottom: 0; }
.norm { font-size: var(--size-clause); font-weight: 600; line-height: 1.45; }
.norm b { font-weight: 700; }
.clause-body p:not(.norm) { font-size: var(--size-small); color: var(--color-muted); }

/* --- agent material --- */
.agent-head {
  font-family: var(--font-mono); font-size: var(--size-micro); font-weight: 700;
  letter-spacing: var(--ls-mono); text-transform: uppercase;
  color: var(--color-agent); margin: .8rem 0 .3rem;
}
pre.cmd {
  font-family: var(--font-mono); font-size: .8rem; line-height: 1.7; margin: 0;
  background: rgba(44,85,96,.07); border-left: 3px solid var(--color-agent);
  padding: .6rem .75rem; overflow-x: auto;
}

.pip { display: inline-flex; align-items: center; gap: .4em; }
.pip::before { content: ""; width: .55em; height: .55em; background: currentColor; flex: none; }
.is-force { color: var(--color-in-force); }
.is-attn { color: var(--color-attention); }
.is-muted { color: var(--color-muted); }

@media (max-width: 700px) {
  .rfc-head { grid-template-columns: 1fr; }
  .rfc-head .right { text-align: left; }
  .sheet { padding: 1.4rem 1.15rem 2rem; }
}

@media print {
  body { background: #fff; color: #000; padding: 0; }
  .sheet { border: none; max-width: none; padding: 0; background: #fff; }
  .band { background: transparent; }
  .band .tab { color: #000 !important; background: transparent !important; border: 1.5px solid #000; margin: .3rem; padding: .3rem .55rem; }
  pre.cmd { background: transparent; border: 1px solid #bbb; border-left: 3px solid #000; white-space: pre-wrap; }
  .clause, h2, h3 { break-inside: avoid; }
  h1, h2, h3 { break-after: avoid; }
  a::after { content: " <" attr(href) ">"; font-size: .72em; word-break: break-all; }
  a[href^="#"]::after { content: ""; }
  @page { margin: 18mm 16mm; }
}
</style>
</head><body>
<main class="sheet">
${headerBlock(meta)}
<h1>${esc(meta.title)}</h1>
${bodyHtml}
</main>
</body></html>`;
}

/* ---------------- cli ---------------- */
function main() {
  const args = process.argv.slice(2);
  let files;
  if (args.length) {
    files = args;
  } else {
    try {
      files = readdirSync(STD_DIR).filter((f) => f.endsWith(".md")).map((f) => join(STD_DIR, f));
    } catch {
      console.error(`no standards/ directory at ${STD_DIR}`);
      process.exit(1);
    }
  }
  if (!files.length) {
    console.error("no standards found to render");
    process.exit(1);
  }

  const cssVars = tokensToCss();
  mkdirSync(OUT_DIR, { recursive: true });

  let failed = 0;
  for (const f of files) {
    const parsed = parseStandard(readFileSync(f, "utf8"), basename(f));
    const name = basename(f).replace(/\.md$/, ".html");
    if (parsed.errors.length) {
      failed++;
      console.log(`\n  x ${basename(f)} — does not conform to STD-001`);
      for (const e of parsed.errors) console.log(`      ${e}`);
      continue;
    }
    writeFileSync(join(OUT_DIR, name), renderStandard(parsed, cssVars));
    const levels = parsed.clauses.reduce((a, c) => {
      const k = c.deprecated ? "DEPRECATED" : c.keyword;
      a[k] = (a[k] || 0) + 1;
      return a;
    }, {});
    const summary = Object.entries(levels).map(([k, n]) => `${n} ${k}`).join(", ") || "no clauses";
    console.log(`  ok ${basename(f).padEnd(42)} ${String(parsed.meta.category).padEnd(9)} ${summary}`);
  }

  console.log(`\n  rendered to out/standards/`);
  if (failed) {
    console.log(`  ${failed} document(s) did not conform.`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
