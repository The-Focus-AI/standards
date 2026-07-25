#!/usr/bin/env node
// Validates DESIGN.md against itself. Standing artifact — re-run on every edit.
//
//   1. every {token.path} reference in the frontmatter resolves
//   2. no colour token is defined and then never used
//   3. every ink/ground pair clears WCAG AA (4.5:1)
//   4. the "Measured contrast" table in the prose matches the computed values
//
// (4) is the point. A design file that states ratios it has not measured is
// exactly the undated, unattributed rule the system forbids.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = join(ROOT, "DESIGN.md");
const src = readFileSync(FILE, "utf8");

const errors = [];
const warnings = [];

/* ---------- split frontmatter ---------- */
const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!m) {
  console.error("DESIGN.md: no YAML frontmatter found");
  process.exit(1);
}
const [, yaml, body] = m;

/* ---------- minimal YAML reader for this file's subset ----------
   Handles nested maps, scalars, flow sequences, quoted strings and `>-`
   block scalars. Deliberately small: if DESIGN.md ever needs more YAML than
   this, that is a signal the token file is drifting toward config. */
function parseYaml(text) {
  const root = {};
  const stack = [{ indent: -1, node: root }];
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim() || /^\s*#/.test(raw)) continue;

    const indent = raw.match(/^\s*/)[0].length;
    let line = raw.trim();

    const km = line.match(/^([\w-]+):\s*(.*)$/);
    if (!km) continue;
    const [, key, rest] = km;

    while (stack.length && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].node;

    if (rest === "" ) {
      const node = {};
      parent[key] = node;
      stack.push({ indent, node });
      continue;
    }
    if (rest === ">-" || rest === "|" || rest === ">") {
      const buf = [];
      while (i + 1 < lines.length && (lines[i + 1].trim() === "" || lines[i + 1].match(/^\s*/)[0].length > indent)) {
        buf.push(lines[++i].trim());
      }
      parent[key] = buf.join(" ").trim();
      continue;
    }
    if (rest.startsWith("[")) {
      parent[key] = rest.replace(/^\[|\]$/g, "").split(",").map((s) => s.trim()).filter(Boolean);
      continue;
    }
    parent[key] = rest.replace(/^["']|["']$/g, "");
  }
  return root;
}

const tokens = parseYaml(yaml);

/* ---------- 1. every {token.path} resolves ---------- */
const get = (path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), tokens);

const refs = [...yaml.matchAll(/\{([\w.-]+)\}/g)].map((x) => x[1]);
const uniqueRefs = [...new Set(refs)];
for (const ref of uniqueRefs) {
  if (get(ref) === undefined) errors.push(`unresolved token reference: {${ref}}`);
}

/* ---------- 2. orphaned colour tokens ---------- */
const colors = tokens.colors || {};
for (const name of Object.keys(colors)) {
  const referenced = uniqueRefs.includes(`colors.${name}`);
  const inProse = new RegExp("`" + name + "`").test(body);
  if (!referenced && !inProse) warnings.push(`colour token never referenced or documented: ${name}`);
}

/* ---------- contrast ---------- */
const toRgb = (hex) => {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const lum = (hex) =>
  toRgb(hex)
    .map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    })
    .reduce((a, c, i) => a + [0.2126, 0.7152, 0.0722][i] * c, 0);
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const r2 = (n) => Math.round(n * 100) / 100;

const resolve = (v) => {
  const ref = typeof v === "string" && v.match(/^\{([\w.-]+)\}$/);
  return ref ? resolve(get(ref[1])) : v;
};
const isHex = (v) => typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v);

const GROUNDS = ["sheet", "page"];
const SKIP = new Set([...GROUNDS, "action-text", "focus-ring"]);

/* ---------- 3. every ink/ground pair clears AA ---------- */
const computed = {};
for (const [name, value] of Object.entries(colors)) {
  const hex = resolve(value);
  if (!isHex(hex) || SKIP.has(name)) continue;
  computed[name] = {};
  for (const g of GROUNDS) {
    const gh = resolve(colors[g]);
    const rr = r2(ratio(hex, gh));
    computed[name][g] = rr;
    if (rr < 4.5) errors.push(`contrast: ${name} on ${g} is ${rr}:1, below AA 4.5:1`);
  }
}
// text on a filled action button
const actionText = resolve(colors["action-text"]);
const actionFill = resolve(colors.action);
if (isHex(actionText) && isHex(actionFill)) {
  const rr = r2(ratio(actionText, actionFill));
  computed["action-text on action"] = { sheet: rr };
  if (rr < 4.5) errors.push(`contrast: action-text on action is ${rr}:1, below AA 4.5:1`);
}

/* ---------- 4. the prose table must match ---------- */
const tableStart = body.indexOf("| Pair | On sheet | On page |");
if (tableStart === -1) {
  errors.push("prose: measured-contrast table not found (expected header '| Pair | On sheet | On page |')");
} else {
  const rows = body
    .slice(tableStart)
    .split("\n")
    .slice(2)
    .filter((l) => l.startsWith("|"));
  let checked = 0;
  for (const row of rows) {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    const label = cells[0].replace(/`/g, "");
    const entry = computed[label];
    if (!entry) {
      errors.push(`prose table names a pair that is not computed: ${label}`);
      continue;
    }
    for (const [idx, g] of ["sheet", "page"].entries()) {
      const claimed = cells[idx + 1];
      if (claimed === "—") continue;
      const actual = entry[g];
      if (actual === undefined) continue;
      if (Math.abs(Number(claimed) - actual) > 0.005) {
        errors.push(`prose table: ${label} on ${g} claims ${claimed}, measured ${actual}`);
      }
      checked++;
    }
  }
  if (checked === 0) errors.push("prose: measured-contrast table has no checkable rows");
}

/* ---------- report ---------- */
const pad = (s, n) => s.padEnd(n);
console.log("DESIGN.md validation\n");
console.log(`  token references : ${uniqueRefs.length} checked`);
console.log(`  colour tokens    : ${Object.keys(colors).length} defined`);
console.log("\n  measured contrast (computed, not claimed):");
for (const [name, v] of Object.entries(computed)) {
  const parts = Object.entries(v).map(([g, n]) => `${g} ${n.toFixed(2)}`).join("  ");
  console.log(`    ${pad(name, 22)} ${parts}`);
}

if (warnings.length) {
  console.log("\n  warnings:");
  for (const w of warnings) console.log(`    ! ${w}`);
}
if (errors.length) {
  console.log("\n  errors:");
  for (const e of errors) console.log(`    x ${e}`);
  console.log(`\n${errors.length} error(s). DESIGN.md is not valid.`);
  process.exit(1);
}
console.log("\n  OK — every reference resolves, every pair clears AA, the table matches.");
