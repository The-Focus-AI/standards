# Skill provenance

Every skill under `skills/` is either **authored here** or **vendored** — copied in from
another TheFocus.AI repository so this repo is the single place skills are maintained.

Vendoring is a one-way move. The copy here is now canonical; the source repo's copy is
frozen history. When a vendored skill needs a change, change it here — never edit the
old location and expect the two to converge.

Install and cite skills by name. This file records attribution, not another
numbering system or installation inventory. `mise run skills:check` requires
each owned skill to appear once and checks vendored lint exemptions.

## Authored here

| Skill | Notes |
| --- | --- |
| `activity-report` | Production usage joined against Git history for client-ready reports |
| `develop-design-md` | Converted from the former design-development prompt |
| `paged-reports` | PDF mechanics split out of `focus-ai-brand` |
| `pptx-decks` | Presentation mechanics split out of `focus-ai-brand` |
| `setup-project` | Converted from the former project-setup prompt |
| `standardize-project` | Converted from the former project-standardization prompt |
| `tech-research` | Adapted from the `tech-research` agent in `The-Focus-AI/focus-agents` |
| `work-next-issue` | Executes the issue-to-review procedure in `handbook/work.md` |
| `standards-map` | Read-only project audit against the handbook |
| `build-focus-course` | Adapted from W. Schenk's local Codex course-authoring skill, 2026-10-12; maintained here |

## Vendored

| Skill | Source repo | Source commit | Vendored |
| --- | --- | --- | --- |
| `browser-automation` | The-Focus-AI/chrome-driver | `b654240` | 2026-07-25 |
| `focus-ai-brand` | The-Focus-AI/focus-ai-brand | `48b769c` | 2026-07-25 |
| `nano-banana-imagegen` | The-Focus-AI/nano-banana-cli | `42dbef7` | 2026-07-25 |
| `nano-banana-videogen` | The-Focus-AI/nano-banana-cli | `42dbef7` | 2026-07-25 |
| `research-methodology` | The-Focus-AI/focus-agents | `f684274` | 2026-07-25 |

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
- Audit and research skills were aligned to the then-numbered corpus, preserving
  attribution and distinguishing proposals from authority to act. The handbook
  redesign later replaced those paths and metadata without re-verifying provider behavior.

These capabilities remain optional named sources. `handbook/skills.md` owns selection of
the internal defaults (`setup-project` and `work-next-issue`); this register
does not imply every registered skill is installed by default. Verification
of instructions and syntax does not establish live provider behavior or visual
quality of a future generated artifact.

## Still upstream, deliberately not vendored

Third-party skills stay upstream. `skills-lock.json` records the selected names
and sources; `handbook/skills.md` explains their roles. This register does not repeat that
inventory or its counts. Updates are reviewed under `handbook/skills.md`.

## Follow-ups in the source repos

Vendoring copied the files; it did not clean up the originals. At import, the
source repositories retained their skill directories. Recheck each source
before proposing removal and a README pointer here; their current cleanup
status has not been verified as a group. That work is outside this repository
and was not performed by the portability update.
