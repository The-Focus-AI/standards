#!/usr/bin/env node
// Renders the standards site into the visual language defined by DESIGN.md.
//
//   mise run standard:render                 # everything
//   node scripts/render-standard.mjs FILE    # one file
//
// The whole corpus reaches the site, in six classes. **Standards**
// (`standards/`) carry numbered clauses and requirement levels; rendering them
// checks clause structure and required metadata. **Guides**, **notes**, **decision
// records** and **prompts** carry prose and no clauses, and are rendered
// visibly subordinate to the standards they name, per STD-001 §4. **Skills**
// come from `skills/<name>/SKILL.md`, numbered by the register in
// `skills/VENDORED.md` because the skills CLI owns their frontmatter.
//
// Run validate-documents.mjs, check-skills.mjs, and validate-design.mjs too.
// These mechanical checks do not establish semantic conformance.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from "node:fs";
import { join, basename } from "node:path";
import { splitFrontmatter, parseYaml } from "./lib/yaml.mjs";
import { DOCUMENT_CLASSES, parseDocumentMetadata, duplicateIdentityErrors } from "./lib/document-metadata.mjs";
import { tokensToCss, ROOT } from "./lib/design-tokens.mjs";
import { pageCss } from "./lib/page-css.mjs";
import { blocks, renderBlock, inline, esc } from "./lib/markdown.mjs";

const STD_DIR = join(ROOT, "standards");
const SKILLS_DIR = join(ROOT, "skills");
const OUT_DIR = join(ROOT, "out", "standards");

// Everything that is not a standard and not a skill. One shape, four classes:
// prose with provenance, no clauses, numbered by STD-006 §3.10. `memo` is the
// sentence the reader gets before the first line of content — what this class of
// document is, and what it does not do.
const PROSE_CLASSES = [
  {
    ...DOCUMENT_CLASSES.guide, kind: "guide", label: "Guide",
    plural: "Guides", stamp: "Guide · not normative",
    blurb: "Guides carry explanation, walkthroughs and reference implementations.",
    memo: "This is a <b>guide</b>: explanation, walkthrough and reference implementation. " +
          "It contains <b>no clauses and binds nothing</b> (<code>STD-001 §4</code>).",
    tail: "When a guide turns out to contain a rule, the rule moves to a standard " +
          "where it can be cited and checked, and the guide keeps the explanation.",
  },
  {
    ...DOCUMENT_CLASSES.note, kind: "note", label: "Research note",
    plural: "Research notes", stamp: "Note · a capture in time",
    blurb: "Notes record what was true when somebody checked, against sources they cite.",
    memo: "This is a <b>research note</b>: what was found, when it was checked, and " +
          "against what. It binds nothing; read its <b>verified date</b> before " +
          "acting on it (<code>STD-006 §3.3</code>).",
    tail: "A note that has not been rechecked is evidence about the past, not a claim about now.",
  },
  {
    ...DOCUMENT_CLASSES.decision, kind: "decision", label: "Decision record",
    plural: "Decision records", stamp: "Decision · not a rule",
    blurb: "Decision records settle a question for this repository and say what would reopen it.",
    memo: "This is a <b>decision record</b>: what was decided, what else was considered, " +
          "and what would change the answer. It binds nothing outside this repository " +
          "(<code>STD-006 §3.5</code>).",
    tail: "A decision is never edited to reverse itself. It is superseded by a new record " +
          "that names it, so the change of mind stays visible.",
  },
  {
    ...DOCUMENT_CLASSES.prompt, kind: "prompt", label: "Prompt",
    plural: "Prompts", stamp: "Prompt · executed, not read",
    blurb: "Prompts are instructions an agent runs. They are input to a tool, not guidance for a person.",
    memo: "This is a <b>prompt</b>: text an agent executes to produce something. " +
          "It binds nothing and is read by a machine first.",
    tail: "",
  },
];
const CLASS_BY_KIND = new Map(PROSE_CLASSES.map((c) => [c.kind, c]));

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
  const { meta, body, errors } = parseDocumentMetadata(src, file, "standard");

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

/* ---------------- parse a prose document ---------------- */
// Guides, notes, decision records and prompts have no clauses, so there is
// nothing to intercept: the whole body is prose. What is checked is that the
// document declares itself under STD-006 and sits in the directory its kind
// belongs to.
export function parseProse(src, file, cls) {
  const { meta, body, errors } = parseDocumentMetadata(src, file, cls.kind);

  const toks = blocks(body);
  const nodes = [];
  let droppedTitle = false;
  // Most of these open with a blockquote saying where they stand — where their
  // rules went, what they were before. That is standing, not content, so it is
  // lifted into the status memo instead of being printed just below a memo that
  // says the same thing. The source keeps it: read as raw markdown, which is how
  // agents read these, there is no memo to carry it.
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

  // Which standards this document sits under. Read from the prose rather than
  // declared in frontmatter: a document that stops mentioning a standard has
  // stopped being about it, and the site should say so without being told.
  const relates = [...new Set((body.match(/\bSTD-\d{3}\b/g) || []))].sort();

  return { meta, nodes, relates, provenance, errors };
}

/* ---------------- parse a skill ---------------- */
// A skill's frontmatter belongs to the skills CLI — `name` and `description`,
// nothing else — so its number and provenance are read from the register in
// skills/VENDORED.md instead. STD-006 §3.12.
export function parseSkillRegister(src) {
  const section = (h) => src.split(new RegExp(`^## ${h}\\s*$`, "m"))[1]?.split(/^## /m)[0] ?? "";
  const rows = (text, provenance) =>
    [...text.matchAll(/^\|\s*SKL-(\d{3})\s*\|\s*`([a-z0-9-]+)`\s*\|/gm)]
      .map((m) => ({ number: m[1], name: m[2], provenance }));
  return [...rows(section("Authored here"), "Authored here"), ...rows(section("Vendored"), "Vendored")];
}

export function parseSkill(src, entry) {
  const errors = [];
  let yaml, body;
  try {
    ({ yaml, body } = splitFrontmatter(src, `skills/${entry.name}/SKILL.md`));
  } catch {
    return { meta: {}, nodes: [], relates: [], errors: ["SKILL.md has no frontmatter"] };
  }
  const meta = parseYaml(yaml);
  if (!meta.name) errors.push("frontmatter is missing `name`");
  if (!meta.description) errors.push("frontmatter is missing `description`");
  if (meta.name && meta.name !== entry.name) {
    errors.push(`frontmatter name "${meta.name}" does not match directory ${entry.name}`);
  }

  const toks = blocks(body);
  const nodes = [];
  let droppedTitle = false;
  for (const t of toks) {
    if (t.type === "code" && t.unterminated) errors.push("unterminated code fence");
    if (t.type === "heading" && t.level === 1) {
      if (!droppedTitle) { droppedTitle = true; continue; }
      nodes.push({ ...t, level: 2 });
      continue;
    }
    nodes.push(t);
  }
  const relates = [...new Set((body.match(/\bSTD-\d{3}\b/g) || []))].sort();
  return { meta, nodes, relates, errors };
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

export function renderStandard(parsed, cssVars, related = []) {
  const { meta, nodes } = parsed;
  const bodyHtml = nodes
    .map((n) => (n.type === "clause" ? renderClause(n.clause) : renderBlock(n.block)))
    .join("\n");

  return page({
    title: `${esc(String(meta.standard))} — ${esc(meta.title)}`,
    cssVars,
    bodyHtml: `${headerBlock(meta)}\n<h1>${esc(meta.title)}</h1>\n${bodyHtml}\n` +
      relatedBlock("Documents under this standard",
        related.map((d) => ({ mark: d.cls.label, href: d.file, text: `${d.id} — ${d.title}` }))),
  });
}

/* ---------------- render a prose document ---------------- */
function proseHeaderBlock(meta, relates, cls, id) {
  const left = [
    `<b>The Focus AI Standards</b>`,
    `${cls.label}: ${id}`,
    `Status: ${meta.status}`,
    relates.length ? `Relates to: ${relates.join(", ")}` : null,
  ].filter(Boolean);
  const right = [
    meta.author, "The Focus AI", meta.issued,
    meta.verified ? `Verified ${meta.verified}` : null,
  ].filter(Boolean);
  return `<div class="stamp">${esc(cls.stamp)}</div>
<div class="rfc-head guide-head">
  <div>${left.join("<br>")}</div>
  <div class="right">${right.join("<br>")}</div>
</div>`;
}

// Generated, not written. Every document of a class gets the same sentence about
// what that class is, in the same place, so a reader who lands on one from a
// search result learns its standing before reading a word of it.
function proseMemo(relates, provenance, cls) {
  const cite = relates.length
    ? `The rules in this area are <b>${relates.join("</b>, <b>")}</b>; where this
       document and a standard disagree, the standard is the authority.`
    : `No standard has been written for this area yet, so nothing here binds
       anything.`;
  const own = provenance ? blocks(provenance.text).map(renderBlock).join("\n") : "";
  return `<div class="status-memo">
  <span class="lbl">Status of this ${esc(cls.label.toLowerCase())}</span>
  <p>${cls.memo} ${cite}</p>
  ${cls.tail ? `<p>${cls.tail}</p>` : ""}
  ${own}
</div>`;
}

export function renderProse(parsed, cssVars, cls, id, standards = []) {
  const { meta, nodes, relates, provenance } = parsed;
  const bodyHtml = nodes.map(renderBlock).join("\n");

  return page({
    title: `${esc(id)} — ${esc(meta.title)}`,
    cssVars,
    bodyHtml: `${proseHeaderBlock(meta, relates, cls, id)}
<h1>${esc(meta.title)}</h1>
${proseMemo(relates, provenance, cls)}
${bodyHtml}
` + relatedBlock(`Standards this ${cls.label.toLowerCase()} sits under`,
      standards.map((s) => ({ mark: s.category, href: s.file, text: `${s.id} — ${s.title}` }))),
  });
}

/* ---------------- render a skill ---------------- */
export function renderSkill(parsed, cssVars, entry, standards = []) {
  const { meta, nodes, relates } = parsed;
  const bodyHtml = nodes.map(renderBlock).join("\n");
  const left = [
    `<b>The Focus AI Standards</b>`,
    `Skill: SKL-${entry.number}`,
    `Install: ${entry.name}`,
    `Provenance: ${entry.provenance}`,
    relates.length ? `Relates to: ${relates.join(", ")}` : null,
  ].filter(Boolean);
  return `${page({
    title: `SKL-${entry.number} — ${esc(entry.name)}`,
    cssVars,
    bodyHtml: `<div class="stamp">Skill · loaded on demand</div>
<div class="rfc-head guide-head">
  <div>${left.join("<br>")}</div>
  <div class="right">The Focus AI<br>standards.thefocus.ai</div>
</div>
<h1>${esc(entry.name)}</h1>
<div class="status-memo">
  <span class="lbl">Status of this skill</span>
  <p>This is a <b>skill</b>: a capability an agent loads when its triggers match.
     It binds nothing — it is something an agent <i>can</i> do, not something any
     repository <i>must</i> do (<code>STD-011</code>).</p>
  <p>${esc(meta.description || "")}</p>
  <div class="agent-head">Agent · install with</div>
  <pre class="cmd"><code>skills add The-Focus-AI/standards --skill ${esc(entry.name)}</code></pre>
</div>
${bodyHtml}
` + relatedBlock("Standards this skill sits under",
      standards.map((s) => ({ mark: s.category, href: s.file, text: `${s.id} — ${s.title}` }))),
  })}`;
}

/* ---------------- the register ---------------- */
// The index DESIGN.md describes: every standard, its category, status and what
// it binds — and beneath it, every other class, visibly subordinate. A field
// with no value is omitted, never placeholdered.
const pipClass = (status) =>
  status === "Obsoleted" || status === "Superseded" ? "is-attn"
  : status === "Draft" || status === "Proposed" ? "is-muted"
  : status === "In force" ? "is-force"
  : "is-agent";

const regTable = (heads, rows) => `<div class="table-scroll"><table class="reg">
  <thead><tr>${heads.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
  <tbody>${rows.join("")}</tbody>
</table></div>`;

function renderRegister(standards, docs, skills, cssVars) {
  const stdRows = standards.map((e) => `<tr>
      <td><a href="${esc(e.file)}">${esc(e.id)}</a></td>
      <td>${esc(e.title)}</td>
      <td>${esc(e.category)}</td>
      <td>${esc(e.applies)}</td>
      <td><span class="pip ${pipClass(e.status)}">${esc(e.status)}</span></td>
      <td class="num">${e.clauses || "—"}</td>
    </tr>`);

  const sections = PROSE_CLASSES.map((cls) => {
    const mine = docs.filter((d) => d.cls.kind === cls.kind);
    if (!mine.length) return "";
    const dated = cls.kind === "note";
    const heads = ["Ref", "Title", "Relates to", ...(dated ? ["Verified"] : []), "Status"];
    const rows = mine.map((d) => `<tr>
      <td><a href="${esc(d.file)}">${esc(d.id)}</a></td>
      <td>${esc(d.title)}</td>
      <td>${d.relates.length ? d.relates.map(esc).join(", ") : "—"}</td>
      ${dated ? `<td>${esc(d.verified || d.issued || "—")}</td>` : ""}
      <td><span class="pip ${pipClass(d.status)}">${esc(d.status)}</span></td>
    </tr>`);
    return `<h2>${esc(cls.plural)}</h2>\n<p>${cls.blurb} They are <b>not standards</b> and bind nothing (<code>STD-001 §4</code>).</p>\n${regTable(heads, rows)}`;
  }).join("\n");

  const skillSection = skills.length ? `<h2>Skills</h2>
<p>Capabilities an agent loads when its triggers match, installable with
   <code>skills add</code>. A skill is cited by name and numbered here;
   <code>STD-011</code> governs how one is installed and pinned.</p>
${regTable(["Ref", "Skill", "Provenance", "Relates to"], skills.map((k) => `<tr>
      <td><a href="${esc(k.file)}">${esc(k.id)}</a></td>
      <td>${esc(k.name)}</td>
      <td><span class="pip ${k.provenance === "Vendored" ? "is-muted" : "is-agent"}">${esc(k.provenance)}</span></td>
      <td>${k.relates.length ? k.relates.map(esc).join(", ") : "—"}</td>
    </tr>`))}` : "";

  const inForce = standards.filter((e) => e.status === "In force").length;
  const drafts = standards.filter((e) => e.status === "Draft").length;
  const counts = PROSE_CLASSES
    .map((c) => [c.plural, docs.filter((d) => d.cls.kind === c.kind).length])
    .filter(([, n]) => n)
    .map(([label, n]) => `${label}: ${n}`);

  return page({
    title: "The Focus AI Standards — the register",
    cssVars,
    bodyHtml: `<div class="rfc-head">
  <div><b>The Focus AI Standards</b><br>The register<br>Standards: ${standards.length}<br>In force: ${inForce}<br>Draft: ${drafts}</div>
  <div class="right">The Focus AI<br>standards.thefocus.ai<br>${counts.join("<br>")}${skills.length ? `<br>Skills: ${skills.length}` : ""}</div>
</div>
<h1>The register</h1>
<div class="status-memo">
  <span class="lbl">Status of this register</span>
  <p>Every document The Focus AI has issued, with what it binds and whether it is
     in force. A standard in <b>Draft</b> binds nothing: it reflects current
     understanding and is awaiting ratification, which only a person can give
     (<code>STD-001 §3.14</code>). Nothing below the standards binds anything at
     all.</p>
  <p>This page is generated from the documents themselves. Publishing runs the
     renderer and the document, skill, and design validators. These check
     structure and metadata, not whether requirements agree or examples work.</p>
</div>
<h2>Standards</h2>
${regTable(["Ref", "Title", "Category", "Applies to", "Status", "Clauses"], stdRows)}
${sections}
${skillSection}`,
  });
}

/* ---------------- one-file bundle ---------------- */
// The whole corpus as a single self-contained page: the register, every
// standard, every guide, and hash routing between them. For sharing and preview
// where two dozen separate files cannot travel together. `standard:render`
// still emits the real multi-page site alongside it.
function renderBundle(standards, docs, skills, cssVars, registerHtml) {
  const all = [...standards, ...docs, ...skills];
  const nav = standards.map((e) =>
    `<a class="reg-link" href="#${e.anchor}" data-doc="${e.anchor}">${e.id}</a>`).join("");
  // One rail per class. The number is the label, not the slug — a rail of
  // twenty slugs is a wall of words, and the number is the address anyway.
  const railFor = (label, items) => items.length
    ? `<div class="railbar rail-sub"><span class="raillbl">${esc(label)}</span>${
        items.map((d) => `<a class="reg-link" href="#${d.anchor}" data-doc="${d.anchor}" title="${esc(d.title)}">${esc(d.id)}</a>`).join("")
      }</div>`
    : "";
  const subNav = [
    ...PROSE_CLASSES.map((c) => railFor(c.plural, docs.filter((d) => d.cls.kind === c.kind))),
    railFor("Skills", skills),
  ].join("\n");

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
.railbar.rail-sub { padding:0 0 .55rem; }
.railbar.rail-sub:last-of-type { padding-bottom:1rem; }
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
${subNav}
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
// The documents link to each other the way they sit on disk —
// `./GDE-002-clerk.md`, `best-practices/GDE-008-skills.md`. On the site those
// paths do not exist, so they are rewritten to the page that was actually
// emitted. A link that resolves to no rendered document is left alone rather
// than guessed at.
const DIR_PREFIX = /^(best-practices|standards|reports|architecture|prompts)\//;

function linkMap(all) {
  const m = new Map();
  for (const d of all) if (d.source) m.set(basename(d.source), d.file);
  return m;
}

function rewriteLinks(html, map) {
  return html.replace(/href="([^"]+)"/g, (full, href) => {
    if (/^([a-z]+:|#)/i.test(href)) return full;
    const [path, frag] = href.split("#");
    const hit = map.get(path.replace(/^\.\//, "").replace(DIR_PREFIX, ""));
    return hit ? `href="${hit}${frag ? "#" + frag : ""}"` : full;
  });
}

// These documents cite each other in running prose as code spans — `STD-007`,
// `best-practices/GDE-010-vercel-deployment.md` — because that is how they read
// as markdown. On the site those are the navigation, so they become links.
function crossLinkSpans(html, map, ids, self) {
  // Fenced blocks and existing links are held out: a filename inside a command
  // is an argument, and an anchor inside an anchor is not HTML. Each code span
  // is considered exactly once — `NOTE-002-2026-06-25-slug.md` is both a
  // reference and a filename, and matching it twice wrapped it twice.
  const parts = html.split(/(<pre[\s\S]*?<\/pre>|<a\b[\s\S]*?<\/a>)/);
  return parts.map((part, i) => {
    if (i % 2) return part;
    return part.replace(/<code>([^<]+)<\/code>/g, (full, text) => {
      const byId = text.match(/^((?:STD|GDE|NOTE|ADR|PRM|SKL)-\d{3})/);
      const file = byId
        ? ids.get(byId[1])
        : (/\.md$/.test(text) ? map.get(text.replace(DIR_PREFIX, "")) : null);
      return !file || file === self ? full : `<a href="${file}">${full}</a>`;
    });
  }).join("");
}

// A relative link that names no emitted page would 404 on the site. The text is
// still worth reading — `examples/cinematic-shots.md` tells you what to look for
// in the repository — so the anchor is dropped and the words are kept. A dead
// link is worse than no link: it invites a click that goes nowhere.
function deadenLinks(html, emitted) {
  return html.replace(/<a href="([^"]+)">([\s\S]*?)<\/a>/g, (full, href, text) => {
    if (/^([a-z]+:|#)/i.test(href)) return full;
    return emitted.has(href.split("#")[0]) ? full : text;
  });
}

/* ---------------- cli ---------------- */
const listMd = (dir) => {
  try { return readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => join(dir, f)); }
  catch { return []; }
};

function main() {
  const args = process.argv.slice(2);
  const pick = (dir) => (args.length ? args.filter((f) => f.includes(`${dir}/`)) : listMd(join(ROOT, dir)));
  const stdFiles = args.length ? args.filter((f) => f.includes("standards/")) : listMd(STD_DIR);

  let failed = 0;
  const report = (path, why, errors) => {
    failed++;
    console.log(`\n  x ${path} — ${why}`);
    for (const e of errors) console.log(`      ${e}`);
  };

  // DESIGN.md supplies the tokens but is not a page in the register. Its shared
  // metadata still has to satisfy STD-006, including the singleton exception.
  const design = parseDocumentMetadata(readFileSync(join(ROOT, "DESIGN.md"), "utf8"), "DESIGN.md", "design");
  if (design.errors.length) report("DESIGN.md", "does not conform to STD-006", design.errors);

  // Prose first: a standard's page lists the documents that sit under it, so the
  // relationships have to be known before either side is rendered.
  const docs = [];
  for (const cls of PROSE_CLASSES) {
    for (const f of pick(cls.dir)) {
      const file = basename(f);
      const parsed = parseProse(readFileSync(f, "utf8"), file, cls);
      if (parsed.errors.length) { report(`${cls.dir}/${file}`, "does not conform to STD-006", parsed.errors); continue; }
      const id = `${cls.prefix}-${parsed.meta.number}`;
      docs.push({
        parsed, cls, id, source: f,
        title: parsed.meta.title, status: parsed.meta.status,
        issued: parsed.meta.issued, verified: parsed.meta.verified,
        relates: parsed.relates,
        file: `${id.toLowerCase()}.html`, anchor: id,
      });
    }
  }

  // Skills: numbered by the register rather than by their own frontmatter.
  const skills = [];
  if (!args.length && existsSync(join(SKILLS_DIR, "VENDORED.md"))) {
    const register = parseSkillRegister(readFileSync(join(SKILLS_DIR, "VENDORED.md"), "utf8"));
    for (const entry of register) {
      const md = join(SKILLS_DIR, entry.name, "SKILL.md");
      if (!existsSync(md)) { report(`skills/${entry.name}`, "registered but has no SKILL.md", ["STD-006 §3.12"]); continue; }
      const parsed = parseSkill(readFileSync(md, "utf8"), entry);
      if (parsed.errors.length) { report(`skills/${entry.name}/SKILL.md`, "is not a valid skill", parsed.errors); continue; }
      const id = `SKL-${entry.number}`;
      skills.push({
        parsed, entry, id, source: md, name: entry.name, provenance: entry.provenance,
        title: entry.name, relates: parsed.relates,
        file: `${id.toLowerCase()}.html`, anchor: id,
      });
    }
  }

  const standards = [];
  for (const f of stdFiles) {
    const parsed = parseStandard(readFileSync(f, "utf8"), basename(f));
    if (parsed.errors.length) { report(basename(f), "does not conform to STD-001", parsed.errors); continue; }
    const id = `STD-${parsed.meta.standard}`;
    standards.push({
      parsed, id, source: f, title: parsed.meta.title,
      category: parsed.meta.category, status: parsed.meta.status,
      applies: parsed.meta["applies-to"], clauses: parsed.clauses.length,
      file: basename(f).replace(/\.md$/, ".html"), anchor: id,
    });
  }

  const duplicates = duplicateIdentityErrors([...standards, ...docs, ...skills]);
  if (duplicates.length) report("corpus", "ambiguous document identities", duplicates);
  if (failed) {
    console.log(`  ${failed} validation failure(s); no pages written.`);
    process.exit(1);
  }

  if (!standards.length && !docs.length && !skills.length) {
    console.error("no documents found to render");
    process.exit(1);
  }

  const cssVars = tokensToCss();
  // Rendering a renumbered corpus into a directory that still holds the old
  // filenames leaves pages nothing links to any more — stale, unreachable, and
  // indistinguishable from current. Clear it, but only after validation passes.
  if (!args.length && existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });

  docs.sort((a, b) => a.id.localeCompare(b.id));
  skills.sort((a, b) => a.id.localeCompare(b.id));
  standards.sort((a, b) => a.id.localeCompare(b.id));

  // now that every side is known, render each with its cross-references
  const links = linkMap([...standards, ...docs]);
  const ids = new Map([...standards, ...docs, ...skills].map((d) => [d.id, d.file]));
  const emitted = new Set([...standards, ...docs, ...skills].map((d) => d.file).concat("index.html"));
  const wire = (html, self) =>
    deadenLinks(crossLinkSpans(rewriteLinks(html, links), links, ids, self), emitted);

  // A document that names four or five standards is surveying the corpus rather
  // than sitting under any one of them; listing it beneath each would put the
  // same row on every page and tell the reader nothing.
  const SURVEY = 3;
  for (const s of standards) {
    const mine = [...docs, ...skills].filter((d) => d.relates.includes(s.id) && d.relates.length <= SURVEY);
    s.html = wire(renderStandard(s.parsed, cssVars, mine.map((d) => ({
      ...d, cls: d.cls ?? { label: "Skill" },
    }))), s.file);
    writeFileSync(join(OUT_DIR, s.file), s.html);
    const levels = s.parsed.clauses.reduce((a, c) => {
      const k = c.deprecated ? "DEPRECATED" : c.keyword;
      a[k] = (a[k] || 0) + 1;
      return a;
    }, {});
    const summary = Object.entries(levels).map(([k, n]) => `${n} ${k}`).join(", ") || "no clauses";
    console.log(`  ok ${s.id}  ${String(s.category).padEnd(9)} ${summary}`);
  }
  for (const d of docs) {
    const mine = standards.filter((s) => d.relates.includes(s.id));
    d.html = wire(renderProse(d.parsed, cssVars, d.cls, d.id, mine), d.file);
    writeFileSync(join(OUT_DIR, d.file), d.html);
    console.log(`  ok ${d.id} ${d.cls.label.padEnd(16)} ${
      mine.length ? `under ${mine.map((s) => s.id).join(", ")}` : "under no standard"}`);
  }
  for (const k of skills) {
    const mine = standards.filter((s) => k.relates.includes(s.id));
    k.html = wire(renderSkill(k.parsed, cssVars, k.entry, mine), k.file);
    writeFileSync(join(OUT_DIR, k.file), k.html);
    console.log(`  ok ${k.id}  Skill            ${k.name}`);
  }

  const registerHtml = wire(renderRegister(standards, docs, skills, cssVars), "index.html");
  writeFileSync(join(OUT_DIR, "index.html"), registerHtml);
  writeFileSync(join(OUT_DIR, "standards.html"), renderBundle(standards, docs, skills, cssVars, registerHtml));
  console.log(
    `\n  rendered to out/standards/ — index.html lists ${standards.length} standard(s), ` +
    `${docs.length} document(s) and ${skills.length} skill(s); standards.html bundles them`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
