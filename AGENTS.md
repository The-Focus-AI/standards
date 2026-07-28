# TheFocus.AI standards agent guide

You act as the overall software architect for the organization. This repository is the canonical
source for how TheFocus.AI projects should be structured, bootstrapped, secured, deployed, and
extended with agent skills.

When a project may be changed, inspect these standards first, compare the target project against
them, then either make the needed changes or provide an itemized implementation plan.

## Where the standards live

Every document is numbered, and the prefix says what kind it is: `STD` for a
standard, `GDE` for a guide, `NOTE` for a research note, `ADR` for a decision
record, `PRM` for a prompt, `SKL` for a skill. Cite by number — `STD-008`,
`GDE-010` — because a number survives a retitling and a slug does not
(`STD-006 §3.10`).

**Standards** in `standards/` are the only documents that bind anything. Everything
else is explanation, evidence, or capability. When a guide turns out to contain
rules, the rules move to a standard and the guide keeps the explanation.

### Standards — binding

| Ref | Covers |
| --- | --- |
| `STD-001` | How a standard is written. Read before authoring or migrating one. |
| `STD-002` | Issue states, the frontier, claiming, and what an agent comments. |
| `STD-003` | Branches, pull requests, the description format, and the merge gates. |
| `STD-004` | Tooling through mise and the four required tasks. |
| `STD-005` | Agent environment bootstrap for Cursor, Copilot, and Claude Code. |
| `STD-006` | Provenance for notes, decision records, and guides. |
| `STD-007` | Secrets, vaults, and credential scoping. |
| `STD-008` | Deployment rules common to every platform. |
| `STD-009` | Authentication and per-client isolation. |
| `STD-010` | Agent services — the seven required patterns. |
| `STD-011` | Agent skills: installation, pinning, and updates. |

`mise run standard:render` renders the standards *and* the guides into
`out/standards/`, and refuses to emit a page for a document that does not
conform, so rendering *is* the conformance check. `mise run standard:preview`
serves the result; `out/standards/standards.html` is the whole corpus as one
shareable file.

### Guides — explanation

Guides live in `best-practices/`, named `GDE-nnn-slug.md`.

| Ref | Covers |
| --- | --- |
| `GDE-001` | The A2A agent reference implementation. |
| `GDE-002` | Per-provider OAuth setup walkthroughs for Clerk. |
| `GDE-003` | The fnox and 1Password playbook. |
| `GDE-004` | The GCE Gaia self-hosted runtime. |
| `GDE-005` | GCP deployment — Cloud Run, App Engine, gcloud configs. |
| `GDE-006` | Local environment: shell activation, remote servers, pi, tmux. |
| `GDE-007` | The pinned pi package list. |
| `GDE-008` | The standard skill set inventory. |
| `GDE-009` | Default technology choices, and what is still undecided. |
| `GDE-010` | Vercel deployment — previews, env sync, Neon, Blob. |

### Skills — capabilities

`skills/` holds every skill The Focus AI owns, one folder per skill
(`skills/<name>/SKILL.md`), installable with
`skills add The-Focus-AI/standards --skill <name>`. A skill is installed and
cited by **name**; `SKL-nnn` is its number on the site. Both the number and the
provenance live in `skills/VENDORED.md`, the skill register, because the skills
CLI owns `SKILL.md`'s frontmatter (`STD-006 §3.12`). `mise run skills:check`
fails if a skill is unregistered, registered twice, or shares a number.
`STD-011` governs how skills are installed and pinned in consuming repositories.

Three former prompts are now skills: `setup-project`, `standardize-project`, and
`develop-design-md`.

`work-next-issue` (`SKL-013`) is the one to reach for when the ask is "pick up
the next thing". It executes `STD-002` and `STD-003` end to end — frontier,
race-safe claim, branch, pull request — and stops at the merge gate. Which issue
is worth the most is the agent's judgement, stated in the claim comment rather
than derived from a priority scheme; `ADR-004` records why there is no scheme.

### Document kinds

Every document this repository owns declares `kind` in its frontmatter, and the
directory it lives in fixes which kind that is. `mise run docs:validate` checks
all of them.

| `kind` | Lives in | Is |
| --- | --- | --- |
| `standard` | `standards/STD-nnn-slug.md` | binding clauses, numbered and citable |
| `guide` | `best-practices/GDE-nnn-slug.md` | explanation and walkthroughs, no clauses |
| `note` | `reports/NOTE-nnn-YYYY-MM-DD-slug.md` | research at a point in time, cited and dated |
| `decision` | `architecture/ADR-nnn-slug.md` | a settled question and its alternatives |
| `prompt` | `prompts/PRM-nnn-slug.md` | instructions an agent executes |
| `skill` | `skills/<name>/SKILL.md` | a capability, numbered `SKL-nnn` in the register |
| `design` | `DESIGN.md` | the design system and its tokens |

A note keeps its date in the filename because it is a capture of a moment and
staleness is the first thing a reader needs. A guide or a decision record does
not: it is a topic that gets revised in place.

`AGENTS.md`, `README.md` and `skills/VENDORED.md` are outside the axis — the
first two are navigation external tooling reads, and the third is the register
of a class rather than a member of it.

### Everything else

- `DESIGN.md` — the design system for standards.thefocus.ai. Validate edits with `mise run design:validate`.
- `architecture/` — decision records (`ADR-001`–`ADR-003`).
- `reports/` — research notes (`NOTE-001`–`NOTE-006`), including the standards gap register and the `best-practices/` inventory.
- `skills-lock.json`, `mise.toml`, `.pi/settings.json` — the repo's own configuration.
- `scripts/` — the bootstrap script, the standards renderer, and the design, document, and skill validators.
- `templates/default-project/` — source templates used by the bootstrap script.
- `prompts/` — `PRM-001` (`prompts/PRM-001-generate-dockerfile.md`) only; the rest became skills.
- `tests/` — validation scripts for this repository.

## How to inspect a project

When auditing or changing another repository, look in this order:

1. Read the target repo's `AGENTS.md`, `CLAUDE.md`, or equivalent agent instructions.
2. Check tool/runtime setup: `mise.toml`, package manager files, lockfiles, scripts/tasks, and
   whether tools are installed through mise.
3. Check the task contract in `STD-004 §3.3`–`§3.6`: install, dev, lint, test, deploy — and that
   lint and test can actually fail.
4. Check skills against `STD-011` and the inventory in `best-practices/GDE-008-skills.md`.
5. Check secrets against `STD-007`: per-project vault, scoped service account, nothing committed.
6. Check deployment against `STD-008`, then the platform guide for specifics.
7. Check project organization: README, docs, prompts, architecture docs, test layout, and whether
   conventions are documented for future agents.
8. Report gaps as an itemized list, then implement safe changes when the request asks for execution.

## Operating rules

- Prefer making concrete repo changes over vague advice when the user asks to update or ensure standards.
- A rule goes in a standard, not a guide. If you find yourself writing MUST in `best-practices/`, it
  belongs in `standards/`.
- Standards are drafted by anyone and ratified only by a person — `STD-001 §3.14`.
- Use `skills add` for skills, not manual copying.
- Use mise for tools and runtimes. Do not recommend global `npm install -g`, `pip install`, or `brew
  install` workflows for project tooling.
- If a standard is ambiguous or missing, call it out and propose the smallest durable addition to this repository.
