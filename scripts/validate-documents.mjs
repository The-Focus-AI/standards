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
  "best-practices": { kind: "guide", prefix: "GDE", statuses: ["Current", "Superseded"] },
  reports: { kind: "note", prefix: "NOTE", statuses: ["Current", "Superseded"], datedFilename: true },
  architecture: { kind: "decision", prefix: "ADR", statuses: ["Proposed", "Accepted", "Superseded"] },
  prompts: { kind: "prompt", prefix: "PRM", statuses: ["Current", "Superseded"] },
  standards: {
    kind: "standard", prefix: "STD", numberField: "standard",
    statuses: ["Draft", "In force", "Obsoleted"],
    extra: ["standard", "category", "revision", "applies-to"],
  },
  // The design document is a singleton at a fixed path and carries no number
  // (STD-006 §3.10).
  ".": { kind: "design", statuses: ["Current", "Superseded"], only: ["DESIGN.md"] },
};

const REQUIRED = ["title", "kind", "issued", "author", "status"];
const errors = [];
const seen = {};
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
    // The number is an address, so the frontmatter and the filename have to
    // agree about it — a document whose name says GDE-002 and whose frontmatter
    // says 003 is citable two different ways and findable neither. (§3.10)
    if (spec.prefix) {
      const field = spec.numberField ?? "number";
      const num = meta[field];
      if (!num) {
        errors.push(`${path}: missing ${field} (STD-006 §3.10)`);
      } else if (!/^\d{3}$/.test(String(num))) {
        errors.push(`${path}: ${field} is "${num}" — three digits, quoted (STD-006 §3.10)`);
      }
      const named = file.match(new RegExp(`^${spec.prefix}-(\\d{3})-`));
      if (!named) {
        errors.push(`${path}: filename must start ${spec.prefix}-nnn- (STD-006 §3.10)`);
      } else if (num && named[1] !== String(num)) {
        errors.push(`${path}: filename says ${spec.prefix}-${named[1]} but ${field} is "${num}" (STD-006 §3.10)`);
      }
      if (named) (seen[dir] ??= new Map()).set(named[1], [...(seen[dir]?.get(named[1]) ?? []), path]);
    }
    if (spec.kind === "note") {
      if (!meta.verified) errors.push(`${path}: notes need a verified date (STD-006 §3.3)`);
      if (!/^NOTE-\d{3}-\d{4}-\d{2}-\d{2}-/.test(file)) {
        errors.push(`${path}: note filenames are NOTE-nnn-YYYY-MM-DD-slug.md (STD-006 §3.4)`);
      }
    }
    if (meta.status === "Superseded" && !/supersede|replaced by/i.test(src)) {
      errors.push(`${path}: superseded but names no replacement (STD-006 §3.7)`);
    }
  }
}

// A number is identity; two documents sharing one makes every citation ambiguous. (§3.11)
for (const [dir, nums] of Object.entries(seen)) {
  for (const [n, paths] of nums) {
    if (paths.length > 1) errors.push(`${dir}/: number ${n} is used by ${paths.join(" and ")} (STD-006 §3.11)`);
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
