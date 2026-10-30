# Testing and release record

This is the repository-specific operational record for `STD-012`, not a claim
that the draft standard has been ratified or every external gate is configured.

## Checks

| Check | Runner / trigger | Class | Coverage |
| --- | --- | --- | --- |
| `mise run lint` | `ci.yml`, job `check`; every PR and push to `main` | blocking | Markdown, skill register and immutable lock metadata/parity, design, corpus rendering, document metadata |
| `mise run test` | `ci.yml`, job `check`; every PR and push to `main` | blocking | Document metadata, skill restoration, secret sync, bootstrap and task-contract regressions with disposable fixtures |
| Pages build validators | `pages.yml`; configured paths on `main` or authorized manual dispatch | blocking for that deployment | Renderer, document, design, and skill validation |
| `mise run test:docker` | Explicit integration run in a Docker-capable cloud workspace | blocking for image changes; not a required PR job | Image build and container smoke checks |
| `mise run secrets:check` | Explicit authorized runtime check | operational; outside offline CI | Real project-vault access, not static correctness |

After tools are installed, lint and test need neither network access, Docker, nor
credentials. Installation restores skills through `node scripts/restore-skills.mjs`
and may need public network access. Docker integration additionally downloads the
base image and build dependencies; it is deliberately not hidden inside `test`.

The intended required PR job is `check` (`fp:ci:ci.yml:check`). Branch protection
and its required-check settings have **not been verified or changed** by adding
the workflow. A passing local run is not proof that GitHub has run the workflow.
An authorized owner should configure only blocking checks as required.

## Preview verification

GitHub Pages publishes the static corpus from `main`; the current workflow does
not provide per-PR deployments or a `preview/e2e` status. This is an explicit
preview gap, not an assertion that all possible Pages preview mechanisms are
impossible. Until one is configured, render the release candidate with
`mise run standard:render`, serve `out/standards/` through a managed cloud service,
and smoke-test navigation, links, and representative rendered documents. Record
the SHA, commands, results, and browser evidence in the PR before review.

Cloud-served output exercises the same static artifact, but does not verify
GitHub Pages deployment, its custom domain, CDN, or permissions. Those remain
deployment checks. There are no application secrets, OAuth clients, or databases
in the static site; introducing any requires a new parity and data-protection
review under `STD-007` and `STD-009`.

## Benchmarks and thresholds

N/A — this repository publishes reference documents and deterministic static
HTML, not model predictions or data-quality scores. It has no automated
confidence-based acceptance policy. Structural validation does not establish
semantic agreement between documents; reviewers still check the requirements
and examples.

## Sign-off gates

Maturity and owner approval belong in `AGENTS.md`; no maturity or delegation is
inferred from the existence of the public site. A named release approver and
owner-approved maturity profile are not yet recorded as an operational gate.
This is a gap, not `N/A`, because `pages.yml` already deploys from `main`.

Before an authorized merge/release, record passing lint/test, release-candidate
smoke evidence, applicable image checks, known gaps, and the required person's
approval in the PR. No separate staging environment is required. CI publishes
the candidate from `main`; `mise run deploy` refuses a workspace deployment and
points to that workflow without claiming a build is a deployment.

The existing Pages workflow does not depend on the separate `ci.yml` job; an
owner-managed merge gate is therefore important. Deployment-environment approval
settings and rollback rehearsal have not been verified. This document does not
create those settings or grant permission to deploy.

## Alerting

Not configured — default-branch CI and Pages failures currently have no verified
issue/Slack feedback loop. No Slack channel, bot-token mapping, fingerprint
deduplication, notification threading, reply routing, or recovery comments have
been configured by this change. These are applicable open gaps under
`STD-012 §3.12–3.18`, not `N/A`.

Until an owner provisions that loop, an authorized operator needs to monitor
Actions and open or link failure issues manually. Do not infer working alerting
from the fingerprint recorded above or from a workflow existing on disk.
