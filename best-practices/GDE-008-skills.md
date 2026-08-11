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

- `skills add <github-repo> --agent claude-code` — installs skill(s) into
  `.claude/skills/` and records an entry in `skills-lock.json`, including a
  `computedHash` pinning the current version.
- `skills-lock.json` — the committed, reproducible source of truth (analogous to
  `package-lock.json`). This is what makes installs identical across machines and CI.
- `mise install` / `[tasks.install]` replays the lock as one `skills add` per source
  — the equivalent of `npm ci`. The recipe is under
  [Installing every locked skill](#installing-every-locked-skill).
- `skills update -y` — fetches the latest versions and rewrites the hashes in
  `skills-lock.json`. Run periodically, then review and commit the diff.
- `skills list` — shows what's installed and which agents each skill targets.

### Where skills have to land

This is the one thing to get right, and the CLI's own restore command gets it wrong.

Claude Code loads project skills from `.claude/skills/` only — plus `~/.claude/skills/`
for personal ones, plugins, and enterprise settings. It does **not** read
`.agents/skills/`.

`skills experimental_install` writes to `.agents/skills/` and nowhere else. It picks
its targets by calling `getUniversalAgents()`, which the CLI defines as exactly those
agents whose `skillsDir` is `.agents/skills` — and Claude Code's entry is
`.claude/skills`, so it is excluded by construction. The command also parses `--agent`
and then ignores it. Verified against `skills@1.5.13`: restoring a 46-entry lock
installs 45 skills, puts every one of them in `.agents/skills/`, creates no
`.claude/skills/` at all, and exits 0.

That is the failure this guide exists to prevent — an install that reports success and
leaves the agent with no skills. `skills add` *does* honour `--agent`, so every command
in this guide passes `--agent claude-code`, and `mise run install` does the same.

Add `.claude/skills/` to `.gitignore` on a project that installs from a lock; it is
build output. The exception is a skill written for one repository and never installed
from anywhere, which is committed.

### Other notes

- `skills update` uses the GitHub API. We are `gh`-authenticated, so
  deletion-detection works locally; if you see "Failed to check for deleted skills"
  in CI, set `GH_TOKEN`.
- Removing a skill with `skills rm` deletes files but leaves the `skills-lock.json`
  entry, so the next install reinstalls it. To truly remove a skill, delete its
  `skills-lock.json` entry as well (`STD-011 §3.5`).
- Lock entry names must be kebab-case (matching the skill folder). Do not keep
  title-case duplicates alongside kebab-case names.
- A skill that disappears from its upstream repository is dropped silently, and the
  install still exits 0. Compare the number of skills reported installed against the
  number of entries in the lock; a shortfall is an upstream rename. `mise run install`
  checks this for you.

## Standard skill set

Forty-six skills, all recorded in `skills-lock.json`, all installed on every project.
Source repos are GitHub (`sourceType: github`). The tables below are the whole set —
if a skill is not in one of them it is not standard. Install only this set: do not
`skills add mattpocock/skills -y` blindly, because that repo also contains course and
writing skills that are not part of TheFocus.AI standards (`STD-011 §3.7`).

The same inventory, generated from the lock rather than typed, is published for agents
at <https://standards.thefocus.ai/llms.txt>. When the two disagree, the generated one
is right and this one has drifted — `mise run skills:check` fails on exactly that.

### Skills we own — all in this repository

Every Focus-authored skill lives in `skills/` here, one folder per skill, and installs
the same way:

```bash
skills add The-Focus-AI/standards --skill <name> --agent claude-code -y
```

| Skill | What it does |
| --- | --- |
| `activity-report` | Live production usage joined against git history → interpreted, client-ready report |
| `browser-automation` | Drive Chrome: navigate, extract, screenshot, fill forms, print PDFs |
| `develop-design-md` | Take a project from no identity to a validated `DESIGN.md` |
| `focus-ai-brand` | The Focus.AI brand: palettes, type, grid, components, voice |
| `nano-banana-imagegen` | Generate images — icons, headers, illustrations, photo edits |
| `nano-banana-videogen` | Generate video — image-to-video, scene extension, dialogue |
| `paged-reports` | Markdown → paged HTML → PDF, with page-break control and magazine mode |
| `pptx-decks` | Markdown → branded `.pptx` via PptxGenJS, with visual QA |
| `research-methodology` | General research method and report templates (literature review, comparative, exec summary) |
| `setup-project` | Scaffold a new project to these standards |
| `standardize-project` | Audit an existing project against these standards, plan the migration |
| `standards-map` | Look up latest standards → dated mapping report (guide applicability, exceptions, gaps) |
| `tech-research` | Pick the best library/tool for a need; write a dated, cited report into `reports/` |
| `work-next-issue` | Take the next issue off the frontier and carry it to an open pull request |

`skills/VENDORED.md` records where each one came from, at which commit, and what its
`SKL-nnn` number is.

**Brand and mechanics are separate on purpose.** `focus-ai-brand` says what things look
like; `paged-reports` and `pptx-decks` say how documents get made. A project with its own
brand uses the mechanics skills with its own `DESIGN.md` and never touches ours. When the
brand changes, only the brand skill changes.

### Third-party skills — scraping, discovery, design

Not ours; installed from upstream so `skills update` keeps giving us their fixes.
Listed individually rather than as `firecrawl-*`, because a reader checking whether a
skill is standard needs to find its name, not a glob.

| Skill | Source repo | Skill folder |
| --- | --- | --- |
| `firecrawl` | firecrawl/cli | `skills/firecrawl-cli` |
| `firecrawl-agent` | firecrawl/cli | `skills/firecrawl-agent` |
| `firecrawl-crawl` | firecrawl/cli | `skills/firecrawl-crawl` |
| `firecrawl-download` | firecrawl/cli | `skills/firecrawl-download` |
| `firecrawl-interact` | firecrawl/cli | `skills/firecrawl-interact` |
| `firecrawl-map` | firecrawl/cli | `skills/firecrawl-map` |
| `firecrawl-parse` | firecrawl/cli | `skills/firecrawl-parse` |
| `firecrawl-scrape` | firecrawl/cli | `skills/firecrawl-scrape` |
| `firecrawl-search` | firecrawl/cli | `skills/firecrawl-search` |
| `find-skills` | vercel-labs/skills | `skills/find-skills` |
| `swiss-design` | zeke/swiss-design-skill | `swiss-design` |

### Product / planning / architecture workflow

All from `mattpocock/skills`. Canonical set matches the engineering/productivity bundle
used in production projects (for example walking-thoughts): 21 skills.

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

There is one spec skill and one ticket skill, not two of each. `mattpocock/skills`
renamed `to-prd` → `to-spec` and merged `to-plan` / `to-issues` → `to-tickets`. Do not
install the deprecated `to-prd` or `to-issues` skills in new projects.

`writing-great-skills` was dropped from the set on 2026-08-11: it no longer exists
upstream, where `skills/productivity/` now carries `writing-for-agents` instead. It was
still in the lock, and the install had been skipping it silently — 46 entries, 45
skills, exit 0 — which is the failure mode described under
[Other notes](#other-notes).

## Authoring a skill in this repository

Skills we own live under `skills/<skill-name>/SKILL.md` at the root of this repo, one
folder per skill, so `skills add The-Focus-AI/standards --skill <skill-name>` works the
same way as any third-party source. Write the frontmatter `description` for triggering —
say what the skill does *and* the phrases that should invoke it. `STD-006 §3.12` governs
the rest of the shape.

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
copy of the lock file from the same run. Both copies — `skills-lock.json` here and
`templates/default-project/skills-lock.json` — have to carry the entry, and
`mise run skills:check` fails if they disagree. Never hand-write a `computedHash`; a
wrong hash makes the install non-reproducible.

### Vendoring policy

Skills TheFocus.AI writes belong here, not scattered across the repos that happened to
birth them. When a skill turns up elsewhere, move it in, record it in
`skills/VENDORED.md` with its source commit, and delete the original so the two cannot
drift.

Third-party skills are the opposite: leave them upstream. Copying them in means
republishing someone else's work and inheriting their maintenance — `skills update`
already gives us their fixes for free.

### Note on repository visibility

`The-Focus-AI/standards` is public, so `skills add` against it needs no authentication —
neither locally nor in CI. Every source in the standard set is public. If the repository
is ever made private, `skills add` falls back to `gh auth token` locally and CI needs
`GH_TOKEN`.

## Installing every locked skill

On a fresh clone, a new machine, or in CI. This is what `mise run install` runs, and it
is the answer to "install the skills" and to "why did nothing get installed":

```bash
node -e '
  const { execFileSync } = require("node:child_process");
  const l = require("./skills-lock.json").skills, by = {};
  for (const [name, e] of Object.entries(l)) (by[e.source] ??= []).push(name);
  for (const [source, names] of Object.entries(by))
    execFileSync("skills", ["add", source, ...names.flatMap((n) => ["--skill", n]), "--agent", "claude-code", "-y"],
      { stdio: ["ignore", "inherit", "inherit"] });
'
```

One `skills add` per source, every skill in the lock, into `.claude/skills/`. Do not
substitute `skills experimental_install` — see
[Where skills have to land](#where-skills-have-to-land) for why it silently does nothing
useful for Claude Code.

**Do not rewrite this as a pipe into `sh`.** The obvious tidier form — print the commands
and pipe them — installs only the first source and exits 0. `skills add` reads stdin, so
it consumes the rest of the command list off the pipe and the remaining sources are never
attempted. Verified: 14 skills installed out of 46. Hence `execFileSync` with stdin set
to `ignore`, which hands each child `/dev/null`.

Then check what landed:

```bash
mise run skills:check -- --installed   # every locked skill present in .claude/skills/
```

## Updating every skill

When you are asked to update all the skills, this is the whole procedure. Step 1 alone
is not enough: `skills update` rewrites the lock and installs nothing.

```bash
skills update -y            # fetch latest, rewrite every hash in skills-lock.json
git diff skills-lock.json   # review it — STD-011 §3.6 forbids committing this unread
```

Then re-run the install block above so the refreshed skills reach `.claude/skills/`, run
`mise run skills:check`, and commit both `skills-lock.json` and
`templates/default-project/skills-lock.json`. Update a subset with
`skills update find-skills firecrawl wayfinder -y`.

Reviewing the diff is not a formality. `skills update` rewrites hashes across the whole
lock, and committing that unread accepts a behaviour change to every agent that touches
the repository, sight unseen — the closest thing this fleet has to a supply-chain event.

## Adding or removing one skill

Add a specific skill folder, never the entire upstream repo:

```bash
skills add <owner>/<repo> --skill <folder> --agent claude-code -y
skills add mattpocock/skills --skill triage --agent claude-code -y
skills add firecrawl/cli --agent claude-code -y   # OK: firecrawl/cli is entirely in the set
```

Then add the entry to both lock files and commit. Removing a skill means deleting its
lock entry as well as its files — `skills rm` leaves the entry behind and the next
install puts the skill back (`STD-011 §3.5`).
