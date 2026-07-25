// Reads the design tokens out of DESIGN.md and turns them into CSS custom
// properties. DESIGN.md is the single source of truth — the renderer must not
// carry a second copy of the palette, or the two will drift and the design
// system stops being enforceable.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { splitFrontmatter, parseYaml, getPath } from "./yaml.mjs";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function loadTokens(file = join(ROOT, "DESIGN.md")) {
  const { yaml } = splitFrontmatter(readFileSync(file, "utf8"), "DESIGN.md");
  const tokens = parseYaml(yaml);

  const resolve = (v, seen = 0) => {
    if (seen > 10) throw new Error("token reference cycle");
    const ref = typeof v === "string" && v.match(/^\{([\w.-]+)\}$/);
    return ref ? resolve(getPath(tokens, ref[1]), seen + 1) : v;
  };
  return { tokens, resolve };
}

export function tokensToCss(file) {
  const { tokens, resolve } = loadTokens(file);
  const out = [];

  for (const [k, v] of Object.entries(tokens.colors || {})) {
    out.push(`  --color-${k}: ${resolve(v)};`);
  }
  const t = tokens.typography || {};
  out.push(`  --font-display: ${t.display?.fontFamily ?? "system-ui, sans-serif"};`);
  out.push(`  --fw-display: ${t.display?.fontWeight ?? 600};`);
  out.push(`  --ls-display: ${t.display?.letterSpacing ?? "0.03em"};`);
  out.push(`  --lh-display: ${t.display?.lineHeight ?? 0.95};`);
  out.push(`  --font-body: ${t.body?.fontFamily ?? "system-ui, sans-serif"};`);
  out.push(`  --lh-body: ${t.body?.lineHeight ?? 1.55};`);
  out.push(`  --font-mono: ${t.mono?.fontFamily ?? "ui-monospace, monospace"};`);
  out.push(`  --ls-mono: ${t.mono?.letterSpacing ?? "0.1em"};`);
  for (const [k, v] of Object.entries(t.sizes || {})) out.push(`  --size-${k}: ${v};`);
  for (const [k, v] of Object.entries(tokens.rounded || {})) out.push(`  --radius-${k}: ${v};`);

  return `:root {\n${out.join("\n")}\n}`;
}
