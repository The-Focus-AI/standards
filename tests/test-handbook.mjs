import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const prompt = "Audit <this repo> & preserve behavior.\nDo not merge.";
const page = (body, meta = {}) => `---\n${Object.entries({
  title: "A fixture", summary: "A useful summary", status: "Draft", ...meta,
}).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n")}\n---\n\n${body}\n`;
const entry = (source, skillPath) => ({ source, skillPath, sourceType: "github",
  ref: "a".repeat(40), computedHash: "b".repeat(64) });

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "handbook-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  cpSync(join(ROOT, "scripts"), join(root, "scripts"), { recursive: true });
  cpSync(join(ROOT, "DESIGN.md"), join(root, "DESIGN.md"));
  for (const dir of ["handbook", "recipes", "evidence", "skills"]) mkdirSync(join(root, dir));
  const write = (file, text) => {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), text);
  };
  const read = file => readFileSync(join(root, "out/handbook", file), "utf8");
  const nav = [{ title: "Projects", summary: "Do useful work", pages: ["update-project", "another"] }];
  write("handbook/navigation.json", JSON.stringify(nav));
  write("handbook/update-project.md", page(`## Prompt\n\n\`\`\`text\n${prompt}\n\`\`\`\n\n[Next](another.md#section)`));
  write("handbook/another.md", page("## Section\n\n[Recipe](../recipes/fixture.md#details)\n\n[Source](../scripts/build-handbook.mjs)"));
  write("recipes/fixture.md", page("## Details\n\nAn explanatory recipe.", { status: "Reference" }));
  write("skills-lock.json", JSON.stringify({ version: 1, skills: {} }));
  return { root, read, write, nav };
}

function run(root, script = "build-handbook.mjs") {
  const result = spawnSync(process.execPath, [join(root, "scripts", script)], {
    cwd: root, encoding: "utf8", timeout: 20_000,
  });
  assert.ifError(result.error);
  return { status: result.status, output: result.stdout + result.stderr };
}

test("build emits linked pages, source-derived prompt, search content and readable agent download", t => {
  const { root, read, write } = fixture(t);
  write("evidence/result.md", page("A measured observation.", { status: "Evidence", checked: "2024-02-29" }));
  const result = run(root);
  assert.equal(result.status, 0, result.output);
  assert.match(read("index.html"), /Audit &lt;this repo&gt; &amp; preserve behavior/);
  assert.match(read("handbook/update-project.html"), /href="another.html#section"/);
  assert.match(read("handbook/another.html"), /href="..\/recipes\/fixture.html#details"/);
  assert.match(read("handbook/another.html"), /href="https:\/\/github.com\/The-Focus-AI\/standards\/blob\/main\/scripts\/build-handbook.mjs"/);
  assert.match(read("handbook/another.html"), /Proposed guidance. Not ratified/);
  assert.match(read("recipes/fixture.html"), /Procedure, not independent policy/);
  assert.match(read("evidence/result.html"), /Checked 2024-02-29/);
  const search = JSON.parse(read("index.html").match(/id="search-data" type="application\/json">(.*?)<\/script>/s)[1]);
  assert.equal(search.length, 4);
  assert.ok(search.some(p => p.path === "recipes/fixture.html" && p.text.includes("explanatory recipe")));
  assert.match(read("handbook.md"), /Status: Evidence\nChecked: 2024-02-29/);
  assert.ok(read("handbook.md").includes(prompt));
  const first = read("index.html");
  assert.equal(run(root).status, 0);
  assert.equal(read("index.html"), first, "builds are deterministic");
  write("handbook/update-project.md", page("```text\nA revised prompt.\n```"));
  assert.equal(run(root).status, 0);
  assert.match(read("index.html"), /A revised prompt/);
  assert.ok(!read("index.html").includes("Audit &lt;this repo&gt;"));
});

test("build ships the local display font and license, and keeps prior output if the font is missing", t => {
  const { root, read } = fixture(t);
  const result = run(root);
  assert.equal(result.status, 0, result.output);
  const fontUrl = read("handbook.css").match(/src: url\("([^"]+\.woff2)"\)/)[1];
  assert.ok(fontUrl.startsWith("fonts/"), "font loads from the site, not a third party");
  const font = readFileSync(join(root, "out/handbook", fontUrl));
  assert.equal(font.subarray(0, 4).toString(), "wOF2");
  const source = join(root, "scripts/assets", fontUrl);
  assert.deepEqual(font, readFileSync(source));
  assert.match(read("fonts/OFL.txt"), /SIL OPEN FONT LICENSE Version 1\.1/);
  const before = read("index.html");
  rmSync(source);
  assert.equal(run(root).status, 1);
  assert.equal(read("index.html"), before);
  assert.deepEqual(readFileSync(join(root, "out/handbook", fontUrl)), font);
});

test("catalog shows canonical upstream pins and optional same-name owned skills without using installed caches", t => {
  const { root, read, write } = fixture(t);
  const skills = { architect: entry("cursor/plugins", "pstack/skills/architect/SKILL.md"),
    shared: entry("other/skills", "skills/shared/SKILL.md"),
    setup: entry("The-Focus-AI/standards", "skills/setup/SKILL.md") };
  write("skills-lock.json", JSON.stringify({ version: 1, skills }));
  for (const name of ["shared", "setup", "slides"]) {
    write(`skills/${name}/SKILL.md`, `---\nname: ${name}\ndescription: Local ${name} capability.\n---\n`);
  }
  write(".agents/skills/ghost/SKILL.md", "This installed-only cache must not enter the site.");
  assert.equal(run(root).status, 0);
  const html = read("skills.html");
  assert.match(html, /3 default selections. 2 optional owned skills/);
  assert.ok(html.includes(`https://github.com/cursor/plugins/blob/${"a".repeat(40)}/pstack/skills/architect/SKILL.md`));
  assert.ok(html.includes("pstack</small>"));
  assert.equal([...html.matchAll(/class="skill-name"[^>]*>shared/g)].length, 2);
  assert.ok(!html.includes("ghost"));
  delete skills.architect;
  write("skills-lock.json", JSON.stringify({ version: 1, skills }));
  assert.equal(run(root).status, 0);
  assert.ok(!read("skills.html").includes("cursor/plugins"));
});

test("Markdown preserves nested code, links, ordered starts, repeated headings and escapes raw HTML", t => {
  const { root, read, write } = fixture(t);
  write("handbook/another.md", page([
    "## Section", "", "## Section", "", "[Repeated](#section-1)", "",
    "3. Read [the recipe](../recipes/fixture.md).", "",
    "   ```js", "   const pattern = /[(not-a-link)](missing)/;", "   ```", "",
    "   - Nested item", "", "> A quoted [recipe](../recipes/fixture.md)", "",
    "<script>alert('no')</script>", "", "<https://example.com/docs>", "",
    "| Key | Value |", "| --- | --- |", "| Script | `x < y` |",
  ].join("\n")));
  const result = run(root);
  assert.equal(result.status, 0, result.output);
  const html = read("handbook/another.html");
  assert.match(html, /<ol start="3">/);
  assert.match(html, /<pre><code>const pattern = \/\[\(not-a-link\)\]\(missing\)\//);
  assert.match(html, /<ul><li><p>Nested item<\/p>/);
  assert.match(html, /id="section-1"/);
  assert.match(html, /href="another.html#section-1"/);
  assert.match(html, /<blockquote><p>A quoted <a href="..\/recipes\/fixture.html"/);
  assert.match(html, /&lt;script&gt;/);
  assert.ok(!html.includes("<script>alert"));
  assert.match(html, /<a href="https:\/\/example.com\/docs">/);
  assert.match(html, /<td><code>x &lt; y<\/code><\/td>/);
});

const invalidPages = [
  ["missing title", page("", { title: undefined }), /missing title/],
  ["missing summary", page("", { summary: "" }), /missing summary/],
  ["unknown status", page("", { status: "Current" }), /unknown status/],
  ["unattributed approval", page("", { status: "In force", "approved-on": "2026-11-07" }), /human approval/],
  ["non-text approval", page("", { status: "In force", "approved-by": [], "approved-on": "2026-11-07" }), /human approval/],
  ["invalid approval date", page("", { status: "In force", "approved-by": "Owner", "approved-on": "2026-04-31" }), /human approval/],
  ["missing evidence date", page("", { status: "Evidence" }), /checked date/],
  ["impossible date", page("", { status: "Evidence", checked: "2026-02-29" }), /checked date/],
  ["broken link", page("[Missing](missing.md)"), /broken link/],
  ["missing anchor", page("[Wrong](../recipes/fixture.md#unknown)"), /missing heading/],
  ["unsafe URL", page("[Click](javascript:alert)"), /unsafe link/],
  ["path escape", page("[Outside](../../outside.md)"), /broken link/],
  ["unclosed fence", page("```js\nunfinished"), /unclosed code fence/],
  ["unclosed nested fence", page("- Example\n\n  ```js\n  unfinished"), /unclosed code fence/],
];
for (const [name, source, expected] of invalidPages) {
  test(`validator and build reject ${name} without replacing published output`, t => {
    const { root, read, write } = fixture(t);
    assert.equal(run(root).status, 0);
    const before = read("index.html");
    write("handbook/another.md", source.replace(/\n---\n/, "\n---\n\n## Section\n"));
    for (const script of ["validate-documents.mjs", "build-handbook.mjs"]) {
      const result = run(root, script);
      assert.equal(result.status, 1, result.output);
      assert.match(result.output, expected);
    }
    assert.equal(read("index.html"), before);
  });
}

test("build accepts attributed approval and rejects missing, repeated and unlisted navigation", t => {
  const { root, read, write, nav } = fixture(t);
  write("handbook/another.md", page("## Section\n\nApproved content", {
    status: "In force", "approved-by": "Test owner", "approved-on": "2024-02-29",
  }));
  assert.equal(run(root).status, 0);
  assert.match(read("handbook/another.html"), /Approved by Test owner on 2024-02-29/);
  for (const [pages, pattern] of [
    [["update-project"], /omits/],
    [["update-project", "another", "another"], /repeats/],
    [["update-project", "missing"], /missing/],
  ]) {
    write("handbook/navigation.json", JSON.stringify([{ ...nav[0], pages }]));
    const result = run(root);
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, pattern);
  }
});

test("invalid skill lock and absent prompt leave the previous build intact", t => {
  const { root, read, write } = fixture(t);
  assert.equal(run(root).status, 0);
  const before = read("index.html");
  write("skills-lock.json", "{");
  assert.equal(run(root).status, 1);
  assert.equal(read("index.html"), before);
  write("skills-lock.json", '{"version":1,"skills":{}}');
  write("handbook/update-project.md", page("No copyable prompt"));
  assert.match(run(root).output, /copyable text prompt/);
  assert.equal(read("index.html"), before);
});
