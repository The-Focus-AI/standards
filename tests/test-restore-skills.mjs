import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

const script = resolve("scripts/restore-skills.mjs");
const skill = "---\nname: example\ndescription: A fixture for verified skill restoration.\n---\nOriginal\n";
const hash = createHash("sha256").update("SKILL.md").update(skill).digest("hex");

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), "restore-test-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  mkdirSync(join(cwd, "bin"));
  const cli = join(cwd, "bin", "skills");
  writeFileSync(cli, `#!${process.execPath}
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
if (process.argv[2] !== 'experimental_install') process.exit(9);
const mode = process.env.FIXTURE_MODE;
mkdirSync('.agents/skills/example', { recursive: true });
if (mode !== 'missing') writeFileSync('.agents/skills/example/SKILL.md', ${JSON.stringify(skill)} + (mode === 'tampered' ? 'Changed' : ''));
if (mode === 'drift') {
  const lock = JSON.parse(readFileSync('skills-lock.json'));
  lock.skills.example.computedHash = 'b'.repeat(64);
  writeFileSync('skills-lock.json', JSON.stringify(lock));
}
if (mode === 'failure') process.exit(1);
`);
  chmodSync(cli, 0o755);
  const lock = { version: 1, skills: { example: {
    source: "fixture/skills", sourceType: "github", ref: "a".repeat(40),
    skillPath: "skills/example/SKILL.md", computedHash: hash,
  } } };
  const save = () => writeFileSync(join(cwd, "skills-lock.json"), JSON.stringify(lock, null, 2) + "\n");
  save();
  return { cwd, lock, save, run(mode = "valid", args = []) {
    return spawnSync(process.execPath, [script, ...args], {
      cwd, encoding: "utf8", env: { ...process.env, PATH: `${cwd}/bin:${process.env.PATH}`, FIXTURE_MODE: mode },
    });
  } };
}

test("publishes verified output, retains lock bytes, and detects subsequent installed drift", (t) => {
  const f = fixture(t);
  const before = readFileSync(join(f.cwd, "skills-lock.json"), "utf8");
  assert.equal(f.run().status, 0);
  assert.equal(readFileSync(join(f.cwd, ".agents/skills/example/SKILL.md"), "utf8"), skill);
  assert.equal(readFileSync(join(f.cwd, "skills-lock.json"), "utf8"), before);
  assert.equal(f.run("valid", ["--check"]).status, 0);
  writeFileSync(join(f.cwd, ".agents/skills/example/SKILL.md"), skill + "drift");
  assert.notEqual(f.run("valid", ["--check"]).status, 0);
});

test("refuses incomplete, changed, or failed restores without replacing working skills", (t) => {
  const f = fixture(t);
  assert.equal(f.run().status, 0);
  const before = readFileSync(join(f.cwd, "skills-lock.json"), "utf8");
  for (const mode of ["missing", "tampered", "drift", "failure"]) {
    assert.notEqual(f.run(mode).status, 0, mode);
    assert.equal(readFileSync(join(f.cwd, ".agents/skills/example/SKILL.md"), "utf8"), skill, mode);
    assert.equal(readFileSync(join(f.cwd, "skills-lock.json"), "utf8"), before, mode);
    assert.equal(existsSync(join(f.cwd, ".agents/skills-restore.lock")), false);
  }
});

test("rejects malformed locks, mutable refs, path escapes and noncanonical sources", (t) => {
  const f = fixture(t);
  for (const change of [
    { ref: "main" }, { sourceType: "git" }, { skillPath: "../example/SKILL.md" },
    { source: "cursor/plugins", skillPath: "harness/example/SKILL.md" },
  ]) {
    const original = { ...f.lock.skills.example };
    Object.assign(f.lock.skills.example, change); f.save();
    assert.notEqual(f.run().status, 0);
    assert.equal(existsSync(join(f.cwd, ".agents/skills")), false);
    f.lock.skills.example = original;
  }
  writeFileSync(join(f.cwd, "skills-lock.json"), "not JSON");
  assert.notEqual(f.run().status, 0);
});

test("does not delete an unrecorded skill or an existing restore guard", (t) => {
  const f = fixture(t);
  mkdirSync(join(f.cwd, ".agents/skills/custom"), { recursive: true });
  writeFileSync(join(f.cwd, ".agents/skills/custom/SKILL.md"), "local work");
  assert.notEqual(f.run().status, 0);
  assert.equal(readFileSync(join(f.cwd, ".agents/skills/custom/SKILL.md"), "utf8"), "local work");
  mkdirSync(join(f.cwd, ".agents/skills-restore.lock"));
  assert.notEqual(f.run().status, 0);
  assert.equal(existsSync(join(f.cwd, ".agents/skills-restore.lock")), true);
});
