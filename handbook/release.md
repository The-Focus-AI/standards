---
title: Verify and release
summary: Test the candidate, record the approval, and separate a successful build from a working deployment.
status: Draft
---

Run the repository's real lint and test tasks in CI on each PR and default-branch
push. Classify checks as blocking or advisory; make only blocking checks required
in branch protection. Tests cannot depend on a person's laptop. Use disposable
services, fixtures, or approved scoped credentials.

## Keep one release record

Use `docs/testing.md` with five sections: Checks, Preview verification, Benchmarks
and thresholds, Sign-off gates, and Alerting. Record actual checks, evidence,
owners, and gaps. `N/A` means inapplicable, not unconfigured.

The [default testing record](../templates/default-project/docs/testing.md) and
[CI procedure](../recipes/ci.md) provide working starting points. Copying a
workflow does not configure branch protection or prove that CI ran.

## Verify what will run

For web changes, publish a PR preview URL as a status/check on the exact head
commit. Run smoke or end-to-end checks against that preview before review.
When the platform cannot provide one, document the limitation and exercise the
candidate's production build/start path in the cloud workspace. State the
deployment behavior that remains unverified.

Inspect representative UI states and widths. Include screenshots for appearance
and a recording for interaction. For data/model behavior, record dataset,
metric, committed baseline, measured score, and commit; fail on regression.
Confidence thresholds for accepting output without review need benchmark
evidence and a person's approval, not an arbitrary constant.

Keep previews [production-like without production writes](secrets.md#match-production-behavior-in-previews).
No separate staging environment is required.

## Name who can release

The project owner records maturity, approval date, and rationale in `AGENTS.md`.
Missing maturity is unassessed, not an implicit `alpha`.

| Maturity | Verification | Approval |
| --- | --- | --- |
| `alpha` | Lint, tests, changed-workflow smoke test, known gaps | Owner may explicitly delegate bounded, reversible releases. |
| `client-testing` | Alpha checks plus client scenarios and representative data | Named owner accepts client-visible changes; record agreed client acceptance. |
| `production` | Regression, relevant auth/isolation/migration checks, candidate smoke test, recovery path | Recorded release approval and operational recovery owner. |

Maturity never waives security or grants merge/deploy authority. An agent can
collect evidence, but cannot supply the person's required approval. The
[review gate](work.md#keep-approval-independent) remains separate.

## Deploy the approved candidate

Build and deploy through the recorded CI path. Name the platform project,
environment, region/team where relevant, runtime identity, and artifact revision.
Do not rely on an ambient CLI target. Serialize releases to a destination;
do not cancel a half-finished deployment to start another.

| State | Guard and owner | Failure and recovery |
| --- | --- | --- |
| Planned | Engineer records code, schema, identity mapping, and rollback compatibility | Missing approval or credential provisioning stops promotion. |
| Candidate verified | CI and cloud checks exercise the chosen release artifact | Fixture interoperability is not genuine issuance or deployed acceptance. |
| Migration ready | Operator approves target, backup, compatibility, and recovery | Apply migrations separately from application boot; stop on failure. |
| Deployed, not accepted | Authorized pipeline publishes the candidate | Check runtime health and actual authenticated paths, not only discovery. |
| Accepted | Recorded gate passes on the deployed candidate | Observe errors and retain release evidence. |
| Rollback or repair | Owner chooses a compatible code/schema/identity pair | A code rollback does not undo schema changes, data writes, grants, or secret sync. |

For integration cutovers, preserve valid existing access only through a separately
approved, bounded coexistence profile. Never retry a failed machine/JWT/grant
request as a demo identity. Test stored contexts and snapshots against the chosen
rollback pair before release. See [service access](service-access.md).

Platform procedures: [Vercel](../recipes/vercel.md), [GCP](../recipes/gcp.md),
and the dated [Gaia runtime record](../evidence/gaia-runtime.md).

## Route failures back to work

Default-branch blocking failures, failed deployments, and scheduled-check failures
need an issue or a link to an existing issue. Deduplicate with a stable
`<!-- fp:scope:target:rule -->` marker, not a run timestamp. Record first/latest
occurrence, classification, and run/log links.

Notify the project's named Slack channel with the issue link. Repeat failures
belong in its existing thread; route human replies and recovery evidence back
to the issue. A raw automated failure stays backlog until actionable under
[the work workflow](work.md). Recovery alone is not permission to close it.
