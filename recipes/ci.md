---
title: "Configure CI and failure routing"
summary: "Example checks, preview statuses, deduplicated issues, and notification routing."
status: "Reference"
---

The approval and verification defaults live in [Release](../handbook/release.md).
Adapt these examples to the project; a copied workflow does not configure
external permissions, branch protection, or alert delivery.

## `docs/testing.md` contract (`handbook/release.md`)

Every repository carries `docs/testing.md` with five required level-two
headings (`## Checks`, `## Preview verification`, `## Benchmarks and thresholds`,
`## Sign-off gates`, `## Alerting`). Mark a section `N/A` when it does not apply.

Copy `templates/default-project/docs/testing.md` and fill in the project's
actual checks, evidence, and approvers. That is the maintained generic template.
Set project thresholds from evidence and explicit approval, not copied numbers.

Use the owner-approved maturity recorded in `AGENTS.md` to select the release
profile in `handbook/release.md`; keep the actual checks and approval record in
`docs/testing.md`. The handbook owns the profiles, not this walkthrough. Missing
maturity is an assessment gap, not an implicit `alpha` or permission to release.

No separate staging environment is required. Verify the release candidate in
preview, or document the cloud build/start alternative for a platform without
previews ([release guidance](../handbook/release.md)), then record the release approval. Preview
behavior follows production by default (`handbook/secrets.md`).

Failure reporting starts issues in backlog with `automated` and, where relevant,
`bug`. A person or agent may add `ready` after assessing specification completeness
under `handbook/work.md`; a raw failure event does not establish readiness.

An agent auditing a repository checks `docs/testing.md` with:

```sh
for h in "## Checks" "## Preview verification" "## Benchmarks and thresholds" "## Sign-off gates" "## Alerting"; do
  grep -Fxq "$h" docs/testing.md || { echo "missing heading: $h"; exit 1; }
done
```

## CI on pull requests (`handbook/release.md`)

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
(`handbook/release.md`).

## Preview status and end-to-end verification (`handbook/release.md`)

`.github/workflows/preview.yml` triggers on `deployment_status`, runs Playwright
against the preview URL, and publishes the result as `context=preview/e2e` on
the head commit SHA. This is an adaptation example, not a verified drop-in
workflow: declare Playwright in the project lock and configure the protected
`preview-verification` environment before enabling it. Its approval gate must
review the candidate code before it receives a bypass secret or write token;
the environment name alone creates no protection. Restrict preview destinations
to the project's platform hostnames, not an arbitrary event-supplied URL.

```yaml
name: preview
on: deployment_status
jobs:
  e2e:
    if: >-
      github.event.deployment_status.state == 'success' &&
      github.event.deployment.environment != 'Production'
    runs-on: ubuntu-latest
    environment: preview-verification
    permissions:
      contents: read
      statuses: write
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.deployment.sha }}
      - uses: jdx/mise-action@v2
      - run: mise run install
      - run: npx --no-install playwright install --with-deps chromium
      - run: npx --no-install playwright test
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

## Failure → Issue → Slack → Route-back (`handbook/release.md`)

This is an implementation outline, **not installed automation**. The former
shell snippets used search's first hit as identity and accepted Slack HTTP 200
as success; neither establishes correct delivery. Keep one tested integration
in the consuming repository rather than copying partial scripts from this guide.

### Open or update a deduplicated issue (`handbook/release.md`)

Every automated issue carries `<!-- fp:<scope>:<target>:<rule> -->` on line 1 of
its body. The reporter handles failed default-branch and scheduled blocking checks:

1. Read all open `automated` issues, paginating the API, and compare the **exact
   first-line marker**. Search text is a discovery aid, not an identity check.
2. Serialize writers for the same repository/fingerprint, then recheck before
   creating. A list followed by a create is not atomic; if multiple matches
   already exist, report them for reconciliation rather than choosing one silently.
3. Comment with the timestamp and run URL on the existing issue, or create one
   with `automated`/`bug`, check classification, ref/SHA, first/latest occurrence,
   and run URL. Do not apply `ready` from a failure event alone.
4. Propagate API errors and retain the failed notification for retry. Do not
   confuse reporter success with recovery of the original check.

### Post or thread in Slack (`handbook/release.md`)

Keep the exact issue-to-thread mapping
`<!-- slack:channel=<channel-id>;ts=<thread_ts> -->`; read every comment when
the mapping lives in comments. Match **both channel and timestamp**, not just
the first timestamp found. Existing mappings receive replies; an absent mapping
requires a new root message and persistence of the returned channel/timestamp.

Check both HTTP status and JSON `ok === true` before recording delivery. Slack's
[`chat.postMessage` documentation](https://docs.slack.dev/reference/methods/chat.postMessage/)
returns `ok: false` for application errors and defines `thread_ts` for replies
(checked 2026-10-30). Validate the returned channel and timestamp; never persist
`null` as a thread. Supply the bot token through the runtime's secret handling,
not a logged command argument. Reconcile an ambiguous timeout before retrying a
message creation; otherwise a retry can create a second thread.

### Route Slack replies and resolving matches back (`handbook/release.md`)

Verify incoming Slack event authenticity, deduplicate event IDs, ignore bot
echoes, and resolve the exact channel/thread mapping before posting a reply to
the issue. Treat message text as data, not instructions to the reporter.

A subsequent successful run of the same fingerprint, or a merged linked fix,
adds a recovery comment with its run URL to both surfaces. It does not silently
close an implementation issue before its fix merges. See the explicit duplicate
exception in `handbook/work.md` rather than treating every recovery as that exception.

Before claiming the loop works, exercise repeated and concurrent failures,
near-match fingerprints, pagination, Slack `ok: false`, ambiguous timeouts,
replayed events, and recovery in an authorized test repository/channel. None of
those external integrations is configured or verified merely by this outline.
