# Testing

This file is the repository's testing and release record (`STD-012 §3.19`).
An agent scaffolding CI and a person approving a release both read it.
Mark a section `N/A` when it does not apply, and never delete a required heading.

## Checks

| Check | Workflow / Runner | Trigger | Class | Fingerprint | Owner |
| --- | --- | --- | --- | --- | --- |
| `lint` | `.github/workflows/ci.yml` (`check`) | `pull_request`, `push` (`main`) | blocking | `fp:ci:ci.yml:check` | repo |
| `test` | `.github/workflows/ci.yml` (`check`) | `pull_request`, `push` (`main`) | blocking | `fp:ci:ci.yml:check` | repo |

Replace or extend this table as the project adds preview, eval, or scheduled checks.
Only blocking checks are required in branch protection (`STD-012 §3.3`).

## Preview verification

N/A — enable when this repository deploys a web surface.

When applicable (see `best-practices/GDE-014-testing-and-preview-pipeline.md`):

- Platform: Vercel GitHub integration (`deployment_status` event).
- Status context on head SHA: `preview/e2e` with `target_url` set to `environment_url`.
- Command: `BASE_URL="$PREVIEW_URL" npx playwright test`.
- Protection bypass secret: `VERCEL_AUTOMATION_BYPASS_SECRET` in `fnox.toml` (`preview` profile).

## Benchmarks and thresholds

N/A — enable when this repository produces data or model behaviour (`STD-012 §3.9–3.10`).

When applicable, record: dataset path, metric name, committed baseline, confidence
routing bands, approver name, and approval date.

## Sign-off gates

N/A — enable when this repository has a staging → production promotion (`STD-012 §3.11`).

When applicable, name each gate, what must be true, and who decides.

## Alerting

N/A — enable when automated failure notification is wired (`STD-012 §3.16–3.18`).

When applicable:

- Slack channel: `#…` (`SLACK_CHANNEL_ID` in `fnox.toml`)
- Bot token secret: `SLACK_BOT_TOKEN` in `fnox.toml`
- Issue labels applied by automation: `automated`, `bug` (never `ready`)
