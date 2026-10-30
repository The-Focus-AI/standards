---
number: "010"
title: "Vercel deployment"
kind: guide
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-10-30"
---

> Rules extracted to STD-008; this is the platform walkthrough.

# Vercel deployment

Canonical pattern for Next.js apps on Vercel with GitHub previews, fnox-backed
secrets, Neon, Vercel Blob, and Clerk. Reference implementation: the **habitats**
repo (Next.js, fnox, Neon + Blob + Clerk). The maintained sync implementation
is this repository's `scripts/sync-secrets.mjs`, not the former bulk-export task.

For remote-server / pi / tmux setup see `best-practices/GDE-006-local-environment.md`. For Clerk domain and
OAuth rules see `best-practices/GDE-002-clerk.md`. For the full fnox playbook see
`best-practices/GDE-003-fnox-secrets.md`. For CI, testing against previews, and
failure notification see `standards/STD-012-testing-and-deployment.md` and
`best-practices/GDE-014-testing-and-preview-pipeline.md`.

## Defaults

| Concern | Standard |
| --- | --- |
| Host | Vercel (GitHub integration) |
| Production branch | `main` → Production deployment |
| Other branches / PRs | Preview deployments (`*.vercel.app`) |
| Database | Neon Postgres (`DATABASE_URL` pooled + `DATABASE_URL_UNPOOLED` when needed) |
| Object storage | Vercel Blob (`BLOB_READ_WRITE_TOKEN`) |
| Auth | Clerk — production-equivalent flows in Preview; production instance in Production; dev instance for local work |
| Secrets | 1Password vault → fnox → `mise run vercel:sync` → Vercel env store |
| Runtime on Vercel | Native Vercel env vars only — **do not** run fnox in the Vercel build or serverless runtime |

## One-time project setup

### 1. GitHub + Vercel

1. Create a Vercel project linked to the GitHub repo.
2. **Settings → Git → Production Branch** = `main`.
3. Leave Preview Deployments enabled for non-`main` branches and pull requests.
4. If the Next app is not at the repo root (e.g. `app/` or `web/`):
   - **Settings → General → Root Directory** = that folder.
   - Enable including source files outside the root when using a pnpm workspace.
5. Pin `npm:vercel` through mise; run `mise install`.
6. Link the intended project/team explicitly using the pinned CLI's project and
   scope options. Keep `.vercel/` gitignored; verify its project/team IDs against
   the committed sync target before using CLI deployment tasks.

### 2. `vercel.json`

Commit a minimal config next to the Next app (adjust path for monorepos):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs"
}
```

Add `crons` only when the app needs them. Cron handlers must verify
`Authorization: Bearer $CRON_SECRET` and stay on the public middleware allowlist.

### 3. Required mise tools and tasks

Pin Vercel CLI, Node and fnox via mise. `GDE-003` owns bootstrap, source-profile
semantics and the common sync contract. Configure the following consuming-project
tasks; they are not deployment tasks for this standards website:

| Task | Purpose |
| --- | --- |
| `mise run setup` | Check the project bootstrap token injected into the cloud workspace (`GDE-003`) |
| `mise run secrets:check` / `secrets:list` | Resolve required keys / list declarations without values |
| **`mise run vercel:sync`** | Run `node scripts/sync-secrets.mjs --config secret-sync.json`; forward explicit `--target` and optional `--apply` |
| `mise run vercel:deploy` | Trigger the approved CI/Git production deployment for the recorded project/team |
| `mise run vercel:preview` | Trigger the recorded project's preview build; not a production release |

#### Configure and review the target

1. Copy `scripts/sync-secrets.mjs` and adapt `templates/secret-sync.example.json`
   as `secret-sync.json` at the consuming repo root. Keep only its Vercel targets.
2. Replace `prj_REPLACE` and `team_REPLACE` with IDs verified in project/team
   settings. Each target explicitly selects `preview`, `production`, or
   `development`; there is no default production destination.
3. Review each `keys` mapping and fnox source file/profile. Shared profile
   `runtime` and shared keys are intentional in the example. Add database and
   URL overrides only where required; do not export every key in the vault.
4. Create an expiring **project-scoped** Vercel access token [3], with an owner
   and renewal date. Inject it into the authorized sync job as `VERCEL_SYNC_TOKEN`
   (or the configured `tokenEnv`), alongside the source's project-vault token.
   Team scope is broader, not equivalent. Do not use a full-account token by default.
5. Run the offline tests, inspect dry-run output, then authorize writes. Do not
   run sync inside `fnox exec` or a shell hook that resolves secrets before dry-run.

The direct commands, before adding the forwarding mise task, are:

```bash
node scripts/sync-secrets.mjs --config secret-sync.json --target vercel-preview
# Authorized writes only after reviewing the plan:
node scripts/sync-secrets.mjs --config secret-sync.json --target vercel-preview --apply
node scripts/sync-secrets.mjs --config secret-sync.json --target vercel-production --apply
```

The script uses `GET /v10/projects/{projectId}/env?teamId=...&decrypt=false`
for a preflight inventory [1], then one
`POST /v10/projects/{projectId}/env?teamId=...&upsert=true` per key [2].
Each body contains one explicit target scope; values travel as JSON in HTTPS,
never `--value` arguments. There is no remove-before-add window. A `201` alone
is insufficient: the tool also checks `failed` and the returned key/scope/type.

All scopes use `type: sensitive` and `visibility: secret`. Vercel's current
Config/Secret documentation [4] explicitly allows Secrets in Development,
reversing the older Preview/Production-only restriction. Secret values are
write-only; an empty/redacted pull is **not** proof that a value was stored
empty or that it is correct. Confirm behavior in a newly built deployment.

Vercel's optional **Separate Production Secret Values** team policy can forbid
sharing a value between Production and other scopes [4]. Shared runtime keys
remain this guide's default where permitted. If that policy is enabled, the
write fails rather than silently switching source or weakening visibility;
document the provider constraint and obtain approval for the needed mapping.

For managed keys, preflight refuses shared multi-scope records, branch/custom
overrides, duplicate entries, integration-owned records, and incomplete inventories.
Review and separate those records deliberately before adopting this tool; do not
delete an old value as part of a blind retry. This implementation manages ordinary
scope-wide variables, not custom environments or branch-specific overrides.
Serialize jobs and avoid dashboard edits while syncing: preflight is not a lock.

On failure, stop the deploy. Confirmed earlier writes remain; the current write
may have landed despite a timeout or invalid response. Inspect remote state
before retrying. The script does not roll back, delete unrelated variables,
retry automatically, or claim all-or-nothing behavior.

### 4. fnox.toml

Declare every runtime env var the app needs. Item title in 1Password = env var
name. Non-secrets may use `default = "..."`.

Minimum set for a typical app:

| Env var | Role |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string |
| `DATABASE_URL_UNPOOLED` | Neon **direct** URL (migrations, LISTEN/NOTIFY, session features) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Svix signing secret (if webhooks are used) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token |
| `CRON_SECRET` | Bearer for Vercel Cron (if crons exist) |
| `NEXT_PUBLIC_APP_URL` | Canonical public URL for the environment |

Optional but common: `AI_GATEWAY_API_KEY`, app-specific secrets, JWT template
name as a fnox `default`.

Keep a committed `.env.example` that lists the same keys with comments for
local / Preview / Production — no real values.

## Environment matrix

Vercel has three scopes. Map them deliberately, starting Preview from the
production configuration rather than a reduced development configuration:

| | Local / Development | Preview (PR / branch) | Production |
| --- | --- | --- | --- |
| Trigger | `pnpm dev` / `vercel dev` | Push to non-`main` or open PR | Push to `main` (or `vercel:deploy`) |
| Sync target | Add explicit `vercel-development` target if needed | `--target vercel-preview` | `--target vercel-production` |
| 1Password | Project vault or isolated dev source | Shared project vault; isolated source only where needed | Project vault |
| Neon | Dev branch or local | Staging / preview branch | Prod branch |
| Clerk | Dev instance `pk_test_` / `sk_test_` | Production-equivalent auth; document provider/domain constraints | **Production instance** `pk_live_` / `sk_live_` |
| Blob | Dev store token | Same integration; isolate writes that could harm production objects | Prod store token |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Preview URL or branch alias | Custom domain |
| `CLERK_AUTHORIZED_PARTIES` | Local origin | Approved preview origin or stable alias; same origin checks | Locked to the prod origin |

**Parity, with explicit exceptions:** `STD-007 §3.4` makes production behavior
the default, not separate keys. Shared runtime credentials are appropriate when
their permissions suit both targets; §3.5 still prohibits preview writes to the
production database. Record each differing setting, its reason, and what the
preview cannot verify. The sync task selects sources and allowed keys explicitly;
the destination flag alone does not establish that mapping.

## GitHub branch previews

1. Connect the repo in the Vercel dashboard (Git integration).
2. Every push to a non-production branch and every PR gets a Preview deployment
   built with the **Preview** env scope.
3. After changing Preview secrets: dry-run, then
   `mise run vercel:sync -- --target vercel-preview --apply`; redeploy to pick up values.
4. `NEXT_PUBLIC_*` vars are baked at **build** time. Changing them requires a
   new deployment through the recorded project's CI/Git pipeline.
5. Allow preview origins where the framework requires it (e.g. Next server
   actions `allowedOrigins` including `*.vercel.app`).

## Neon

- The **Neon ↔ Vercel** integration can provision pooled/direct connections.
  Give each variable one delivery owner: either record an integration-managed
  exception or transfer it deliberately to the 1Password-backed sync mapping.
  Do not have the integration and this script overwrite each other's values.
- App queries: pooled URL. Migrations / LISTEN / session features: unpooled.
- Preview isolation: a Neon **branch** (or separate project) whose connection
  strings are mapped to the Preview Vercel scope; this does not require a
  separate vault. Keep schema and database behavior aligned with production,
  apart from the change under test.
- Run migrations through an authorized cloud operational job against the explicit
  target URL, after any required approval. Do not depend on a laptop or use a
  Vercel build as an implicit destructive-migration step.

Map the migration job's explicit fnox profile to the intended direct database
reference and execute its migration command through fnox. Keep tracing disabled;
never print the connection string as a diagnostic.

## Vercel Blob

1. Create a Blob store in the Vercel project (or reuse per-environment stores).
2. Put `BLOB_READ_WRITE_TOKEN` in the matching 1Password vault.
3. Sync with `vercel:sync` for each env scope that needs storage.
4. Prefer **private** blobs; serve through authenticated app routes (signed URL
   or stream), not public world-readable URLs for client data.
5. Health checks should report whether the blob token is present (boolean), not
   the token value.

## Clerk: production and preview

Instance setup and the **publishable-key diagnostic** live in `GDE-002`; use
that diagnostic for both live and test keys rather than a live-prefix-only decoder.
A development instance still
uses client-specific OAuth applications under `STD-009 §3.6`; Preview aims to
exercise production authentication under `STD-007 §3.4`, not inherit development
shortcuts automatically.

| | Preview | Production |
| --- | --- | --- |
| Instance / keys | Select a supported preview domain/instance setup; share runtime keys where appropriate | **Production** instance on the client custom domain; `pk_live_…` / `sk_live_…` |
| Social OAuth | Same providers and client-specific setup as production | This client's Google/Microsoft apps; never another client's (see `GDE-002`) |
| Domains | Configure the actual preview origin and callback URLs; document required differences | Custom domain + Clerk CNAMEs (DNS-only / grey cloud on Cloudflare) |
| `authorizedParties` | Approved preview origin or stable branch alias; retain origin checks | Lock to `https://<prod-host>` |
| Webhooks | Same events and handlers at the preview endpoint; isolate harmful downstream effects | Prod URL + `CLERK_WEBHOOK_SECRET` in Production scope |
| Middleware | Same auth checks and public-route exceptions; no silent auth bypass | Public: sign-in/up, health, cron, webhooks; never put `DEV_AUTH_BYPASS` in Production |

Verify Clerk's supported domains and redirects before selecting shared keys;
do not assume copying live keys makes an arbitrary preview URL work. If a
provider constraint requires a development-only fallback, document what it
leaves unverified. Clerk's shared development OAuth credentials do not satisfy
the client-isolation rule, even when a login succeeds.

**Never** put `pk_test_` / `sk_test_` in Vercel Production. The #1 prod outage
pattern is shipping the dev instance to the live domain.

Practical sync model:

1. Map shared runtime keys and justified overrides to each Vercel scope.
2. Keep preview database writes on a separate branch; scope Blob writes and
   webhook effects so testing cannot damage production data.
3. `mise run vercel:sync -- --target vercel-preview` reviews that mapping without resolving values.
4. Select `vercel-production` explicitly for production; add `--apply` only after approval.

A shared project vault is compatible with this model. A blind export of its
contents is not: sync only each target's required keys (`STD-007 §3.12`).

## Daily operations

For production, record the verified candidate and required release approval
before triggering the CI deployment (`STD-012 §3.11`). No separate staging
environment is required; a Git-triggered release still has that gate.

```bash
# 1. Rotate the value through 1Password's secure UI, not shell arguments.
# 2. Review then apply the explicit production target.
mise run vercel:sync -- --target vercel-production
mise run vercel:sync -- --target vercel-production --apply
# 3. Trigger the approved CI/Git deployment for this project.
# 4. Review key names/scopes in the project's dashboard, then smoke-test.
curl --fail --silent --show-error "https://<host>/api/health"
```

An inventory confirms names and scopes, not that values work. Test actual
database/auth/storage operations without exposing credentials in logs.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `No Next.js version detected` | Root Directory points at the Next.js app, not the monorepo root |
| `No Output Directory named public` | Framework Preset is Next.js; minimal `vercel.json` is next to the app |
| Empty-looking sensitive value on pull | Sensitive values are write-only; verify a rebuilt app rather than replacing them with empty strings |
| Quotes/newlines corrupted | Use the maintained JSON-based sync, not shell/dotenv line splitting |
| Profile mismatch | Unset the ambient `FNOX_PROFILE` or choose the matching named target; do not change only the destination |

Do not install fnox in the Vercel build or store only its bootstrap token there.
Native environment delivery avoids a 1Password request at every cold start;
already-deployed functions do not depend on a later sync succeeding.

## Health and cron

- Expose `/api/health` (or equivalent) that reports booleans for DB / Blob /
  Clerk config without leaking secrets.
- Cron routes: declare in `vercel.json`, protect with `CRON_SECRET`, exclude
  from Clerk auth.
- Long jobs: set `maxDuration` / Fluid Compute as needed; document in the app.

## Anti-patterns

- Manual dashboard-only secrets with no fnox / 1Password source of truth.
- `fnox exec` (or installing fnox) as the Vercel build command.
- Dev Clerk keys in Production; live keys committed to `.env` or the repo.
- One Neon database shared by Preview and Production with write access from both.
- Syncing the entire monorepo vault into a Vercel project that only needs a
  subset (review `vercel env ls` after sync).
- Changing `NEXT_PUBLIC_*` and expecting running deployments to pick it up
  without a rebuild.
- Relying on Supabase-as-default for new Focus projects — prefer Neon unless
  the client already standardized on Supabase (document the exception).

## New project checklist

- [ ] Vercel project linked to GitHub; Production branch `main`; Preview on
- [ ] Root Directory + `vercel.json` `"framework": "nextjs"`
- [ ] `npm:vercel` in mise; `vercel link`; `.vercel/` gitignored
- [ ] Dedicated 1Password vault(s); `fnox.toml`; `mise run setup`
- [ ] `vercel:sync` / `vercel:deploy` / `vercel:preview` tasks
- [ ] Neon: pooled + unpooled URLs; Preview branch planned
- [ ] Blob token(s) in fnox
- [ ] Clerk: production instance in Production; production-equivalent auth in Preview
- [ ] Preview configuration differences have a reason and documented testing limits
- [ ] `.env.example` matches fnox keys; health endpoint exists
- [ ] Explicit sync target reviewed and applied; deployed runtime and key/scope inventory verified
- [ ] Custom domain + Clerk DNS per `best-practices/GDE-002-clerk.md` when going live

## Verification and primary sources

Checked 2026-10-30: reachable primary API documentation and offline simulated
adapter tests (`node --test tests/test-secret-sync.mjs`). No real provider
credential was read, no live write or deployment was performed, and these
tests do not establish live permission or account-specific API behavior.
Before adoption, an authorized operator verifies a disposable project, exact
scope isolation, sensitive-variable behavior, and runtime delivery.

[1] Vercel, [environment inventory API](https://vercel.com/docs/rest-api/projects/retrieve-the-environment-variables-of-a-project-by-id-or-name).

[2] Vercel, [create/upsert environment variables](https://vercel.com/docs/rest-api/projects/create-one-or-more-environment-variables).

[3] Vercel, [access token scope and expiry](https://vercel.com/docs/accounts/access-tokens).

[4] Vercel, [Config/Secret variables and separation policy](https://vercel.com/docs/environment-variables/sensitive-environment-variables).
