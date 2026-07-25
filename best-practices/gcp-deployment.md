---
title: "GCP deployment"
kind: guide
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-07-25"
---

> Rules extracted to STD-008; this is the platform walkthrough.

# GCP deployment

Canonical pattern for deploying and operating Focus projects on Google Cloud.
Reference implementations:

| Project | Runtime | Pattern |
| --- | --- | --- |
| **foundtain-creek** (Fountain Creek) | Cloud Run (+ Scheduler, GCS, Secret Manager) | Named gcloud config + project-local ADC + `mise` deploy tasks |
| **qbsync** | App Engine (+ cron) | Isolated gcloud config `qb-to-sheets` + fnox at deploy time |

Longer research on multi-project gcloud configs:
`reports/2026-02-02-gcloud-cloud-run-multi-project.md`. Secrets on GCP:
`reports/fnox-secrets.md` § GCP. For Vercel apps see @vercel-deployment.md.

For the **habitats / Umwelten agent runtime** (GCE VM, Docker-out-of-Docker,
self-hosted GitHub runner, no PR previews on GCP), see @gce-gaia-runtime.md —
that CD shape does not apply to Cloud Run.

## Defaults

| Concern | Standard |
| --- | --- |
| CLI | `gcloud` pinned via mise (`gcloud = "latest"`) — not Homebrew for project tooling |
| Project isolation | One **named gcloud configuration** per GCP project / client |
| Shell activation | Set `CLOUDSDK_ACTIVE_CONFIG_NAME` (and related vars) in **`mise.toml` `[env]`** |
| Deploy commands | Explicit `--project` and `--region` in mise tasks (never rely on “whatever is active”) |
| User auth | `mise run auth` → `gcloud auth login` + Application Default Credentials |
| Automation | Prefer **service account impersonation** or Workload Identity; avoid downloaded SA key JSON when org policy allows |
| App secrets | 1Password → fnox locally; on Cloud Run prefer **Secret Manager** (`--set-secrets`) — see fnox-secrets Pattern A/B |
| Preferred compute for new services | **Cloud Run** (source deploy or image). Use App Engine when the existing project already standardized on it (qbsync). Agent orchestration that needs a host Docker daemon → @gce-gaia-runtime.md. |

## Mental model

gcloud config precedence (highest wins):

1. Command-line flags (`--project`, `--region`)
2. Environment variables (`CLOUDSDK_CORE_PROJECT`, `CLOUDSDK_ACTIVE_CONFIG_NAME`, …)
3. Active named configuration
4. Default configuration

Treat named configurations as profiles. The failure mode to prevent is deploying
to the wrong project. Make context automatic in the repo (mise `[env]`) and
still pass `--project` / `--region` in every deploy task.

## Project-local mise setup

### 1. Tools and env

```toml
[tools]
gcloud = "latest"
fnox = "latest"   # when the project uses 1Password secrets

[env]
CLOUDSDK_ACTIVE_CONFIG_NAME = "foundtaincreek"   # or qb-to-sheets, client-acme, …
GOOGLE_CLOUD_PROJECT = "foundtaincreek"
GOOGLE_CLOUD_REGION = "us-central1"
# Optional: project-local ADC so libraries don't depend on ~/.config/gcloud
# GOOGLE_APPLICATION_CREDENTIALS = "{{config_root}}/.adc.json"
```

Add `.adc.json` (if used) to `.gitignore`. Do **not** commit credential files.

### 2. Create and authenticate a named configuration

```bash
# One-time (also encapsulate as mise run auth — see fountain creek / qbsync)
gcloud config configurations create foundtaincreek
gcloud config configurations activate foundtaincreek
gcloud config set project foundtaincreek
gcloud config set compute/region us-central1
gcloud auth login
gcloud auth application-default login
```

qbsync pattern — isolate without touching the user’s default config:

```bash
export CLOUDSDK_ACTIVE_CONFIG_NAME=qb-to-sheets
gcloud config configurations create qb-to-sheets 2>/dev/null || true
gcloud auth login
gcloud auth application-default login
```

Fountain Creek additionally copies ADC into a **project-local** `.adc.json` and
patches `quota_project_id`, so libraries use repo-scoped credentials via mise
`GOOGLE_APPLICATION_CREDENTIALS`. Prefer that when multiple GCP projects are
open on one machine.

### 3. Required mise tasks

| Task | Purpose |
| --- | --- |
| `mise run auth` | Login + ADC (+ create named config if missing) |
| `mise run auth-status` | Show active config, project, ADC path / quota project |
| `mise run deploy` or `deploy-<service>` | Deploy with explicit `--project` / `--region` |
| `mise run watch-logs` / log helpers | Tail Cloud Run or App Engine logs for this project |

Optional but useful: `auth-revoke`, `enable-apis`, `deploy-all`, Scheduler setup
tasks (see foundtain-creek `mise.toml`).

## Cloud Run (Fountain Creek pattern)

Use for HTTP services, webhooks, workers triggered by Eventarc/Scheduler.

```bash
gcloud run deploy SERVICE \
  --source . \
  --project "$GOOGLE_CLOUD_PROJECT" \
  --region "$GOOGLE_CLOUD_REGION" \
  --set-env-vars "GCS_BUCKET=…,NON_SECRET=…" \
  --set-secrets "NOTION_API_KEY=notion-api-key:latest,…" \
  --memory 512Mi \
  --timeout 300s
  # --allow-unauthenticated   # only for public webhooks/front doors
  # --no-allow-unauthenticated  # default for internal APIs
```

Conventions:

- One mise task per service (`deploy-invoice-parse`, …); `deploy-all` depends on them.
- Non-secrets via `--set-env-vars`; secrets via **Secret Manager** + `--set-secrets`.
- Public only when required (Notion/Xero OAuth callbacks, public dashboards).
- Polling / periodic work: **Cloud Scheduler** → Cloud Run with OIDC to the
  runtime service account (see `setup-drive-watcher-scheduler` in foundtain-creek).
- Prefer `--source .` for small Node/Python services; use Artifact Registry images
  when build is heavy or multi-service.

### Secrets on Cloud Run

Two supported patterns (detail in `reports/fnox-secrets.md`):

| Pattern | When | How |
| --- | --- | --- |
| **A — fnox at start** | Want 1P as runtime source of truth | GSM holds only `OP_SERVICE_ACCOUNT_TOKEN`; entrypoint `fnox exec -- <app>` |
| **B — GSM mirrors 1P** | Lean cold starts, no 1P dependency in prod | CI/local `fnox export` → `gcloud secrets versions add`; deploy with `--set-secrets` |

Fountain Creek today uses **Pattern B-style** Secret Manager bindings on deploy
(`--set-secrets "KEY=secret-name:latest"`). qbsync injects secrets at **deploy**
time via `fnox exec -- ./deploy …` into App Engine config — keep that for App
Engine legacy; prefer GSM bindings for new Cloud Run services.

## App Engine (qbsync pattern)

Use when the project is already on App Engine (cron + Flask, etc.).

```toml
[tasks.deploy]
run = '''
set -euo pipefail
export CLOUDSDK_ACTIVE_CONFIG_NAME=qb-to-sheets
# stage any generated data the app bundle needs
fnox exec -- ./deploy steering_house app --quiet
./deploy steering_house cron --quiet
'''
```

Conventions:

- Isolated config name matching the GCP project (e.g. `qb-to-sheets`).
- `mise run deploy` is the only supported ship path; document data-staging steps
  so generated JSON is included in the App Engine bundle.
- Logs: `gcloud app logs tail --project=…` behind `mise run watch-logs`.

## Multi-project / multi-client machines

1. One named configuration per GCP project (`client-acme-prod`, `foundtaincreek`, …).
2. Each repo sets `CLOUDSDK_ACTIVE_CONFIG_NAME` in its own `mise.toml`.
3. Deploy scripts always pass `--project` / `--region`.
4. Prefer **service account impersonation** over SA key files:

```bash
gcloud run deploy my-service \
  --source . \
  --project "$GOOGLE_CLOUD_PROJECT" \
  --region "$GOOGLE_CLOUD_REGION" \
  --impersonate-service-account=deploy-sa@PROJECT.iam.gserviceaccount.com
```

5. CI: GitHub Actions + **Workload Identity Federation** (no keys). See the
   multi-project report references.

Do **not** use direnv as the primary switcher in new projects — mise `[env]` is
the org standard. The older report mentions direnv; treat that as background
research only.

## Auth troubleshooting

If `gcloud run deploy` prompts **"Reauthentication required"** on macOS, the
password is usually a **Keychain** passphrase or Google reauth — not a GCP API
key. Prefer:

1. Re-run `mise run auth` / ADC refresh.
2. Cloud Shell deploy when local Keychain is blocked.
3. CI + Workload Identity for unattended deploys.

Avoid downloading SA JSON keys when org policy
`iam.disableServiceAccountKeyCreation` is on (common). Fountain Creek’s
`docs/gcloud-auth.md` documents the Keychain case in detail — keep that
project-local; this standard prefers impersonation / WIF / Cloud Shell.

## Anti-patterns

- Deploying without verifying project (`gcloud config get-value project` or
  explicit `--project`).
- Homebrew / global gcloud as the only install — pin via mise in the project.
- Shared “default” gcloud config for every client repo.
- Long-lived service account key files in the repo or home directory when
  impersonation/WIF is available.
- Putting secret values in `--set-env-vars` instead of Secret Manager / fnox.
- Assuming ADC (`application-default login`) and `gcloud auth login` are the
  same — client libraries need ADC; the CLI uses its own credentials.
- Hardcoding another client’s project ID in a shared script without an env override.

## New GCP project checklist

- [ ] GCP project created; billing and required APIs enabled (`mise run enable-apis`)
- [ ] Named gcloud configuration; `CLOUDSDK_ACTIVE_CONFIG_NAME` in `mise.toml`
- [ ] `gcloud` (and `fnox` if needed) in `[tools]`; `mise run auth` / `auth-status`
- [ ] `.adc.json` / key files gitignored
- [ ] Deploy tasks with explicit `--project` and `--region`
- [ ] Secrets in 1Password + Secret Manager (or documented fnox-at-start pattern)
- [ ] Log/tail tasks for the chosen runtime (Cloud Run or App Engine)
- [ ] Scheduler / Eventarc wired if the design needs polling or GCS triggers
- [ ] Smoke deploy + `gcloud run services list` / App Engine versions check

## Where the source material lives

| Source | Role |
| --- | --- |
| `foundtain-creek/reports/2026-02-02-gcloud-cloud-run-multi-project.md` | Original research (copied to `reports/` here) |
| `foundtain-creek/mise.toml` + `docs/gcloud-*.md` | Cloud Run + auth tasks |
| `qbsync/mise.toml` | App Engine + isolated config + fnox deploy |
| `reports/fnox-secrets.md` | 1Password ↔ GSM / Cloud Run secret patterns |
