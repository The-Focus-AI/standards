import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { parseStandard, parseProse } from "../scripts/render-standard.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const CLASSES = {
  guide: { kind: "guide", dir: "best-practices", prefix: "GDE", statuses: ["Current", "Superseded"] },
  note: { kind: "note", dir: "reports", prefix: "NOTE", statuses: ["Current", "Superseded"] },
  decision: { kind: "decision", dir: "architecture", prefix: "ADR", statuses: ["Proposed", "Accepted", "Superseded"] },
  prompt: { kind: "prompt", dir: "prompts", prefix: "PRM", statuses: ["Current", "Superseded"] },
};
const STANDARD_BODY = "## 3. Requirements\n\n### 3.1\n\nA repository MUST keep its metadata.\n";

function document(kind, changes = {}, body = kind === "standard" ? STANDARD_BODY : "Document content.\n") {
  const meta = {
    title: "Fixture document", kind, issued: "2026-07-25", author: "Test author",
    status: kind === "standard" ? "Draft" : kind === "decision" ? "Accepted" : "Current",
    ...(kind === "standard"
      ? { standard: "001", category: "Process", revision: "R1", "applies-to": "Test repositories" }
      : kind === "design" ? {} : { number: "001" }),
    ...(kind === "note" ? { verified: "2026-07-25" } : {}),
    ...changes,
  };
  const yaml = Object.entries(meta).filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n");
  return `---\n${yaml}\n---\n\n${body}`;
}

function parse(kind, changes = {}, file, body) {
  const src = document(kind, changes, body);
  if (kind === "standard") return parseStandard(src, file ?? "STD-001-fixture.md");
  return parseProse(src, file ?? `${CLASSES[kind].prefix}-001-${kind === "note" ? "2026-07-25-" : ""}fixture.md`, CLASSES[kind]);
}

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "document-validation-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  cpSync(join(ROOT, "scripts"), join(root, "scripts"), { recursive: true });
  const write = (file, src) => {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), src);
  };
  write("DESIGN.md", document("design"));
  write("standards/STD-001-fixture.md", document("standard"));
  write("skills-lock.json", JSON.stringify({ version: 1, skills: {} }));
  return { root, write };
}

function run(root, script, args = []) {
  const result = spawnSync(process.execPath, [join(root, "scripts", script), ...args], {
    cwd: root, encoding: "utf8", timeout: 20_000,
  });
  assert.ifError(result.error);
  return { status: result.status, output: result.stdout + result.stderr };
}

for (const kind of ["standard", ...Object.keys(CLASSES)]) {
  test(`${kind}: accepts valid metadata`, () => {
    assert.deepEqual(parse(kind).errors, []);
  });

  test(`${kind}: requires kind and rejects a different kind`, () => {
    assert.match(parse(kind, { kind: undefined }).errors.join("\n"), /missing.*kind/i);
    assert.match(parse(kind, { kind: "design" }).errors.join("\n"), /kind.*design/i);
  });

  test(`${kind}: number must agree with the filename`, () => {
    const field = kind === "standard" ? "standard" : "number";
    assert.match(parse(kind, { [field]: "002" }).errors.join("\n"), /filename.*001.*002/i);
    assert.match(parse(kind, { [field]: "1" }).errors.join("\n"), /three digits/i);
    assert.match(parse(kind, {}, "wrong-name.md").errors.join("\n"), /filename/i);
  });

  test(`${kind}: validates statuses for its class`, () => {
    assert.match(parse(kind, { status: "Unknown" }).errors.join("\n"), /status/i);
    assert.match(parse(kind, { status: kind === "standard" ? "Superseded" : "Obsoleted" }).errors.join("\n"), /status/i);
  });

  test(`${kind}: issued must be a real YYYY-MM-DD date`, () => {
    for (const issued of ["yesterday", "2026-7-25", "2026-02-29", "2026-04-31", "2026-13-01"]) {
      assert.match(parse(kind, { issued }).errors.join("\n"), /issued.*date/i, issued);
    }
    const file = kind === "note" ? "NOTE-001-2024-02-29-fixture.md" : undefined;
    assert.deepEqual(parse(kind, { issued: "2024-02-29" }, file).errors, []);
  });
}

test("required metadata must be nonempty scalar text", () => {
  for (const title of [undefined, "", "  ", null, [], false]) {
    assert.match(parse("standard", { title }).errors.join("\n"), /title/i);
    assert.match(parse("guide", { title }).errors.join("\n"), /title/i);
  }
  // The repository's YAML subset supports block maps, not JSON flow objects.
  for (const title of ["title:", "title:\n  nested: value"]) {
    const standard = document("standard").replace(/^title:.*$/m, title);
    const guide = document("guide").replace(/^title:.*$/m, title);
    assert.match(parseStandard(standard, "STD-001-fixture.md").errors.join("\n"), /title/i);
    assert.match(parseProse(guide, "GDE-001-fixture.md", CLASSES.guide).errors.join("\n"), /title/i);
  }
});

test("standard extras are required and category is restricted", () => {
  for (const field of ["standard", "category", "revision", "applies-to"]) {
    assert.match(parse("standard", { [field]: undefined }).errors.join("\n"), new RegExp(`missing.*${field}`, "i"));
  }
  assert.match(parse("standard", { category: "Guide" }).errors.join("\n"), /category/i);
});

test("missing frontmatter is reported by both parsers", () => {
  assert.match(parseStandard(STANDARD_BODY, "STD-001-fixture.md").errors.join("\n"), /frontmatter/i);
  assert.match(parseProse("No frontmatter.", "GDE-001-fixture.md", CLASSES.guide).errors.join("\n"), /frontmatter/i);
});

test("notes require a real verified date, without imposing date ordering", () => {
  assert.match(parse("note", { verified: undefined }).errors.join("\n"), /verified/i);
  assert.match(parse("note", { verified: "2026-02-30" }).errors.join("\n"), /verified.*date/i);
  assert.deepEqual(parse("note", { verified: "2024-02-29" }).errors, []);
  assert.match(parse("guide", { verified: "not-a-date" }).errors.join("\n"), /verified.*date/i);
});

test("note filenames carry the issue date, not the verified date", () => {
  for (const file of ["NOTE-001-fixture.md", "NOTE-001-2026-07-26-fixture.md", "NOTE-001-2026-02-30-fixture.md"]) {
    assert.match(parse("note", {}, file).errors.join("\n"), /filename/i);
  }
  assert.deepEqual(parse("note", { verified: "2026-07-26" }).errors, []);
});

test("superseded status or an empty statement is not a replacement pointer", () => {
  for (const body of ["Document content.", "This document is superseded.", "Replaced by.", "Superseded by GDE-001."]) {
    assert.match(parse("guide", { status: "Superseded" }, undefined, body).errors.join("\n"), /replacement/i, body);
  }
});

test("examples and comments cannot supply a document's replacement", () => {
  for (const body of ["```md\nSuperseded by GDE-002.\n```", "<!-- Superseded by GDE-002. -->"]) {
    assert.match(parse("guide", { status: "Superseded" }, undefined, body).errors.join("\n"), /replacement/i);
  }
});

test("superseded documents accept explicit replacement references and links", () => {
  for (const body of [
    "Superseded by `GDE-002`.",
    "> Replaced by [the new guide](GDE-002-new-guide.md).",
    "This document is superseded by\n`STD-002`.",
    "Replaced by https://example.com/new-guide.",
  ]) {
    assert.deepEqual(parse("guide", { status: "Superseded" }, undefined, body).errors, [], body);
  }
});

test("standard clause parsing retains its existing semantics", () => {
  const parsed = parse("standard", {}, undefined,
    "## 3. Requirements\n\n### 3.1\n\nA repository SHOULD try first, but MUST report errors.\n\n### 3.2 DEPRECATED\n\nRetired.\n");
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.clauses.map((c) => [c.ref, c.keyword, c.deprecated]), [
    ["3.1", "SHOULD", false], ["3.2", undefined, true],
  ]);
  assert.match(parse("standard", {}, undefined, "No clauses.").errors.join("\n"), /at least one clause/i);
});

for (const script of ["validate-documents.mjs", "render-standard.mjs"]) {
  test(`${script}: accepts all classes and numbers reused across prefixes`, (t) => {
    const { root, write } = fixture(t);
    for (const cls of Object.values(CLASSES)) {
      write(`${cls.dir}/${cls.prefix}-001-${cls.kind === "note" ? "2026-07-25-" : ""}fixture.md`, document(cls.kind));
    }
    const result = run(root, script);
    assert.equal(result.status, 0, result.output);
    if (script === "render-standard.mjs") {
      const html = readFileSync(join(root, "out/standards/standards.html"), "utf8");
      for (const id of ["STD-001", "GDE-001", "NOTE-001", "ADR-001", "PRM-001"]) {
        assert.ok(html.includes(`id="${id}"`), id);
      }
    }
  });

  for (const [name, file, src, expected] of [
    ["missing kind", "standards/STD-001-fixture.md", document("standard", { kind: undefined }), /missing.*kind/i],
    ["wrong kind", "standards/STD-001-fixture.md", document("standard", { kind: "guide" }), /kind.*guide/i],
    ["number mismatch", "standards/STD-001-fixture.md", document("standard", { standard: "002" }), /filename.*001.*002/i],
    ["missing verified", "reports/NOTE-001-2026-07-25-fixture.md", document("note", { verified: undefined }), /verified/i],
    ["invalid date", "best-practices/GDE-001-fixture.md", document("guide", { issued: "2026-02-29" }), /issued.*date/i],
    ["note filename date", "reports/NOTE-001-2026-07-26-fixture.md", document("note"), /filename.*issued/i],
    ["standard category", "standards/STD-001-fixture.md", document("standard", { category: "Guide" }), /category/i],
    ["superseded status alone", "best-practices/GDE-001-fixture.md", document("guide", { status: "Superseded" }), /replacement/i],
    ["design metadata", "DESIGN.md", document("design", { kind: undefined }), /missing.*kind/i],
  ]) {
    test(`${script}: rejects ${name}`, (t) => {
      const { root, write } = fixture(t);
      write(file, src);
      const result = run(root, script);
      assert.equal(result.status, 1, result.output);
      assert.match(result.output, expected);
    });
  }

  for (const [kind, dir, prefix] of [
    ["standard", "standards", "STD"],
    ...Object.values(CLASSES).map((cls) => [cls.kind, cls.dir, cls.prefix]),
  ]) {
    test(`${script}: rejects duplicate ${prefix} identities`, (t) => {
      const { root, write } = fixture(t);
      const name = `${prefix}-001-${kind === "note" ? "2026-07-25-" : ""}`;
      write(`${dir}/${name}fixture.md`, document(kind));
      write(`${dir}/${name}other-title.md`, document(kind, { title: "Another document" }));
      const result = run(root, script);
      assert.equal(result.status, 1, result.output);
      assert.match(result.output, /(?:duplicate|used by).*001|001.*(?:duplicate|used by)/i);
      assert.match(result.output, new RegExp(`${name}fixture\\.md`));
      assert.match(result.output, new RegExp(`${name}other-title\\.md`));
      if (script === "render-standard.mjs") assert.equal(existsSync(join(root, "out/standards/index.html")), false);
    });
  }

  test(`${script}: accepts a superseded document naming its replacement`, (t) => {
    const { root, write } = fixture(t);
    write("best-practices/GDE-001-fixture.md", document("guide", { status: "Superseded" }, "Superseded by `GDE-002`.\n"));
    write("best-practices/GDE-002-replacement.md", document("guide", { number: "002" }));
    const result = run(root, script);
    assert.equal(result.status, 0, result.output);
  });
}

test("renderer leaves an existing build untouched when validation fails", (t) => {
  const { root, write } = fixture(t);
  const first = run(root, "render-standard.mjs");
  assert.equal(first.status, 0, first.output);
  const index = readFileSync(join(root, "out/standards/index.html"), "utf8");
  write("standards/STD-001-duplicate.md", document("standard"));
  const second = run(root, "render-standard.mjs");
  assert.equal(second.status, 1, second.output);
  assert.match(second.output, /no pages written/i);
  assert.equal(readFileSync(join(root, "out/standards/index.html"), "utf8"), index);
});

test("register and bundle show the current PRM-002 quick-start text before the document list", (t) => {
  const { root, write } = fixture(t);
  for (const text of ["Audit <this repo> & preserve behavior.\n\nDo not merge.", "Use the revised workflow."]) {
    write("prompts/PRM-002-fixture.md", document("prompt", { number: "002" },
      `# Update a repository\n\n## Quick-start prompt\n\n\`\`\`text\n${text}\n\`\`\`\n\n# Agent prompt\n\nFull instructions.\n`));
    const result = run(root, "render-standard.mjs");
    assert.equal(result.status, 0, result.output);
    for (const [file, href] of [["index.html", "prm-002.html"], ["standards.html", "#PRM-002"]]) {
      const html = readFileSync(join(root, "out/standards", file), "utf8");
      const prompt = html.match(/<pre[^>]*aria-label="Repository update prompt"[^>]*><code>([\s\S]*?)<\/code><\/pre>/);
      assert.ok(prompt, `${file} exposes a labeled, selectable prompt without JavaScript`);
      const decoded = prompt[1].replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
      assert.equal(decoded, text);
      assert.ok(!prompt[1].includes("<this repo>"), "prompt text is escaped, not rendered as markup");
      assert.ok(prompt.index < html.indexOf('id="register-standards"'));
      assert.ok(html.includes(`href="${href}">Read the full workflow (PRM-002)</a>`));
    }
  }
});

test("skill inventory includes locked upstream skills and optional local skills, grouped by source", (t) => {
  const { root, write } = fixture(t);
  const names = ["setup-project", "shared-name", "pptx-decks"];
  write("skills/VENDORED.md", "## Authored here\n\n" + names.map((name, i) =>
    `| SKL-00${i + 1} | \`${name}\` | Fixture |`).join("\n"));
  for (const name of names) {
    write(`skills/${name}/SKILL.md`, `---\nname: ${name}\ndescription: Fixture skill\n---\n\nSkill content.\n`);
  }
  write(".agents/skills/not-in-the-lock/SKILL.md", "Must not appear in the published inventory.");
  const entry = (source, skillPath) => ({ source, skillPath, sourceType: "github", ref: "a".repeat(40), computedHash: "b".repeat(64) });
  const skills = {
    architect: entry("cursor/plugins", "pstack/skills/architect/SKILL.md"),
    "setup-project": entry("The-Focus-AI/standards", "skills/setup-project/SKILL.md"),
    "shared-name": entry("other/skills", "canonical/shared-name/SKILL.md"),
  };
  write("skills-lock.json", JSON.stringify({ version: 1, skills }));
  const first = run(root, "render-standard.mjs");
  assert.equal(first.status, 0, first.output);
  for (const file of ["index.html", "standards.html"]) {
    const html = readFileSync(join(root, "out/standards", file), "utf8");
    assert.match(html, /5 skills: <b>3 default<\/b>, <b>2 optional<\/b>/);
    for (const [label, count] of [["pstack", 1], ["The Focus AI", 3], ["other/skills", 1]]) {
      assert.ok(html.includes(`>${label} (${count})</a>`), label);
    }
    assert.ok(html.includes('href="#register-skills"'));
    const rows = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) => m[1]);
    const local = (id) => file === "index.html" ? `skl-${id}.html` : `#SKL-${id}`;
    for (const [name, href, selection] of [
      ["architect", `https://github.com/cursor/plugins/blob/${"a".repeat(40)}/pstack/skills/architect/SKILL.md`, "Default"],
      ["setup-project", local("001"), "Default"],
      ["shared-name", `https://github.com/other/skills/blob/${"a".repeat(40)}/canonical/shared-name/SKILL.md`, "Default"],
      ["shared-name", local("002"), "Optional"],
      ["pptx-decks", local("003"), "Optional"],
    ]) {
      const matches = rows.filter((row) => row.includes(`<a href="${href}">${name}</a>`));
      assert.equal(matches.length, 1, `${file}: ${name} at ${href} appears once`);
      assert.ok(matches[0].includes(`>${selection}</td>`));
    }
    assert.ok(!html.includes("not-in-the-lock"));
  }
  delete skills.architect;
  skills["shared-name"] = entry("The-Focus-AI/standards", "skills/shared-name/SKILL.md");
  write("skills-lock.json", JSON.stringify({ version: 1, skills }));
  const second = run(root, "render-standard.mjs");
  assert.equal(second.status, 0, second.output);
  const updated = readFileSync(join(root, "out/standards/index.html"), "utf8");
  assert.match(updated, /3 skills: <b>2 default<\/b>, <b>1 optional<\/b>/);
  assert.ok(!updated.includes("cursor/plugins") && !updated.includes("other/skills"));
});

test("renderer preserves the published output when the skill lock is missing or invalid", (t) => {
  const { root, write } = fixture(t);
  assert.equal(run(root, "render-standard.mjs").status, 0);
  const before = readFileSync(join(root, "out/standards/index.html"), "utf8");
  for (const source of [null, "{", JSON.stringify({ version: 1, skills: { bad: {} } })]) {
    if (source === null) rmSync(join(root, "skills-lock.json"));
    else write("skills-lock.json", source);
    const result = run(root, "render-standard.mjs");
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /skills-lock\.json.*cannot render/);
    assert.equal(readFileSync(join(root, "out/standards/index.html"), "utf8"), before);
  }
});
