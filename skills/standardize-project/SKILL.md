---
name: standardize-project
description: >
  Applies approved, additive tooling and bootstrap migrations after an evidence-backed
  TheFocus.AI standards audit. Use to bring an existing project onto mise, fnox,
  cloud bootstrap, or selected skills without replacing project-specific behavior.
  Produces a proposed diff before editing; use PRM-002 for the full issue/PR loop.
---

# Audit and Standardize a Project

Inspect first, propose a plan, then apply only the authorized changes. A
conforming repository that breaks the team's existing workflow is a failed
migration.

## Audit and approval

Resolve the target and a concrete `The-Focus-AI/standards` revision using
`standards-map`. Read `GDE-012` for the audit order and **Conforms / Exception /
Gap / Soft gap / Not applicable** vocabulary. Use the report phases of
`PRM-002` rather than a second checklist here. A read-only request stops with
the report; it does not authorize installation or edits.

Only In force standards bind the fleet. Record a source's kind/status with
each finding; Draft standards are proposals and Current guides are explanation.
An explicitly adopted project convention may still apply—cite that adoption.
Name conflicts with target instructions rather than silently picking a side.

Before changes, give the current state, clause-backed findings, exact proposed
file changes, key **names** and vault scope for any secret migration, commands
to run, and outstanding approvals. Use `STD-006` report metadata and NOTE paths
when working in this corpus; `standards-map` carries the report envelope.

For the full issue → branch → draft PR loop, follow `PRM-002` only when that
external work was requested. Readiness still needs the `STD-002` assessment and
any unresolved approvals; a gap report does not make an issue ready or claimed.
Do not merge, deploy, or ratify a Draft through this skill.

## Apply an approved batch

### Tooling and tasks

Use `STD-004`, `STD-005`, and `GDE-011` as the task/bootstrap references,
checking their status and project adoption. Inspect existing tool versions
before adding anything; do not downgrade a working runtime to a copied example.
Use `mise use` for approved tools with reviewed exact versions where output
depends on the version. Never silently add dependencies or globally install
them. `mise install` installs declared tools; `mise run install` installs the
project's dependencies/skills. Keep those responsibilities separate.

Merge tasks additively. Preserve project-specific install/dev/test/deploy
behavior and make failures propagate. Use the corpus's default-project
skeleton only as a missing-file example, not something to copy over the target.

### Secrets and cloud bootstrap

Follow `GDE-003` and `STD-007`; do not duplicate their setup procedure here.
Before setup or any secret write, run the target's ignore/tracking preflight
for **each** intended `.fnox/`, `.env`, `.env.*`, and credential path:
`git check-ignore -q -- <path>` and `git ls-files -- <path>`. Stop if a secret
file is tracked; report its path without reading or printing its contents.
Keep `.env.example` trackable and placeholder-only.

The target state is a project-scoped vault/service account, `fnox.toml`
declarations, and a person supplying the bootstrap token to the authorized
cloud environment's secret settings. Do not request their account password,
copy their session, or persist the injected token in an image/snapshot.
`.fnox/env` is only a documented local exception, not a required cloud file.
Do not add a required dotenv load for a file that cloud bootstrap never creates.
Do not move, quarantine, delete, or provision secrets without explicit approval.

### Skills, pi, and agent instructions

Use `GDE-008` / `STD-011` for the selected inventory. The internal default is
`setup-project` plus `work-next-issue`; all other owned skills remain optional
named installs. Preserve legitimate optional sources and project exceptions.
Review source/pin drift rather than replacing every lock with the standards
repo's lock. Install approved selections with the mise-pinned `skills add`
command, never manual copying or a bare whole-repository install.

Use `GDE-007` when the project uses pi; merge, do not replace, its settings.
Update `AGENTS.md` additively with context entry points, task commands, cloud
bootstrap, the secret-file preflight, and workflow references to `STD-002` /
`STD-003`. Do not recreate obsolete workflow documents as mandatory files.

## Verify and hand off

After reviewing what they execute, run the approved project's install, lint,
test, and relevant bootstrap checks in its cloud workspace. Check real failure
behavior, not just green command names. Resolve secrets only when authorized;
use presence checks or `fnox check`, never output values. Do not run deployment
as a verification shortcut.

Re-run the map against the same standards revision. Report changed paths,
commands and results, remaining Exceptions/Gaps/Soft gaps, and any unverified
integration. Missing credentials, tools, or human decisions are blockers to
state honestly—not a reason to weaken a gate or declare completion.
