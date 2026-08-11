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
//   7. the inventory agrees with itself: every skill on disk is in both lock
//      files and in the GDE-008 table, the two lock files are identical, and
//      nothing is listed in one place and missing from another. The inventory
//      lives in four places because each has a different reader — a machine
//      restoring it, a person reading the guide, the register that numbers it —
//      and a partial list is worse than none, because it reads as complete.
//
// With --installed, additionally checks that what is on disk in .claude/skills/
// matches the lock. The skills CLI drops a skill that has vanished upstream and
// still exits 0, so the count is the only thing that catches it (STD-011 §3.8).
//
// Exits non-zero with a list of problems, so CI catches a broken skill before install does.

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const SKILLS_DIR = "skills";
const LOCKS = ["skills-lock.json", "templates/default-project/skills-lock.json"];
const INVENTORY_DOC = "best-practices/GDE-008-skills.md";
const INSTALL_DIR = ".claude/skills";
const OWN_SOURCE = "The-Focus-AI/standards";
const checkInstalled = process.argv.includes("--installed");
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

/* ---- the skill register ---- */
// skills/VENDORED.md assigns every skill its SKL-nnn number, because SKILL.md's
// frontmatter belongs to the skills CLI. That makes the file authoritative, and
// an authoritative file that nothing checks is one that drifts. Two things are
// verified here: every skill on disk is registered exactly once with a unique
// number, and the vendored half agrees with the markdownlint ignore list —
// vendored skills are exempt from lint because they are somebody else's prose,
// and that exemption is only honest while the two lists match.
{
  const vendoredDoc = join(SKILLS_DIR, "VENDORED.md");
  const lintConfig = ".markdownlint-cli2.jsonc";
  if (existsSync(vendoredDoc)) {
    const doc = readFileSync(vendoredDoc, "utf8");
    const sectionOf = (h) => doc.split(new RegExp(`^## ${h}\\s*$`, "m"))[1]?.split(/^## /m)[0] ?? "";
    const rows = (s) => [...s.matchAll(/^\|\s*SKL-(\d{3})\s*\|\s*`([a-z0-9-]+)`\s*\|/gm)]
      .map((m) => ({ num: m[1], name: m[2] }));

    const authored = rows(sectionOf("Authored here"));
    const vendored = rows(sectionOf("Vendored"));
    const all = [...authored, ...vendored];

    const byName = new Map();
    const byNum = new Map();
    for (const r of all) {
      if (byName.has(r.name)) problems.push(`VENDORED.md registers ${r.name} twice`);
      byName.set(r.name, r);
      if (byNum.has(r.num)) {
        problems.push(`VENDORED.md gives SKL-${r.num} to both ${byNum.get(r.num).name} and ${r.name}`);
      }
      byNum.set(r.num, r);
    }
    for (const skill of skills) {
      if (!byName.has(skill)) problems.push(`skills/${skill} is not registered in VENDORED.md — it has no SKL number`);
    }
    for (const r of all) {
      if (!skills.includes(r.name)) problems.push(`VENDORED.md registers ${r.name} (SKL-${r.num}), which is not a directory under skills/`);
    }

    if (existsSync(lintConfig)) {
      const declared = new Set(vendored.map((r) => r.name));
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
}

/* ---- the inventory ---- */
// Four lists of the same thing: the skills on disk, the two lock files, and the
// table in GDE-008. They are written for different readers and they disagree the
// moment nobody checks, which is how work-next-issue ended up shipped but never
// locked, and writing-great-skills stayed locked after vanishing upstream.
{
  const locks = new Map();
  for (const file of LOCKS) {
    if (!existsSync(file)) { problems.push(`${file} is missing`); continue; }
    try {
      locks.set(file, JSON.parse(readFileSync(file, "utf8")).skills ?? {});
    } catch (e) {
      problems.push(`${file} is not valid JSON: ${e.message}`);
    }
  }

  const [primary, ...rest] = [...locks.keys()];
  for (const other of rest) {
    if (readFileSync(primary, "utf8") !== readFileSync(other, "utf8")) {
      problems.push(
        `${primary} and ${other} differ — a project scaffolded from the template ` +
        `would get a different skill set than this repository runs`
      );
    }
  }

  const lock = locks.get(primary) ?? {};
  for (const skill of skills) {
    const entry = lock[skill];
    if (!entry) {
      problems.push(`skills/${skill} is not in ${primary} — it ships but no project installs it`);
    } else if (entry.source !== OWN_SOURCE) {
      problems.push(`${primary} sources ${skill} from ${entry.source}, but it lives in skills/`);
    } else if (entry.skillPath !== `skills/${skill}/SKILL.md`) {
      problems.push(`${primary} points ${skill} at ${entry.skillPath}`);
    }
  }
  for (const [name, entry] of Object.entries(lock)) {
    if (entry.source === OWN_SOURCE && !skills.includes(name)) {
      problems.push(`${primary} locks ${name} from this repository, but skills/${name} does not exist`);
    }
  }

  // GDE-008 is the human-readable half of the same inventory. Every locked skill
  // has to appear in it by name, or a reader checking "is this one of ours?" is
  // told no by omission.
  if (existsSync(INVENTORY_DOC)) {
    const doc = readFileSync(INVENTORY_DOC, "utf8");
    const listed = new Set([...doc.matchAll(/^\|\s*`([a-z0-9-]+)`\s*\|/gm)].map((m) => m[1]));
    for (const name of Object.keys(lock)) {
      if (!listed.has(name)) {
        problems.push(`${name} is locked but not listed in ${INVENTORY_DOC}`);
      }
    }
    for (const name of listed) {
      if (!(name in lock)) {
        problems.push(`${INVENTORY_DOC} lists ${name}, which is not in ${primary}`);
      }
    }
  }

  // --installed: what actually landed. Only meaningful after `mise run install`.
  if (checkInstalled) {
    const installed = existsSync(INSTALL_DIR)
      ? readdirSync(INSTALL_DIR).filter((d) => statSync(join(INSTALL_DIR, d)).isDirectory())
      : [];
    if (installed.length === 0) {
      problems.push(
        `${INSTALL_DIR}/ is empty or missing — the install wrote nothing Claude Code reads. ` +
        `If the command used was \`skills experimental_install\`, that is the cause (STD-011 §3.3)`
      );
    }
    for (const name of Object.keys(lock)) {
      if (!installed.includes(name)) {
        problems.push(
          `${name} is in ${primary} but not in ${INSTALL_DIR}/ — dropped silently, ` +
          `most likely renamed or removed upstream (STD-011 §3.8)`
        );
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`✗ ${problems.length} problem(s) in ${skills.length} skill(s):\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const locked = existsSync(LOCKS[0]) ? Object.keys(JSON.parse(readFileSync(LOCKS[0], "utf8")).skills ?? {}).length : 0;
console.log(`✓ ${skills.length} skills valid: ${skills.join(", ")}`);
console.log(`✓ inventory agrees: ${locked} locked, both lock files identical, all listed in ${INVENTORY_DOC}`);
