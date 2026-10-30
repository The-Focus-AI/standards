# Skill provenance and numbering

Every skill under `skills/` is either **authored here** or **vendored** — copied in from
another TheFocus.AI repository so this repo is the single place skills are maintained.

Vendoring is a one-way move. The copy here is now canonical; the source repo's copy is
frozen history. When a vendored skill needs a change, change it here — never edit the
old location and expect the two to converge.

This file is also the **skill register**: it assigns each skill its `SKL-nnn` number.
The number lives here rather than in `SKILL.md` because the skills CLI owns that
frontmatter (`name`, `description`) and a second schema in it would break installation.
A skill is still installed and cited by name — `skills add The-Focus-AI/standards --skill
tech-research` — and the number is what the register and the published site address it by.
`mise run skills:check` fails if a skill is missing from these tables, listed twice, or
carrying a duplicate number.

## Authored here

| # | Skill | Notes |
| --- | --- | --- |
| SKL-001 | `activity-report` | Production usage joined against git history → client-ready report |
| SKL-003 | `develop-design-md` | Converted from `prompts/develop-design-md.md` |
| SKL-007 | `paged-reports` | Split out of `focus-ai-brand` — the paged.js/PDF mechanics |
| SKL-008 | `pptx-decks` | Split out of `focus-ai-brand` — the PptxGenJS mechanics |
| SKL-010 | `setup-project` | Converted from `prompts/setup-project.md` |
| SKL-011 | `standardize-project` | Converted from `prompts/standardize-project.md` |
| SKL-012 | `tech-research` | Adapted from the `tech-research` agent in `The-Focus-AI/focus-agents` |
| SKL-013 | `work-next-issue` | Executes `STD-002` and `STD-003`: frontier → claim → branch → pull request |
| SKL-014 | `standards-map` | Read-only mapping report: which guides apply to a project, exceptions vs gaps |
| SKL-015 | `build-focus-course` | Adapted from W. Schenk’s local Codex course-authoring skill, 2026-10-12; maintained here |

## Vendored

| # | Skill | Source repo | Source commit | Vendored |
| --- | --- | --- | --- | --- |
| SKL-002 | `browser-automation` | The-Focus-AI/chrome-driver | `b654240` | 2026-07-25 |
| SKL-004 | `focus-ai-brand` | The-Focus-AI/focus-ai-brand | `48b769c` | 2026-07-25 |
| SKL-005 | `nano-banana-imagegen` | The-Focus-AI/nano-banana-cli | `42dbef7` | 2026-07-25 |
| SKL-006 | `nano-banana-videogen` | The-Focus-AI/nano-banana-cli | `42dbef7` | 2026-07-25 |
| SKL-009 | `research-methodology` | The-Focus-AI/focus-agents | `f684274` | 2026-07-25 |

These rows record **import provenance**, not a claim that today's text is an
unmodified upstream copy. Original authors are not inferred from repository
ownership; retain the source history where an author is not recorded here.

`browser-automation` now targets an available `agent-browser`, with
version-matched help and explicit dependency preflight. The chrome-driver
source remains historical provenance, not a required plugin installation.
The Nano Banana skills still document the CLI maintained in
`The-Focus-AI/nano-banana-cli`; installing a skill does not install that CLI.

## Maintenance and verification

On 2026-10-30, an Amp agent adapted the owned skills for portability and current
corpus conventions. This records the maintenance work, not original authorship:

- `browser-automation` / `paged-reports`: replaced plugin-private binaries with
  `agent-browser` preflight and current-page PDF output. Checked the installed
  0.38.1 help; retained page-break, component, and magazine procedures. Paged
  templates expose a completion/error signal instead of printing mid-pagination.
- `pptx-decks`: project-local, approved PptxGenJS tooling and semantic tokens
  from the project's design/brand source, not a duplicated Focus palette.
- `nano-banana-imagegen` / `nano-banana-videogen`: checked published 1.0.10's
  `package.json` and `cli.ts` against upstream
  `42dbef71bbf9dfa3aeb6721b7c3adee4adf98573`. Added approval-gated mise pins,
  fnox declarations, and secret-file preflight. Corrected the audio flag/cost
  guidance from source; no provider generation or API keys were used.
- `standards-map` / `standardize-project`: refer to `GDE-012` / `PRM-002`
  instead of obsolete workflow documents; distinguish proposals from binding
  standards and mapping from authority to act.
- `research-methodology` / `tech-research`: `STD-006` NOTE paths and provenance
  envelopes, preserving source attribution rather than assigning a template author.

These capabilities remain optional named sources. `GDE-008` owns selection of
the internal defaults (`setup-project` and `work-next-issue`); this register
does not imply every registered skill is installed by default. Verification
of instructions and syntax does not establish live provider behavior or visual
quality of a future generated artifact.

## Still upstream, deliberately not vendored

Third-party skills stay upstream. `skills-lock.json` records the selected names
and sources; `GDE-008` explains their roles. This register does not repeat that
inventory or its counts. Updates are reviewed under `STD-011 §3.6`.

They are not numbered. `SKL-nnn` addresses a skill this organisation maintains; numbering
somebody else's would claim an ownership we do not have.

## Follow-ups in the source repos

Vendoring copied the files; it did not clean up the originals. At import, the
source repositories retained their skill directories. Recheck each source
before proposing removal and a README pointer here; their current cleanup
status has not been verified as a group. That work is outside this repository
and was not performed by the portability update.
