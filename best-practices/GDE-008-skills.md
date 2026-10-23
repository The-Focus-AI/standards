---
number: "008"
title: "Standard skill set"
kind: guide
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-10-23"
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
  restores every skill from `skills-lock.json` — equivalent to `npm ci`.
- `skills update -y` — fetches the latest versions and rewrites the hashes in
  `skills-lock.json`. Run periodically, then review and commit the diff.
- `skills use <source> --skill <name>` — emits a skill's `SKILL.md` prompt directly
  from an upstream repository without installing it or modifying `skills-lock.json`.
- `skills list` — shows what's installed and which agents each skill targets.

Notes:

- `experimental_install` and `experimental_sync` are still `experimental_`-prefixed
  as of skills v1.5.13; their names may change in future releases.
- `skills update` uses the GitHub API. We are `gh`-authenticated, so
  deletion-detection works locally; if you see "Failed to check for deleted skills"
  in CI, set `GH_TOKEN`.
- Removing a skill with `skills rm` in v1.5.13 deletes files but leaves the
  `skills-lock.json` entry, so the next `experimental_install` reinstalls it. To
  truly remove a skill, edit `skills-lock.json` by hand (`STD-011 §3.5`).
- Lock entry names must be kebab-case (matching the skill folder and `SKILL.md`
  frontmatter `name`). Do not keep title-case duplicates alongside kebab-case names.

## Standard skill set

The following are installed on all projects and are recorded in `skills-lock.json`
(and mirrored in `templates/default-project/skills-lock.json`). Source repos are
GitHub (`sourceType: github`). Install only this set (`STD-011 §3.7`) — do not run
`skills add mattpocock/skills -y` or `skills add cursor/plugins -y` without naming
the skills, because both repositories also carry skills outside this standard set.

### Skills we own — all in this repository

Every Focus-authored or vendored skill lives in `skills/` here, one folder per
skill, and installs the same way:

```bash
skills add The-Focus-AI/standards --skill <name> -y
```

| Skill | Skill folder | What it does |
| --- | --- | --- |
| `activity-report` | `skills/activity-report` | Live production usage joined against git history → interpreted, client-ready report |
| `tech-research` | `skills/tech-research` | Pick the best library/tool for a need; write a dated, cited report into `reports/` |
| `research-methodology` | `skills/research-methodology` | General research method and report templates (literature review, comparative, exec summary) |
| `browser-automation` | `skills/browser-automation` | Drive Chrome: navigate, extract, screenshot, fill forms, print PDFs |
| `nano-banana-imagegen` | `skills/nano-banana-imagegen` | Generate images — icons, headers, illustrations, photo edits |
| `nano-banana-videogen` | `skills/nano-banana-videogen` | Generate video — image-to-video, scene extension, dialogue |
| `focus-ai-brand` | `skills/focus-ai-brand` | The Focus.AI brand: palettes, type, grid, components, voice |
| `paged-reports` | `skills/paged-reports` | Markdown → paged HTML → PDF, with page-break control and magazine mode |
| `pptx-decks` | `skills/pptx-decks` | Markdown → branded `.pptx` via PptxGenJS, with visual QA |
| `setup-project` | `skills/setup-project` | Scaffold a new project to these standards |
| `standardize-project` | `skills/standardize-project` | Audit an existing project against these standards, plan the migration |
| `standards-map` | `skills/standards-map` | Look up latest standards → dated mapping report (guide applicability, exceptions, gaps) |
| `develop-design-md` | `skills/develop-design-md` | Take a project from no identity to a validated `DESIGN.md` |
| `work-next-issue` | `skills/work-next-issue` | Execute `STD-002` and `STD-003`: frontier → claim → branch → pull request |
| `build-focus-course` | `skills/build-focus-course` | Author a multi-lesson technical course for the Focus.AI platform |

`skills/VENDORED.md` records each skill's `SKL-nnn` number, where it came from, and
at which commit.

**Brand and mechanics are separate on purpose.** `focus-ai-brand` says what things look
like; `paged-reports` and `pptx-decks` say how documents get made. A project with its own
brand uses the mechanics skills with its own `DESIGN.md` and never touches ours. When the
brand changes, only the brand skill changes.

### Third-party utility skills

Not ours; installed from upstream so `skills update` keeps giving us their fixes.

| Skill | Source repo | Skill folder |
| --- | --- | --- |
| `firecrawl` + 8 `firecrawl-*` | `firecrawl/cli` | `skills/firecrawl-*` |
| `find-skills` | `vercel-labs/skills` | `skills/find-skills` |
| `swiss-design` | `zeke/swiss-design-skill` | `swiss-design` |

### pstack engineering workflow and principles (Lauren Tan / @poteto)

[pstack](https://github.com/cursor/plugins/tree/main/pstack) is Lauren Tan's
(@poteto) set of 57 engineering workflow and first-principles skills, published in
`cursor/plugins` under the MIT license (`pstack/LICENSE`, Copyright (c) 2026 Lauren
Tan; `pstack/.cursor-plugin/plugin.json` v0.15.30, verified at `cursor/plugins@8b3326d`).

#### Ensuring the final canonical upstream version (`STD-011 §3.8`)

`cursor/plugins` contains two trees of pstack:

1. **Canonical Cursor-native tree (`pstack/skills/<name>/SKILL.md`)** — the source
   of truth authored for Cursor.
2. **Generated Claude Code adapter tree (`harness/pstack/claude-code/skills/<name>/SKILL.md`)**
   — generated by `scripts/generate-pstack-harness-trees.mjs` and referenced by the
   root `.claude-plugin/marketplace.json`.

Because `skills` CLI's `getPluginSkillPaths()` reads `.claude-plugin/marketplace.json`
when pointed at the repository root, running a bare `skills add cursor/plugins`
resolves to `harness/pstack/claude-code/skills/` instead of `pstack/skills/`. In
addition, `cursor/plugins` carries unrelated plugins (`origin-api`,
`port-github-app-to-origin`), so `STD-011 §3.7` forbids installing with `--all`.

To guarantee you are pulling the latest canonical Cursor-native version from
upstream `main`, always pass the `tree/main/pstack/skills` subpath URL and name the
55 non-colliding skills explicitly:

```bash
skills add https://github.com/cursor/plugins/tree/main/pstack/skills \
  -s architect -s arena -s automate-me -s benchmark-checklist -s blast-radius \
  -s bro -s correct -s create-formal-verification-skill \
  -s create-verification-skill -s figure-it-out -s how -s in-your-own-words \
  -s interrogate -s ketchup -s maintain-formal-verification-skill \
  -s maintain-verification-skill -s make-bot-ui -s no-comments -s poteto-help \
  -s poteto-mode -s principle-attack-the-premise \
  -s principle-boundary-discipline -s principle-build-the-lever \
  -s principle-encode-lessons-in-structure \
  -s principle-exhaust-the-design-space -s principle-experience-first \
  -s principle-explain-the-number -s principle-fix-root-causes \
  -s principle-foundational-thinking -s principle-guard-the-context-window \
  -s principle-laziness-protocol -s principle-make-operations-idempotent \
  -s principle-migrate-callers-then-delete-legacy-apis \
  -s principle-minimize-reader-load -s principle-model-the-domain \
  -s principle-never-block-on-the-human \
  -s principle-outcome-oriented-execution -s principle-prove-it-works \
  -s principle-redesign-from-first-principles \
  -s principle-separate-before-serializing-shared-state \
  -s principle-sequence-verifiable-units -s principle-subtract-before-you-add \
  -s principle-test-behavior-not-implementation \
  -s principle-type-system-discipline -s recall -s reflect -s setup-pstack \
  -s sharpen -s show-me-your-work -s statechart -s swarm -s technical-writing \
  -s typescript-best-practices -s unslop -s why -a cursor -y
```

After installing or updating, an agent MUST run this verification check to confirm
that every `cursor/plugins` entry in `skills-lock.json` points to `pstack/skills/`
and has a 64-hex SHA-256 `computedHash`:

```bash
jq -e '
  [.skills | to_entries[] | select(.value.source == "cursor/plugins")]
  | length == 55 and all(
      (.value.skillPath | startswith("pstack/skills/")) and
      (.value.computedHash | test("^[0-9a-f]{64}$"))
    )
' skills-lock.json
```

**CLI version caveat (`skills@1.5.13` vs `skills>=1.7.4`).** In `skills` v1.5.13,
`skills experimental_install` (`runInstallFromLock`) and `skills update`
(`updateProjectSkills`) ignore `entry.skillPath` and re-clone `cursor/plugins#main`
from the repository root, which causes `.claude-plugin/marketplace.json` to rewrite
`skillPath` to `harness/pstack/claude-code/skills/<name>/SKILL.md`. (`skills`
v1.7.4 fixes this via `buildLocalUpdateSource(entry)`, which appends
`entry.skillPath`.) While `skills@1.5.13` is pinned, refresh pstack skills to the
latest upstream `main` by re-running the explicit `skills add
https://github.com/cursor/plugins/tree/main/pstack/skills ...` command above, then
running the `jq -e` check and reviewing `git diff skills-lock.json` (`STD-011 §3.6`).

#### Entry, setup, and context

| Skill | Skill folder | Role |
| --- | --- | --- |
| `poteto-mode` | `pstack/skills/poteto-mode` | Primary router: picks a playbook (bug fix, feature, refactor, perf, investigation, plan) and orchestrates supporting skills |
| `poteto-help` | `pstack/skills/poteto-help` | Guide to pstack setup, `/poteto-mode`, and choosing which skill, playbook, or principle fits a task |
| `setup-pstack` | `pstack/skills/setup-pstack` | Configure per-role models and reasoning budget for pstack subagents |
| `recall` | `pstack/skills/recall` | Reconstruct recent working context from chat history, git state, and shared records |
| `ketchup` | `pstack/skills/ketchup` | Summarize what changed in the current chat since the user's last message, with open decisions listed |
| `in-your-own-words` | `pstack/skills/in-your-own-words` | Restate the user's goals and problem in plain language before starting work |
| `bro` | `pstack/skills/bro` | Restate the last message in plain human language with no jargon |
| `sharpen` | `pstack/skills/sharpen` | Rewrite a task prompt deeper (raw material, methods, outside check) before executing |
| `show-me-your-work` | `pstack/skills/show-me-your-work` | Maintain a reviewable TSV decision log (`what`, `why`, `evidence`, `result`) for unattended or multi-phase runs |

#### Codebase understanding (`how`, `why`, `teach`)

| Skill | Skill folder | Role |
| --- | --- | --- |
| `how` | `pstack/skills/how` | Explain how a subsystem works at runtime, ownership, and placement before changing code |
| `why` | `pstack/skills/why` | Trace why code is shaped a given way across git history, tracker, docs, and telemetry |
| `teach` *(see collision rules below)* | `pstack/skills/teach` | Run `how` and `why` in parallel and weave the findings into one plain explanation via `unslop` |

#### Design, parallelism, and adversarial review

| Skill | Skill folder | Role |
| --- | --- | --- |
| `architect` | `pstack/skills/architect` | Sketch types, signatures, and module boundaries before writing code across a seam |
| `arena` | `pstack/skills/arena` | Spawn N parallel candidates on the same brief, pick a base, and graft the strongest parts together |
| `swarm` | `pstack/skills/swarm` | Fan out N parallel workers across slices or races, drain them, and return one consolidated report |
| `interrogate` | `pstack/skills/interrogate` | Multi-model adversarial review to challenge a design or diff from independent angles |
| `blast-radius` | `pstack/skills/blast-radius` | Find what a change could break outside the diff and prove safety by running real code |
| `figure-it-out` | `pstack/skills/figure-it-out` | Design an auditable hypothesis-loop playbook for large migrations or multi-part changes |
| `statechart` | `pstack/skills/statechart` | Render user-visible state machines from TLA+ models as colour-coded Mermaid statecharts |

#### Verification, testing, and quality

| Skill | Skill folder | Role |
| --- | --- | --- |
| `create-verification-skill` | `pstack/skills/create-verification-skill` | Generate a project-local skill that drives the real app (UI, CLI, or service) like a user |
| `maintain-verification-skill` | `pstack/skills/maintain-verification-skill` | Audit and update a project's verification skill and feature map against current code |
| `create-formal-verification-skill` | `pstack/skills/create-formal-verification-skill` | Generate a formal verification skill (TLA+, model checking, property testing) for high-cost concurrency/state code |
| `maintain-formal-verification-skill` | `pstack/skills/maintain-formal-verification-skill` | Sync formal verification models and properties with code changes and classify failures as drift vs bug |
| `benchmark-checklist` | `pstack/skills/benchmark-checklist` | Vet a performance or eval measurement (limiter, tuning, repeatability, relevance) before reporting it |
| `tdd` *(see collision rules below)* | `pstack/skills/tdd` | Write a focused failing-before regression test for a bug fix when a cheap local test path exists |
| `typescript-best-practices` | `pstack/skills/typescript-best-practices` | TypeScript rules for reading or editing `.ts` and `.tsx` files |
| `no-comments` | `pstack/skills/no-comments` | Strip unnecessary comments and encode claimed constraints in types, lints, or tests |
| `unslop` | `pstack/skills/unslop` | Cut AI tells, filler, and hedging from prose |
| `technical-writing` | `pstack/skills/technical-writing` | Diátaxis structure, Google developer style, STE instruction rules, and Global English |
| `correct` | `pstack/skills/correct` | Turn repeated agent mistakes into structural prevention (architecture → types → lint → test → docs) |
| `reflect` | `pstack/skills/reflect` | Spawn three review subagents over a session transcript and route learnings into skill edits |
| `automate-me` | `pstack/skills/automate-me` | Capture a user's preferences and working style into a personal `-mode` skill |
| `make-bot-ui` | `pstack/skills/make-bot-ui` | Build a custom UI page/dashboard that wakes a Grok Bot over a webhook or Tailscale |

#### First-principles skills (`principle-*`)

| Skill | Skill folder | When to apply |
| --- | --- | --- |
| `principle-attack-the-premise` | `pstack/skills/principle-attack-the-premise` | Two or more fixes sharing one premise failed the same gate — test the premise directly |
| `principle-boundary-discipline` | `pstack/skills/principle-boundary-discipline` | Concentrate validation and adapters at system boundaries; keep internal logic pure |
| `principle-build-the-lever` | `pstack/skills/principle-build-the-lever` | Build a repeatable script, codemod, generator, or verifier instead of doing non-trivial work by hand |
| `principle-encode-lessons-in-structure` | `pstack/skills/principle-encode-lessons-in-structure` | Encode recurring instructions as a lint, type, runtime check, or script rather than prose |
| `principle-exhaust-the-design-space` | `pstack/skills/principle-exhaust-the-design-space` | Build 2–3 competing prototypes side by side for novel UI or architecture choices |
| `principle-experience-first` | `pstack/skills/principle-experience-first` | Ship fewer polished features over more rough ones when UX and convenience trade off |
| `principle-explain-the-number` | `pstack/skills/principle-explain-the-number` | Find the limiter and rule out measurement error before trusting a benchmark or eval number |
| `principle-fix-root-causes` | `pstack/skills/principle-fix-root-causes` | Trace symptoms to the first place state went wrong; add guards only for legitimate states |
| `principle-foundational-thinking` | `pstack/skills/principle-foundational-thinking` | Settle core types, data structures, and shared state before writing logic |
| `principle-guard-the-context-window` | `pstack/skills/principle-guard-the-context-window` | Route bulk reads and fan-out work to subagents; keep concise summaries in the main thread |
| `principle-laziness-protocol` | `pstack/skills/principle-laziness-protocol` | Bias toward deletion and the smallest diff that solves the problem |
| `principle-make-operations-idempotent` | `pstack/skills/principle-make-operations-idempotent` | Make commands and loops converge to the same end state across retries and crashes |
| `principle-migrate-callers-then-delete-legacy-apis` | `pstack/skills/principle-migrate-callers-then-delete-legacy-apis` | Migrate callers and remove the old internal API in the same wave instead of keeping shims |
| `principle-minimize-reader-load` | `pstack/skills/principle-minimize-reader-load` | Collapse single-caller wrappers and shrink mutable scope to reduce hops for the reader |
| `principle-model-the-domain` | `pstack/skills/principle-model-the-domain` | Replace scattered boolean branches and shape assumptions with explicit domain types |
| `principle-never-block-on-the-human` | `pstack/skills/principle-never-block-on-the-human` | Execute reversible work autonomously instead of asking permission mid-flight |
| `principle-outcome-oriented-execution` | `pstack/skills/principle-outcome-oriented-execution` | Converge directly on the target architecture during phased rewrites without throwaway shims |
| `principle-prove-it-works` | `pstack/skills/principle-prove-it-works` | Verify against the real running artifact, never "it compiles" or self-report |
| `principle-redesign-from-first-principles` | `pstack/skills/principle-redesign-from-first-principles` | Redesign from the new invariant set instead of bolting a requirement onto an old shape |
| `principle-separate-before-serializing-shared-state` | `pstack/skills/principle-separate-before-serializing-shared-state` | Eliminate shared mutable state between concurrent actors before reaching for locks |
| `principle-sequence-verifiable-units` | `pstack/skills/principle-sequence-verifiable-units` | Stack work in small commits/PRs where each unit ends in a verifiable state (failing test before fix) |
| `principle-subtract-before-you-add` | `pstack/skills/principle-subtract-before-you-add` | Remove dead code, redundant validators, and stubs before adding new behaviour |
| `principle-test-behavior-not-implementation` | `pstack/skills/principle-test-behavior-not-implementation` | Assert user-observable behaviour so refactors do not break tests |
| `principle-type-system-discipline` | `pstack/skills/principle-type-system-discipline` | Make illegal states unrepresentable, brand primitives, parse at boundaries, exhaust variants |

#### Same-name collision resolution: `tdd` and `teach` (`STD-011 §3.9`)

Both `mattpocock/skills` and `cursor/plugins` (`pstack/skills`) ship skills whose
`SKILL.md` frontmatter declares `name: tdd` and `name: teach`.

**Why both cannot occupy `skills-lock.json` at once:**

1. `skills-lock.json` (version 1) stores skills in a single JSON map
   `skills: { "<name>": { source, sourceType, skillPath, computedHash } }` keyed by
   the `name` field in `SKILL.md` frontmatter (`addSkillToLocalLock(skill.name, …)`
   in `skills/dist/cli.mjs`).
2. On disk, `skills` CLI installs into `.agents/skills/<name>/SKILL.md`, and `pi`'s
   skill loader (`@earendil-works/pi-coding-agent/dist/core/skills.js`) keys its
   `skillMap` by `skill.name` and drops duplicate names as collisions.
3. `skills` CLI does not support alias keys in `skills-lock.json`: `skills
   experimental_install` passes `--skill <key>` to `runAdd`, where `filterSkills()`
   matches `<key>` strictly against the upstream `SKILL.md` frontmatter `name`. A
   renamed key such as `"pstack-tdd"` fails to match `pstack/skills/tdd/SKILL.md`.

**Catalog mapping and agent decision rule:**

| Skill name | Source A (`mattpocock/skills` — locked default in `skills-lock.json`) | Source B (`cursor/plugins` pstack — available on demand or by project switch) | Agent selection rule |
| --- | --- | --- | --- |
| `tdd` | `skills/engineering/tdd/SKILL.md` (`computedHash`: `81eca2a5…`) — full red-green-refactor loop across architectural seams (`GLOSSARY.md`, ADRs, vertical slices) | `pstack/skills/tdd/SKILL.md` (`computedHash`: `d3316fbb89ac596c91bb8d529180393c3b69fb6408f7d5cdccb74ead97cbf188`) — focused failing-before regression test for a bug fix when a cheap local test path exists; skips when integration-heavy | Use **Source A (`mattpocock`)** when implementing a feature or vertical slice test-first from a spec (`/implement`). Use **Source B (`pstack`)** when fixing a bug with a cheap local reproduction under `/poteto-mode` (`playbooks/bug-fix.md`). |
| `teach` | `skills/productivity/teach/SKILL.md` (`computedHash`: `68999bb1…`) — stateful multi-session teaching workspace (`MISSION.md`, `./lessons/`, `./reference/*.html`, learning records) | `pstack/skills/teach/SKILL.md` (`computedHash`: `371a2a40807cc1c0611d50b8170b2395f9c0297f7eb475e071018e12aa766bc5`) — explain a change or subsystem in one plain account by running `how` and `why` in parallel and writing through `unslop` | Use **Source A (`mattpocock`)** when the user asks to learn a topic across sessions in a workspace. Use **Source B (`pstack`)** when explaining how and why code or a diff in the repository works. |

**How an agent invokes or switches between them:**

```bash
# 1. Invoke pstack's tdd or teach on demand WITHOUT modifying skills-lock.json or .agents/skills/:
skills use https://github.com/cursor/plugins/tree/main/pstack/skills --skill tdd
skills use https://github.com/cursor/plugins/tree/main/pstack/skills --skill teach

# 2. Invoke Matt Pocock's tdd or teach on demand:
skills use mattpocock/skills --skill tdd
skills use mattpocock/skills --skill teach

# 3. Switch a repository's locked tdd and teach to pstack (updates .agents/skills/ and skills-lock.json):
skills add https://github.com/cursor/plugins/tree/main/pstack/skills -s tdd -s teach -a cursor -y

# 4. Switch a repository's locked tdd and teach back to mattpocock:
skills add mattpocock/skills -s tdd -s teach -a cursor -y
```

#### Dependencies outside `skills-lock.json`

Several pstack skills (`poteto-mode` and its playbooks, `poteto-help`, `reflect`)
reference capabilities that are not skills in `pstack/skills/`:

- **`cursor-team-kit` plugin skills** (`deslop`, `control-cli`, `control-ui`) —
  separate plugin; skip those steps unless `cursor-team-kit` is installed.
- **`poteto-agent` subagent** (`pstack/agents/poteto-agent.md`) — Cursor plugin
  agent definition, not installed by the `skills` CLI; use the host agent's native
  subagent tool instead.
- **Plugin guide docs** (`../../docs/guide/*.md`, `../../docs/harness/claude-code.md`)
  — relative links in `poteto-help` that live outside `pstack/skills/` in
  `cursor/plugins`.
- **Cursor Bugbot and Automations** — Cursor product features; skip with a one-line
  note when running outside Cursor.

### Product / planning / architecture workflow (`mattpocock/skills`)

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
skills add https://github.com/cursor/plugins/tree/main/pstack/skills --skill poteto-mode -y
skills add firecrawl/cli -y   # OK: firecrawl/cli is entirely in the standard set
```

Then commit the updated `skills-lock.json` (and `templates/default-project/skills-lock.json`
when adding to the standard set). Run `mise install` (or `skills experimental_install`)
to reproduce on another machine.

## Keeping skills current

```bash
skills update -y        # update all project skills, rewrite hashes
skills update find-skills firecrawl wayfinder -y   # update a subset
git diff skills-lock.json   # review before committing (STD-011 §3.6)
```
