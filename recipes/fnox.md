---
title: "Configure fnox and secret delivery"
summary: "Project bootstrap, profile semantics, and the explicit runtime-key sync contract."
status: "Reference"
---

Follow the [secret-handling guidance](../handbook/secrets.md) before setup.

A reference for setting up isolated, auditable secret management on any project.
Goals:

1. **Project isolation in the company account** — each project's secrets live in
   its own dedicated vault (`<Client> - <Project>` or `<Client>`) inside
   TheFocus.AI's company 1Password Business account (`thefocusai.1password.com`),
   accessed by a service account scoped to that vault. Never use a personal
   1Password account (`my.1password.com`) or built-in `Private`, `Personal`,
   `Employee`, `Shared`, or `default` vaults.
2. **1Password is the source of truth for development and preview values** — production
   values are set in the deployment platform by an owner. The scoped bootstrap token enters through
   cloud secret settings; application credentials resolve through fnox. Platform
   write credentials belong only in authorized sync jobs, not the application.
   Nothing is committed or baked into a reusable image. A local token file is an exception.
3. **Control where every key comes from** — `fnox.toml` maps each runtime variable to
   a provider/vault/item; a sync target maps only the runtime keys its application needs.
4. **Usage visibility** — secret descriptions can point to billing dashboards.
   Administrative usage-report credentials stay outside application runtime profiles.

## Concepts

- **fnox** resolves variables from providers; it is a router, not a vault or API proxy.
- **1Password service account** is a non-human identity scoped to selected vaults.
  Its `OP_SERVICE_ACCOUNT_TOKEN` is a bootstrap credential, not an application key.
- **fnox profile** selects source declarations and overrides. It does not select a
  deployment destination or prove that the injected identity has the correct scope.
- **Sync target** names the platform project, destination, source profile, credential
  environment names, and runtime allowlist together. Preview and Production may use
  the **same profile and runtime keys**; differences need a reason, not just different names.

Deployment procedures have one owner: **`recipes/vercel.md` for Vercel**, **`recipes/gcp.md` for GCP**.
This guide owns bootstrap, fnox semantics, and the common sync contract.

## One-time per-project setup

### Install tools (via mise)

Work in the project's cloud workspace (`handbook/development.md`). Declare fnox and the
1Password CLI in its mise configuration; use `mise use` when adding tools.
The maintained versions are in `templates/default-project/mise.toml`.

Run `mise trust` and `mise install` for the tools, then `mise run install` for
project dependencies. fnox needs `op` on PATH, but an injected service-account
token does not need desktop integration or a person's interactive login.
Installation of `op` 2.41.1 through mise and its service-account command help
were checked on 2026-10-29; no real credentials were resolved [1].

For the sync implementation below, use Node 22 or newer and pin a tested fnox
release with named-key export support through mise. The source checked here is
**fnox v1.45.0** [2], not an assertion that older releases accept the same flags.

> **Interactive shells.** Optional mise/fnox activation can resolve application
> values when entering a project. For zsh, put activation in `~/.zshrc` rather
> than only `~/.zprofile`:
>
> ```bash
> eval "$(mise activate zsh)"
> command -v fnox >/dev/null 2>&1 && eval "$(fnox activate zsh)"
> ```
>
> Activation is for interactive app work, not a prerequisite for sync. For a
> command without activation, use `fnox --profile runtime exec -- <command>`.
> Keep administrative keys out of the runtime profile. Inspect the selected
> profile rather than assuming that every declared key is safe to inject.

The cloud platform injects `OP_SERVICE_ACCOUNT_TOKEN`; mise does not retrieve it.
Check presence without printing even part of a value:

```bash
test -n "${OP_SERVICE_ACCOUNT_TOKEN:-}" && echo "Bootstrap token is present"
fnox --profile runtime exec -- sh -c 'test -n "$ANTHROPIC_API_KEY"'
```

The second command resolves real secrets: run it only in an authorized workspace.
Presence alone is not proof of vault access or correct scope.

### Create the dedicated vault in the company account

Always pass `--account thefocusai.1password.com` (and unset any ambient
`OP_SERVICE_ACCOUNT_TOKEN`) on interactive `op` commands. A laptop signed in to
both `thefocusai.1password.com` and a personal `my.1password.com` account
otherwise creates resources in whichever account signed in last:

```bash
env -u OP_SERVICE_ACCOUNT_TOKEN op vault create "<Client> - <Project>" \
  --account thefocusai.1password.com --icon vault-door \
  --description "Secrets for <project>; managed by fnox"
```

### Retrieve and inject the scoped bootstrap token

A person uses their individual seat in the company 1Password account
(`thefocusai.1password.com`, never a personal `my.1password.com` account) to
retrieve the project's saved service-account token. If it does not exist, an
authorized owner or administrator creates it in `thefocusai.1password.com` and
saves the result in the project vault:

```bash
env -u OP_SERVICE_ACCOUNT_TOKEN op service-account create "<project>-sa" \
  --account thefocusai.1password.com \
  --vault "<Client> - <Project>:read_items"
```

Use `write_items` only for an authorized secret-management workflow, not merely
to run the app. The command displays the token once: keep its output out of
agent transcripts and save it through 1Password's secure UI.

Add the token as `OP_SERVICE_ACCOUNT_TOKEN` in each authorized cloud environment's
secret settings. In Amp, prefer project scope; a personal Amp secret applies
across that person's orbs and is not equivalent to retrieving a project token
with a personal 1Password identity. Cursor environment secrets apply to every
repository using that environment; choose the environment boundary accordingly
(`handbook/development.md`).

Record the token item's location, owner, vault scope, and receiving environments,
not its value. Recovery uses the person's 1Password access, not the lost token;
there is no universal same-vault or different-vault rule (`handbook/secrets.md`).
Never supply the person's account password, Secret Key, or login-session cache
to the agent, and never bake the token into an image or snapshot.

For a documented local-development exception only, `.fnox/env` is a gitignored
dotenv file with mode 600, loaded by mise's `_.file` directive. It is not needed
for cloud injection. Run the agent-instruction secret-file preflight before
creating it; do not copy an injected cloud token there.

### Ignore coverage

```text
.fnox/
.env
.env.*
!.env.example
```

The full template and `AGENTS.md` preflight own ignore coverage. Check each
intended secret path for both ignore coverage and existing Git tracking before
writing; patterns do not protect already tracked files.

### Initialize fnox

```bash
fnox provider add op 1password
# Edit fnox.toml: replace vault = "default" with vault = "<Client> - <Project>".
```

`fnox provider add` writes `vault = "default"` as a placeholder: always replace
it with the dedicated company project vault (`<Client> - <Project>` or
`<Client>`), never `"default"`, `"Private"`, `"Personal"`, `"Employee"`, or
`"Shared"`. Do **not** set `account = "thefocusai.1password.com"` inside
`[providers.op]`: fnox forwards `--account` to `op read`, which conflicts with
`OP_SERVICE_ACCOUNT_TOKEN`, whereas the scoped service-account token already
binds resolution exclusively to `thefocusai.1password.com` and its granted vault.

Example declarations (references, not secret values):

```toml
[providers.op]
type = "1password"
vault = "<Client> - <Project>"

[secrets.ANTHROPIC_API_KEY]
provider = "op"
value = "ANTHROPIC_API_KEY"
description = "Anthropic — https://console.anthropic.com/settings/billing"

[secrets.CLERK_SECRET_KEY]
provider = "op"
value = "CLERK_SECRET_KEY"

[secrets.NEXT_PUBLIC_CLERK_SIGN_IN_URL]
default = "/sign-in"

[secrets.OPTIONAL_FUTURE_KEY]
provider = "op"
value = "OPTIONAL_FUTURE_KEY"
if_missing = "ignore"

# An explicit profile can inherit the shared top-level declarations.
[profiles.runtime]
```

1Password item title = `value` is a convention, not an implicit lookup: include
the `value` reference. fnox's schema rejects arbitrary custom fields; put
dashboard URLs in `description`, not a custom `dashboard` or `usage_api` field.
Keep unprovisioned keys out of sync allowlists until they are required and issued.

### Import existing values (one-time migration)

The 1Password provider reads item references; `fnox set`/`import` are not a
substitute for creating those items. Use 1Password's secure UI for a small
import or a separately reviewed importer for the source format. Then add the
provider/item references to `fnox.toml`.

The former `while IFS='=' read ...` loop was not a dotenv parser: quotes,
multiline values and comments could be stored incorrectly. It also passed
passwords in process arguments and printed `FAILED` without failing the job.
It is intentionally not retained as an executable migration recipe. Do not
paste replacement secrets into shell commands or transcripts.

After checking ignore/untracked status, verify the required keys through the
app or an authorized `fnox check`, then remove only the now-disposable plaintext
source. A successful check that ignores an unprovisioned key does not verify it.

### Wire up application and operations tasks

With fnox activation, ordinary `package.json` commands inherit the selected
application environment. Without activation, wrap the application command in
`fnox --profile runtime exec -- ...`.

```json
{
  "scripts": {
    "dev": "pnpm --filter web dev",
    "build": "pnpm --filter web build",
    "start": "pnpm --filter web start"
  }
}
```

To run a workspace binary rather than a package script, use
`pnpm --filter web exec tsx ...`, not `pnpm --filter web tsx ...`.

Use the maintained `setup` task in `templates/default-project/mise.toml`. It is
the one command that gets a checkout ready, and it is safe to run again at any time:

- If the token in the environment can read the project vault, it changes nothing.
- If there is no token, or the token no longer reads the vault, it fetches the
  saved token from `thefocusai.1password.com` (`--account thefocusai.1password.com`)
  and writes the ignored, mode-600 `.fnox/env`, after checking that git ignores
  and does not track it. It refuses personal `my.1password.*` accounts and
  built-in `Private`, `Personal`, `Employee`, `Shared`, or `default` vaults.
- If neither works, it says what to fix: the cloud secret setting, or the
  person's sign-in and group membership in `thefocusai.1password.com`.

It then checks that every declared secret resolves. `OP_ACCOUNT_HOST` defaults
to `thefocusai.1password.com`; set the project vault (`OP_VAULT`) and the token
item's title (`OP_TOKEN_ITEM`) when adapting it to a project.
The other secret tasks are:

```toml
[tasks."secrets:check"]
description = "Verify declared required secrets resolve cleanly"
run = "fnox check"

[tasks."secrets:list"]
description = "List declared secrets and their sources without resolving values"
run = "fnox list"
```

After rotation, update the receiving cloud secret settings and refresh the
workspace processes using that platform's supported mechanism. On a person's own
machine, `mise run setup` notices the old token no longer works and replaces it;
there is no separate refresh task. It cannot update a cloud secret setting.

## Multi-environment (development / preview / production)

`handbook/secrets.md` makes production behavior the default for preview. Start from the
same configuration and integrations, then record only the differences needed
for deployment constraints or to prevent harmful side effects. A project vault
and suitably scoped runtime keys can be shared; a separate vault, account, or
key for every environment is not the default requirement.

Profiles select intended values; they do not have to select different vaults.
Keep preview writes off the production database (`handbook/secrets.md`), and record
each difference and its testing limits in the environment matrix. For example,
retain shared provider keys but override database references in a preview profile:

```toml
[profiles.preview.secrets.DATABASE_URL]
provider = "op"
value = "DATABASE_URL_PREVIEW"

[profiles.production.secrets.DATABASE_URL]
provider = "op"
value = "DATABASE_URL_PRODUCTION"
```

For hard isolation, the earlier separate-vault layout remains an option:

```toml
[profiles.dev.providers.op]
type = "1password"
vault = "<Project> - Dev"

[profiles.prod.providers.op]
type = "1password"
vault = "<Project> - Prod"
```

That layout needs separately scoped service-account tokens. A profile alone
is not an access boundary. The deployment target selects both profile and token
environment name; Vercel/runtime GSM mirrors receive neither bootstrap token.

### Verified fnox semantics

Source inspection at v1.45.0 [2–4] establishes:

- `--profile` takes precedence over `FNOX_PROFILE`; absent selection falls back
  to settings/default. `default` means the top-level config, not `[profiles.default]`.
- Named profiles inherit top-level secret/provider declarations, then overlay
  their own. Missing profiles fail. Sharing declarations does not prove that
  different vaults contain all the same items.
- `export --format json KEY ...` exports **only the named keys** as strings in
  `.secrets`, with `.metadata.profile` and `.metadata.total_secrets`. It can
  resolve referenced dependencies internally, but does not export those dependencies.
- The output is not a flat object and not a stream of `KEY=value` lines. JSON
  decoding preserves quotes, newlines, backslashes and JSON-valued strings.
- fnox's export `--dry-run` is **not** a no-resolution mode. The wrapper's
  default dry-run does not call fnox at all.
- `as_file = true` exports temporary-file paths, not contents. It is unsupported
  by this sync tool; configure runtime values as inline strings.

Use `fnox --profile NAME list` to inspect declared key names without resolving
them. Do not export the whole vault just to compare key sets. Authorized CI
checks select their profile explicitly and use only that profile's scoped token.

## Common sync contract

The replacement for the withdrawn bulk-sync snippets is
[`scripts/sync-secrets.mjs`](../scripts/sync-secrets.mjs), with
[`templates/secret-sync.example.json`](../templates/secret-sync.example.json).
Copy the script and adapt the JSON in a consuming project; the platform guides
own commands and provider setup. This repository itself does not need provider
credentials to run the offline tests.

The JSON maps a named target to:

- `platform`, `projectId`, and (Vercel) `teamId` and `environment`;
- `tokenEnv`: the injected platform credential's **environment name**, never its value;
- `source.config`: fnox file path relative to the JSON file;
- `source.profile` and `source.tokenEnv`: an explicit profile and the injected
  project-vault token's environment name;
- `keys`: a nonempty mapping of fnox runtime keys to destination environment
  names (Vercel) or pre-existing secret IDs (GCP).

The example deliberately shares profile `runtime` and runtime keys between
Preview and Production. It omits databases: add only the justified overrides
for a preview branch before allowing preview writes. Delete unused example
targets and replace project/team placeholders before applying.

**Safety behavior:**

- No default target. Without `--apply`, the script validates configuration and
  prints key/destination names; no credentials are read, no secrets resolved,
  and no provider requests made.
- An ambient `FNOX_PROFILE` mismatch fails even in dry-run. Unset it or choose
  the intended target; the child always receives an explicit `--profile`.
- The child has an isolated global fnox config/state directory, no daemon, and
  no ambient application variables or platform credentials. Only the selected
  project token is mapped to `OP_SERVICE_ACCOUNT_TOKEN`.
- Review the fnox file **and its imports**: use direct 1Password references and
  intentional non-secret defaults, not fallback values masking provider failures,
  sync caches, file-valued secrets, or administrative credentials renamed as runtime keys.
  This is not a TOML policy engine or sandbox for untrusted project configuration.
- Only allowlisted keys are requested; missing/extra keys, wrong profile metadata,
  invalid JSON, empty/non-string values, NUL and invalid Unicode fail before writes.
  Empty values are intentionally unsupported, not silently treated as deletion.
- Known admin/bootstrap/control-plane names, configured credential names and
  recognizable admin/bootstrap values are rejected. Name checks cannot identify
  every provider's master key: human review of key permissions remains necessary.
- Values stay in captured stdout and HTTPS request bodies, not shell arguments,
  generated env files, or logs. Provider bodies and subprocess error text are not
  printed. Keep shell tracing and external HTTP/debug tracing disabled too.
- Writes are sequential and **not atomic**. First failure stops later writes and
  exits nonzero, reporting confirmed destinations and the possibly applied current
  write. No deletion, rollback, automatic retry, or deployment is performed.
  Inspect provider state after partial or uncertain completion before retrying.
- Serialize sync jobs per destination and avoid concurrent dashboard edits.
  A dry-run validates a plan, not credentials, remote state, or runtime behavior.

## Onboarding a teammate

[Give and remove access](../handbook/access.md) owns groups, shared-service seats,
offboarding, and rotation. These steps cover only the workspace.

1. Open the repository in an Amp orb, Cursor cloud environment, or equivalent
   reproducible workspace. Its committed bootstrap installs the tools and dependencies.
2. Add the person to the project's group in `thefocusai.1password.com`. In a
   cloud workspace the project's secret settings already supply the token; if
   they do not, the person retrieves it from their seat in
   `thefocusai.1password.com` (never a personal `my.1password.com` account) and
   enters it there.
3. Run `mise run setup`. It confirms the token reads the vault, fetching it on
   the person's own machine if needed, then checks that secrets resolve. Resolve
   application secrets through fnox activation or `fnox exec --`, as in step 1
   above, then run `mise run dev`.
4. Review the app through the workspace portal or deployment preview. A teammate
   should not need your laptop, shell configuration, or local database.

During token rotation, update every recorded receiving environment, verify access,
and revoke the old service account. Do not treat successful presence checks as
verification that the new token has the right scope.

## Tracking key usage

fnox is a router, not a proxy: it cannot measure API usage. Store dashboard URLs
in secret descriptions and use the provider's billing dashboard. For automated
usage checks, run a separate authorized operational job with administrative
credentials and provider-supported reporting APIs; keep those keys out of app
profiles and sync allowlists. Use an HTTP library rather than passing bearer
values as `curl` arguments. The older unverified balance snippets are not a
runtime-secret deployment recipe.

Per-request attribution needs a proxy or instrumentation layer, for example
LiteLLM, Helicone, or an application-owned usage meter. That is separate from
secret storage and delivery.

## Security checklist

- [ ] Vault, service account, and saved token live in `thefocusai.1password.com`,
  never `my.1password.com` or `Private`/`Personal`/`Employee`/`Shared`/`default` vaults.
- [ ] Service account scoped to one project vault; review `op vault list` using
  the already injected token, not a token literal in the command.
- [ ] Secret-file preflight confirms intended paths are ignored and untracked.
- [ ] Only required runtime keys appear in each allowlist; credential scope reviewed.
- [ ] Preview shares production behavior; justified differences and testing limits recorded.
- [ ] Preview cannot write to the production database.
- [ ] Rotation owner, expiry, token location, and receiving environments recorded.
- [ ] Provider target/inventory reviewed after sync; runtime smoke check after deployment.
- [ ] An authorized member can recover the saved token through their seat in `thefocusai.1password.com`.
- [ ] No bootstrap token or personal session persisted into a shared image/snapshot.

## Verification and references

On 2026-10-30, fnox source and primary provider API documentation were read and
the Node tests exercised simulated fnox and HTTP adapters, including failure paths.
Run `node --test tests/test-secret-sync.mjs` offline. No real secret resolution,
provider credential validation, live write, or deployment was performed. Before
adoption, an authorized operator still verifies the pinned tools, IAM scopes,
provider behavior on a disposable target, then the application's runtime behavior.

[1] [fnox 1Password provider](https://fnox.jdx.dev/providers/1password),
checked 2026-10-29, plus `op service-account create --help` from mise-installed
`op` 2.41.1. Cloud secret scope/snapshot references remain in `handbook/development.md`.

[2] fnox v1.45.0,
[named-key export and JSON metadata](https://github.com/jdx/fnox/blob/48f328bbdb726b527dca0328bc52da30557d0dbd/src/commands/export.rs#L29-L200).

[3] fnox v1.45.0,
[profile selection and merging](https://github.com/jdx/fnox/blob/48f328bbdb726b527dca0328bc52da30557d0dbd/crates/fnox-core/src/config.rs),
and [CLI flags](https://github.com/jdx/fnox/blob/48f328bbdb726b527dca0328bc52da30557d0dbd/src/commands/mod.rs#L80-L133).

[4] fnox v1.45.0,
[resolution/fallback behavior](https://github.com/jdx/fnox/blob/48f328bbdb726b527dca0328bc52da30557d0dbd/crates/fnox-core/src/secret_resolver.rs#L700-L772).
