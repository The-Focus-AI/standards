---
number: "014"
title: "Testing and preview pipeline"
kind: guide
issued: "2026-10-22"
author: W. Schenk
status: Current
verified: "2026-10-22"
---

> The rules are in `STD-012`. This is the walkthrough, the templates and a
> worked example from UpperHand.

# Testing and preview pipeline

How a repository gets from "has a `test` task" to the loop `STD-012`
describes: CI on every pull request, checks classified as blocking or
advisory, previews verified by tests, benchmarks for data and model output,
gated releases, and failures that become issues, Slack threads and replies
routed back.

For Vercel project setup see `best-practices/GDE-010-vercel-deployment.md`.
For deployment rules see `standards/STD-008-deployment.md`. For secrets see
`best-practices/GDE-003-fnox-secrets.md`.

## The `docs/testing.md` file

`STD-012 §3.19` asks for one file. A minimal one:

```markdown
# Testing

Slack channel: #upperhand-alerts

| Check | Where | Class | Owner |
| --- | --- | --- | --- |
| lint | ci.yml | blocking | repo |
| test | ci.yml | blocking | repo |
| e2e against preview | preview.yml | blocking | repo |
| title-match benchmark | eval.yml | blocking below baseline | data |
| null-rate variance | scheduled | advisory | data |

Thresholds: auto-accept matches at confidence >= 0.80 (approved by <name>, <date>, benchmark run <link>).

Gates: stage -> production after <condition>, signed off by <role>.
```

## CI on pull requests

Start from what `upperhand-cp` and `upperhandai-workbench` already run, but
call `mise` tasks so CI and laptops agree (`STD-012 §3.1`):

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
      postgres:            # disposable, per STD-012 §3.4
        image: postgres:16
        env: { POSTGRES_HOST_AUTH_METHOD: trust, POSTGRES_DB: test }
        ports: ["5432:5432"]
        options: --health-cmd "pg_isready -U postgres" --health-interval 5s --health-retries 10
    env:
      DATABASE_URL: postgresql://postgres@127.0.0.1:5432/test
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise run install
      - run: mise run lint
      - run: mise run test
```

Mark `check` as required in branch protection; leave advisory jobs optional
(`STD-012 §3.3`).

## Previews: publish the URL, then test it

Vercel's GitHub integration already builds a preview per pull request and
reports a `deployment_status` event. Use that event both to pin the URL as a
status (`STD-012 §3.6`) and to run tests against it (`STD-012 §3.7`):

```yaml
name: preview
on: deployment_status
jobs:
  e2e:
    if: github.event.deployment_status.state == 'success'
      && github.event.deployment.environment != 'Production'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { ref: "${{ github.event.deployment.sha }}" }
      - uses: jdx/mise-action@v2
      - run: mise run install
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          BASE_URL: ${{ github.event.deployment_status.environment_url }}
      - if: always()
        run: |
          gh api repos/${{ github.repository }}/statuses/${{ github.event.deployment.sha }} \
            -f state=${{ job.status == 'success' && 'success' || 'failure' }} \
            -f context=preview/e2e \
            -f target_url="${{ github.event.deployment_status.environment_url }}"
        env: { GH_TOKEN: "${{ github.token }}" }
```

A protected preview needs Vercel's automation bypass secret sent as the
`x-vercel-protection-bypass` header; keep it in fnox under the preview profile.

## Failures become issues

`STD-012 §3.12–3.15`. Run this as a final `if: failure()` step on default-branch
and scheduled jobs. It deduplicates on a fingerprint in a hidden HTML comment:

```sh
FP="ci:${GITHUB_WORKFLOW}:${GITHUB_JOB}"
RUN="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
N=$(gh issue list --state open --label automated --search "\"fp:$FP\" in:body" \
      --json number --jq '.[0].number')
if [ -n "$N" ]; then
  gh issue comment "$N" --body "Failed again: $RUN"
else
  N=$(gh issue create --label automated --label bug \
        --title "$GITHUB_WORKFLOW / $GITHUB_JOB failing on main" \
        --body "<!-- fp:$FP -->
**Check:** $GITHUB_WORKFLOW / $GITHUB_JOB (blocking)
**Where:** $GITHUB_REF @ $GITHUB_SHA
**First seen / latest:** $(date -u +%FT%TZ)
**Run:** $RUN" | sed 's#.*/##')
fi
echo "issue=$N" >> "$GITHUB_OUTPUT"
```

The automation never applies `ready` (`STD-002 §3.5`, `STD-012 §3.15`).

## Slack: notify, thread, route back

Use a Slack app with `chat:write` (not an incoming webhook) so the bot can
thread, and keep its token in fnox. Store the thread timestamp on the issue the
first time, so repeats reply in-thread (`STD-012 §3.17`):

```sh
TS=$(gh issue view "$N" --json body --jq '.body' | sed -n 's/.*slack-ts:\([0-9.]*\).*/\1/p')
MSG="<https://github.com/$GITHUB_REPOSITORY/issues/$N|#$N> $GITHUB_WORKFLOW failed: $RUN"
RESP=$(curl -s https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" -H 'Content-Type: application/json' \
  -d "$(jq -n --arg c "$SLACK_CHANNEL" --arg t "$MSG" --arg ts "$TS" \
        '{channel:$c,text:$t} + (if $ts=="" then {} else {thread_ts:$ts} end)')")
[ -z "$TS" ] && gh issue comment "$N" --body "<!-- slack-ts:$(echo "$RESP" | jq -r .ts) -->Notified Slack."
```

Routing back (`STD-012 §3.18`) needs a small listener: a Slack Events API
subscription to `message` events in the channel, filtered to replies whose
`thread_ts` matches a known issue, and posted with `gh issue comment` as
"**<name> in Slack:** …". "Matches" go the same way: when a later run of
the same fingerprint passes, or a pull request with `Closes #N` merges, post
"Recovered: <run>" to both the thread and the issue. Run the listener as a
Vercel function or the existing A2A/agent service, not a laptop.

## Worked example: UpperHand × A+E STACI data QA

Source: UpperHand / A+E QA working sessions, 2026-06-23 to 2026-10-21 (Granola
notes). This is where the `STD-012` shape came from: a data pipeline is a
deployment whose tests run on a schedule.

### Layers

| Layer | Cadence | Checks | Class |
| --- | --- | --- | --- |
| L1 — file | every 15 min | File presence, expected directory, cadence per S3 feed. Missing daily file alerts next day; monthly/quarterly feeds are softer. | blocking |
| L2 — structure | each file | Columns, schema and format; null-rate variance against historical baseline. | schema: blocking; null variance: advisory |
| L3 — data | every 4 h | Partner-specific checks: channels, title matching, variance, raw-file-to-Snowflake row counts, regression via pre/post snapshots. | load and row-count failures: blocking; variance: advisory |
| L4 — alerting | on failure | Route to role/group owners; notify and escalate, no auto-resolution. **Not yet built.** | — |

L4 is exactly `STD-012 §3.12–3.18`: each failing (feed, rule) fingerprint opens
or links an issue, notifies the channel in one thread, and replies route back.

### Blocking vs advisory

- **Blocking:** failed file arrival, structural validation failures, failed
  loads — anything that prevents reliable processing.
- **Advisory:** unknown columns, column-order changes, name mismatches,
  variance and anomaly checks — surface for investigation, do not stop the run.
- Thresholds for row-count decline, month-over-month and channel-level variance
  still need formal sign-off (`STD-012 §3.10`); until approved they stay advisory.

### Definition of QA

Andy's definition (2026-10-13): **QA is value-matching across agent output,
raw data and dashboards**, with accurate pass/fail status in the app. A check
that softens or hides a fail flag is not QA; flags temporarily softened must be
restored before sign-off.

### Sign-off gates

1. **Priority cohort:** Amazon, Roku, DTC, Samsung and Tubi validated end to end.
2. **Samsung UAT:** internal review and business-side review in parallel; Samsung
   sign-off triggers rollout of the same process to the other four.
3. **Production gate:** all five partners validated for HOV and revenue, then
   promote through a stage-first release (`STD-012 §3.11`).

### Title-matching eval layer (2026-10-21)

- Matcher algorithm, core service and client apps are separate; a **shared
  benchmark** decides go/no-go and guards against regression (`STD-012 §3.9`).
- Match order: external ID → timestamp/schedule → episode string → series →
  partner/network fallback.
- Output is a candidate plus confidence. **Auto-accept at roughly ≥ 80%**,
  queue the rest for review, and report insufficient evidence explicitly. The
  80% value is a threshold under `STD-012 §3.10`: record it with the benchmark
  run that justifies it and the approver.
- Benchmark target: beat the existing MSA match rate in an A/B comparison
  (reference rates cited: 97–99% Visio, ~95% Tubi; internal models 90%+, 96% on
  Samsung). Commit the labelled set and baseline; CI fails below baseline.

### Agent acceptance record

`The-Focus-AI/upperhandai-standards` `conformance.md` is the deployment-side
counterpart: a green `agent-probe` run is diagnostic, not certification. Each
environment records card URL, service commit, SDK version, wire dialect, test
time and credential-free results, marking each item passed, failed or not
supported — **an untested capability is not passed**:

1. Discovery — card and health reachable, URLs resolve to this environment.
2. Auth — approved identities succeed; wrong audience/scope/owner fails.
3. Wire — blocking and streaming calls in each dialect; ordering preserved.
4. State — follow-ups, polling across restarts, no cross-caller access.
5. Output — numbers verified against source; refusals triggered and preserved.
6. Feedback — when enabled, payload, retries and task association.
7. Deployment — storage, model access, entitlements, owner and rollback.

Treat items 1–5 against the preview as `STD-012 §3.7` evidence, and the full
record against stage as the production gate.

### Current state of the UpperHand repos (2026-10-22)

| Repo | PR CI | Tests | Previews |
| --- | --- | --- | --- |
| upperhand-cp | typecheck, test, build | yes | Vercel Preview/Production |
| upperhandai-workbench | Postgres service, typecheck, test, build, migrate | yes | Vercel Preview/Production |
| upperhandai-standards | lint only | lint | Vercel Preview/Production |
| upperhand-ae | **none** | vitest, Playwright (local only) | Vercel Preview (two projects) |
| upperhand-versant | none | — | Vercel Preview/Production |
| upperhand-roblox | none | vitest config | none |

None publishes a preview status, tests against the preview, or notifies Slack.
`upperhand-ae` is the first candidate: its Playwright suite already exists.

## Adoption checklist

- [ ] `docs/testing.md` with classification, channel, gates, thresholds
- [ ] `ci.yml` running `mise run lint` and `mise run test`; blocking jobs required
- [ ] `preview.yml` on `deployment_status`, pinning `preview/e2e`
- [ ] Benchmark job with committed baseline, if output is data or model behaviour
- [ ] Failure step opening or linking an `automated` issue by fingerprint
- [ ] Slack bot token and channel in fnox; threaded notifications
- [ ] Reply/match listener routing back to issue comments
- [ ] Stage environment and named production gate
