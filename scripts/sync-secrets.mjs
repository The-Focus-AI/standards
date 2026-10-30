#!/usr/bin/env node
// No dependencies; dry-run never invokes fnox or the network. See GDE-003/005/010.
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);
const keyPattern = /^[A-Z][A-Z0-9_]*$/;
const namePattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
const blocked = /(^|[_-])(ADMIN|BOOTSTRAP|MANAGEMENT|CONTROL[_-]PLANE)([_-]|$)|^(OP_|FNOX_|VERCEL_(TOKEN|ACCESS_TOKEN)|GCP_.*TOKEN|GOOGLE_APPLICATION_CREDENTIALS|AWS_(ACCESS_KEY_ID|SECRET_ACCESS_KEY|SESSION_TOKEN)|GH_TOKEN$|GITHUB_TOKEN$|NEON_API_KEY$)/i;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

// Never surface upstream error text: fnox and provider errors can contain values.
class SyncError extends Error {}
function requireThat(condition, message) {
  if (!condition) throw new SyncError(message);
}
function fields(value, allowed, label) {
  requireThat(object(value) && Object.keys(value).every((k) => allowed.includes(k)), `Invalid ${label} fields`);
}
function matches(value, pattern, label) {
  requireThat(typeof value === "string" && pattern.test(value), `Invalid ${label}`);
}

export function parseArgs(args) {
  const options = { apply: false };
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    requireThat(["--config", "--target", "--apply"].includes(flag) && !seen.has(flag), "Unknown or duplicate argument");
    seen.add(flag);
    if (flag === "--apply") options.apply = true;
    else {
      const value = args[++i];
      requireThat(value && !value.startsWith("--"), "Missing argument value");
      options[flag.slice(2)] = value;
    }
  }
  requireThat(options.config && options.target, "Usage: node scripts/sync-secrets.mjs --config FILE --target NAME [--apply]");
  return options;
}

export function selectTarget(config, name, baseDir, env) {
  fields(config, ["version", "targets"], "config");
  requireThat(config.version === 1 && object(config.targets), "Expected config version 1 and targets");
  const credentials = new Set();
  for (const [targetName, target] of Object.entries(config.targets)) {
    matches(targetName, namePattern, "target name");
    requireThat(object(target), "Invalid target");
    const platformFields = target.platform === "vercel" ? ["teamId", "environment"] : [];
    fields(target, ["platform", "projectId", "tokenEnv", "source", "keys", ...platformFields], "target");
    requireThat(["vercel", "gcp"].includes(target.platform), "Unsupported platform");
    matches(target.projectId, target.platform === "vercel" ? /^prj_[a-zA-Z0-9]+$/ : /^(?:[a-z][a-z0-9-]{4,28}[a-z0-9]|[0-9]+)$/, "project ID");
    if (target.platform === "vercel") {
      matches(target.teamId, /^team_[a-zA-Z0-9]+$/, "team ID");
      requireThat(["preview", "production", "development"].includes(target.environment), "Invalid Vercel environment");
    }
    fields(target.source, ["config", "profile", "tokenEnv"], "source");
    matches(target.source.profile, namePattern, "source profile (one profile only)");
    requireThat(typeof target.source.config === "string" && target.source.config.length > 0 && !/[\x00-\x1f]/.test(target.source.config), "Invalid fnox config path");
    for (const name of [target.tokenEnv, target.source.tokenEnv]) {
      matches(name, keyPattern, "credential environment name");
      credentials.add(name);
    }
    requireThat(target.tokenEnv !== target.source.tokenEnv, "Source and destination credentials must be distinct");
    requireThat(object(target.keys) && Object.keys(target.keys).length > 0, "Runtime allowlist must not be empty");
    const destinations = new Set();
    for (const [key, destination] of Object.entries(target.keys)) {
      matches(key, keyPattern, "runtime key");
      matches(destination, target.platform === "vercel" ? keyPattern : /^[a-zA-Z0-9_-]{1,255}$/, "destination key");
      requireThat(!blocked.test(key) && !blocked.test(destination), "Control-plane/bootstrap keys are not runtime keys");
      requireThat(!destinations.has(destination), "Duplicate destination key");
      destinations.add(destination);
    }
  }
  for (const target of Object.values(config.targets)) {
    requireThat(Object.entries(target.keys).every(([key, dest]) => !credentials.has(key) && !credentials.has(dest)), "Credential names cannot be runtime keys");
  }
  requireThat(Object.hasOwn(config.targets, name), "Unknown target");
  const target = config.targets[name];
  requireThat(env.FNOX_PROFILE === undefined || env.FNOX_PROFILE === target.source.profile, "FNOX_PROFILE disagrees with target; unset it or select the matching target");
  return { ...target, source: { ...target.source, config: resolve(baseDir, target.source.config) } };
}

export function parseFnoxExport(text, profile, keys) {
  let data;
  try { data = JSON.parse(text); } catch { throw new SyncError("fnox returned invalid JSON"); }
  requireThat(object(data) && object(data.secrets) && object(data.metadata), "Expected fnox secrets and metadata objects");
  requireThat(data.metadata.profile === profile, "fnox returned a different source profile");
  requireThat(Object.keys(data.secrets).length === keys.length && keys.every((key) => Object.hasOwn(data.secrets, key)), "fnox returned missing or unexpected keys");
  requireThat(data.metadata.total_secrets === keys.length, "fnox returned an inconsistent secret count");
  for (const key of keys) {
    const value = data.secrets[key];
    requireThat(typeof value === "string" && value.length > 0 && !value.includes("\0") && value.isWellFormed(), "Expected nonempty UTF-8 runtime strings without NUL");
    requireThat(!/(?:^|[/\\])fnox-export-/.test(value), "as_file exports are unsupported; configure inline runtime strings");
  }
  return data.secrets;
}

export async function resolveFnox(target, env, execute = exec) {
  // An empty global config/state directory avoids personal config and caches.
  // Only the chosen 1Password token crosses into the child, not ambient app values.
  const isolated = await mkdtemp(join(tmpdir(), "secret-sync-"));
  try {
    const childEnv = {
      PATH: env.PATH,
      HOME: env.HOME,
      FNOX_CONFIG_DIR: isolated,
      FNOX_STATE_DIR: isolated,
      TMPDIR: isolated,
      OP_SERVICE_ACCOUNT_TOKEN: env[target.source.tokenEnv],
      OP_BIOMETRIC_UNLOCK_ENABLED: "false",
      NO_COLOR: "1",
    };
    const { stdout } = await execute("fnox", [
      "--config", target.source.config, "--profile", target.source.profile,
      "--no-daemon", "--non-interactive", "--if-missing", "error",
      "export", "--format", "json", ...Object.keys(target.keys),
    ], { cwd: dirname(target.source.config), env: childEnv, timeout: 60_000, maxBuffer: 8 * 1024 * 1024 });
    return stdout;
  } catch {
    throw new SyncError("fnox resolution failed (diagnostics suppressed; no writes attempted)");
  } finally {
    await rm(isolated, { recursive: true, force: true });
  }
}

async function request(fetcher, url, token, body) {
  let response;
  try {
    response = await fetcher(url, {
      method: body === undefined ? "GET" : "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      redirect: "error", signal: AbortSignal.timeout(30_000),
    });
  } catch { throw new SyncError("Transport failure; remote outcome may be unknown"); }
  requireThat(response.ok, `Provider HTTP failure (${Number(response.status)})`);
  try { return await response.json(); }
  catch { throw new SyncError("Invalid provider response; remote outcome may be unknown"); }
}

function vercelUrl(target) {
  return `https://api.vercel.com/v10/projects/${target.projectId}/env?teamId=${target.teamId}`;
}

async function checkVercel(target, token, fetcher) {
  const data = await request(fetcher, `${vercelUrl(target)}&decrypt=false`, token);
  requireThat(object(data) && Array.isArray(data.envs) && !data.pagination?.next && !data.hiddenProductionEnvCount, "Vercel inventory incomplete; refusing writes");
  const destinations = new Set(Object.values(target.keys));
  const seen = new Set();
  for (const entry of data.envs) {
    if (!destinations.has(entry.key)) continue;
    const scopes = Array.isArray(entry.target) ? entry.target : [entry.target];
    requireThat(scopes.every((scope) => ["production", "preview", "development"].includes(scope)), "Unsupported Vercel scope on a managed key");
    if (!scopes.includes(target.environment)) continue;
    requireThat(scopes.length === 1 && !entry.gitBranch && !entry.customEnvironmentIds?.length && !entry.configurationId && !seen.has(entry.key), "Managed Vercel key has shared scopes, branch/custom overrides, integration ownership, or duplicates; review it first");
    seen.add(entry.key);
  }
}

async function writeKey(target, destination, value, token, fetcher) {
  if (target.platform === "vercel") {
    const type = "sensitive";
    const data = await request(fetcher, `${vercelUrl(target)}&upsert=true`, token, {
      key: destination, value, type, visibility: "secret", target: [target.environment],
    });
    requireThat(Array.isArray(data.failed) && data.failed.length === 0, "Vercel reported failed or unconfirmed writes");
    const created = Array.isArray(data.created) ? data.created : [data.created];
    requireThat(created.length === 1 && created[0]?.key === destination && created[0]?.type === type && Array.isArray(created[0]?.target) && created[0].target.length === 1 && created[0].target[0] === target.environment, "Vercel did not confirm the requested key/scope/type");
    requireThat(created[0].visibility === undefined || created[0].visibility === "secret", "Vercel did not confirm secret visibility");
    return destination;
  }
  const parent = `projects/${target.projectId}/secrets/${destination}`;
  const data = await request(fetcher, `https://secretmanager.googleapis.com/v1/${parent}:addVersion`, token, {
    payload: { data: Buffer.from(value, "utf8").toString("base64") },
  });
  // GCP canonicalizes project IDs to project numbers in resource names.
  const match = typeof data.name === "string" && data.name.match(/^projects\/([a-z0-9-]+)\/secrets\/([A-Za-z0-9_-]+)\/versions\/([1-9][0-9]*)$/);
  requireThat(match && (match[1] === target.projectId || (!/^\d+$/.test(target.projectId) && /^\d+$/.test(match[1]))) && match[2] === destination && data.state === "ENABLED", "GCP did not confirm the requested secret version");
  return data.name;
}

export async function syncSecrets(config, options, {
  env = process.env, baseDir = process.cwd(), resolveSecrets = resolveFnox,
  fetcher = fetch, log = console.log,
} = {}) {
  const target = selectTarget(config, options.target, baseDir, env);
  log(`${options.apply ? "Apply" : "Dry-run"}: ${options.target} -> ${target.platform}/${target.projectId}${target.teamId ? `/${target.teamId}/${target.environment}` : ""}; fnox profile ${target.source.profile}`);
  for (const [key, dest] of Object.entries(target.keys)) log(`  ${key} -> ${dest}`);
  if (!options.apply) {
    log("No credentials read, secrets resolved, or network requests made. Use --apply to write.");
    return [];
  }
  for (const name of [target.tokenEnv, target.source.tokenEnv]) {
    requireThat(typeof env[name] === "string" && env[name].length > 0 && !/[\r\n\0]/.test(env[name]), `Missing or invalid credential in ${name}`);
  }
  let raw;
  try { raw = await resolveSecrets(target, env); }
  catch { throw new SyncError("fnox resolution failed; no writes attempted (diagnostics suppressed)"); }
  const values = parseFnoxExport(raw, target.source.profile, Object.keys(target.keys));
  for (const value of Object.values(values)) {
    requireThat(value !== env[target.tokenEnv] && value !== env[target.source.tokenEnv] && !/^(sk-ant-admin-|sk-admin-|ops_)/.test(value), "Refusing a control-plane/bootstrap credential value");
    requireThat(target.platform !== "gcp" || Buffer.byteLength(value, "utf8") <= 65536, "GCP secret exceeds 64 KiB");
  }
  if (target.platform === "vercel") await checkVercel(target, env[target.tokenEnv], fetcher);
  const completed = [];
  for (const [key, destination] of Object.entries(target.keys)) {
    try {
      const receipt = await writeKey(target, destination, values[key], env[target.tokenEnv], fetcher);
      completed.push(destination);
      log(`Confirmed: ${receipt}`);
    } catch (error) {
      const reason = error instanceof SyncError ? error.message : "Unconfirmed provider response";
      throw new SyncError(`${reason}. Stopped at ${destination}. Confirmed ${completed.length}/${Object.keys(target.keys).length}: ${completed.join(", ") || "none"}. Current write may have landed; later keys not attempted. No rollback; inspect destination before retrying.`);
    }
  }
  log(`Confirmed ${completed.length} writes. Not atomic; no deployment or deletion performed.`);
  return completed;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    let config;
    try { config = JSON.parse(await readFile(options.config, "utf8")); }
    catch { throw new SyncError("Cannot read/parse sync config (contents suppressed)"); }
    await syncSecrets(config, options, { baseDir: dirname(resolve(options.config)) });
  } catch (error) {
    console.error(error instanceof SyncError ? error.message : "Secret sync failed (diagnostics suppressed)");
    process.exitCode = 1;
  }
}
