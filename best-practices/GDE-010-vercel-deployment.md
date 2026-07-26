---
number: "010"
title: "Vercel deployment"
kind: guide
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-07-25"
---

> Rules extracted to STD-008; this is the platform walkthrough.

# Vercel deployment

Canonical pattern for Next.js apps on Vercel with GitHub previews, fnox-backed
secrets, Neon, Vercel Blob, and Clerk. Reference implementation: the **habitats**
repo (`mise.toml` `vercel:sync`, `fnox.toml`, Neon + Blob + Clerk).

For remote-server / pi / tmux setup see `best-practices/GDE-006-local-environment.md`. For Clerk domain and
OAuth rules see `best-practices/GDE-002-clerk.md`. For the full fnox playbook see
`best-practices/GDE-003-fnox-secrets.md`.

## Defaults

| Concern | Standard |
| --- | --- |
| Host | Vercel (GitHub integration) |
| Production branch | `main` → Production deployment |
| Other branches / PRs | Preview deployments (`*.vercel.app`) |
| Database | Neon Postgres (`DATABASE_URL` pooled + `DATABASE_URL_UNPOOLED` when needed) |
| Object storage | Vercel Blob (`BLOB_READ_WRITE_TOKEN`) |
| Auth | Clerk — **dev instance** for local + Preview; **production instance** for Production only |
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
5. Add `"npm:vercel" = "latest"` (or a pin) to `mise.toml` tools; run `mise install`.
6. From the app directory: `vercel link` once. Keep `.vercel/` gitignored.

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

Pin Vercel CLI via mise. Copy the habitats-style tasks (see
`best-practices/GDE-003-fnox-secrets.md` for the full sync script):

| Task | Purpose |
| --- | --- |
| `mise run setup` | Write `.fnox/env` with the project’s 1Password service-account token |
| `mise run secrets:check` / `secrets:list` | Verify fnox resolution |
| `mise run secrets:seed-from-vercel` | One-time: pull Production env into the 1P vault |
| **`mise run vercel:sync`** | Push every fnox-resolved secret to a Vercel env scope |
| `mise run vercel:deploy` | `vercel deploy --prod` (or rely on Git push to `main`) |
| `mise run vercel:preview` | `vercel deploy` (ad-hoc preview) |

`vercel:sync` must use `fnox export -f json` and
`vercel env add "$KEY" "$ENV" --value "$VALUE" --yes`. Never pipe values on
stdin — empty strings get stored silently.

```bash
mise run vercel:sync                      # → Vercel Production (default)
mise run vercel:sync -- --env preview     # → Vercel Preview
mise run vercel:sync -- --env development # → Vercel Development / `vercel dev`
```

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

Vercel has three scopes. Map them deliberately:

| | Local / Development | Preview (PR / branch) | Production |
| --- | --- | --- | --- |
| Trigger | `pnpm dev` / `vercel dev` | Push to non-`main` or open PR | Push to `main` (or `vercel:deploy`) |
| Sync target | `--env development` | `--env preview` | `--env production` (default) |
| 1Password | Project vault (or `… - Dev`) | Prefer `… - Preview` / Staging vault | `… - Prod` vault |
| Neon | Dev branch or local | Staging / preview branch | Prod branch |
| Clerk | Dev instance `pk_test_` / `sk_test_` | **Same dev instance** | **Production instance** `pk_live_` / `sk_live_` |
| Blob | Dev store token | Preview store token (or shared non-prod) | Prod store token |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Preview URL or branch alias | Custom domain |
| `CLERK_AUTHORIZED_PARTIES` | Often unset | Blank or known alias | Locked to the prod origin |

**Blast radius:** Prefer separate 1Password vaults (and Neon branches) for
Preview vs Production so a leaked preview token cannot read prod. Use fnox
profiles (`FNOX_PROFILE=preview` / `prod`) locally when syncing; see
`best-practices/GDE-003-fnox-secrets.md` § Staging vs production isolation. Habitats currently
runs a single vault with profiles commented out — fine for dogfood, not the
long-term default for client work.

## GitHub branch previews

1. Connect the repo in the Vercel dashboard (Git integration).
2. Every push to a non-production branch and every PR gets a Preview deployment
   built with the **Preview** env scope.
3. After changing Preview secrets: `mise run vercel:sync -- --env preview`, then
   push or redeploy so the build picks up new values.
4. `NEXT_PUBLIC_*` vars are baked at **build** time. Changing them requires a
   new deployment (Git push or `vercel --prod --force` / preview redeploy).
5. Allow preview origins where the framework requires it (e.g. Next server
   actions `allowedOrigins` including `*.vercel.app`).

## Neon

- Prefer the **Neon ↔ Vercel** integration so both `DATABASE_URL` (pooled) and
  `DATABASE_URL_UNPOOLED` (direct) are created; still mirror them into 1Password
  and manage day-to-day via `vercel:sync` so 1P remains source of truth.
- App queries: pooled URL. Migrations / LISTEN / session features: unpooled.
- Preview isolation: a Neon **branch** (or separate project) whose connection
  strings live only in the Preview vault / Preview Vercel scope.
- Run migrations from a laptop against the target URL; do not rely on Vercel
  build steps for destructive schema changes unless the project documents that
  path explicitly.

```bash
# Example: migrate prod from laptop (fnox or explicit URL)
DATABASE_URL="$(fnox get DATABASE_URL_UNPOOLED)" pnpm db:migrate
```

## Vercel Blob

1. Create a Blob store in the Vercel project (or reuse per-environment stores).
2. Put `BLOB_READ_WRITE_TOKEN` in the matching 1Password vault.
3. Sync with `vercel:sync` for each env scope that needs storage.
4. Prefer **private** blobs; serve through authenticated app routes (signed URL
   or stream), not public world-readable URLs for client data.
5. Health checks should report whether the blob token is present (boolean), not
   the token value.

## Clerk: production vs staging / preview

Full rules: `best-practices/GDE-002-clerk.md`. On Vercel specifically:

| | Preview + local | Production |
| --- | --- | --- |
| Clerk instance | **Development** (`*.clerk.accounts.dev`) | **Production** instance on the client custom domain |
| Keys | `pk_test_…` / `sk_test_…` in Development + Preview scopes | `pk_live_…` / `sk_live_…` in Production scope **only** |
| Social OAuth | Clerk shared dev credentials | Your Google/Microsoft apps (see `best-practices/GDE-002-clerk.md`) |
| Domains | Add needed `*.vercel.app` / localhost in the **dev** Clerk instance | Custom domain + Clerk CNAMEs (DNS-only / grey cloud on Cloudflare) |
| `authorizedParties` | Usually omit (preview URLs vary) or list a stable branch alias | Lock to `https://<prod-host>` |
| Webhooks | Optional; point at a stable preview URL or disable | Prod URL + `CLERK_WEBHOOK_SECRET` in Production scope |
| Middleware | Public: sign-in/up, health, cron, webhooks | Same; never put `DEV_AUTH_BYPASS` in Production |

**Never** put `pk_test_` / `sk_test_` in Vercel Production. The #1 prod outage
pattern is shipping the dev instance to the live domain.

Sanity-check a publishable key:

```bash
echo "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY#pk_live_}" | base64 -d
# → clerk.<client>.thefocus.ai for live; *.clerk.accounts.dev means DEV
```

Practical sync model:

1. Preview vault holds **dev** Clerk keys + staging Neon + preview Blob token.
2. Prod vault holds **live** Clerk keys + prod Neon + prod Blob token.
3. `FNOX_PROFILE=preview mise run vercel:sync -- --env preview`
4. `FNOX_PROFILE=prod mise run vercel:sync` (production)

If the project still uses one vault (habitats today), keep Clerk live keys only
on items that you sync to Production, and never run a blind sync of test keys
into `--env production`.

## Daily operations

```bash
# 1. Rotate or edit in 1Password
op item edit DATABASE_URL --vault "<Project - Prod>" password='…'

# 2. Push to the right Vercel scope
mise run vercel:sync
# or: FNOX_PROFILE=preview mise run vercel:sync -- --env preview

# 3. Ship
git push origin main          # preferred: Git → Production
# or: mise run vercel:deploy

# 4. Verify
vercel env ls
curl -sS "https://<host>/api/health"
```

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
- [ ] Clerk: separate prod instance; test keys only in Preview/Development
- [ ] `.env.example` matches fnox keys; health endpoint exists
- [ ] `mise run vercel:sync` + smoke deploy; `vercel env ls` reviewed
- [ ] Custom domain + Clerk DNS per `best-practices/GDE-002-clerk.md` when going live
