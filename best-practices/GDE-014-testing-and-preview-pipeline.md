---
number: "014"
title: "Testing and preview pipeline"
kind: guide
issued: "2026-10-23"
author: W. Schenk
status: Current
verified: "2026-10-23"
---

> The rules are in `STD-012`. This is the walkthrough, the templates and a
> worked example from UpperHand.

# Testing and preview pipeline

How an agent takes a repository from "has a `test` task" to the full loop
`STD-012` specifies: PR CI, blocking vs advisory classification, preview status
checks and Playwright verification against the preview URL, regression
benchmarks and approved confidence thresholds, stage-first sign-off gates, and
the failure → GitHub issue → Slack thread → reply/match route-back loop.

For Vercel project setup see `best-practices/GDE-010-vercel-deployment.md`.
For deployment rules see `standards/STD-008-deployment.md`. For secrets see
`best-practices/GDE-003-fnox-secrets.md`.

## 1. `docs/testing.md` contract (`STD-012 §3.19`)

Every repository carries `docs/testing.md` with five required level-two
headings (`## Checks`, `## Preview verification`, `## Benchmarks and thresholds`,
`## Sign-off gates`, `## Alerting`). Mark a section `N/A` when it does not apply.

Template (`docs/testing.md`):

```markdown
# Testing

## Checks

| Check | Workflow / Runner | Trigger | Class | Fingerprint | Owner |
| --- | --- | --- | --- | --- | --- |
| `lint` | `.github/workflows/ci.yml` (`check`) | `pull_request`, `push` (`main`) | blocking | `fp:ci:ci.yml:check` | repo |
| `test` | `.github/workflows/ci.yml` (`check`) | `pull_request`, `push` (`main`) | blocking | `fp:ci:ci.yml:check` | repo |
| `preview/e2e` | `.github/workflows/preview.yml` (`e2e`) | `deployment_status` (Preview) | blocking | `fp:ci:preview.yml:e2e` | repo |
| `title-match-eval` | `.github/workflows/eval.yml` (`eval`) | `pull_request`, `push` (`main`) | blocking below baseline | `fp:ci:eval.yml:eval` | data |
| `null-rate-variance` | scheduled QA runner | cron (`*/15 * * * *`) | advisory | `fp:qa:<feed>:l2-null-variance` | data |

## Preview verification

- Platform: Vercel GitHub integration (`deployment_status` event).
- Status context published on head SHA: `preview/e2e` with `target_url` set to `environment_url`.
- Command: `BASE_URL="$PREVIEW_URL" npx playwright test`.
- Protection bypass secret: `VERCEL_AUTOMATION_BYPASS_SECRET` in `fnox.toml` (`preview` profile).

## Benchmarks and thresholds

- Dataset: `inputs/benchmarks/title-matching-v1.jsonl`
- Metric: top-1 exact PPL ID match rate (`match_rate`).
- Baseline floor: `0.90` overall; `0.96` on Samsung cohort (`STD-012 §3.9`).
- Confidence routing (`STD-012 §3.10`):
  - `confidence >= 0.80` → `auto_accept`
  - `0.00 < confidence < 0.80` → `review_queue`
  - missing candidate / evidence → `insufficient_evidence`
- Approved by: pending formal sign-off (provisional from 2026-10-21 working session).

## Sign-off gates

1. Stage validation: priority cohort (Amazon, Roku, DTC, Samsung, Tubi) passes L1–L3 blocking checks.
2. UAT gate: internal QA + business-side sign-off on HOV and revenue value-matching (`STD-012 §3.11`).
3. Production promotion: stage-first release after all 5 priority feeds pass sign-off.

## Alerting

- Slack channel: `#upperhand-alerts` (`SLACK_CHANNEL_ID` in `fnox.toml`)
- Bot token secret: `SLACK_BOT_TOKEN` in `fnox.toml`
- Issue label applied by automation: `automated`, `bug` (never `ready`, per `STD-012 §3.15`)
```

An agent auditing a repository checks `docs/testing.md` with:

```sh
for h in "## Checks" "## Preview verification" "## Benchmarks and thresholds" "## Sign-off gates" "## Alerting"; do
  grep -Fxq "$h" docs/testing.md || { echo "missing heading: $h"; exit 1; }
done
```

## 2. CI on pull requests (`STD-012 §3.1–3.4`)

`.github/workflows/ci.yml` runs `mise run lint` and `mise run test` against a
disposable service container so CI never depends on laptop state:

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  check:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_HOST_AUTH_METHOD: trust
          POSTGRES_DB: test
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s --health-retries 10
    env:
      DATABASE_URL: postgresql://postgres@127.0.0.1:5432/test
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise run install
      - run: mise run lint
      - run: mise run test
```

Mark `check` as required in branch protection; keep advisory jobs non-required
(`STD-012 §3.3`).

## 3. Preview status and end-to-end verification (`STD-012 §3.5–3.8`)

`.github/workflows/preview.yml` triggers on `deployment_status`, runs Playwright
against the preview URL, and publishes the result as `context=preview/e2e` on
the head commit SHA:

```yaml
name: preview
on: deployment_status
jobs:
  e2e:
    if: >-
      github.event.deployment_status.state == 'success' &&
      github.event.deployment.environment != 'Production'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      statuses: write
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.deployment.sha }}
      - uses: jdx/mise-action@v2
      - run: mise run install
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          BASE_URL: ${{ github.event.deployment_status.environment_url }}
          VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}
      - if: always()
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          gh api "repos/${{ github.repository }}/statuses/${{ github.event.deployment.sha }}" \
            -f state="${{ job.status == 'success' && 'success' || 'failure' }}" \
            -f context="preview/e2e" \
            -f description="Playwright against preview (${{ job.status }})" \
            -f target_url="${{ github.event.deployment_status.environment_url }}"
```

An agent preparing PR evidence reads the preview status directly from the commit:

```sh
SHA="$(git rev-parse HEAD)"
gh api "repos/:owner/:repo/commits/$SHA/status" \
  --jq '.statuses[] | select(.context == "preview/e2e") | {state, target_url, description}'
```

## 4. Failure → Issue → Slack → Route-back (`STD-012 §3.12–3.18`)

### 4.1 Open or update a deduplicated issue (`STD-012 §3.12–3.15`)

Every automated issue carries `<!-- fp:<scope>:<target>:<rule> -->` on line 1 of
its body. Run on `if: failure()` for default-branch and scheduled blocking checks:

```sh
FP="fp:ci:${GITHUB_WORKFLOW}:${GITHUB_JOB}"
RUN_URL="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
NOW="$(date -u +%FT%TZ)"

ISSUE_NUM="$(gh issue list --state open --label automated --search "\"$FP\" in:body" \
  --json number --jq '.[0].number // empty')"

if [ -n "$ISSUE_NUM" ]; then
  gh issue comment "$ISSUE_NUM" --body "Latest failure ($NOW): $RUN_URL"
else
  ISSUE_URL="$(gh issue create --label automated --label bug \
    --title "[automated] ${GITHUB_WORKFLOW} / ${GITHUB_JOB} failing" \
    --body "<!-- ${FP} -->
- **Check:** \`${GITHUB_WORKFLOW}\` / \`${GITHUB_JOB}\`
- **Class:** blocking
- **Where:** \`${GITHUB_REF}\` @ \`${GITHUB_SHA}\`
- **First seen:** ${NOW}
- **Latest occurrence:** ${NOW}
- **Run:** ${RUN_URL}")"
  ISSUE_NUM="${ISSUE_URL##*/}"
fi
echo "issue_number=${ISSUE_NUM}" >> "$GITHUB_OUTPUT"
```

### 4.2 Post or thread in Slack (`STD-012 §3.16–3.17`)

Store `<!-- slack:channel=<channel-id>;ts=<thread_ts> -->` on the issue the first
time, then reply in-thread on subsequent failures:

```sh
BODY_AND_COMMENTS="$(gh issue view "$ISSUE_NUM" --comments --json body,comments \
  --jq '[.body, (.comments[].body)] | join("\n")')"
THREAD_TS="$(printf '%s\n' "$BODY_AND_COMMENTS" \
  | sed -n 's/.*<!-- slack:channel=[^;]*;ts=\([0-9.]*\) -->.*/\1/p' | head -1)"

ISSUE_URL="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/issues/${ISSUE_NUM}"
TEXT="<${ISSUE_URL}|#${ISSUE_NUM}> \`${GITHUB_WORKFLOW} / ${GITHUB_JOB}\` failed on \`${GITHUB_REF}\`: <${RUN_URL}|run>"

PAYLOAD="$(jq -n \
  --arg c "$SLACK_CHANNEL_ID" \
  --arg t "$TEXT" \
  --arg ts "$THREAD_TS" \
  '{channel: $c, text: $t} + (if $ts == "" then {} else {thread_ts: $ts} end)')"

RESP="$(curl -fsSL https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")"

if [ -z "$THREAD_TS" ]; then
  NEW_TS="$(printf '%s' "$RESP" | jq -r '.ts')"
  gh issue comment "$ISSUE_NUM" \
    --body "<!-- slack:channel=${SLACK_CHANNEL_ID};ts=${NEW_TS} -->Notified Slack channel \`${SLACK_CHANNEL_ID}\`."
fi
```

### 4.3 Route Slack replies and resolving matches back (`STD-012 §3.18`)

1. **Human Slack reply → GitHub issue comment:** A Slack Events API handler
   listening to `message` events where `thread_ts` is present searches open
   `automated` issues for `slack:channel=<channel>;ts=<thread_ts>` and posts:
   `**@<slack-user> in Slack (<permalink>):** <message text>`.
2. **Resolving match → Issue + Slack thread:** When a subsequent run of the same
   `fp:…` fingerprint succeeds on the default branch (or a PR carrying
   `Closes #<N>` merges), automation finds any open issue with `<!-- fp:… -->`,
   comments `<!-- resolved-by:${RUN_URL} -->Resolved by passing run: ${RUN_URL}`,
   and posts the same link to `thread_ts` in Slack.

## 5. Worked example: UpperHand × A+E STACI data QA

Source: UpperHand / A+E QA working sessions, 2026-06-23 through 2026-10-21
(Granola meeting records). A data pipeline is a deployment whose checks run on a
schedule (`STD-012 §3.2`, `§3.9–3.18`).

### 5.1 STACI L1–L4 layer specification

| Layer | Cadence | Check rule | Class | Fingerprint pattern | Action on failure |
| --- | --- | --- | --- | --- | --- |
| **L1 — File arrival** | every 15 min (`*/15 * * * *`) | Expected S3 directory, file presence, and feed cadence. Missing daily file alerts the following day; monthly/quarterly feeds use softer cadence windows. | **blocking** | `fp:qa:<partner>:l1-arrival` | Halt downstream load for that feed; open/update issue and thread in Slack (L4). |
| **L2 — Schema & format** | on each file arrival | Required columns present, column types and file format match contract. | **blocking** | `fp:qa:<partner>:l2-schema` | Reject file load; open/update issue and thread in Slack (L4). |
| **L2 — Null-rate variance** | on each file arrival | Per-column null rate compared against historical baseline window. | **advisory** (until threshold signed off) | `fp:qa:<partner>:l2-null-variance` | Continue load; record variance for investigation. |
| **L2 — Column drift** | on each file arrival | Unknown extra columns, column-order changes, non-breaking header name mismatches. | **advisory** | `fp:qa:<partner>:l2-column-drift` | Continue load; log drift for schema review. |
| **L3 — Snowflake load & row counts** | every 4 hours (`0 */4 * * *`) | Raw S3 file row count matches staged/loaded Snowflake row count; pre/post snapshot check against historical regression. | **blocking** | `fp:qa:<partner>:l3-row-count` | Block promotion of snapshot; open/update issue and thread in Slack (L4). |
| **L3 — Partner domain checks** | every 4 hours (`0 */4 * * *`) | Partner-specific channel mapping, title-matching coverage, MoM and channel-level variance. | **advisory** (blocking once variance thresholds are signed off) | `fp:qa:<partner>:l3-partner-variance` | Surface anomaly in QA dashboard and review queue. |
| **L4 — Alerting & escalation** | event-driven on L1–L3 failure | Route blocking failures and signed-off threshold breaches to role/group owners via issue + Slack thread (`STD-012 §3.12–3.18`). Notification and escalation only, never auto-resolution. | **routing layer** *(not yet built in repo)* | uses triggering L1–L3 `fp:qa:…` | Open/link issue, post/thread Slack alert, route replies and recovery matches back. |

### 5.2 Andy's QA definition (2026-10-13)

**QA means value-matching across three surfaces: agent output, raw source data,
and dashboards, paired with accurate pass/fail flags in the application.**

- Every numeric metric returned by an agent must reconcile against both the raw
  partner feed and the reporting dashboard for that period.
- Application pass/fail status indicators must reflect real check outcomes; any
  flags temporarily softened during development must be restored to strict
  pass/fail before UAT sign-off.

### 5.3 Sign-off gates and rollout sequence (`STD-012 §3.11`)

1. **Priority cohort (first 5 feeds):** Amazon, Roku, DTC, Samsung, and Tubi.
2. **Gate 1 — Samsung UAT:** Internal QA review and business-side review run in
   parallel against Samsung. Formal sign-off on Samsung unlocks applying the
   identical checklist to Amazon, Roku, DTC, and Tubi.
3. **Gate 2 — Cohort HOV & revenue validation:** All five priority partners
   validated end-to-end for Hours of Viewing (HOV) and revenue reconciliation.
4. **Gate 3 — Stage-first production release:** Promote to staging, verify all
   blocking checks and acceptance records pass, then promote to production.

### 5.4 Title-matching evaluation layer (2026-10-21) (`STD-012 §3.9–3.10`)

The title-matching architecture separates the **matcher algorithm**, **core
service**, and **client applications**, governed by a shared evaluation and
benchmark layer. (External reference → PPL ID mapping is owned upstream by the
data-engineering mapping team, not the matcher service.)

**Deterministic 5-step matching cascade:**

| Step | Signal | Behaviour |
| --- | --- | --- |
| 1 | `external_id` | Exact partner/external identifier match against known PPL ID table |
| 2 | `timestamp_schedule` | Airing timestamp + schedule window match |
| 3 | `episode_string` | Normalized episode title / season-episode token match |
| 4 | `series` | Series-level title match |
| 5 | `partner_network_fallback` | Partner/network catalog fallback heuristic |

**Confidence routing bands (`STD-012 §3.10`):**

| Confidence score | Outcome | System action |
| --- | --- | --- |
| `confidence >= 0.80` | `auto_accept` | Accept candidate match automatically and write provenance (step + confidence) |
| `0.00 < confidence < 0.80` | `review_queue` | Hold candidate match in human review queue; do not auto-commit |
| no candidate / missing evidence | `insufficient_evidence` | Surface explicit `insufficient_evidence` status; never fabricate a fallback match |

**Regression benchmark baselines (`STD-012 §3.9`):**

| Cohort / Partner | Reference MSA / Baseline match rate | Gate rule |
| --- | --- | --- |
| Visio | `97% – 99%` (existing MSA reference) | Candidate model compared A/B against MSA rate |
| Tubi | `~95%` (existing MSA reference) | Candidate model compared A/B against MSA rate |
| Samsung | `96%` (internal model benchmark) | Blocking CI check if match rate drops below `0.96` |
| Overall internal test floor | `>= 90%` | Blocking CI check if aggregate match rate drops below `0.90` |

### 5.5 Agent service acceptance record (`upperhandai-standards/conformance.md`)

For A2A agent repositories (`upperhand-cp`, `upperhand-versant`, `upperhand-ae`),
`The-Focus-AI/upperhandai-standards` `conformance.md` (reviewed against
`The-Focus-AI/agent-probe@17db375`) defines the deployment acceptance record. A
green probe is diagnostic evidence, not full certification (`--card-only` checks
discovery only, and warnings/skips can still exit 0). Note that the public npm
package `@upperhand/agent-probe` returns 404; build `The-Focus-AI/agent-probe`
from source at the reviewed commit.

Each environment (`Preview`, `Stage`, `Production`) records a header block:

- `card_url`, `service_commit`, `sdk_version`, `wire_dialect`, `tested_at`,
  `probe_commit` (`17db3755fac61f610d716a73105d86ab4c0000dc`).

And marks each of the 7 items `passed`, `failed`, or `not_supported` (**an
untested capability is never marked `passed`**):

| # | Area | Required verification evidence | Gate scope |
| --- | --- | --- | --- |
| 1 | **Discovery** | Card and `/health` reachable; absolute interface URLs resolve to this environment (never loopback or another deployment); declared skills exist; optional views are agent-authenticated (not a 404 or login redirect). | Preview (`STD-012 §3.7`) & Stage/Prod (`§3.11`) |
| 2 | **Auth** | Approved machine and human identities succeed; missing, expired, wrong-audience, wrong-scope, and cross-owner requests fail; client-binding profile tested with two entitled machines. | Preview & Stage/Prod |
| 3 | **Wire** | Direct and Workbench-coordinated blocking and streaming calls work in each supported dialect (SDK v1 / 0.3); task precedes status updates; artifacts precede completion; typed Parts and specialist task references survive. | Preview & Stage/Prod |
| 4 | **State** | Follow-up turns send only the new user turn against retained context; task polling survives disconnects and restarts without re-running tools; cross-caller task/history retrieval fails; cancellation/resubscription works or explicit recovery path is documented. | Preview & Stage/Prod |
| 5 | **Output** | Quantitative results match source evidence and extension schemas (Andy's value-matching rule); refusal rules are triggered intentionally and preserve typed refusal Parts without fabricated answers; dataset name agrees with runtime citations. | Preview & Stage/Prod |
| 6 | **Feedback** | When enabled: discovery, payload schema, retry semantics, original owner check, and exact specialist task association verified. | Stage/Prod (`STD-012 §3.11`) |
| 7 | **Deployment** | Persistent storage, model access, production trust/entitlements, operational owner, and rollback procedure verified in that environment (local fixtures or an orb portal never certify production). | Stage/Prod (`STD-012 §3.11`) |

### 5.6 UpperHand fleet rollout plan

Current state surveyed 2026-10-22 across `The-Focus-AI/upperhand*`:

| Order | Repository | Current CI & tests | Current Vercel environments | Target additions under `STD-012` |
| --- | --- | --- | --- | --- |
| 1 | `upperhand-ae` | **No `.github/workflows/`**; has local `vitest`, Playwright (`playwright.config.ts`, `playwright.staging.config.ts`), and CP ROI snapshot/parity suites | `Preview – hudson`, `Preview – upperhand-ae`, `Production – hudson` | Add `docs/testing.md`, `ci.yml` (`lint` + `test` + CP ROI parity), `preview.yml` running Playwright against preview URL and posting `preview/e2e`, and issue + Slack failure steps |
| 2 | `upperhand-versant` | **No `.github/workflows/`**; TypeScript + Python extractor, Postgres-backed A2A agent | `Preview`, `Production` | Add `docs/testing.md`, `ci.yml` with disposable Postgres service (`mise run lint`, `mise run test`), `preview.yml` running `agent-probe` items 1–5 against preview |
| 3 | `upperhand-roblox` | **No `.github/workflows/`**; has `vitest.config.ts` | none | Add `docs/testing.md` and `ci.yml` running `mise run lint` and `mise run test` |
| 4 | `upperhand-cp` | Has `ci.yml` (`pnpm typecheck`, `test`, `build`, `git diff --check`) and `mirror-aegm.yml` | `Preview`, `Production` | Add `docs/testing.md`, `preview.yml` (`preview/e2e` status + probe checks), STACI L1–L4 / title-matching benchmark gates, and issue + Slack failure steps |
| 5 | `upperhandai-workbench` | Has `ci.yml` (Postgres 15 service, `typecheck`, `test`, `build`, disposable DB migration) | `Preview`, `Production` | Add `docs/testing.md`, `preview.yml` (`preview/e2e` Playwright run against preview), and issue + Slack failure steps |
| 6 | `upperhandai-standards` | Has `ci.yml` (`npm run lint`) | `Preview`, `Production` | Add `docs/testing.md` and `preview/e2e` link/conformance check |

## Default-project template

New repositories scaffolded from `templates/default-project/` (via
`scripts/setup-default-project.sh` or `setup-project`) receive:

- `docs/testing.md` — the five required headings, with preview / benchmarks /
  gates / alerting marked `N/A` until enabled.
- `.github/workflows/ci.yml` — `mise run install`, `mise run lint`, `mise run test`
  on pull requests and pushes to `main`.

Fill in the `N/A` sections as the project grows; do not delete the headings.

## 6. Agent execution checklist

When bringing a repository into conformance with `STD-012`, execute in order:

1. Create `docs/testing.md` with all five required sections (`## Checks`,
   `## Preview verification`, `## Benchmarks and thresholds`, `## Sign-off gates`,
   `## Alerting`).
2. Ensure `mise.toml` defines `install`, `dev`, `lint`, and `test` (`STD-004 §3.1`).
3. Add `.github/workflows/ci.yml` calling `mise run install`, `mise run lint`, and
   `mise run test` on `pull_request` and `push` to `main`.
4. Add `.github/workflows/preview.yml` on `deployment_status` to run smoke/e2e
   tests against `environment_url` and post the `preview/e2e` commit status.
5. If the repository produces data or model output, wire the benchmark task into
   CI so scores below the committed baseline exit non-zero (`STD-012 §3.9`).
6. Add the failure step (`fp:<scope>:<target>:<rule>`) and Slack thread step
   (`slack:channel=<id>;ts=<ts>`) to default-branch and scheduled blocking workflows.
7. Run `mise run lint` and `mise run test` locally, open the pull request with
   evidence (`STD-003 §3.5`), and verify the `preview/e2e` status attaches to the
   head commit.
