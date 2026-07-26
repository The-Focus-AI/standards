#!/usr/bin/env node
// Validates every skill under skills/ — run by `mise run skills:check` (and by `mise lint`).
//
// Checks, per skill:
//   1. SKILL.md exists
//   2. YAML frontmatter is present and has `name` and `description`
//   3. `name` is kebab-case and matches the directory name
//   4. `description` is substantial and within the 1024-char limit the skills CLI enforces
//   5. every `references/…`, `templates/…`, or `examples/…` path named in SKILL.md exists
//
// And repo-wide:
//   6. the vendored skills listed in skills/VENDORED.md match the ones the
//      markdownlint config ignores — two hand-maintained lists that must agree,
//      which is exactly the pair that drifts silently.
//
// Exits non-zero with a list of problems, so CI catches a broken skill before install does.

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const SKILLS_DIR = "skills";
const MAX_DESCRIPTION = 1024;
const MIN_DESCRIPTION = 40;
const REF_RE = /(?:references|templates|examples)\/[A-Za-z0-9._/-]+/g;

const problems = [];
const fail = (skill, msg) => problems.push(`${skill}: ${msg}`);

function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return null;
  const block = text.slice(4, end);
  const data = {};
  let key = null;
  for (const line of block.split("\n")) {
    const m = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (m) {
      key = m[1];
      data[key] = m[2].trim().replace(/^>[-+]?$/, "");
    } else if (key && line.trim()) {
      data[key] = `${data[key]} ${line.trim()}`.trim();
    }
  }
  return data;
}

const skills = readdirSync(SKILLS_DIR)
  .filter((d) => statSync(join(SKILLS_DIR, d)).isDirectory())
  .sort();

if (skills.length === 0) {
  console.error("No skills found under skills/");
  process.exit(1);
}

for (const skill of skills) {
  const dir = join(SKILLS_DIR, skill);
  const skillMd = join(dir, "SKILL.md");

  if (!existsSync(skillMd)) {
    fail(skill, "missing SKILL.md");
    continue;
  }

  const text = readFileSync(skillMd, "utf8");
  const fm = parseFrontmatter(text);

  if (!fm) {
    fail(skill, "SKILL.md has no YAML frontmatter");
    continue;
  }
  if (!fm.name) fail(skill, "frontmatter is missing `name`");
  if (!fm.description) fail(skill, "frontmatter is missing `description`");

  if (fm.name && fm.name !== skill) {
    fail(skill, `frontmatter name "${fm.name}" does not match directory name`);
  }
  if (fm.name && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fm.name)) {
    fail(skill, `name "${fm.name}" is not kebab-case`);
  }
  if (fm.description) {
    if (fm.description.length > MAX_DESCRIPTION) {
      fail(skill, `description is ${fm.description.length} chars (max ${MAX_DESCRIPTION})`);
    }
    if (fm.description.length < MIN_DESCRIPTION) {
      fail(skill, `description is only ${fm.description.length} chars — say what it does and when to trigger`);
    }
  }

  for (const ref of new Set(text.match(REF_RE) ?? [])) {
    if (!existsSync(join(dir, ref))) {
      fail(skill, `SKILL.md points at ${ref}, which does not exist`);
    }
  }
}

/* ---- vendored list vs lint ignores ---- */
// Vendored skills are excluded from markdownlint because they are somebody
// else's prose. That exclusion is only honest while the two lists agree.
{
  const vendoredDoc = join(SKILLS_DIR, "VENDORED.md");
  const lintConfig = ".markdownlint-cli2.jsonc";
  if (existsSync(vendoredDoc) && existsSync(lintConfig)) {
    const doc = readFileSync(vendoredDoc, "utf8");
    const section = doc.split(/^## Vendored\s*$/m)[1]?.split(/^## /m)[0] ?? "";
    const declared = new Set(
      [...section.matchAll(/^\|\s*`([a-z0-9-]+)`\s*\|/gm)].map((m) => m[1])
    );
    const ignored = new Set(
      [...readFileSync(lintConfig, "utf8").matchAll(/"skills\/([a-z0-9-]+)\/\*\*"/g)].map((m) => m[1])
    );
    for (const s of declared) {
      if (!ignored.has(s)) problems.push(`VENDORED.md lists ${s} as vendored, but markdownlint does not ignore it`);
    }
    for (const s of ignored) {
      if (!declared.has(s)) problems.push(`markdownlint ignores skills/${s}, but VENDORED.md does not list it as vendored`);
    }
  }
}

if (problems.length > 0) {
  console.error(`✗ ${problems.length} problem(s) in ${skills.length} skill(s):\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`✓ ${skills.length} skills valid: ${skills.join(", ")}`);
