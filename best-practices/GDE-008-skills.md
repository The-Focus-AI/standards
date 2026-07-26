---
number: "008"
title: "Standard skill set"
kind: guide
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-07-25"
---

> Rules extracted to STD-011; this is the skill inventory.

# Standard Skills

Skills are managed with the `skills` CLI (npm package `skills`), pinned in
`mise.toml` as `"npm:skills"`. Always use `skills add ...` to install skills —
never manually copy skill directories. After `mise install`, the `skills` binary is
on PATH, so prefer it over `npx skills` to avoid version drift.

## How it works

- `skills add <github-repo>` — installs skill(s) into `.agents/skills/` (and other
  detected agent dirs) and records an entry in `skills-lock.json`, including a
  `computedHash` pinning the current version.
- `skills-lock.json` — the committed, reproducible source of truth (analogous to
  `package-lock.json`). This is what makes installs identical across machines and CI.
- `mise install` / `[tasks.install]` runs `skills experimental_install`, which
  restores every skill from `skills-lock.json` by hash — equivalent to `npm ci`.
- `skills update -y` — fetches the latest versions and rewrites the hashes in
  `skills-lock.json`. Run periodically, then review and commit the diff.
- `skills list` — shows what's installed and which agents each skill targets.

Notes:

- `experimental_install` and `experimental_sync` are still `experimental_`-prefixed
  as of skills v1.5.13; their names may change in future releases.
- `skills update` uses the GitHub API. We are `gh`-authenticated, so
  deletion-detection works locally; if you see "Failed to check for deleted skills"
  in CI, set `GH_TOKEN`.
- Removing a skill with `skills rm` deletes files but leaves the `skills-lock.json`
  entry, so the next `experimental_install` reinstalls it. To truly remove a skill,
  edit `skills-lock.json` by hand (or delete it and re-add the ones you want).
- Lock entry names must be kebab-case (matching the skill folder). Do not keep
  title-case duplicates alongside kebab-case names.

## Standard skill set

The following are installed on all projects and are recorded in `skills-lock.json`.
Source repos are GitHub (`sourceType: github`). Install only this set — do not
`skills add mattpocock/skills -y` blindly; that repo also contains course/writing
skills that are not part of TheFocus.AI standards.

### Skills we own — all in this repository

Every Focus-authored skill lives in `skills/` here, one folder per skill, and installs
the same way:

```bash
skills add The-Focus-AI/standards --skill <name> -y
```

| Skill | What it does |
| --- | --- |
| `activity-report` | Live production usage joined against git history → interpreted, client-ready report |
| `tech-research` | Pick the best library/tool for a need; write a dated, cited report into `reports/` |
| `research-methodology` | General research method and report templates (literature review, comparative, exec summary) |
| `browser-automation` | Drive Chrome: navigate, extract, screenshot, fill forms, print PDFs |
| `nano-banana-imagegen` | Generate images — icons, headers, illustrations, photo edits |
| `nano-banana-videogen` | Generate video — image-to-video, scene extension, dialogue |
| `focus-ai-brand` | The Focus.AI brand: palettes, type, grid, components, voice |
| `paged-reports` | Markdown → paged HTML → PDF, with page-break control and magazine mode |
| `pptx-decks` | Markdown → branded `.pptx` via PptxGenJS, with visual QA |
| `setup-project` | Scaffold a new project to these standards |
| `standardize-project` | Audit an existing project against these standards, plan the migration |
| `develop-design-md` | Take a project from no identity to a validated `DESIGN.md` |

`skills/VENDORED.md` records where each one came from and at which commit.

**Brand and mechanics are separate on purpose.** `focus-ai-brand` says what things look
like; `paged-reports` and `pptx-decks` say how documents get made. A project with its own
brand uses the mechanics skills with its own `DESIGN.md` and never touches ours. When the
brand changes, only the brand skill changes.

### Third-party skills

Not ours; installed from upstream so `skills update` keeps giving us their fixes.

| Skill | Source repo | Skill folder |
| --- | --- | --- |
| `firecrawl` + 8 `firecrawl-*` | firecrawl/cli | `skills/firecrawl-*` |
| `find-skills` | vercel-labs/skills | `skills/find-skills` |
| `swiss-design` | zeke/swiss-design-skill | `swiss-design` |

### Product / planning / architecture workflow

All from `mattpocock/skills`. Canonical set matches the full engineering/productivity
bundle used in production projects (for example walking-thoughts): 22 skills.

Default flow: grill the idea, produce a spec, break it into tickets, implement a
ticket, then run code review. Use `wayfinder` before the spec when the work is
too large or foggy for one agent session. Use `ask-matt` when unsure which skill
fits. Run `setup-matt-pocock-skills` once per repo before first use of the
tracker-backed skills.

Issue states, the label vocabulary, claiming, and Wayfinder operations are
specified by `STD-002`, which binds every repository worked by an agent. A
project records only its own tracker configuration — which tracker, and the
local fallback path — in its `AGENTS.md`.

#### Setup and routing

| Skill | Skill folder | Role |
| --- | --- | --- |
| `setup-matt-pocock-skills` | `skills/engineering/setup-matt-pocock-skills` | One-time repo setup: tracker, triage labels, domain docs |
| `ask-matt` | `skills/engineering/ask-matt` | Router — which skill/flow fits the situation |
| `writing-great-skills` | `skills/productivity/writing-great-skills` | Reference for authoring predictable skills |

#### Planning and tickets

| Skill | Skill folder | Role |
| --- | --- | --- |
| `grill-me` | `skills/productivity/grill-me` | Relentless interview to sharpen a plan or design |
| `grilling` | `skills/productivity/grilling` | Stress-test a plan/decision/idea (grill trigger phrases) |
| `grill-with-docs` | `skills/engineering/grill-with-docs` | Grill while creating ADRs and glossary docs |
| `wayfinder` | `skills/engineering/wayfinder` | Multi-session planning map for large or foggy work |
| `research` | `skills/engineering/research` | Primary-source research into a Markdown note |
| `to-spec` | `skills/engineering/to-spec` | Conversation → specification on the tracker |
| `to-tickets` | `skills/engineering/to-tickets` | Spec/plan → blocked vertical-slice tickets |
| `triage` | `skills/engineering/triage` | Move issues/PRs through triage roles to agent-ready briefs |
| `prototype` | `skills/engineering/prototype` | Throwaway logic/UI prototype for a design question |
| `handoff` | `skills/productivity/handoff` | Compact the conversation for another agent |

#### Implementation and quality

| Skill | Skill folder | Role |
| --- | --- | --- |
| `implement` | `skills/engineering/implement` | Implement work from a spec or tickets |
| `tdd` | `skills/engineering/tdd` | Red/green testing at agreed seams |
| `code-review` | `skills/engineering/code-review` | Standards + spec review since a fixed point |
| `diagnosing-bugs` | `skills/engineering/diagnosing-bugs` | Diagnosis loop for hard bugs / regressions |
| `resolving-merge-conflicts` | `skills/engineering/resolving-merge-conflicts` | Resolve in-progress merge/rebase conflicts |

#### Domain and architecture

| Skill | Skill folder | Role |
| --- | --- | --- |
| `domain-modeling` | `skills/engineering/domain-modeling` | Ubiquitous language, CONTEXT.md, ADRs |
| `codebase-design` | `skills/engineering/codebase-design` | Deep-module vocabulary and seam design |
| `improve-codebase-architecture` | `skills/engineering/improve-codebase-architecture` | Scan for deepening opportunities, grill one |
| `teach` | `skills/productivity/teach` | Teach a skill or concept in-workspace |

`mattpocock/skills` renamed `to-prd` → `to-spec` and merged `to-plan` /
`to-issues` → `to-tickets`. Do not install the deprecated `to-prd` or
`to-issues` skills in new projects.

## Authoring a skill in this repository

Skills we own live under `skills/<skill-name>/SKILL.md` at the root of this repo, one
folder per skill, so `skills add The-Focus-AI/standards --skill <skill-name>` works the
same way as any third-party source. Write the frontmatter `description` for triggering —
say what the skill does *and* the phrases that should invoke it. `writing-great-skills`
is the reference for the rest.

Layout, per skill:

```text
skills/<name>/
  SKILL.md          # required — frontmatter + the process
  references/       # optional — long-form detail, read on demand
  templates/        # optional — files the skill produces from
  examples/         # optional — worked examples
```

Keep `SKILL.md` to the process and the pitfalls; push anything long into `references/`
and link it from a table. A skill that inlines 600 lines of detail is a skill nobody
reads to the end of.

`mise run skills:check` validates the whole directory — frontmatter present, `name`
kebab-case and matching the folder, `description` substantial and within the CLI's
1024-character limit, and every `references/…` path actually existing. It runs as part
of `mise lint`, so a broken skill fails CI rather than failing at install time.

Once the skill is on `main`, run `skills add` against it from a project so the CLI
computes and records the hash in that project's `skills-lock.json`; commit the standards
copy of the lock file from the same run. Never hand-write a `computedHash` — a wrong
hash makes `experimental_install` non-reproducible.

### Vendoring policy

Skills TheFocus.AI writes belong here, not scattered across the repos that happened to
birth them. When a skill turns up elsewhere, move it in, record it in
`skills/VENDORED.md` with its source commit, and delete the original so the two cannot
drift.

Third-party skills are the opposite: leave them upstream. Copying them in means
republishing someone else's work and inheriting their maintenance — `skills update`
already gives us their fixes for free.

### Note on repository visibility

`The-Focus-AI/standards` is private, so `skills add` against it needs GitHub auth. That
is fine locally (the CLI falls back to `gh auth token`) but CI needs `GH_TOKEN` set. If
these skills are ever to be installable by people outside the org, they need to move to
a public repo — that is a decision, not an oversight.

## Adding a new skill

Prefer adding a specific skill folder, not the entire upstream repo:

```bash
skills add <owner>/<repo> --skill <folder> -y
skills add mattpocock/skills --skill triage -y
skills add firecrawl/cli -y   # OK: firecrawl/cli is entirely in the standard set
```

Then commit the updated `skills-lock.json`. Run `mise install` (or
`skills experimental_install`) to reproduce on another machine.

## Keeping skills current

```bash
skills update -y        # update all project skills, rewrite hashes
skills update find-skills firecrawl wayfinder -y   # update a subset
git diff skills-lock.json   # review before committing
```
