---
number: "005"
title: "GCP deployment"
kind: guide
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-10-30"
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
`reports/NOTE-001-2026-02-02-gcloud-cloud-run-multi-project.md`. This guide owns
GCP secret delivery; `GDE-003` owns fnox/bootstrap concepts and the sync contract.
For Vercel apps see `GDE-010`.

For the **habitats / Umwelten agent runtime** (GCE VM, Docker-out-of-Docker,
self-hosted GitHub runner, no PR previews on GCP), see `best-practices/GDE-004-gce-gaia-runtime.md` —
that CD shape does not apply to Cloud Run.

## Defaults

| Concern | Standard |
| --- | --- |
| CLI | `gcloud` pinned via mise — not Homebrew for project tooling |
| Project isolation | One **named gcloud configuration** per GCP project / client |
| Shell activation | Set `CLOUDSDK_ACTIVE_CONFIG_NAME` (and related vars) in **`mise.toml` `[env]`** |
| Deploy commands | Explicit `--project` and `--region` in mise tasks (never rely on “whatever is active”) |
| User auth | `mise run auth` → `gcloud auth login` + Application Default Credentials |
| Automation | Prefer **service account impersonation** or Workload Identity; avoid downloaded SA key JSON when org policy allows |
| App secrets | 1Password → fnox in an authorized cloud job → **Secret Manager**; Cloud Run binds secret references, not values |
| Preferred compute for new services | **Cloud Run** (source deploy or image). Use App Engine when the existing project already standardized on it (qbsync). Agent orchestration that needs a host Docker daemon → `best-practices/GDE-004-gce-gaia-runtime.md`. |

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

Pin tested `gcloud` and fnox versions through mise (the sync source contract
checked here is fnox v1.45.0; `GDE-003` records its limits). Configure the
non-secret project context separately:

```toml
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
# Create once; if it already exists, inspect it rather than suppressing errors.
gcloud config configurations create qb-to-sheets
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
Run production builds/deploys in CI (`STD-008 §3.10`); `--source .` below is
Cloud Build input, not authorization to release an unreviewed workspace.

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

Two patterns; this is their platform owner. Bootstrap, profile semantics and
runtime-key allowlists are in `GDE-003`. Both keep 1Password authoritative.

| Pattern | When | How |
| --- | --- | --- |
| **A — fnox at start** | A deliberate runtime dependency on 1Password is acceptable | GSM holds the scoped bootstrap token; a verified image runs fnox before the app |
| **B — GSM mirrors 1P** | Prefer native runtime delivery, no 1P call at cold start | Authorized job syncs allowlisted values; Cloud Run binds numeric GSM versions |

Pattern B is the default here. Pattern A does not have a measured latency claim
or a ready-to-use runtime image in this corpus; validate it for the application.
Fountain Creek's original examples use native Secret Manager bindings. qbsync's
legacy App Engine deploy-time configuration is a separate path, not evidence
that Cloud Run needs fnox in the runtime image.

#### Pattern B: sync runtime values to existing GSM secrets

1. Copy `scripts/sync-secrets.mjs` and adapt `templates/secret-sync.example.json`
   as `secret-sync.json` at the consuming repo root. Keep only relevant GCP
   targets. Pin Node/fnox through mise as described in `GDE-003`.
2. Set each target's explicit GCP `projectId` and `keys` mapping (fnox runtime
   key → secret ID). The example uses separate preview/production GCP projects
   but the same `runtime` source profile and provider keys. A single project
   with distinct secret IDs/services is also possible. Separate projects are an
   isolation choice, not a requirement to duplicate all runtime credentials.
3. Provision secret containers separately through reviewed infrastructure or
   the console, with the intended replication/residency policy. The sync tool
   adds versions only: a missing secret fails, never triggers auto-creation.
4. Grant the sync identity **Secret Manager Secret Version Adder**
   (`roles/secretmanager.secretVersionAdder`) on only those secret resources [3].
   It does not need value-read, deletion or project-admin permissions. Give
   the Cloud Run runtime identity **Secret Accessor** on its required secrets,
   not the sync role. Document both identities and the project/resource scope.
5. An authorized CI job uses Workload Identity Federation or impersonation to
   obtain a short-lived OAuth access token with the `cloud-platform` scope and
   inject it as the target's `tokenEnv` (for example `GCP_PREVIEW_ACCESS_TOKEN`).
   The separate `source.tokenEnv` holds the project-vault bootstrap token.
   The script never discovers ADC, an active gcloud project, or a personal login.
   It cannot prove a token's IAM scope offline; verify the issuing identity and
   grants when provisioning the job. Do not commit or log either token.
6. Review the dry-run plan, then explicitly apply from the authorized job.

```bash
node scripts/sync-secrets.mjs --config secret-sync.json --target gcp-preview
# After plan review and authorization:
node scripts/sync-secrets.mjs --config secret-sync.json --target gcp-preview --apply
```

Expose that command as a forwarding `gcp:sync` mise task in the consuming
project, retaining mandatory `--target` and optional `--apply`. No target is
selected by ambient gcloud configuration or `FNOX_PROFILE`.

The supported REST write [1] is
`POST https://secretmanager.googleapis.com/v1/projects/PROJECT/secrets/SECRET:addVersion`.
The script sends `payload.data` as base64 of the exact UTF-8 string in an HTTPS
JSON body [2]. Quotes, embedded JSON and trailing newlines are preserved, not
shell-decoded or trimmed. Values above 64 KiB fail before any writes. Regional
Secret Manager endpoints are outside this implementation's scope.

The CLI alternative `gcloud secrets versions add SECRET --data-file=-` supports
stdin and fails for a missing container [5]; the maintained script uses REST,
not a shell loop. Neither credential values nor payloads are command arguments.

Each successful call creates a **new version**, even for an unchanged value.
Capture the printed version resource names in the release evidence. First failure
stops later writes and exits nonzero with confirmed destinations; the current
write may have landed. There is no transaction, rollback, pruning or automatic
retry. Inspect versions/audit records before retrying, since retries can add
duplicate versions. A partial sync is not a successful release.

#### Bind and verify the versions

Use the confirmed numeric version for each environment-variable binding [4].
`latest` can leave old and new instances with different values across starts;
adding a version alone does not refresh a running app. For example, from the
approved CI deployment job, with non-secret identifiers set explicitly:

```bash
gcloud run deploy "$SERVICE" \
  --configuration "$GCLOUD_CONFIGURATION" \
  --project "$GCP_PROJECT_ID" \
  --region "$GCP_REGION" \
  --impersonate-service-account "$DEPLOY_SERVICE_ACCOUNT" \
  --service-account "$RUNTIME_SERVICE_ACCOUNT" \
  --image "$CI_IMAGE_DIGEST" \
  --update-secrets "CLERK_SECRET_KEY=app-clerk-secret-key:${CLERK_SECRET_VERSION}"
```

The flag contains secret **references**, not values. `--update-secrets` retains
unrelated bindings; `--set-secrets` replaces the binding set, so the latter is
appropriate only when the full intended set is supplied. Verify the new revision's
bindings and runtime behavior without printing secret data. Runtime bindings do
not inject build-time variables into a previously built image.

#### Pattern A: fnox at container start

The container has fnox installed through the repository's mise configuration and
an explicitly selected runtime-only profile. Build and verify that image in CI;
there is no supported `https://fnox.jdx.dev/install.sh` recipe here. Its entrypoint
shape is `fnox --profile runtime exec -- <app>`.

A person retrieves the project-scoped bootstrap token from 1Password and enters
it into the intended project's GSM secret through secure cloud secret settings
(`STD-007 §3.3`). This is a bootstrap operation, **not** a runtime allowlist entry:
the sync tool intentionally refuses `OP_SERVICE_ACCOUNT_TOKEN`.

Grant the runtime identity Secret Accessor only on that bootstrap secret and bind
its numeric version to `OP_SERVICE_ACCOUNT_TOKEN` using the same explicit
project/region/identity deploy pattern above. fnox then resolves application values
at startup. The runtime now holds a vault-reading credential and depends on
1Password/network availability; assess that wider blast radius before choosing A.
On rotation, update the token/value upstream and deploy a new revision, then verify.

For GKE, the analogous delivery is a reviewed Secret Manager CSI integration or
External Secrets Operator plus a pod secret reference. For Compute Engine, use
the VM identity with Secret Manager access; if an operational design requires a
systemd `EnvironmentFile`, protect its ownership/mode and lifecycle rather than
treating `/etc/fnox/token` as disposable. Those adapters are not tested by this
Cloud Run/GSM sync implementation.

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
| `GDE-003` | Bootstrap, fnox semantics and common sync contract; GCP procedures stay here |

## Verification and primary sources

Checked 2026-10-30: reachable Google API/CLI documentation and offline simulated
fnox/transport tests (`node --test tests/test-secret-sync.mjs`). No real credential
read, provider write, IAM change or deployment was performed. The existing
application-specific deploy wrappers above were not executed. Before adoption,
an authorized operator verifies a disposable target, identity scope, version
creation and runtime delivery; simulated tests do not establish live IAM access.

[1] Google Cloud, [Secret Manager addVersion](https://cloud.google.com/secret-manager/docs/reference/rest/v1/projects.secrets/addVersion).

[2] Google Cloud, [SecretPayload encoding and size](https://cloud.google.com/secret-manager/docs/reference/rest/v1/SecretPayload).

[3] Google Cloud, [Secret Manager IAM roles and resource scope](https://cloud.google.com/secret-manager/docs/access-control).

[4] Google Cloud, [Cloud Run secret bindings and version pinning](https://cloud.google.com/run/docs/configuring/services/secrets).

[5] Google Cloud, [gcloud secrets versions add](https://cloud.google.com/sdk/gcloud/reference/secrets/versions/add).
