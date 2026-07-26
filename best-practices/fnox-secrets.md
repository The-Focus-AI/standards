---
title: "Project secrets with fnox and 1Password"
kind: guide
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-07-26"
---

> Moved from `reports/`: this is a walkthrough, not a point-in-time research
> note. The binding rules it satisfies are `STD-007`.

# Project Secrets with fnox + 1Password

A reference for setting up isolated, auditable secret management on any project.
Goals:

1. **Full isolation** — each project's secrets live in their own 1Password vault, accessed by a service account that can only see that vault.
2. **1Password is the source of truth** — secrets are never committed, never written to disk in plaintext, and never live in a personal shell profile.
3. **Control where every key comes from** — `fnox.toml` declaratively maps each `ENV_VAR` to a specific provider/vault/item.
4. **Usage visibility** — every secret has metadata pointing to its billing/usage dashboard, plus optional scripts to programmatically check balances.

---

## Concepts

- **fnox** — a CLI that resolves env vars at runtime from one or more *providers* (1Password, age, keychain, AWS, etc.). It does not store secrets itself; it's a router.
- **Service account (1Password)** — a non-human identity scoped to specific vaults. Authenticates with a long-lived `OP_SERVICE_ACCOUNT_TOKEN`. Cannot access Personal/Private vaults.
- **Profile (fnox)** — named environment (e.g. `default`, `prod`, `staging`) that selects different secrets or providers. `FNOX_PROFILE=prod fnox exec -- ./run.sh`.
- **Provider (fnox)** — a backend declared in `fnox.toml`. You can have multiple per project (e.g. `op-dev`, `op-prod`, `keychain-local`).

---

## One-time per-project setup

### 1. Install tools (via mise)

`mise.toml` at the project root:

```toml
[tools]
fnox = "latest"
# op (1Password CLI) is installed globally via Homebrew so it can integrate
# with the 1Password desktop app for Touch ID. Onboarding:
#   brew install --cask 1password-cli
#
# We do NOT manage op via mise — the aqua:1password/cli backend has broken
# release URLs and op needs the desktop app integration to be useful anyway.

[env]
# Loads OP_SERVICE_ACCOUNT_TOKEN from .fnox/env (dotenv format) only when
# the shell is inside this project directory. File is gitignored; the token
# itself is backed up to 1Password (see step 3).
_.file = ".fnox/env"
```

Then `mise install`.

> **Important — shell activation.** mise's per-directory env (`_.file = ".fnox/env"`)
> only fires when `mise activate` is loaded in your **interactive** shell rc.
> Make sure `~/.zshrc` (NOT just `~/.zprofile`) has:
>
> ```bash
> eval "$(mise activate zsh)"
> # fnox: auto-injects every declared secret on `cd` into a fnox.toml dir,
> # unsets them on leave (chpwd hook). Replaces `fnox exec --` wrapping.
> command -v fnox >/dev/null 2>&1 && eval "$(fnox activate zsh)"
> ```
>
> Without `mise activate`, new terminal tabs won't have `OP_SERVICE_ACCOUNT_TOKEN`
> in env, and the `op` CLI will fall back to the desktop app's Touch ID prompt
> for every command. Without `fnox activate`, you'll have to wrap every command
> in `fnox exec --` to see secrets. Check with:
>
> ```bash
> echo "${OP_SERVICE_ACCOUNT_TOKEN:0:8}..."   # should be ops_...
> echo "${DATABASE_URL:0:20}..."              # should be your DB URL
> ```
>
> in a fresh tab inside the project directory.

> **Why `fnox activate` is the smart default.** It registers a `chpwd` hook
> that walks up looking for `fnox.toml`; when it finds one, every declared
> secret is exported into your shell. When you leave that directory tree, the
> vars are unset. This means:
>
> - `pnpm dev`, `pnpm build`, `tsx scripts/foo.ts` all "just work" without a
>   `fnox exec --` prefix — the secrets are already in env.
> - Each project gets its own scoped secret env, no cross-contamination.
> - One round-trip to 1Password per `cd`, not per command.
>
> `fnox exec --` is still the right tool for **non-interactive** contexts
> (CI, Docker `ENTRYPOINT`, `cron`) where there's no shell to hook into.

### 2. Create the dedicated vault

```bash
op vault create "<Project Name>" --icon vault-door \
  --description "Secrets for <project>; managed by fnox"
```

### 3. Create a scoped service account

```bash
op service-account create "<project>-sa" \
  --vault "<Project Name>:read_items,write_items"
```

The token (`ops_...`) is shown **once**. Save it two places:

- `./.fnox/env` (gitignored, dotenv format so mise auto-loads it)
- A 1Password item in a **different** vault (e.g. a shared team vault like
  `thefocus`) so teammates can fetch it. Don't put the SA token into the
  vault it has access to — that creates a circular bootstrap problem.

```bash
mkdir -p .fnox && chmod 700 .fnox
printf 'OP_SERVICE_ACCOUNT_TOKEN=%s\n' "ops_..." > .fnox/env
chmod 600 .fnox/env

op item create --category="API Credential" --vault="thefocus" \
  --title="<project> service account token" \
  "credential[concealed]=ops_..." \
  "service-account-uuid[text]=<UUID-from-create-output>" \
  "vault[text]=<Project Name>"
```

> Why `.fnox/env` and not `.fnox/token`? mise's `_.file` directive expects a
> dotenv-format file (`KEY=value` lines), not a raw value. Using `.fnox/env`
> lets you add other project-bootstrap env vars later without changing config.

### 4. `.gitignore`

```
.fnox/
*.env
*.env.local
```

### 5. Initialize fnox

```bash
fnox provider add op 1password
# edit fnox.toml: set vault = "<Project Name>"
```

> **fnox.toml schema is strict.** The only fields recognized on a `[secrets.X]`
> entry are: `description`, `if_missing`, `default`, `provider`, `value`, `env`,
> `as_file`, `json_path`, `line`, `sync`. **Custom keys like `dashboard` or
> `usage_api` are rejected.** To track dashboard URLs, embed them in the
> `description` field (and parse them out with a script if you need a list).

Final `fnox.toml`:

```toml
# Source of truth: 1Password vault "<Project Name>"
# Each [secrets.X] block maps env var X to a 1P item in that vault.
# Convention: 1P item title = env var name (= the `value` field below).

[providers.op]
type  = "1password"
vault = "<Project Name>"

# ---- Application secrets (values live in 1P) ----

[secrets.DATABASE_URL]
provider    = "op"
value       = "DATABASE_URL"     # 1P item name to look up
description = "Neon Postgres — https://console.neon.tech"

[secrets.ANTHROPIC_API_KEY]
provider    = "op"
value       = "ANTHROPIC_API_KEY"
description = "Anthropic — https://console.anthropic.com/settings/billing"

[secrets.CLERK_SECRET_KEY]
provider    = "op"
value       = "CLERK_SECRET_KEY"
description = "Clerk backend — https://dashboard.clerk.com"

# ---- Static defaults (no need to be in 1P) ----

[secrets.NEXT_PUBLIC_CLERK_SIGN_IN_URL]
default     = "/sign-in"
description = "Clerk sign-in route"

# ---- Declared but not yet provisioned ----
# Mark with if_missing="ignore" so `fnox check` stays green until a value lands.

[secrets.OPTIONAL_FUTURE_KEY]
provider    = "op"
value       = "OPTIONAL_FUTURE_KEY"
if_missing  = "ignore"
description = "Will be required when feature X ships"

# ---- Profiles for environment-specific overrides ----

[profiles.prod.providers.op]
type  = "1password"
vault = "<Project Name> - Prod"
```

### 6. Import existing `.env` (one-time migration)

> ⚠️ **`fnox import` does NOT work with the 1Password provider.** It only
> supports providers that "encrypt or remote-store" content; 1P expects items
> to already exist. You must push items into 1P yourself with `op item create`,
> then declare each one in `fnox.toml`.

Use this loop to push every line of `web/.env` into 1P as a password item:

```bash
while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  key="$(echo "$key" | xargs)"
  [[ -z "$key" ]] && continue
  echo "→ $key"
  op item create --vault "<Project Name>" --category=password \
    --title="$key" "password=$value" >/dev/null \
    && echo "  created" || echo "  FAILED"
done < web/.env
```

Then verify and delete the plaintext file:

```bash
fnox list                            # all declared secrets visible
fnox check                           # all resolve cleanly (or ignore the marked ones)
fnox exec -- printenv DATABASE_URL  # round-trip works
rm web/.env                          # plaintext file gone
```

### 7. Wire up `package.json` and mise tasks

With `fnox activate` loaded in `~/.zshrc` (step 1), `package.json` scripts are
plain commands — secrets are already in your shell env when you `cd` into the
project. No `fnox exec --` wrapper needed:

```json
{
  "scripts": {
    "dev":   "pnpm --filter web dev",
    "build": "pnpm --filter web build",
    "start": "pnpm --filter web start"
  }
}
```

> **If you're not using `fnox activate`** (e.g. running scripts from a
> non-interactive context, or you skipped the zshrc step), wrap each script
> in `fnox exec --` instead — `"dev": "fnox exec -- pnpm --filter web dev"`.
> Both styles work; activation just removes the boilerplate.

> **Gotcha — `pnpm --filter web tsx ...` does NOT work.** That tries to run
> `tsx` as a *package script*. Use `pnpm --filter web exec tsx ...` to run
> `tsx` as a binary from `node_modules/.bin`.

`mise.toml` `[tasks]` section gives you onboarding + ops commands:

```toml
[tasks.setup]
description = "First-time onboarding: pulls SA token from 1Password into .fnox/env"
run = '''
set -euo pipefail
mkdir -p .fnox && chmod 700 .fnox
if [ -f .fnox/env ]; then
  echo "✓ .fnox/env already exists — skipping"
  exit 0
fi
TOKEN="$(op read 'op://thefocus/<project> service account token/credential')"
printf 'OP_SERVICE_ACCOUNT_TOKEN=%s\n' "$TOKEN" > .fnox/env
chmod 600 .fnox/env
echo "✓ .fnox/env written. Open a new shell tab, then 'pnpm dev'."
'''

[tasks."secrets:check"]
description = "Verify every declared secret resolves cleanly"
run = "fnox check"

[tasks."secrets:list"]
description = "List all declared secrets and where they resolve from"
run = "fnox list"

[tasks."secrets:rotate-token"]
description = "Re-pull SA token from 1Password (overwrites .fnox/env)"
run = '''
set -euo pipefail
TOKEN="$(op read 'op://thefocus/<project> service account token/credential')"
printf 'OP_SERVICE_ACCOUNT_TOKEN=%s\n' "$TOKEN" > .fnox/env
chmod 600 .fnox/env
echo "✓ .fnox/env refreshed."
'''
```

Now `pnpm dev` boots with secrets pulled from 1Password at process start, and
`mise run setup` is the one-command onboarding for new teammates.

---

## Daily operations

| Task | Command |
| --- | --- |
| Run app with secrets injected | `pnpm dev` (auto-injected via `fnox activate` in `~/.zshrc`); or `fnox exec -- <cmd>` if activation isn't loaded |
| List all configured secrets | `mise run secrets:list` |
| Verify everything resolves | `mise run secrets:check` |
| Add a new secret | `op item create --vault "<Project>" --category=password --title=<KEY> "password=<value>"` then add `[secrets.<KEY>]` block to `fnox.toml` |
| Rotate a secret | `op item edit <KEY> --vault "<Project>" password='<new>'` |
| Read one secret | `fnox get DATABASE_URL` |
| Remove a secret | `fnox rm OLD_KEY` |
| Diagnose problems | `fnox doctor` |
| Scan repo for accidentally-committed secrets | `fnox scan` |
| Switch environments | `FNOX_PROFILE=prod fnox exec -- ...` |
| Refresh local SA token from 1P backup | `mise run secrets:rotate-token` |
| Sync 1P → Vercel | `mise run vercel:sync` |
| Deploy after a secret rotation | `mise run vercel:sync && mise run vercel:deploy` |

> **Avoid `fnox set` for the 1Password provider.** It writes the *value* into
> `fnox.toml` as a reference, then tries to look it up as an item name in 1P
> and fails. Use `op item create` / `op item edit` directly; declare the
> mapping in `fnox.toml` once.

---

## Multi-environment (dev / staging / prod)

Two patterns — pick one:

**A. One vault, profiles select different items.** Items named `DATABASE_URL_prod`, etc. Profile maps them to the same env var.

**B. One vault per environment** (recommended for stricter isolation). Separate service accounts:

```
"<Project> - Dev"   → dev-sa   token →  $OP_SERVICE_ACCOUNT_TOKEN_DEV
"<Project> - Prod"  → prod-sa  token →  $OP_SERVICE_ACCOUNT_TOKEN_PROD
```

In `fnox.toml`:

```toml
[profiles.dev.providers.op]
type  = "1password"
vault = "<Project> - Dev"

[profiles.prod.providers.op]
type  = "1password"
vault = "<Project> - Prod"
```

CI/Vercel sets only the `_PROD` token; local devs have only the `_DEV` token. Compromised dev creds cannot read prod values.

---

## Deployment

There are two patterns; pick based on platform constraints:

| Pattern | When to use | How it works |
| --- | --- | --- |
| **A. Sync** (recommended for Vercel/Next.js) | Platform has native env vars and you can run `fnox` locally to push them | `mise run <platform>:sync` resolves fnox → platform env vars; deploys read natively |
| **B. Bootstrap token** (recommended for GCP Cloud Run, Fly.io, K8s) | Platform can run a wrapper command at container start | One bootstrap secret (`OP_SERVICE_ACCOUNT_TOKEN`) in the platform; container ENTRYPOINT runs `fnox exec -- <app>` |

**1Password is always the source of truth.** Sync makes the platform a derived
cache; bootstrap-token keeps fnox in the loop at runtime.

### Vercel

> **Pick the sync pattern, not the runtime-fetch pattern.** Next.js
> serverless functions boot directly into Node and read `process.env.X`
> immediately — they can't run `fnox exec --` first. So we resolve secrets
> once locally via fnox and push them to Vercel's native env-var store; Vercel
> handles runtime injection. **1Password stays the source of truth, Vercel
> is a derived cache.** This avoids brittle "install fnox in the build" hacks.

**1. Project settings (one-time, in dashboard)**

- **Settings → General → Root Directory** → `web` (the Next.js app folder).
  Check "Include source files outside of the Root Directory in the Build Step"
  so `pnpm-workspace.yaml` and sibling packages are accessible.
- **Settings → General → Framework Preset** should auto-detect "Next.js"
  once Root Directory is set.

**2. `<app>/vercel.json`** — minimal, only declares framework so Vercel
finds the right output directory:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs"
}
```

No build/install command overrides needed — Vercel handles pnpm monorepos
natively when Root Directory is set.

**3. Add a `vercel:sync` mise task** that pushes fnox-resolved secrets to
Vercel using `vercel env add --value` (NOT stdin — see gotcha below):

```toml
[tasks."vercel:sync"]
description = "Push every fnox-resolved secret to Vercel."
usage = '''
flag "-e --env <env>" help="production | preview | development" default="production"
'''
run = '''
set -euo pipefail
ENV="${usage_env:-production}"
echo "→ Syncing secrets to Vercel env: $ENV"

SECRETS_JSON=$(fnox export -f json --if-missing ignore 2>/dev/null)
KEYS=$(echo "$SECRETS_JSON" | jq -r '.secrets | keys[]')

for KEY in $KEYS; do
  VALUE=$(echo "$SECRETS_JSON" | jq -r --arg k "$KEY" '.secrets[$k]')
  printf "  %-36s " "$KEY"
  if [ -z "$VALUE" ] || [ "$VALUE" = "null" ]; then
    echo "skipped (empty)"
    continue
  fi
  vercel env rm "$KEY" "$ENV" --yes >/dev/null 2>&1 || true
  if vercel env add "$KEY" "$ENV" --value "$VALUE" --yes >/dev/null 2>&1; then
    echo "✓"
  else
    echo "✗ FAILED"
  fi
done
'''

[tasks."vercel:deploy"]
description = "Deploy to Vercel production"
run = "vercel deploy --prod"

[tasks."vercel:preview"]
run = "vercel deploy"
```

**4. Daily flow:**

```bash
# Edit a secret in 1Password (UI or `op item edit`)
op item edit DATABASE_URL --vault "<Project>" password='postgres://...'

mise run vercel:sync          # push 1P → Vercel "production" env
mise run vercel:deploy         # ship it
```

**5. Preview deploys (PRs):**

```bash
mise run vercel:sync -- --env preview
mise run vercel:preview
```

For stronger isolation, point preview at a **separate vault** (`<Project> - Preview`)
with its own service account. Use `FNOX_PROFILE=preview` locally so `vercel:sync`
reads from that vault.

#### Gotchas we hit

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Error: No Next.js version detected` | Vercel scanning root `package.json` (no `next` there) | Set **Root Directory = `web`** in dashboard |
| `Database connection string is not valid URL` | `vercel env add` from stdin silently stored empty strings | Use `--value <VALUE> --yes` flags, not stdin |
| `vercel env pull` shows `KEY=""` for production secrets | Production env vars default to **sensitive** (write-only) | Not a bug — secrets are stored fine, just unreadable on pull |
| `No Output Directory named "public"` | Framework Preset stuck on "Other" | Add `web/vercel.json` with `"framework": "nextjs"` |
| `fnox export` values come out single-quoted (`'value'`) | env-format output quotes values | Use `fnox export -f json` and parse with `jq` |

#### What does NOT work on Vercel

- ❌ `curl https://fnox.jdx.dev/install.sh | sh` — there's no install script.
- ❌ `fnox exec -- pnpm build` as the buildCommand — fnox isn't installed,
  and even if it were, runtime functions still wouldn't have the secrets.
- ❌ Storing only `OP_SERVICE_ACCOUNT_TOKEN` in Vercel and expecting fnox to
  resolve at runtime — would add a 1P round-trip to every cold start.

Sync once, deploy. If 1P goes down later, your already-deployed Vercel
functions keep running.

---

### GCP (Cloud Run, GKE, Compute Engine)

Two viable patterns — pick based on whether you want fnox in the runtime image or want GCP to handle secret delivery natively.

#### Pattern A — fnox at container start (most portable)

The container has `fnox` installed; entrypoint is `fnox exec -- <your app>`. The bootstrap token comes from **Google Secret Manager**.

**Dockerfile:**

```dockerfile
FROM node:22-slim
RUN apt-get update && apt-get install -y curl ca-certificates && \
    curl -fsSL https://fnox.jdx.dev/install.sh | sh && \
    mv /root/.local/bin/fnox /usr/local/bin/fnox

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build

ENTRYPOINT ["fnox", "exec", "--"]
CMD ["pnpm", "start"]
```

**Store the bootstrap token in Secret Manager:**

```bash
echo -n "ops_..." | gcloud secrets create op-service-account-token \
  --data-file=- --replication-policy=automatic
```

**Cloud Run deploy:**

```bash
gcloud run deploy my-app \
  --image=gcr.io/PROJECT/my-app \
  --set-secrets=OP_SERVICE_ACCOUNT_TOKEN=op-service-account-token:latest
```

Cloud Run injects `OP_SERVICE_ACCOUNT_TOKEN` into the container env. Entrypoint runs `fnox exec --`, which calls 1Password and re-execs your app with all the project secrets resolved. The container itself never persists those secrets.

**GKE equivalent:** mount the GSM secret via [Secret Manager CSI driver](https://secrets-store-csi-driver.sigs.k8s.io/) or sync to a K8s `Secret` via External Secrets Operator, then reference as an env var in the pod spec.

**Compute Engine:** use [the metadata server + Secret Manager](https://cloud.google.com/secret-manager/docs/access-control#vm) at boot via a startup script, write to `/etc/fnox/token`, run app via systemd unit with `EnvironmentFile`.

#### Pattern B — sync 1Password → GCP Secret Manager (no fnox in prod)

If you'd rather keep production lean and not depend on outbound network calls to 1Password.com from Cloud Run cold starts, use fnox **only locally and in CI**, and have CI sync the resolved values into GSM:

```bash
# In CI, after fnox exec is verified working:
fnox export -f env | while IFS='=' read -r key value; do
  printf '%s' "$value" | gcloud secrets versions add "$key" --data-file=- 2>/dev/null \
    || printf '%s' "$value" | gcloud secrets create "$key" --data-file=- --replication-policy=automatic
done
```

Then `gcloud run deploy --set-secrets=DATABASE_URL=DATABASE_URL:latest,ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,...`

Trade-off: production reads from GSM (faster, no external dependency, IAM-controlled), but you've now got two systems to keep in sync. The CI sync step is the bridge — only 1Password is ever a source of truth, GSM is a derived cache.

#### Pattern A vs Pattern B

| | Pattern A (fnox in runtime) | Pattern B (sync to GSM) |
| --- | --- | --- |
| Source of truth | 1Password | 1Password (GSM is a mirror) |
| Cold-start latency | +50-200ms (1P API call) | None |
| External dependency | 1Password.com must be up | Just GCP |
| Rotation | Update 1P, restart app | Update 1P, run sync script, restart app |
| Audit trail | 1P access logs | 1P + GSM access logs |
| Simplest mental model | ✅ | |
| Best for high-scale, multi-region | | ✅ |

For most projects start with **A**, switch to **B** if cold starts become measurable.

---

### Staging vs production isolation

Treat **each environment as its own blast-radius boundary**: separate vault, separate service account, separate token. fnox profiles are the local switch; the platform's environment is the deploy-time switch.

#### Recommended layout

```
1Password
├── "Trinity Hunt Pilot - Dev"      ← devs' machines + Vercel "Development"
│   ├── DATABASE_URL                  (points at dev Neon branch)
│   ├── ANTHROPIC_API_KEY             (low-quota key)
│   └── th-pilot-dev-sa               ← service account, scoped here only
│
├── "Trinity Hunt Pilot - Staging"  ← Vercel "Preview" / GCP staging project
│   ├── DATABASE_URL                  (staging Neon branch)
│   ├── ANTHROPIC_API_KEY             (separate key, separate quota)
│   └── th-pilot-staging-sa
│
└── "Trinity Hunt Pilot - Prod"     ← Vercel "Production" / GCP prod project
    ├── DATABASE_URL                  (prod Neon)
    ├── ANTHROPIC_API_KEY             (real key, monitored)
    └── th-pilot-prod-sa
```

Each service account can only see its own vault. A leaked staging token cannot read prod values, period.

#### `fnox.toml` — one config, three profiles

```toml
# Default = dev. Local `pnpm dev` always hits dev secrets unless overridden.
[providers.op]
type  = "1password"
vault = "Trinity Hunt Pilot - Dev"

[secrets]
DATABASE_URL                       = { provider = "op" }
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  = { provider = "op" }
CLERK_SECRET_KEY                   = { provider = "op" }
BLOB_READ_WRITE_TOKEN              = { provider = "op" }
INNGEST_EVENT_KEY                  = { provider = "op" }
INNGEST_SIGNING_KEY                = { provider = "op" }
ANTHROPIC_API_KEY                  = { provider = "op" }

[profiles.staging.providers.op]
type  = "1password"
vault = "Trinity Hunt Pilot - Staging"

[profiles.prod.providers.op]
type  = "1password"
vault = "Trinity Hunt Pilot - Prod"
```

The `[secrets]` table is shared — same set of env vars for every environment. Only the *vault* changes per profile, so you can't accidentally have prod missing a key that staging has.

#### Switching profiles

| Where | How profile is selected |
| --- | --- |
| Local dev | default (no env var) → dev vault |
| Local "what would prod look like?" | `FNOX_PROFILE=prod fnox exec -- pnpm build` (with prod token in `.fnox/token-prod`) |
| Vercel Production | env var `FNOX_PROFILE=prod` + `OP_SERVICE_ACCOUNT_TOKEN=ops_prod_...` |
| Vercel Preview | env var `FNOX_PROFILE=staging` + `OP_SERVICE_ACCOUNT_TOKEN=ops_staging_...` |
| Vercel Development | (default) `OP_SERVICE_ACCOUNT_TOKEN=ops_dev_...` |
| GCP staging Cloud Run | env var `FNOX_PROFILE=staging` + GSM-injected staging token |
| GCP prod Cloud Run | env var `FNOX_PROFILE=prod` + GSM-injected prod token |
| GitHub Actions on PR | `FNOX_PROFILE=staging` + repository secret `OP_SA_TOKEN_STAGING` |
| GitHub Actions on `main` | `FNOX_PROFILE=prod` + repository secret `OP_SA_TOKEN_PROD` |

The pair `(FNOX_PROFILE, OP_SERVICE_ACCOUNT_TOKEN)` is the entire environment selector.

#### Vercel specifics

Vercel's three environments (Development / Preview / Production) each have their own env var scope. Set in dashboard:

```
Production:   OP_SERVICE_ACCOUNT_TOKEN = ops_prod_...     FNOX_PROFILE = prod
Preview:      OP_SERVICE_ACCOUNT_TOKEN = ops_staging_...  FNOX_PROFILE = staging
Development:  OP_SERVICE_ACCOUNT_TOKEN = ops_dev_...      (no FNOX_PROFILE → default)
```

A pushed commit to `main` builds with prod creds, a PR builds with staging creds, `vercel dev` locally pulls dev creds. Three vaults, three blast radii, one config file.

#### GCP specifics

Two common shapes:

- **Single GCP project, environment by Cloud Run service** — `my-app-staging` and `my-app-prod` both run the same image; each has its own GSM secret holding its own SA token, each has `FNOX_PROFILE` set in `--set-env-vars`.
- **Separate GCP projects per environment** (preferred for hard isolation) — `acme-staging` and `acme-prod` projects each have their own GSM, IAM, billing. The Docker image is identical; only platform env differs.

```bash
# Staging
gcloud run deploy my-app --project=acme-staging \
  --image=gcr.io/acme-shared/my-app:$SHA \
  --set-env-vars=FNOX_PROFILE=staging \
  --set-secrets=OP_SERVICE_ACCOUNT_TOKEN=op-sa-token:latest

# Prod
gcloud run deploy my-app --project=acme-prod \
  --image=gcr.io/acme-shared/my-app:$SHA \
  --set-env-vars=FNOX_PROFILE=prod \
  --set-secrets=OP_SERVICE_ACCOUNT_TOKEN=op-sa-token:latest
```

Same image promoted from staging → prod. Only the host project's GSM token + `FNOX_PROFILE` differ.

#### Promoting between environments

The flow you want:

1. Dev tweaks `ANTHROPIC_API_KEY` in 1P **dev** vault → `pnpm dev` picks it up.
2. Code merged to `main` → CI runs against **staging** profile → smoke tests pass.
3. Tag a release → CI redeploys with **prod** profile.
4. If a staging-only secret needs promoting: `op item get ... --vault "Trinity Hunt Pilot - Staging"` → `op item create ... --vault "Trinity Hunt Pilot - Prod"`. Or write a tiny `scripts/promote-secret.sh` that does this for one secret at a time. Never bulk-copy a vault — that defeats the isolation.

#### Comparing what changed between environments

```bash
diff \
  <(FNOX_PROFILE=staging fnox export -f env | sort) \
  <(FNOX_PROFILE=prod    fnox export -f env | sort)
```

Quickly answers "is staging missing a secret that prod has?" or "did someone forget to update prod's `INNGEST_SIGNING_KEY`?" Run this in CI before deploy as a sanity check (compare keys, not values).

#### `fnox check` per profile in CI

```yaml
# .github/workflows/deploy.yml
- name: Verify staging secrets resolve
  env: { OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SA_TOKEN_STAGING }} }
  run:  FNOX_PROFILE=staging fnox check

- name: Verify prod secrets resolve
  env: { OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SA_TOKEN_PROD }} }
  run:  FNOX_PROFILE=prod fnox check
```

Fails the build if either vault is missing a declared secret — catches drift before runtime.

---

### Other platforms (one-line mapping)

- **Fly.io** — `fly secrets set OP_SERVICE_ACCOUNT_TOKEN=ops_...`, run `fnox exec --` as `CMD` in Dockerfile.
- **Railway / Render** — set `OP_SERVICE_ACCOUNT_TOKEN` in dashboard, prefix start command with `fnox exec --`.
- **AWS (ECS/Lambda)** — store token in AWS Secrets Manager, inject as env, container entrypoint = `fnox exec --`. For Lambda, bake at build time (same as Vercel functions).
- **Kubernetes (any)** — bootstrap token via External Secrets Operator from your secret backend; `command: ["fnox", "exec", "--", ...]` in the pod spec.

---

## Onboarding a teammate

1. They install the prerequisites:

   ```bash
   brew install --cask 1password-cli   # op (with desktop app integration)
   curl https://mise.run | sh           # mise
   ```

2. Make sure mise + fnox activate in their interactive shell — append to `~/.zshrc`:

   ```bash
   eval "$(mise activate zsh)"
   command -v fnox >/dev/null 2>&1 && eval "$(fnox activate zsh)"
   ```

   The fnox line installs a `chpwd` hook so secrets are auto-loaded into the
   shell when entering any directory containing `fnox.toml`, and unset on exit.
3. Grant them access in 1Password to the **token backup vault** (e.g. `thefocus`)
   so they can read `op://thefocus/<project> service account token/credential`.
4. They run:

   ```bash
   git clone <repo>
   cd <repo>
   mise install         # pulls fnox
   mise run setup       # reads token from 1P → writes .fnox/env (one-shot)
   pnpm dev             # secrets injected from 1P at process start
   ```

No more "ping me on Slack for the dev DB URL". The `mise run setup` task is
idempotent — re-run it any time you need to refresh the token (e.g. after
rotation).

---

## Tracking key usage (Anthropic, OpenAI, etc.)

fnox is a **vault, not a proxy** — it doesn't see API calls and can't directly tell you usage. But you can build lightweight visibility two ways:

### A. Static dashboard map (lowest effort)

> ⚠️ fnox.toml rejects custom keys, so encode the dashboard URL directly in
> the `description` field, then parse it out of `fnox list`.

```toml
[secrets.ANTHROPIC_API_KEY]
provider    = "op"
value       = "ANTHROPIC_API_KEY"
description = "Anthropic — https://console.anthropic.com/settings/billing"
```

A mise task that prints the descriptions (URLs included):

```toml
[tasks."secrets:dashboards"]
description = "Show the billing/usage dashboard for each secret"
run = '''
fnox list 2>/dev/null | awk 'NR>1 {
  key=$1
  $1=$2=$3=""
  desc=$0
  sub(/^[[:space:]]+/, "", desc)
  printf "%-36s %s\n", key, desc
}'
'''
```

Output:

```
ANTHROPIC_API_KEY    Anthropic — https://console.anthropic.com/settings/billing
DATABASE_URL         Neon Postgres — https://console.neon.tech
CLERK_SECRET_KEY     Clerk backend — https://dashboard.clerk.com
```

`mise run secrets:dashboards` → instant link list.

### B. Programmatic balance/usage checks

Each provider exposes its own usage API. Wrap them in `scripts/check-balances.ts` (or .sh) and run via fnox so the right keys are present:

#### Anthropic

Requires a separate **Admin API key** (`ANTHROPIC_ADMIN_KEY`, prefix `sk-ant-admin-...`), stored in fnox alongside the regular key:

```bash
fnox exec -- bash -c '
  curl -sS https://api.anthropic.com/v1/organizations/cost_report \
    -H "x-api-key: $ANTHROPIC_ADMIN_KEY" \
    -H "anthropic-version: 2023-06-01" \
    --data-urlencode "starting_at=$(date -u -v-7d +%Y-%m-%dT00:00:00Z)" \
    | jq ".data | map(.amount) | add"
'
```

Endpoints:

- `GET /v1/organizations/usage_report/messages` — token counts per model
- `GET /v1/organizations/cost_report` — dollar amounts

#### OpenAI

Requires an Admin key (`sk-admin-...`):

```bash
curl https://api.openai.com/v1/organization/costs \
  -H "Authorization: Bearer $OPENAI_ADMIN_KEY"
```

#### Pattern: a single `pnpm balances` command

```ts
// scripts/balances.ts
import { execSync } from "node:child_process";

const checks = [
  { name: "Anthropic", key: "ANTHROPIC_ADMIN_KEY", fn: anthropicCost },
  { name: "OpenAI",    key: "OPENAI_ADMIN_KEY",    fn: openaiCost    },
  { name: "Neon",      key: "NEON_API_KEY",        fn: neonUsage     },
];

for (const c of checks) {
  if (!process.env[c.key]) { console.log(`${c.name}: skipped (no admin key)`); continue; }
  console.log(`${c.name}: ${await c.fn()}`);
}
```

Run with `fnox exec -- tsx scripts/balances.ts`. Output:

```
Anthropic: $14.32 (last 7d)
OpenAI:    $2.10  (last 7d)
Neon:      0.42 GB compute / 100 GB plan
```

Schedule it in CI nightly, post to Slack, and you've got proactive cost alerts without any third-party SaaS.

### C. Optional: meter at the proxy layer

If you need per-request attribution (which agent / which user burned which tokens), put a proxy like [LiteLLM](https://github.com/BerriAI/litellm), Helicone, or your own logging middleware in front of provider APIs. fnox supplies the upstream key; the proxy emits structured usage events. Out of scope for most projects but worth knowing about.

---

## Security checklist

- [ ] Service account scoped to **one** vault (verify by `OP_SERVICE_ACCOUNT_TOKEN=ops_... op vault list` — should show ONLY the project vault).
- [ ] `.fnox/`, `*.env`, `*.env.local` in `.gitignore`.
- [ ] `fnox scan` clean before every release.
- [ ] Production token only on production hosts; dev token only on dev machines.
- [ ] Rotation policy: every 90 days, run `op service-account create` again, update the token backup item in 1P, distribute via `mise run secrets:rotate-token`, revoke the old service account.
- [ ] Admin/usage keys (Anthropic admin, OpenAI admin) stored under distinct names so they aren't accidentally exported to runtime processes that don't need them.
- [ ] `mise run secrets:check` runs in CI as a pre-build step — fails fast if a secret is missing.
- [ ] After any Vercel `vercel:sync`, verify with `vercel env ls` that no extras leaked in (compare with `fnox list`).
- [ ] Service account token backup lives in a *different* vault than the one it can access (avoids a circular bootstrap if the SA loses access).

---

## TL;DR mental model

```
Developer      mise              fnox activate          1Password         App
─────────      ────              ─────────────          ─────────         ───
$ cd project → loads SA token →  chpwd hook fires    →  fetches items  →  shell env populated
                from .fnox/env    reads fnox.toml        over HTTPS

$ pnpm dev   → secrets already in env from `cd` above → Next.js boots
```

One token per machine. One vault per project. One config file describing
every secret. `fnox activate` makes the secrets a property of *being inside
the directory*, not of *running a particular command*. Everything else is
automation around those primitives.
