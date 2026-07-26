#!/usr/bin/env node
// Checks every non-standard document against STD-006: guides, notes, and
// decision records must declare what they are and when they were last true.
//
// Standards are checked by render-standard.mjs — rendering is their conformance
// check. Nothing checked the other three kinds, which is how a guide lost
// fifteen pieces of its walkthrough without anything noticing.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { splitFrontmatter, parseYaml } from "./lib/yaml.mjs";
import { ROOT } from "./lib/design-tokens.mjs";

// One axis: every document this repository owns declares `kind`. Skills carry
// the schema the skills CLI imposes, and AGENTS.md / README.md are navigation
// read by external tooling — both are deliberately outside, per STD-006 §4.
const DIRS = {
  "best-practices": { kind: "guide", statuses: ["Current", "Superseded"] },
  reports: { kind: "note", statuses: ["Current", "Superseded"], datedFilename: true },
  architecture: { kind: "decision", statuses: ["Proposed", "Accepted", "Superseded"] },
  prompts: { kind: "prompt", statuses: ["Current", "Superseded"] },
  standards: { kind: "standard", statuses: ["Draft", "In force", "Obsoleted"], extra: ["standard", "category", "revision", "applies-to"] },
  ".": { kind: "design", statuses: ["Current", "Superseded"], only: ["DESIGN.md"] },
};

const REQUIRED = ["title", "kind", "issued", "author", "status"];
const errors = [];
let checked = 0;

for (const [dir, spec] of Object.entries(DIRS)) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) continue;

  const files = spec.only ?? readdirSync(abs).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const path = dir === "." ? file : `${dir}/${file}`;
    const src = readFileSync(join(abs, file), "utf8");
    checked++;

    let meta;
    try {
      meta = parseYaml(splitFrontmatter(src, path).yaml);
    } catch {
      errors.push(`${path}: no frontmatter. STD-006 §3.1 requires title, kind, issued, author, status.`);
      continue;
    }

    for (const k of REQUIRED) {
      if (!meta[k]) errors.push(`${path}: missing ${k} (STD-006 §3.1)`);
    }
    for (const k of spec.extra ?? []) {
      if (!meta[k]) errors.push(`${path}: missing ${k} (STD-001 §3.18)`);
    }
    if (meta.kind && meta.kind !== spec.kind) {
      errors.push(`${path}: kind is "${meta.kind}" but ${dir}/ holds ${spec.kind} documents (STD-006 §4)`);
    }
    if (meta.status && !spec.statuses.includes(meta.status)) {
      errors.push(`${path}: status "${meta.status}" not one of ${spec.statuses.join(", ")} (STD-006 §4)`);
    }
    if (spec.kind === "note") {
      if (!meta.verified) errors.push(`${path}: notes need a verified date (STD-006 §3.3)`);
      if (!/^\d{4}-\d{2}-\d{2}-/.test(file)) {
        errors.push(`${path}: note filenames start with YYYY-MM-DD (STD-006 §3.4)`);
      }
    }
    if (meta.status === "Superseded" && !/supersede|replaced by/i.test(src)) {
      errors.push(`${path}: superseded but names no replacement (STD-006 §3.7)`);
    }
  }
}

console.log(`STD-006 document validation\n\n  ${checked} document(s) checked`);
if (errors.length) {
  console.log("\n  errors:");
  for (const e of errors) console.log(`    x ${e}`);
  console.log(`\n${errors.length} error(s).`);
  process.exit(1);
}
console.log("\n  OK — every document declares its kind, date, author and status.");
