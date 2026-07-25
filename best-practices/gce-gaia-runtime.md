---
title: "GCE Gaia runtime"
kind: guide
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-07-25"
---

> Rules extracted to STD-008; this is the platform walkthrough.

# GCE Gaia runtime

Deployment pattern for the **habitats / Umwelten agent runtime plane**: a
long-lived **GCE VM** running Docker, Gaia (orchestrator), and sibling habitat
containers. Reference: **umwelten** (`deploy/gaia/`, `.github/workflows/deploy-gaia.yml`)
and ops notes in `umwelten/docs/guide/operating-production.md`.

This is **not** the Cloud Run / App Engine standard. For those see
@gcp-deployment.md. For the habitats SaaS control plane (previews, env sync)
see @vercel-deployment.md.

## When to use this pattern

Use GCE + Gaia when the workload needs:

- A **Docker daemon** on the host (Gaia spawns sibling containers — Docker-out-of-Docker)
- **Persistent per-habitat volumes** (tokens, local state) that must survive recreates
- **Wildcard subdomains** (`*.habitats.thefocus.ai`) terminated on the host
- Long-running agent processes, not request/response Cloud Run functions

Do **not** use this for:

- Stateless HTTP APIs → Cloud Run (@gcp-deployment.md)
- Next.js SaaS with PR previews → Vercel (@vercel-deployment.md)
- Gaia itself on Cloud Run — rejected today (needs Docker socket, volumes, sibling networking)

## Three deploy loops (do not mix them)

| Loop | What changes | Trigger | Blast radius |
| --- | --- | --- | --- |
| **1. Platform** | Gaia, base images, tool sets, `deploy/gaia/` | Push to `umwelten` `main` (path-filtered) → self-hosted runner → `redeploy.sh` | Whole fleet: rebuilds images, recreates Gaia, cycles **running** habitats (~10 min) |
| **2. One agent** | Habitat repo logic (`config.json`, tools, stimulus) | Push to the agent repo → Gaia `rebuild <id>` (`git pull` + `mise install` + `pnpm install --prod`) | That habitat only |
| **3. SaaS** | habitats.thefocus.ai UI / API | Push to `habitats` → Vercel | Control plane only; **does not** rebuild GCE agents |

PR previews exist on **loop 3 (Vercel)** only. Loops 1–2 have **no** branch/PR
preview environment on GCP today.

## Host topology

| Piece | Convention |
| --- | --- |
| Compute | GCE VM (e.g. `gaia-host`), Debian + Docker Engine + compose |
| Size | Start ≥ `e2-standard-4` / 100 GB disk when hosting multiple habitats; 4 GB swap |
| SSH | **IAP only** — no public SSH |
| Ingress | caddy-docker-proxy on `gaia-net`; Gaia not published raw on the host |
| Domains | `GAIA_HOSTNAME` + `GAIA_BASE_DOMAIN`; DNS `*.<base>`; habitat default `<id>.<base>` |
| Naming | Gaia container `gaia`; children `gaia-<id>`; volumes `gaia-<id>-data` |
| gcloud | Named config in umwelten `mise.toml` (`CLOUDSDK_ACTIVE_CONFIG_NAME = "habitats"`) |
| Secrets | Host `deploy/gaia/.env` (0600, gitignored); Gaia master vault on disk; child bindings via Gaia API — **not** Vercel Preview env |

Startup hardening: idempotent `deploy/gcp/*-startup.sh` (swap, Docker, gcplogs,
Ops Agent). Logging: Docker `gcplogs` driver + `docker logs` on the host.
Backups: scheduled disk snapshots covering Gaia data and Docker volumes.

## Auto-deploy (platform loop)

### How it works

1. Merge to `umwelten` `main` touching `packages/**`, `examples/**`, `deploy/gaia/**`,
   lockfiles, or the workflow file.
2. GitHub Actions job `runs-on: [self-hosted, gaia]` executes **on the prod VM**.
3. Workflow sets `GAIA_ENV_FILE` to the host’s canonical `.env` (secrets stay on disk).
4. `deploy/gaia/redeploy.sh` builds images **on the host**, recreates Gaia, waits
   for `/health`, then stop/start each **running** habitat via the Gaia API.
5. Deliberately stopped habitats stay stopped. Named volumes persist.

Manual equivalent: SSH via IAP and run `redeploy.sh`, or `workflow_dispatch`.

### Hard rules for the self-hosted runner

- **Push to the default branch only.** Never attach this runner to `pull_request`
  — the repo is public and the runner controls the production Docker socket.
- Require approval for workflows from forks.
- Path-filter the workflow so unrelated docs/PRs do not cycle the fleet.
- `concurrency` group for deploys with `cancel-in-progress: false` (don’t interrupt
  a half-finished redeploy).
- Runner user needs Docker group access; treat runner registration as a production
  credential (rotate if leaked; systemd `Restart=always` watchdog recommended).

This CD shape **does not transfer to Cloud Run**. Cloud Run has no host Docker
socket and no “build on the prod box” step. Future Cloud Run / Cloud Build work
is a different pipeline (build in Cloud Build → Artifact Registry → pull on host
or deploy a service) — document that separately when it ships.

## Previews: what exists vs what does not

| Surface | Preview? | How |
| --- | --- | --- |
| habitats SaaS | Yes | Vercel Preview env + `mise run vercel:sync -- --env preview` |
| Gaia / habitats on GCE | **No** | Every platform merge hits production |
| Cloud Build PR images | **Not implemented** | Planned (umwelten migration Phase 4 / Stage 2) |

Until a staging Gaia host or Cloud Build PR pipeline exists, test control-plane
UI against Preview Vercel, and treat agent-fleet changes as production deploys
with the ~10 minute cycle cost.

## Agent (habitat) lifecycle

Repo-backed habitats only going forward:

```
config.json      # id metadata, toolsDir, stimulusFile, requiredSecrets
STIMULUS.md
tools/<name>/    # TOOL.md + handler.ts
src/
package.json     # runtime deps; boot installs with --prod
mise.toml        # pin node/pnpm
```

1. Secrets → Gaia master vault (`POST /api/secrets`), never into git.
2. `create_habitat` with `gitUrl` + `secretBindings`; hostname defaults to
   `<id>.<GAIA_BASE_DOMAIN>`.
3. `start_habitat` → check `/health`; attach in SaaS with the **child** API key
   (never Gaia’s master key).
4. Later deploys = agent-repo push + Gaia `rebuild <id>` (loop 2).

Gaia is the only holder of GitHub credentials (GitHub App on an explicit
allowlist). See umwelten ADR / operating-production for the App layout.

## Secrets and credentials

| Secret | Where it lives |
| --- | --- |
| Compose / host config (`GAIA_API_KEY`, hostnames, …) | `deploy/gaia/.env` on the VM |
| Provider keys, Twitter tokens, per-agent DB URLs | Gaia master vault → bound into child `secrets.json` |
| GitHub App private key | On gaia-host only |
| SaaS Clerk / Neon / Blob | habitats Vercel + fnox — **separate plane** |

Do not sync Vercel Preview secrets onto the GCE host. Do not put prod Gaia keys
in the SaaS Preview vault.

## Anti-patterns

- Wiring the prod self-hosted runner to `pull_request` or `pull_request_target`.
- Expecting Cloud Run “branch previews” for Gaia/habitats.
- Building images on a laptop and `docker save` into prod as the normal path
  (use the on-host redeploy or future Artifact Registry pull).
- Exposing Gaia’s raw port publicly; always go through caddy + API key.
- Wiping habitat Docker volumes casually (rotated OAuth tokens live there).
- Mixing loops: changing SaaS Preview env and assuming agents rebuilt.
- Putting Gaia’s master API key into the habitats SaaS client.

## Planned next (not standard yet)

Documented in umwelten migration reports — **do not treat as current practice**:

1. **Cloud Build → Artifact Registry** so the host **pulls** tags instead of
   `docker build` on the pet VM (decouples CD from runner disk/RAM).
2. Optional **staging Gaia host** if we need a non-prod runtime plane.
3. Longer term: GKE / Cloud Run Instances if orchestration requirements change.

When Stage 2 lands, add a short subsection here or a sibling doc; keep this file
focused on the live GCE + self-hosted runner pattern.

## Checklist (new Gaia host)

- [ ] GCE VM, IAP SSH, Docker Engine, disk + swap sized for the fleet
- [ ] Wildcard DNS + caddy-docker-proxy; Gaia only on `gaia-net`
- [ ] `deploy/gaia/.env` from `.env.example`; mode 0600; not in git
- [ ] Self-hosted runner registered with labels `self-hosted`, `gaia`
- [ ] `deploy-gaia.yml`: `main` + path filters only; no `pull_request`
- [ ] `GAIA_ENV_FILE` points at host `.env`; smoke `redeploy.sh`
- [ ] Uptime check on Gaia `/health`; memory/disk alerts
- [ ] Disk snapshot schedule; document restore
- [ ] Named gcloud config in the umwelten repo `mise.toml`
- [ ] Team knows the three deploy loops and which repo to push

## Related docs

| Doc | Role |
| --- | --- |
| @gcp-deployment.md | Cloud Run / App Engine / gcloud configs |
| @vercel-deployment.md | habitats SaaS previews and fnox→Vercel sync |
| umwelten `deploy/gaia/README.md` | Host runbook |
| umwelten `docs/guide/operating-production.md` | Day-to-day fleet ops |
| umwelten `reports/2026-07-10-gaia-on-gcp-deployment-strategy.md` | Why not Cloud Run |
