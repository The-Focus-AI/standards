---
number: "005"
title: "Standards gap register: inconsistencies and unresolved decisions"
kind: note
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-10-30"
---

# Standards gap register

Review began on 2026-10-28 and was updated by an Amp agent on 2026-10-30:
12 standards, 14 guides,
6 notes, 4 decision records, 2 prompts, design document, 15 skill entry points,
and relevant supporting code/templates. Findings are repository comparisons,
not an audit of deployed projects. Recommendations are agent judgements under
`STD-006 §3.8` unless attributed to the maintainer below; no draft was ratified.

Only `STD-001` is In force. The other standards are Draft: conflicts below need
resolution before adoption, not claims that the fleet violates binding policy.
Historical notes and accepted decisions remain evidence of their original dates.

## Maintainer decisions during review

On 2026-10-28, the maintainer directed that "the preview should behave like
production by default" [3], rejecting blanket separation of environment keys
and vaults. `STD-007` R2 replaces §3.4 accordingly, retaining Draft status and
the existing database-write and credential-scoping protections. `GDE-003` and
`GDE-010` now describe production parity with minimal, documented exceptions;
their isolated-environment layouts are options rather than universal defaults.
On 2026-10-29, the maintainer also directed [3]:

- **No mandatory staging:** `STD-012` R2 retains release verification and approval
  but removes the separate staging environment. Existing client-specific staging
  plans remain historical examples, not a fleet requirement.
- **OAuth per client, always:** `STD-009` R3 and `GDE-002` now require client-specific
  provider registrations and credentials in every environment. Reuse within a client
  remains distinct from sharing across clients.
- **Personal retrieval, cloud injection:** `STD-007` R3 describes a person retrieving
  the project token with their 1Password account and supplying it to scoped cloud
  secret settings. The agent's interpretation is a project-scoped service-account
  token, not the person's account password, Secret Key, or login session.
- **Cloud-first development:** `STD-005` R3 and `GDE-006` make the cloud workspace
  the development runtime. The laptop provides browser review and authentication;
  genuine hardware/network exceptions are recorded rather than silently required.
- **Agents may establish readiness:** `STD-002` R2 permits `ready` after checking
  specification completeness and unresolved decisions. Merge/deploy authority is
  unchanged. State labels stay mutually exclusive; maturity is not a ticket label.
- **Maturity profiles accepted:** on 2026-10-29 the maintainer agreed with the
  proposed alpha / client-testing / production map [3]. `STD-012` R3 now owns it
  in §3.20–3.21; templates and the testing guide refer there rather than duplicating
  it. This accepts the draft's direction, not ratification or a release delegation.

On 2026-10-30, the maintainer approved linked duplicate-ticket closure and the
latest skills CLI upgrade [3]. `STD-002 §3.18` now permits a verified duplicate
to close while the original stays open; the PR and failure-routing references
follow that exception. The maintainer also requested an internal-skill inventory.
The subsequent "fix all of it" request [3] was implemented with the proposed
smaller internal default: `setup-project` and `work-next-issue`. All 88 external
selections remain; the other 13 internal sources stay available on demand.
This is a repository inventory choice, not a new fleet-wide requirement.

## Corrections in this cleanup

These describe the accompanying working-tree changes, not a deployed release.

- **Bootstrap safety:** new projects lacked `.gitignore`, so `.fnox/env` was
  stageable. The template now ignores credentials/caches; repeat bootstrap still
  preserves an existing ignore file. Existing projects need a separate ignore audit.
  At the maintainer's request [3], repository and generated-project agent instructions
  now require a preflight before setup or writing secrets: check ignore coverage,
  preserve existing rules, and flag already tracked secret files without exposing them.
- **Install terminology:** `mise install` installs tools; `mise run install`
  runs project setup. `STD-004`, `STD-005`, and active walkthroughs now distinguish them.
- **Secret examples:** removed unfiltered Vercel/GSM sync loops and the broken
  fnox Dockerfile; removed conflicting Vercel token-only instructions. Presence
  checks no longer print a database URL. `scripts/sync-secrets.mjs` replaces the
  loops with explicit target/source mappings, runtime allowlists and dry-run by
  default. Preview and production can intentionally use the same runtime profile.
  Its 15 offline tests cover wrong-profile/admin-key rejection, exact string
  transfer, preflight, and partial failures; no provider writes were performed.
- **Skill restoration:** raw CLI restore still does not enforce hashes [1,4].
  `scripts/restore-skills.mjs` stages the CLI's output, checks immutable refs,
  canonical paths, completeness, lock drift and installed hashes, then replaces
  the canonical directory. Failure preserves the existing installation; unknown
  skills cause a refusal rather than deletion. Both identical locks were generated
  through CLI 1.7.4 and now contain 90 pinned entries. A fresh networked restore
  verified the full set without changing the lock. This does not certify every
  external skill's behavior.
- **Authority and metadata:** navigation distinguishes drafts from binding rules;
  `PRM-002` distinguishes adoption recommendations from nonconformance and lock
  drift from proven staleness. `STD-006` no longer assigns `Superseded` to standards.
- **Duplication and stale claims:** `GDE-007` reads the pi package list from
  configuration; the skill register no longer repeats third-party counts. Navigation
  includes testing guidance, repository visibility is public [2], and `DESIGN.md`
  distinguishes the implemented Markdown renderer from the unimplemented MDX design.
- **Metadata validation:** the renderer and validator now share the same schema,
  date, identity and replacement-pointer checks. Invalid metadata/duplicates fail
  before the renderer replaces existing output. Negative parser/CLI fixtures
  cover these contracts. Mechanical checks still do not prove clauses agree.
- **Cloud bootstrap:** root and template `setup` check an injected token without
  writing one to disk. The previously undeclared `op` dependency is mise-managed;
  installation and CLI help were verified, not access to any real vault.
- **Readiness and release consumers:** removed the partial claim shell recipes,
  aligned the issue skill and audit prompt with agent-set readiness, and made the
  generic testing record independent of UpperHand's provisional thresholds/staging.
  Acceptance outcomes and the verification plan are now distinguished in `STD-002`.
  Branch creation refuses an existing branch instead of resetting it.
- **Bootstrap and tasks:** a brief-driven `--emit-prompt` handoff combines the
  setup skill with canonical templates without invoking an agent or writing files.
  Missing project checks/deployments fail clearly; frozen installs never retry
  unfrozen. Root lint/test work offline without credentials; Docker is a separate
  integration task. New PR CI and `docs/testing.md` record the actual checks and
  explicitly unconfigured external gates. Tool pins include the tested fnox
  1.45.0 and skills 1.7.4; Python and jq are declared.
- **Optional skills:** removed private Claude-plugin binary assumptions, global
  PPTX installs, duplicated palettes in deck code, and unpinned Nano Banana
  commands. Browser/PDF tooling has an executable preflight; deck mechanics map
  project tokens instead of imposing Focus branding. Research/audit skills use
  numbered provenance and current standards rather than obsolete workflow files.
- **Diagnostics and cleanup:** one Clerk diagnostic handles live/test prefixes;
  six synthetic cases passed. `GDE-013` independently registers each acquired
  resource's cleanup; success, registration failure and unregister failure were
  exercised against the upstream substrate. Docker instructions now identify
  their generator and no longer mount personal authentication directories.

## Remaining integration and delivery limits

| Area | What remains | Required next evidence |
| --- | --- | --- |
| Secret sync | Real vault/provider permissions and existing target configuration have not been exercised. Upserts/version writes are not atomic and ambiguous failures need reconciliation. | Authorized test targets, then inspected receipts and exact destination values without logging them. No production mutation is authorized by this review. |
| Published skill pins | Internal entries point to the last published commit, not the corrected local sources. Two removed/renamed external names retain their last available revisions. | Publish only after approval; refresh internal pins through the CLI afterward. Treat replacement of the two external capabilities as an explicit inventory change. |
| Shared-identity claims | A read-back cannot distinguish sessions using the same GitHub identity. The skill stops for repository-specific coordination. | An approved tracker/session-claim design and concurrency tests; no invented remote locking protocol is presented as working. |
| CI/release/alerting | Workflow files exist, but GitHub execution, branch protection, owner maturity/release approval and issue/Slack routing are unverified or unconfigured. | Owner-authorized setup and a real failure/recovery exercise. `GDE-014` now labels routing as an outline, not copy-paste automation. See `docs/testing.md`. |
| Docker | `test:docker` stops because this orb has no reachable Docker daemon. | Build/smoke checks in a Docker-capable cloud workspace; no image pass is claimed. |
| Optional integrations | Browser commands and pagination readiness were exercised; Nano Banana flags were source-checked. No generated PPTX was rendered and no paid media generation was run. | Approved dependencies/renderers and scoped provider access in a consuming project. Installing skill text does not install its tools. |

## Verification on 2026-10-30

- `mise run --deny-net --deny-env test`: 86 Node tests and 13 bootstrap assertion
  groups passed. Fixtures exercise actual entry points without real credentials.
- `mise run --deny-net --deny-env lint`: passed Markdown, 15 registered skills,
  90 immutable lock entries/parity, design, rendering and 39 document checks.
- The actual fnox 1.45.0 subprocess preserved quoted/multiline Unicode fixture
  values, applied a named-profile override and excluded an unselected key.
- Full 90-skill restoration from GitHub passed content and unchanged-lock checks;
  provider integration tests use simulated HTTP responses, not live accounts.
- `mise run test:docker`: blocked by the missing daemon, not passed or skipped
  silently. No external CI, deployment, OAuth sign-in or real token resolution was run.

## Minimize by giving each procedure one owner

Keep clauses in standards; secret concepts in `GDE-003`; Vercel delivery in
`GDE-010`; GCP delivery in `GDE-005`; Clerk diagnostics in `GDE-002`; copyable
scaffolds in `templates/default-project/`; exact skill selection in the lock.
Guides explain and link to those sources rather than maintaining alternate copies.
Preserve clause addresses, decision history, and unique working procedures when moving content.

The earlier gaps in naming, commit conventions, repository layout, code review,
database conventions, model selection, and fleet-wide accessibility remain
unsettled. Do not invent observability, rollback, privacy, or
dependency-cadence policy merely to fill a section; gather project evidence first.

## Sources and limits

[1] Previously pinned `skills` v1.5.13 source:
[runInstallFromLock](https://github.com/vercel-labs/skills/blob/9a7d8acfbf29f9cced7fb5a504da1d65b484aed3/src/install.ts)
and [runAdd](https://github.com/vercel-labs/skills/blob/9a7d8acfbf29f9cced7fb5a504da1d65b484aed3/src/add.ts).
Source inspection, not a networked restore or verification of newer releases.

[2] [GitHub repository metadata](https://api.github.com/repos/The-Focus-AI/standards),
checked 2026-10-28: `private: false`, `visibility: public`.

[3] Maintainer direction in the
[corpus cleanup discussion](https://ampcode.com/threads/T-01a18374-3137-77e5-a2c3-97f63f600432),
2026-10-28–30. The draft revisions and agent preflight are requested changes,
not ratification or authorization to change deployed credentials.

[4] `skills` v1.7.4 [release metadata](https://registry.npmjs.org/skills/1.7.4)
and [restore source](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/src/install.ts),
checked 2026-10-30 against the published CLI using isolated Git fixtures.
Canonical/adapter selection, pinned/moving refs, tampered hashes, missing skills,
update scope, and removal were exercised. `skills check` was also verified to
mutate content and locks; `GDE-008` now warns against using it for read-only audits.
The full public-source inventory was restored separately with the verification
wrapper. Private-source authentication and individual skill behavior remain outside
that check.

Other evidence is the local corpus and implementation named in each row, plus
`mise install --help` and a temporary bootstrap demonstrating `.fnox/env` was
not ignored. No production credentials were resolved, deployments changed,
external issues filed, or dependent repositories migrated.
