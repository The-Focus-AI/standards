#!/usr/bin/env node
// Checks document metadata against STD-006 and the additional standard fields
// in STD-001. The renderer shares these checks and adds clause validation.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DOCUMENT_CLASSES, parseDocumentMetadata, duplicateIdentityErrors } from "./lib/document-metadata.mjs";
import { ROOT } from "./lib/design-tokens.mjs";

// One axis: every document this repository owns declares `kind`. Skills carry
// the schema the skills CLI imposes, and AGENTS.md / README.md are navigation
// read by external tooling — both are deliberately outside, per STD-006 §4.
const errors = [];
const documents = [];
let checked = 0;

for (const [kind, spec] of Object.entries(DOCUMENT_CLASSES)) {
  const { dir } = spec;
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) continue;

  const files = spec.only ?? readdirSync(abs).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const path = dir === "." ? file : `${dir}/${file}`;
    const src = readFileSync(join(abs, file), "utf8");
    checked++;

    const parsed = parseDocumentMetadata(src, file, kind);
    errors.push(...parsed.errors.map((error) => `${path}: ${error}`));
    documents.push({ id: parsed.id, source: path });
  }
}

// A number is identity; two documents sharing one makes every citation ambiguous. (§3.11)
errors.push(...duplicateIdentityErrors(documents));

console.log(`STD-006 document validation\n\n  ${checked} document(s) checked`);
if (errors.length) {
  console.log("\n  errors:");
  for (const e of errors) console.log(`    x ${e}`);
  console.log(`\n${errors.length} error(s).`);
  process.exit(1);
}
console.log("\n  OK — every document declares its kind, date, author and status.");
