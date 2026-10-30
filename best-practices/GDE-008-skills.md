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

The root and default-project manifests pin **1.7.4**, the npm `latest` release
checked on 2026-10-30. It requires Node **22.20.0 or newer**. The CLI behavior
below was checked against that release; this does not update every upstream
skill's content or imply its integration has been tested.

## How it works

- `skills add <github-repo>` — installs skill(s) into `.agents/skills/` (and other
  detected agent dirs) and records an entry in `skills-lock.json`, including a
  `computedHash` recording the fetched content.
- `skills-lock.json` — the committed inventory of selected skills and sources,
  with immutable commit refs rather than moving branches.
- `mise run install` runs `scripts/restore-skills.mjs`. It invokes the CLI in a
  temporary directory, checks the entire inventory and installed content hashes,
  and replaces `.agents/skills/` only after verification. It never rewrites the
  project lock. The template copies this helper from the canonical script.
- `skills update --project -y` checks recorded refs, so a commit-pinned source
  does not advance to latest. Updating content deliberately means selecting a
  new commit with `skills add`, then reviewing the diff. Always scope updates
  to the project; an unscoped named update can also change global skills.
- `skills use <source> --skill <name>` — emits a skill's `SKILL.md` prompt directly
  from an upstream repository without installing it or modifying `skills-lock.json`.
- `skills list` — shows what's installed and which agents each skill targets.

Notes for 1.7.4:

- Restore is still `experimental_install`; `skills install` is an alias for
  `add`, not lock restoration. There is no frozen restore mode: unknown flags
  such as `--frozen-lockfile` and `--frozen` do not stop content or lock changes.
- **`skills check` mutates content and locks**, because it dispatches to update.
  Do not use it as a read-only audit command.
- Removing a project skill with `skills remove <name> -y` (alias `skills rm`)
  removes files and its lock entry. Agent-specific removal retains the shared
  entry while another agent still uses it (`STD-011 §3.5`).
- Lock entry names must be kebab-case (matching the skill folder and `SKILL.md`
  frontmatter `name`). Do not keep title-case duplicates alongside kebab-case names.

### Verify a restore

Run the repository entry point, not the raw experimental installer:

```bash
mise run install
node scripts/restore-skills.mjs --check          # installed files, without network
node scripts/restore-skills.mjs --validate-lock  # lock shape and immutable sources only
```

The wrapper supports this inventory's GitHub shorthand sources, canonical
paths and full commit SHAs. It rejects a changed lock, missing skill, unexpected
name, symlink, or installed-byte hash mismatch before replacing working skills.
Unknown installed skills are preserved by refusing replacement, not deleted.
Concurrent wrapper runs are rejected; an abandoned guard needs inspection before
removal. This is not a sandbox for untrusted skills, a power-loss-safe transaction,
or a lock against someone concurrently running the raw CLI.

Hashing follows skills 1.7.4's path/content format. A CLI that drops source files
can fail verification even if it exits successfully; investigate, do not weaken
the check or regenerate the hash to hide the failure.

## Installed selection and capability inventory

`skills-lock.json` and `templates/default-project/skills-lock.json` are the exact
current default selection; the catalogue below also includes capabilities not
installed by default. Source repos are GitHub (`sourceType: github`). Do not run
`skills add mattpocock/skills -y` or `skills add cursor/plugins -y` without naming
the skills, because both repositories also carry unrelated skills (`STD-011 §3.7`).

The 2026-10-30 cleanup keeps all 88 external selections and reduces internal
defaults to `setup-project` and `work-next-issue`: 90 entries in each identical
lock. The other 13 owned capabilities remain available on demand; no authored
skill directory was removed. This applies the smaller default proposed during
the maintainer's "fix all of it" request, not a requirement on every project.

Sources are pinned to published commits. The two internal entries therefore
refer to the last published version, not these uncommitted source edits. After
publishing skill changes, refresh those two pins through the CLI in a separate
reviewed lock update. Never point a consumer lock at an unpublished commit.

Two external names no longer exist at upstream HEAD: `resolving-merge-conflicts`
was removed, and `writing-great-skills` was renamed to `writing-for-agents`.
They remain pinned to their last available revisions to preserve the requested
external selection; replacing/removing those capabilities is a deliberate
inventory change, not something restore silently decides.

### Skills we own — all in this repository

Every Focus-authored or vendored skill lives in `skills/` here, one folder per
skill, and installs the same way. Resolve and review `REF` as shown under
"Keeping skills current"; do not record a moving branch in the project lock:

```bash
skills add "The-Focus-AI/standards#$REF" --skill <name> --agent amp -y
```

| Skill | Recommended scope | What it does |
| --- | --- | --- |
| `activity-report` | On demand: production reporting | Live production usage joined against git history → interpreted, client-ready report |
| `tech-research` | On demand: technical selection | Pick the best library/tool for a need; write a dated, cited report into `reports/` |
| `research-methodology` | On demand: deep research | General research method and report templates (literature review, comparative, exec summary) |
| `browser-automation` | On demand: browser tasks | Drive the available browser with an explicit tooling preflight |
| `nano-banana-imagegen` | On demand: image generation | Generate images — icons, headers, illustrations, photo edits; requires its external CLI and scoped API access |
| `nano-banana-videogen` | On demand: video generation | Generate video — image-to-video, scene extension, dialogue; requires its external CLI and scoped API access |
| `focus-ai-brand` | On demand: Focus-branded output only | The Focus.AI brand: palettes, type, grid, components, voice |
| `paged-reports` | On demand: printable deliverables | Markdown → paged HTML → PDF, with page-break control and magazine mode; verify the renderer dependency first |
| `pptx-decks` | On demand: PowerPoint deliverables | Markdown → branded `.pptx` via PptxGenJS, with visual QA; verify local dependencies and slide rendering first |
| `setup-project` | Default: bootstrap | Scaffold a new project to these standards |
| `standardize-project` | On demand: migration | Audit an existing project against these standards, plan the migration |
| `standards-map` | On demand: read-only audit | Look up latest standards → dated mapping report (guide applicability, exceptions, gaps) |
| `develop-design-md` | On demand: visual identity | Take a project from no identity to a validated `DESIGN.md` |
| `work-next-issue` | Default: implementation workflow | Execute `STD-002` and `STD-003`: frontier → claim → branch → pull request |
| `build-focus-course` | Only the course platform | Author a multi-lesson technical course for the Focus.AI platform |

`skills/VENDORED.md` records each skill's `SKL-nnn` number, where it came from, and
at which commit.

**Brand and mechanics are separate on purpose.** `focus-ai-brand` says what things look
like; `paged-reports` and `pptx-decks` say how documents get made. A project with its own
brand uses the mechanics skills with its own `DESIGN.md` and never touches ours. When the
brand changes, only the brand skill changes.

Neither `pptx-decks` nor `focus-ai-brand` is needed for ordinary application
development. Keep both available: install the former for a deck, and the latter
only when that deliverable uses Focus branding. Installing a skill does not
install PptxGenJS, a PDF renderer, or a browser driver. The known portability
requirements belong in each skill's preflight; this inventory does not certify
those tools or silently replace a client's visual identity.

### Third-party utility skills

Not ours; updates come from their upstream repositories at reviewed revisions.

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

For a deliberate pstack update, select an immutable revision and derive the names
from the current lock instead of maintaining a second installation list:

```bash
set -euo pipefail
PSTACK_REF=$(git ls-remote https://github.com/cursor/plugins.git HEAD | cut -f1)
[[ "$PSTACK_REF" =~ ^[0-9a-f]{40}$ ]]
mapfile -t NAMES < <(jq -r '.skills | to_entries[] | select(.value.source == "cursor/plugins") | .key' skills-lock.json)
test "${#NAMES[@]}" -gt 0
skills add "https://github.com/cursor/plugins/tree/$PSTACK_REF/pstack/skills" \
  --skill "${NAMES[@]}" --agent amp -y
git diff -- skills-lock.json
node scripts/restore-skills.mjs --check
```

After installing or updating, use this verification check for `STD-011 §3.8` to confirm
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

**CLI scope caveat (1.7.4).** The inventory uses GitHub `owner/repo` sources with
recorded `skillPath`. `buildLocalUpdateSource(entry)` now includes that canonical
directory and the recorded ref, fixing the old v1.5.13 adapter-tree selection.
Generic Git/SSH/`.git` sources do not all receive this subpath handling; do not
change the source format and assume restoration stays equivalent.

The hash-format check above validates shape, not integrity. Moving refs can
still install new content and replace hashes; use the restore checks above and
review intentional updates under `STD-011 §3.6`.

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
| `tdd` | `skills/engineering/tdd/SKILL.md` — full red-green-refactor loop across architectural seams (`GLOSSARY.md`, ADRs, vertical slices) | `pstack/skills/tdd/SKILL.md` — focused failing-before regression test for a bug fix when a cheap local test path exists; skips when integration-heavy | Use **Source A (`mattpocock`)** when implementing a feature or vertical slice test-first from a spec (`/implement`). Use **Source B (`pstack`)** when fixing a bug with a cheap local reproduction under `/poteto-mode` (`playbooks/bug-fix.md`). |
| `teach` | `skills/productivity/teach/SKILL.md` — stateful multi-session teaching workspace (`MISSION.md`, `./lessons/`, `./reference/*.html`, learning records) | `pstack/skills/teach/SKILL.md` — explain a change or subsystem in one plain account by running `how` and `why` in parallel and writing through `unslop` | Use **Source A (`mattpocock`)** when the user asks to learn a topic across sessions in a workspace. Use **Source B (`pstack`)** when explaining how and why code or a diff in the repository works. |

Hashes and revisions belong in the lock, not a second table. For an on-demand
invocation, use the already reviewed source revision from that lock:

```bash
set -euo pipefail
PSTACK_REF=$(jq -er '.skills["poteto-mode"].ref' skills-lock.json)
MATT_REF=$(jq -er '.skills.implement.ref' skills-lock.json)
[[ "$PSTACK_REF" =~ ^[0-9a-f]{40}$ && "$MATT_REF" =~ ^[0-9a-f]{40}$ ]]
skills use "https://github.com/cursor/plugins/tree/$PSTACK_REF/pstack/skills" --skill tdd
skills use "mattpocock/skills#$MATT_REF" --skill teach
```

Either invocation can select `tdd` or `teach`; neither updates the lock or
installs supporting files. Read any referenced resources from the same revision.
To switch the installed pair, run **one** of these deliberate alternatives,
then review the lock diff and run the restore verification above:

```bash
# Choose pstack:
skills add "https://github.com/cursor/plugins/tree/$PSTACK_REF/pstack/skills" -s tdd -s teach --agent amp -y
```

```bash
# Or choose Matt Pocock:
skills add "mattpocock/skills#$MATT_REF" -s tdd -s teach --agent amp -y
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
specified by `STD-002` (Draft; check the project's adopted revision). A
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
copy of the lock file from the same run. Never hand-write a `computedHash` — it
records content the CLI fetched, even though the current installer does not enforce it.

### Vendoring policy

Skills TheFocus.AI writes belong here, not scattered across the repos that happened to
birth them. When a skill turns up elsewhere, move it in, record it in
`skills/VENDORED.md` with its source commit, and delete the original so the two cannot
drift.

Third-party skills are the opposite: leave them upstream. Copying them in means
republishing someone else's work and inheriting their maintenance. Deliberate
updates select reviewed upstream revisions instead.

### Note on repository visibility

`The-Focus-AI/standards` is public. Installing its skills does not require repository
access credentials. Authenticated GitHub API calls can still avoid anonymous rate
limits; use scoped CI credentials only when needed.

## Adding a new skill

Use the pinned-source procedure below, naming only the intended skill and its
canonical subpath. Even `firecrawl/cli` now contains skills beyond the selected
set, so do not install it wholesale. Review the resulting source, ref, path and
hash, then commit the lock (and its template copy when changing shared defaults).
Run `mise run install` to reproduce on another machine.

## Keeping skills current

`skills update --project -y` restores/checks the recorded refs; it cannot advance
an immutable pin. For new content, resolve the upstream revision, name only the
intended skill, and retain its canonical subpath. For example:

```bash
set -euo pipefail
REF=$(git ls-remote https://github.com/The-Focus-AI/standards.git HEAD | cut -f1)
[[ "$REF" =~ ^[0-9a-f]{40}$ ]]
skills add "The-Focus-AI/standards#$REF" --skill setup-project work-next-issue --agent amp -y
git diff -- skills-lock.json
node scripts/restore-skills.mjs --check
```

In this source repository, run inventory maintenance in a temporary consumer
directory and copy only the CLI-generated lock back after review. The CLI detects
`skills/` as an OpenClaw installation: running unscoped `skills remove` here can
delete authored sources. For the shared defaults, keep the template lock identical.

## CLI verification sources

Checked 2026-10-30: [npm release metadata](https://registry.npmjs.org/skills/1.7.4)
and the published CLI, with isolated Git fixtures for canonical/adapter paths,
refs, hash drift, incomplete restores, update scope, and removal. The complete
90-entry inventory was then restored from GitHub in a fresh consumer: all
installed folder hashes matched and the project lock remained byte-identical.
This verifies restoration, not every skill's behavior or private-source access.

Primary source at the release revision:
[restore](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/src/install.ts),
[source construction](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/src/update-source.ts),
[command dispatch](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/src/cli.ts),
[updates](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/src/update.ts),
and [removal](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/src/remove.ts).
