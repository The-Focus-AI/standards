# Testing

This file is the repository's testing and release record (`STD-012 §3.19`).
An agent scaffolding CI and a person approving a release both read it.
Mark a section `N/A` only when it does not apply, not when it is unconfigured.
Never delete a required heading. Adapt this baseline to the project brief.

## Checks

| Check | Workflow / Runner | Trigger | Class | Fingerprint | Owner |
| --- | --- | --- | --- | --- | --- |
| `lint` | `.github/workflows/ci.yml` (`check`) | `pull_request`, `push` (`main`) | blocking | `fp:ci:ci.yml:check` | repo |
| `test` | `.github/workflows/ci.yml` (`check`) | `pull_request`, `push` (`main`) | blocking | `fp:ci:ci.yml:check` | repo |

These are intended blocking gates, not evidence of a passing application suite.
The baseline lint/test tasks fail until real project checks are configured. Run
them in the cloud workspace and record their results; do not add fictional app tests.
Install uses the canonical `scripts/restore-skills.mjs` helper, and an existing
pnpm lock is always frozen. A failed frozen install is not retried unfrozen.

Replace or extend this table as the project adds preview, eval, or scheduled checks.
Branch protection is not configured by this template and has not been verified.
An authorized owner should require the blocking `check` job, not advisory jobs
(`STD-012 §3.3`).

## Preview verification

N/A for the empty baseline: no web surface exists yet. Reassess during adaptation;
a web project with no preview verification has a gap, not an exemption.

When applicable, record the platform, URL status on the head SHA (`preview/e2e`),
real smoke/e2e command, and evidence. Declare test tooling through mise or the
project manifest before invoking it. See `GDE-014` for platform examples.

Use production-like previews, document differences, and protect production data
under `STD-007`. If the platform cannot provide PR previews, record that limitation
and cloud build/start verification under `STD-012 §3.7`, including what remains
unverified. A separate staging environment is not required.

## Benchmarks and thresholds

N/A — enable when this repository produces data or model behaviour (`STD-012 §3.9–3.10`).

When applicable, record: dataset path, metric name, committed baseline, confidence
routing bands, approver name, and approval date.

## Sign-off gates

N/A — no release path is configured yet. Before enabling one, use the owner-approved
maturity in `AGENTS.md` to select the profile in `STD-012 §3.20–3.21`. Record the
gate's checks, evidence, approver, and approval location here (`STD-012 §3.11`).

Record any explicit delegation with its authorizer, date, permitted actions, and
limits. Neither an `alpha` classification nor a `ready` ticket grants release
authority or waives the merge gates in `STD-003`.

No separate staging environment is required. Use the verified preview or
documented cloud build/start alternative, and record any checks specific to
production. A configured release path with a missing gate is a gap, not N/A.

## Alerting

Not configured — an open gap because CI runs on the default branch. Workflow
creation alone does not implement failure routing (`STD-012 §3.12–3.18`).

Before claiming this loop is implemented, record and verify:

- Slack channel: `#…` (`SLACK_CHANNEL_ID` in `fnox.toml`)
- Bot token secret: `SLACK_BOT_TOKEN` in `fnox.toml`
- Deduplicated issue creation/linking by fingerprint, threaded notifications,
  replies back to the issue, and recovery comments.
- Issue labels on failure reports: `automated`, `bug`; a person or agent may add
  `ready` only after assessing specification completeness (`STD-002 §3.4–3.5`).
