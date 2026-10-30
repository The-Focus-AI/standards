import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { parseArgs, parseFnoxExport, resolveFnox, selectTarget, syncSecrets } from "../scripts/sync-secrets.mjs";

const example = JSON.parse(await readFile(new URL("../templates/secret-sync.example.json", import.meta.url), "utf8"));
const values = { ANTHROPIC_API_KEY: "a'\"\\$`=\r\n\t☃\n", CLERK_SECRET_KEY: '{"nested":"value\\nline"}\n' };
const exported = (secrets = values, profile = "runtime") => JSON.stringify({ secrets, metadata: { profile, total_secrets: Object.keys(secrets).length } });
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
function harness(target = "vercel-preview") {
  const calls = [], logs = [], resolutions = [];
  const deps = {
    env: { OP_SERVICE_ACCOUNT_TOKEN: "fake-source-token", VERCEL_SYNC_TOKEN: "fake-vercel-token", GCP_PREVIEW_ACCESS_TOKEN: "fake-gcp-token", GCP_PRODUCTION_ACCESS_TOKEN: "fake-gcp-prod-token" },
    baseDir: "/project", log: (line) => logs.push(line),
    resolveSecrets: async (selected) => { resolutions.push(selected); return exported(); },
    fetcher: async (url, options) => {
      calls.push({ url, ...options });
      if (options.method === "GET") return response({ envs: [] });
      if (url.startsWith("https://api.vercel.com/")) return response({ failed: [], created: JSON.parse(options.body) }, 201);
      return response({ name: `${url.replace("https://secretmanager.googleapis.com/v1/", "").replace(":addVersion", "")}/versions/7`, state: "ENABLED" });
    },
  };
  return { calls, logs, resolutions, deps, run: (config = example, apply = true) => syncSecrets(config, { target, apply }, deps) };
}

test("CLI requires explicit config/target; default is dry-run", () => {
  assert.deepEqual(parseArgs(["--config", "sync.json", "--target", "preview"]), { config: "sync.json", target: "preview", apply: false });
  for (const args of [[], ["--config"], ["--env", "production"], ["--config", "x", "--target", "p", "--apply", "--apply"]]) assert.throws(() => parseArgs(args));
});

test("default dry-run does not even read credential properties", async () => {
  const h = harness();
  h.deps.env = new Proxy({}, { get: (_, name) => { assert.equal(name, "FNOX_PROFILE"); } });
  h.deps.resolveSecrets = h.deps.fetcher = async () => assert.fail("dry-run side effect");
  assert.deepEqual(await h.run(example, false), []);
  assert.match(h.logs.join("\n"), /No credentials read/);
});

test("real CLI dry-run works without fnox or credentials and invalid target exits nonzero", () => {
  const args = ["scripts/sync-secrets.mjs", "--config", "templates/secret-sync.example.json", "--target"];
  const output = execFileSync(process.execPath, [...args, "vercel-preview"], { cwd: new URL("..", import.meta.url), env: { PATH: "/nonexistent" }, encoding: "utf8" });
  assert.match(output, /Dry-run/);
  assert.throws(() => execFileSync(process.execPath, [...args, "unknown"], { cwd: new URL("..", import.meta.url), env: {}, stdio: "pipe" }), (error) => error.status === 1);
});

test("preview and production can intentionally share profile and runtime credentials", async () => {
  for (const target of ["vercel-preview", "vercel-production"]) {
    const h = harness(target);
    await h.run();
    assert.equal(h.resolutions[0].source.profile, "runtime");
    assert.equal(h.resolutions[0].source.config, "/project/fnox.toml");
    assert.deepEqual(Object.keys(h.resolutions[0].keys), Object.keys(values));
    assert.equal(h.calls.length, 3);
    assert.match(h.calls[0].url, /teamId=team_REPLACE&decrypt=false$/);
    for (const call of h.calls.slice(1)) {
      const body = JSON.parse(call.body);
      assert.equal(body.value, values[body.key]);
      assert.deepEqual(body.target, [target.replace("vercel-", "")]);
      assert.equal(body.type, "sensitive");
      assert.equal(body.visibility, "secret");
      assert.equal(call.headers.Authorization, "Bearer fake-vercel-token");
      assert.equal(call.redirect, "error");
      assert.match(call.url, /^https:\/\/api.vercel.com\/v10\/projects\/prj_REPLACE\/env\?teamId=team_REPLACE&upsert=true$/);
    }
    assert.ok(!h.logs.join("\n").includes(values.ANTHROPIC_API_KEY));
    assert.ok(!h.logs.join("\n").includes("fake-source-token"));
  }
});

test("development uses Secret visibility under the current Vercel contract", async () => {
  const config = structuredClone(example);
  config.targets["vercel-preview"].environment = "development";
  const h = harness();
  await h.run(config);
  assert.equal(JSON.parse(h.calls[1].body).type, "sensitive");
  assert.equal(JSON.parse(h.calls[1].body).visibility, "secret");
});

test("mismatched ambient profile is rejected before resolution, matching profile accepted", async () => {
  const h = harness();
  h.deps.env.FNOX_PROFILE = "production";
  await assert.rejects(h.run(), /FNOX_PROFILE disagrees/);
  assert.equal(h.resolutions.length, 0);
  h.deps.env.FNOX_PROFILE = "runtime";
  await h.run();
});

test("allowlists reject admin/bootstrap keys, credential aliases, duplicates and ambiguous targets", () => {
  const mutate = (change) => { const config = structuredClone(example); change(config.targets["vercel-preview"], config); assert.throws(() => selectTarget(config, "vercel-preview", "/project", {})); };
  for (const key of ["OP_SERVICE_ACCOUNT_TOKEN", "ANTHROPIC_ADMIN_KEY", "OPENAI_ADMIN_KEY", "VERCEL_TOKEN", "NEON_API_KEY", "GITHUB_TOKEN"]) mutate((t) => { t.keys[key] = key; });
  mutate((t) => { t.keys.ANTHROPIC_API_KEY = "MY_BOOTSTRAP_TOKEN"; });
  mutate((t) => { t.keys = {}; });
  mutate((t) => { t.keys.CLERK_SECRET_KEY = "ANTHROPIC_API_KEY"; });
  mutate((t) => { t.teamId = undefined; });
  mutate((t) => { t.projectId = "ambient-project"; });
  mutate((t) => { t.source.profile = "runtime,production"; });
  mutate((t) => { t.source.tokenEnv = "ANTHROPIC_API_KEY"; });
  mutate((t) => { t.keyz = {}; });
  mutate((t, config) => { config.targets["gcp-preview"].tokenEnv = "CLERK_SECRET_KEY"; });
});

test("parser preserves quoting/newlines/Unicode but rejects wrong shape/profile/key sets and invalid strings", () => {
  assert.deepEqual(parseFnoxExport(exported(), "runtime", Object.keys(values)), values);
  for (const raw of ["invalid-secret-text", "null", "[]", "{}", JSON.stringify(values), exported(values, "other"), exported({ ANTHROPIC_API_KEY: "x" }), exported({ ...values, ADMIN_KEY: "x" })]) assert.throws(() => parseFnoxExport(raw, "runtime", Object.keys(values)));
  for (const bad of [null, 42, {}, [], "", "a\0b", "\ud800", "/tmp/fnox-export-KEY-abc"]) assert.throws(() => parseFnoxExport(exported({ ...values, CLERK_SECRET_KEY: bad }), "runtime", Object.keys(values)));
  const wrongCount = JSON.parse(exported()); wrongCount.metadata.total_secrets++;
  assert.throws(() => parseFnoxExport(JSON.stringify(wrongCount), "runtime", Object.keys(values)));
});

test("missing credentials and failed/invalid resolution cannot write; diagnostics do not echo secrets", async () => {
  const h = harness();
  delete h.deps.env.VERCEL_SYNC_TOKEN;
  await assert.rejects(h.run(), /Missing or invalid credential/);
  assert.equal(h.resolutions.length, 0);
  h.deps.env.VERCEL_SYNC_TOKEN = "fake-token";
  h.deps.resolveSecrets = async () => { throw new Error(values.ANTHROPIC_API_KEY); };
  await assert.rejects(h.run(), (error) => !error.message.includes(values.ANTHROPIC_API_KEY));
  for (const raw of [exported({}, "runtime"), exported(values, "wrong-profile"), exported({ ...values, CLERK_SECRET_KEY: "fake-token" }), exported({ ...values, CLERK_SECRET_KEY: "sk-ant-admin-fake" })]) {
    h.deps.resolveSecrets = async () => raw;
    await assert.rejects(h.run());
  }
  assert.equal(h.calls.length, 0);
});

test("Vercel preflight rejects multi-scope records, branch overrides, integrations and incomplete inventories", async () => {
  for (const inventory of [
    { envs: [], pagination: { next: 42 } }, { envs: [], hiddenProductionEnvCount: 1 }, {},
    ...[
      { target: ["preview", "production"] }, { target: ["preview"], gitBranch: "main" },
      { target: ["preview"], configurationId: "integration" }, { target: ["preview"], customEnvironmentIds: ["custom"] },
    ].map((extra) => ({ envs: [{ key: "ANTHROPIC_API_KEY", ...extra }] })),
  ]) {
    const h = harness();
    h.deps.fetcher = async (_, options) => { assert.equal(options.method, "GET"); return response(inventory); };
    await assert.rejects(h.run());
  }
});

test("partial failures stop immediately, never delete/retry/echo response bodies, and report confirmed writes", async () => {
  for (const failure of [
    async () => response({ error: values.ANTHROPIC_API_KEY }, 403),
    async () => response({ failed: [{ error: values.ANTHROPIC_API_KEY }] }, 201),
    async () => { throw new Error(values.ANTHROPIC_API_KEY); },
    async () => ({ ok: true, json: async () => { throw new Error(values.ANTHROPIC_API_KEY); } }),
    async () => response({ failed: [], created: { key: "WRONG_KEY" } }, 201),
  ]) {
    const h = harness();
    const original = h.deps.fetcher;
    let writes = 0;
    h.deps.fetcher = async (url, options) => {
      assert.ok(["POST", "GET"].includes(options.method));
      if (options.method === "POST" && ++writes === 2) return failure();
      return original(url, options);
    };
    await assert.rejects(h.run(), (error) => {
      assert.match(error.message, /Confirmed 1\/2: ANTHROPIC_API_KEY/);
      assert.match(error.message, /may have landed.*No rollback/);
      assert.ok(!error.message.includes(values.ANTHROPIC_API_KEY));
      return true;
    });
    assert.equal(writes, 2);
    assert.ok(!h.logs.join("\n").includes("Confirmed 2 writes"));
  }
});

test("GCP sends exact bytes to explicit existing secret resources and reports numeric versions", async () => {
  const h = harness("gcp-preview");
  await h.run();
  assert.equal(h.calls.length, 2);
  h.calls.forEach((call, i) => {
    assert.equal(call.method, "POST");
    assert.equal(call.headers.Authorization, "Bearer fake-gcp-token");
    assert.match(call.url, /^https:\/\/secretmanager.googleapis.com\/v1\/projects\/replace-preview\/secrets\/app-[a-z-]+:addVersion$/);
    assert.equal(Buffer.from(JSON.parse(call.body).payload.data, "base64").toString("utf8"), Object.values(values)[i]);
  });
  assert.match(h.logs.join("\n"), /versions\/7/);
});

test("GCP rejects oversize payloads before any writes, missing resources and unconfirmed versions", async () => {
  const h = harness("gcp-preview");
  h.deps.resolveSecrets = async () => exported({ ...values, CLERK_SECRET_KEY: "a".repeat(65537) });
  await assert.rejects(h.run(), /64 KiB/);
  assert.equal(h.calls.length, 0);
  h.deps.resolveSecrets = async () => exported();
  for (const failed of [response({}, 404), response({ name: "projects/other/secrets/wrong/versions/2", state: "ENABLED" }), response({})]) {
    let attempts = 0;
    h.deps.fetcher = async () => { attempts++; return failed; };
    await assert.rejects(h.run(), /Confirmed 0\/2/);
    assert.equal(attempts, 1);
  }
});

test("fnox subprocess adapter fixes profile/config/key arguments and isolates environment on success and failure", async () => {
  const target = selectTarget(example, "vercel-preview", "/project", {});
  target.source.tokenEnv = "SCOPED_SOURCE_TOKEN";
  for (const fail of [false, true]) {
    let isolated;
    const promise = resolveFnox(target, {
      PATH: "/tools", HOME: "/home/fake", FNOX_PROFILE: "wrong", FNOX_NO_DEFAULTS: "1",
      SCOPED_SOURCE_TOKEN: "selected-fake-token", OP_SERVICE_ACCOUNT_TOKEN: "wrong-fake-token",
      ANTHROPIC_API_KEY: "ambient-fake-value", VERCEL_SYNC_TOKEN: "platform-fake-token",
    }, async (command, args, options) => {
      assert.equal(command, "fnox");
      assert.deepEqual(args, ["--config", "/project/fnox.toml", "--profile", "runtime", "--no-daemon", "--non-interactive", "--if-missing", "error", "export", "--format", "json", ...Object.keys(values)]);
      assert.equal(options.env.OP_SERVICE_ACCOUNT_TOKEN, "selected-fake-token");
      for (const key of ["SCOPED_SOURCE_TOKEN", "VERCEL_SYNC_TOKEN", "FNOX_PROFILE", "FNOX_NO_DEFAULTS", "ANTHROPIC_API_KEY"]) assert.equal(options.env[key], undefined);
      assert.equal(options.shell, undefined);
      assert.equal(options.cwd, "/project");
      assert.equal(options.env.TMPDIR, options.env.FNOX_CONFIG_DIR);
      isolated = options.env.FNOX_CONFIG_DIR;
      await access(isolated);
      if (fail) throw new Error("fake-sensitive-stderr");
      return { stdout: exported() };
    });
    if (fail) await assert.rejects(promise, (error) => !error.message.includes("fake-sensitive-stderr"));
    else assert.equal(await promise, exported());
    await assert.rejects(access(isolated), { code: "ENOENT" });
  }
});

test("a middle write failure leaves later keys untouched on either platform", async () => {
  for (const target of ["vercel-preview", "gcp-preview"]) {
    const h = harness(target);
    const config = structuredClone(example);
    config.targets[target].keys.CRON_SECRET = target === "vercel-preview" ? "CRON_SECRET" : "app-cron-secret";
    h.deps.resolveSecrets = async () => exported({ ...values, CRON_SECRET: "fake-cron-value" });
    const original = h.deps.fetcher;
    let attempts = 0;
    h.deps.fetcher = async (url, options) => {
      if (options.method === "POST" && ++attempts === 2) return response({}, 429);
      return original(url, options);
    };
    await assert.rejects(h.run(config), /Confirmed 1\/3/);
    assert.equal(attempts, 2);
  }
});
