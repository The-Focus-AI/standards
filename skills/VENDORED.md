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

## Vendored

| # | Skill | Source repo | Source commit | Vendored |
| --- | --- | --- | --- | --- |
| SKL-002 | `browser-automation` | The-Focus-AI/chrome-driver | `b654240` | 2026-07-25 |
| SKL-004 | `focus-ai-brand` | The-Focus-AI/focus-ai-brand | `48b769c` | 2026-07-25 |
| SKL-005 | `nano-banana-imagegen` | The-Focus-AI/nano-banana-cli | `42dbef7` | 2026-07-25 |
| SKL-006 | `nano-banana-videogen` | The-Focus-AI/nano-banana-cli | `42dbef7` | 2026-07-25 |
| SKL-009 | `research-methodology` | The-Focus-AI/focus-agents | `f684274` | 2026-07-25 |

`browser-automation`, `nano-banana-imagegen`, and `nano-banana-videogen` document CLIs
that live in their source repos — the skill text moved, the tools did not. Those repos
remain the home of the binaries the skills invoke.

## Still upstream, deliberately not vendored

The 31 third-party skills in `skills-lock.json` — 22 from `mattpocock/skills`, 9 from
`firecrawl/cli`, plus `find-skills` and `swiss-design` — stay where they are. Vendoring
them would mean republishing other people's work and owning their drift; `skills update`
gives us their fixes for free instead. See `best-practices/GDE-008-skills.md`.

They are not numbered. `SKL-nnn` addresses a skill this organisation maintains; numbering
somebody else's would claim an ownership we do not have.

## Follow-ups in the source repos

Vendoring copied the files; it did not clean up the originals. Each source repo still
carries its `skills/` directory, which will drift the moment either side is edited. To
finish the move, each source repo needs its skill directory removed and its README
pointed here. That work is outside this repository and has not been done.
