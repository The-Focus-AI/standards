# Skill Provenance

Every skill under `skills/` is either **authored here** or **vendored** — copied in from
another TheFocus.AI repository so this repo is the single place skills are maintained.

Vendoring is a one-way move. The copy here is now canonical; the source repo's copy is
frozen history. When a vendored skill needs a change, change it here — never edit the
old location and expect the two to converge.

## Authored here

| Skill | Notes |
| --- | --- |
| `activity-report` | Production usage joined against git history → client-ready report |
| `tech-research` | Adapted from the `tech-research` agent in `The-Focus-AI/focus-agents` |
| `paged-reports` | Split out of `focus-ai-brand` — the paged.js/PDF mechanics |
| `pptx-decks` | Split out of `focus-ai-brand` — the PptxGenJS mechanics |
| `setup-project` | Converted from `prompts/setup-project.md` |
| `standardize-project` | Converted from `prompts/standardize-project.md` |
| `standards-map` | Authored here — latest standards → project mapping report (read-only) |
| `develop-design-md` | Converted from `prompts/develop-design-md.md` |

## Vendored

| Skill | Source repo | Source commit | Vendored |
| --- | --- | --- | --- |
| `research-methodology` | The-Focus-AI/focus-agents | `f684274` | 2026-07-25 |
| `browser-automation` | The-Focus-AI/chrome-driver | `b654240` | 2026-07-25 |
| `nano-banana-imagegen` | The-Focus-AI/nano-banana-cli | `42dbef7` | 2026-07-25 |
| `nano-banana-videogen` | The-Focus-AI/nano-banana-cli | `42dbef7` | 2026-07-25 |
| `focus-ai-brand` | The-Focus-AI/focus-ai-brand | `48b769c` | 2026-07-25 |

`browser-automation`, `nano-banana-imagegen`, and `nano-banana-videogen` document CLIs
that live in their source repos — the skill text moved, the tools did not. Those repos
remain the home of the binaries the skills invoke.

## Still upstream, deliberately not vendored

The 31 third-party skills in `skills-lock.json` — 22 from `mattpocock/skills`, 9 from
`firecrawl/cli`, plus `find-skills` and `swiss-design` — stay where they are. Vendoring
them would mean republishing other people's work and owning their drift; `skills update`
gives us their fixes for free instead. See `best-practices/skills.md`.

## Follow-ups in the source repos

Vendoring copied the files; it did not clean up the originals. Each source repo still
carries its `skills/` directory, which will drift the moment either side is edited. To
finish the move, each source repo needs its skill directory removed and its README
pointed here. That work is outside this repository and has not been done.
