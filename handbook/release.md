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

## Integration cutover and recovery

This proposed release state machine applies to the combined code, schema, and
identity configuration, not code alone. It does not grant deployment or access
approval. The [state-machine index](agent-services.md#find-the-integration-state-machine)
links the request and view lifecycles affected by a cutover.

| Transition | Guard, owner and effect | Failure and recovery |
| --- | --- | --- |
| Planned to candidate verified | Engineer records code, schema, identity mapping and rollback compatibility; CI and cloud checks exercise that candidate | Fixture interoperability is not genuine issuance or deployed acceptance. Missing evidence stays an open gate. |
| Candidate verified to schema and configuration ready | Approved operator verifies target, backup and recovery, applies compatible schema, and confirms required credential and entitlement setup | Apply migrations separately from application boot and before readers. A failed migration, missing grant or absent provisioning stops promotion. |
| Ready to deployed, not accepted | Release owner authorizes the recorded code and registry cutover; pipeline publishes that candidate | Check runtime health and actual authenticated paths separately from discovery. Build success is not acceptance. |
| Deployed to accepted | Recorded acceptance gate passes on the deployed candidate, including direct and routed identity, negative auth cases, next turns and saved views | A failed gate blocks acceptance. The owner chooses repair or rollback; never mark blocked checks passed. |
| Deployed or accepted to dispatch paused | On failed acceptance or an incident, operator blocks new dispatch under the recovery plan and records known task/context ids | Pausing dispatch does not cancel in-flight work. Reconcile its actual outcome through supported reads or operator investigation; do not replay blindly. |
| Paused to rolled back or repaired | Owner selects a tested compatible code, schema and identity configuration; operator restores it while dispatch remains paused | Keep additive schema and saved history unless a separate migration is approved. Rollback does not undo data writes, grants or secret sync, or revoke issued tokens. |
| Rolled back or repaired to deployed, not accepted | Operator verifies compatibility and obtains approval for bounded acceptance traffic | Repeat the affected acceptance checks before general dispatch resumes. No rollback by disabling auth or restoring demo operator privileges. |

Workbench `c302e20` follow-up turns query `mcp_app_views` even when no view opens.
Apply and verify that schema before deploying code that reads it. Test a text-only
follow-up as well as view reopen; hiding the view UI does not remove the schema
dependency. The [source record](../evidence/workbench-integration.md#conversation-and-view-sources)
pins the implementation, not a current deployment.

For integration cutovers, preserve valid existing access only through a separately
approved, bounded coexistence profile. Never retry a failed machine/JWT/grant
request as a demo identity. Test stored contexts and snapshots against the chosen
rollback pair before release. See [service access](service-access.md).

| Recovery check | Observable acceptance criterion |
| --- | --- |
| Schema before readers | A failed or missing migration blocks the candidate's traffic. With the approved schema, text-only follow-ups and saved-view reopen both work. |
| Dispatch pause | New specialist calls stop, while an already accepted task is tracked separately. The operator records whether its outcome is known or unresolved, without claiming cancellation. |
| Compatible rollback | The selected old-code/new-schema pair can read retained contexts and snapshots. Code rollback neither drops additive schema/history nor weakens authorization. |
| Resume gate | Approved acceptance calls pass for the restored revision before general dispatch resumes. A public card alone cannot pass this gate. |

Platform procedures: [Vercel](../recipes/vercel.md), [GCP](../recipes/gcp.md),
[macOS menu bar apps](../recipes/macos-menubar-app.md), and the dated
[Gaia runtime record](../evidence/gaia-runtime.md).

## Route failures back to work

Default-branch blocking failures, failed deployments, and scheduled-check failures
need an issue or a link to an existing issue. Deduplicate with a stable
`<!-- fp:scope:target:rule -->` marker, not a run timestamp. Record first/latest
occurrence, classification, and run/log links.

Notify the project's named Slack channel with the issue link. Repeat failures
belong in its existing thread; route human replies and recovery evidence back
to the issue. A raw automated failure stays backlog until actionable under
[the work workflow](work.md). Recovery alone is not permission to close it.
