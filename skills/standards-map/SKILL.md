---
name: standards-map
description: >
  Look up the latest TheFocus.AI standards, inspect the current (or named) project,
  and write a dated mapping report: how the project implements each standard, which
  best-practice guides apply or are N/A, intentional product exceptions, and soft
  gaps. Read-only by default — does not migrate the project.
  Use when asked how a project maps to standards, which guides apply, for a
  standards compliance report, or "standards map".
  Triggers on: "standards map", "map to standards", "how do we map to standards",
  "which standards apply", "standards report", "guide applicability",
  "does this project follow standards", "standards coverage".
---

# Standards Map

Produce a **dated report** that answers:

1. What does this project look like against the **latest** TheFocus.AI standards?
2. Which **best-practice guides** apply, partially apply, or are N/A — and why?
3. What are **intentional product exceptions** vs **compliance gaps**?

This skill is **read-only by default**. It does not edit the project. If the user
wants a migration plan or to apply fixes, hand off to `standardize-project` after
the report (or when they ask).

| Skill | Job |
| --- | --- |
| `standards-map` | Latest standards → mapping report (this skill) |
| `standardize-project` | Audit + migration plan → optional apply |
| `setup-project` | Greenfield scaffold |

## Target project

Resolve the target before reading anything else:

1. Path the user named (absolute or relative).
2. Else the current working directory if it looks like a project (has `AGENTS.md`,
   `mise.toml`, `package.json`, or `.git`).
3. Else ask and stop.

Use **explicit paths** for every read. Never write into the standards repo by
accident when the target is a sibling project.

## Source of truth — latest standards

Standards live in **`The-Focus-AI/standards`**. Always pin the report to a concrete
revision (commit SHA + date), not "whatever I remember."

### Resolve the standards tree (in order)

1. **`STANDARDS_REPO` env** if set and the path contains `best-practices/GDE-009-technology-defaults.md`.
2. **Sibling / known clones** (first hit wins):
   - `../standards` relative to the target
   - `../../standards` if target is deeper
   - `$HOME/The-Focus-AI/standards`
   - Any path the user named for standards
3. **GitHub (latest `main`)** when no local clone is usable:
   - Prefer `gh api repos/The-Focus-AI/standards/commits/main --jq .sha` for the SHA
   - Fetch files with `gh api` / `gh browse` raw, or a shallow clone into a temp dir:
     `git clone --depth 1 https://github.com/The-Focus-AI/standards.git <tmpdir>`
   - If the network/auth fails, say so and stop — do **not** invent standards from
     model memory.

Record in the report:

- Absolute path used (or `github:The-Focus-AI/standards@<sha>`)
- Commit SHA and commit date when available
- Whether the clone might be stale relative to origin (optional:
  `git -C <standards> fetch --dry-run` / `rev-parse HEAD` vs `origin/main`)

### Read these from the resolved standards tree

Required:

- `AGENTS.md` (root navigation / audit order)
- `best-practices/GDE-009-technology-defaults.md` — mise, tasks, pnpm/TS defaults, fnox, skills install
- `best-practices/GDE-008-skills.md` — canonical skill set and planning workflow
- `STD-007` — secrets and credentials; `best-practices/GDE-003-fnox-secrets.md` for the playbook
- `STD-008` — deployment; `best-practices/GDE-006-local-environment.md` for local setup
- `best-practices/GDE-007-pi-extensions.md`
- Repository layout has no standard yet — see `reports/NOTE-005-2026-07-25-standards-gap-register.md`
- Default project template under the standards repo (`templates` / `default-project`)
  — reference for expected files only
- Root `skills-lock.json` — canonical skill names/hashes for diffing

Conditionally (after product shape is known):

| If the project looks like… | Also read |
| --- | --- |
| Vercel / Next / preview deploys | `best-practices/GDE-010-vercel-deployment.md` |
| Cloud Run / App Engine / gcloud | `best-practices/GDE-005-gcp-deployment.md` |
| Gaia / habitats / GCE agent fleet | `best-practices/GDE-004-gce-gaia-runtime.md` |
| Clerk / user auth | `best-practices/GDE-002-clerk.md` |
| A2A / MCP agent service | `best-practices/GDE-001-a2a-agent.md` |

Do not skip the conditional list: the report must still **name** those guides under
"N/A" when they do not apply, with one-line reasons.

## Inspect the target project

Follow the standards audit order, adapted for a **map** (not a migration plan):

1. **Agent instructions** — `AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, equivalents.
2. **Tooling** — `mise.toml`, package manager files, lockfiles, scripts/tasks.
3. **Secrets** — `fnox.toml`, `.fnox/` presence (not contents), `.env*` risk, gitignore.
4. **pi** — `.pi/settings.json`, required packages vs `pi-extensions.md`.
5. **Skills** — `skills-lock.json` vs standards lock / `skills.md` (missing, deprecated
   `to-prd`/`to-issues`, title-case keys, wrong sources).
6. **Workflow** — README, `docs/agents/issue-workflow.md`, tracker, wayfinder docs.
7. **Deploy shape** — Dockerfile, Vercel, GH Actions, Pages, Cloud Run, none.
8. **Product stack** — language, build vs no-build, auth, database, hosting.
9. **Git hygiene** — `.gitignore`, committed secrets risk, generated dirs.

Capture concrete evidence (task names, file paths, skill counts). Prefer
`mise tasks`, reading files, and lockfile keys over guessing.

**Never print secret values.** Key *names* only.

## Classify every finding

Use these buckets so the report does not confuse product law with tech debt:

| Bucket | Meaning |
| --- | --- |
| **Meets** | Implements the standard as written |
| **Exception** | Deliberate product choice documented (e.g. vanilla JS / no build) — not a bug |
| **Soft gap** | Partial / shared vault / docs only — should improve but not blocking |
| **Gap** | Standard expects it; missing or wrong without a documented exception |
| **N/A** | Guide or rule does not apply to this product shape |

When project `AGENTS.md` conflicts with standards defaults, **name the conflict** —
do not silently pick standards over product law. Exceptions that are written down
belong in **Exception**; silent drift belongs in **Gap**.

## Write the report

### Path

Prefer, under the **target** project:

```text
reports/YYYY-MM-DD-standards-map.md
```

Use today's real date. Create `reports/` if needed.

If the user asked for stdout-only or a different path, honor that, but still offer
to write the file.

### Required sections

Use this skeleton (adapt tables; do not drop sections):

````markdown
---
title: "Standards map: <project-name>"
date: YYYY-MM-DD
project: <path or github slug>
standards_source: <path or github:The-Focus-AI/standards@sha>
standards_sha: <full or short sha>
standards_date: <commit date if known>
mode: map   # not a migration
---

# Standards map — <project-name>

## Product in one line

| | |
| --- | --- |
| What | … |
| Stack | … |
| Host | … |
| Backend | … / none |
| Org remote | … |

## Standards revision

- Source: …
- SHA: …
- Note if local clone may lag `origin/main`.

## Scorecard

| Area | Grade or status | Notes |
| --- | --- | --- |
| Tooling (mise/pnpm) | | |
| Secrets (fnox) | | |
| Agent instructions | | |
| Skills lock | | |
| pi | | |
| Workflow docs | | |
| Deploy | | |
| App stack vs defaults | | |

## Standards surface → project files

| Standards concept | Expected | Project artifact | Status |
| --- | --- | --- | --- |
| Project agent guide | AGENTS.md | … | Meets / Gap / … |
| Tooling / tasks | mise.toml | … | |
| Secrets | fnox.toml | … | |
| Skills lock | skills-lock.json | … | |
| Issue workflow | docs/agents/issue-workflow.md | … | |
| pi config | .pi/settings.json | … | |
| README | human entry | … | |
| … | | | |

### Required mise tasks

| Task | Expected role | Project behavior | Status |
| --- | --- | --- | --- |
| install | deps + skills | | |
| dev | run app / checks | | |
| lint | quality | | |
| test | automated | | |
| deploy | ship | | |
| setup / secrets:* | onboarding | | |

## Guide-by-guide applicability

### Always / core for this product

For each applicable guide (`best-practices/GDE-009-technology-defaults.md`, `skills.md`, `security.md`,
`pi-extensions.md`, `organization.md`, relevant parts of `deployment.md`):

- What the guide requires
- How this project maps (paths, tasks, evidence)
- Exceptions or soft gaps

### Conditionally applicable

Guides that only matter for certain shapes (or partial sections of deployment.md).

### Does not apply today

| Guide | Why N/A | Would apply if… |
| --- | --- | --- |
| vercel-deployment.md | | |
| gcp-deployment.md | | |
| gce-gaia-runtime.md | | |
| clerk.md | | |
| a2a-agent.md | | |

## Skills map

| Category | In standards lock | In project lock | Notes |
| --- | --- | --- | --- |
| Focus-owned | … | … | missing / extra / wrong source |
| Third-party | … | … | |
| mattpocock set | … | … | deprecated names? |

Call out title-case lock keys, `to-prd` / `to-issues`, and skills not from
`The-Focus-AI/standards` when they should be.

## Architecture vs default stack

| Default standard | This project | Treatment |
| --- | --- | --- |
| TypeScript | | Meets / Exception / Gap |
| Build pipeline | | |
| Neon / Postgres | | |
| Clerk | | |
| Vercel (if web app) | | |

## How guides apply by kind of work

Short routing table: work type → open which guide/skill first.

## Soft gaps and gaps

Prioritized list. Each item: finding, standards file, severity, suggested next step
(`standardize-project`, manual, ignore as exception).

## Mental model

Optional one-diagram summary: standards shell vs product exception zone vs
N/A stack guides.

## Recommended next steps

1–5 bullets. If migration is warranted, point to `standardize-project` — do not
start migrating inside this skill unless the user explicitly asked to apply fixes.
````

## Deliver

1. Write the markdown file under the target project's `reports/`.
2. Summarize in chat: product one-liner, scorecard highlights, top gaps/exceptions,
   path to the report, standards SHA used.
3. Ask whether they want `standardize-project` to close gaps (only if gaps exist).

## Optional modes (if the user asks)

| Mode | Behavior |
| --- | --- |
| **Default / map** | Report only (above) |
| **Diff skills** | Emphasize lockfile key/source/hash drift vs standards |
| **Guides only** | Applicability matrix without full file inventory |
| **Compare two projects** | Two targets, shared standards SHA, side-by-side scorecard |

Still write a dated report unless they forbid files.

## Pitfalls

- **Do not invent standards.** Always resolve a real tree + SHA. Model memory is not
  the org source of truth.
- **Do not treat exceptions as gaps.** Documented vanilla-JS / no-build / static Pages
  is product law when `AGENTS.md` says so.
- **Do not apply migrations here.** That is `standardize-project`. Mixing jobs
  confuses reviewers and rewrites repos during a "report" request.
- **Do not dump secret values.** Names only; skip `.fnox/env` contents.
- **Do not mark Vercel/Clerk/GCP as gaps** for a client-only static PWA — mark N/A.
- **Stale local standards clone.** Prefer noting `HEAD` vs `origin/main` when
  networked; if you cannot check, say the report is against the local tree only.
- **Wrong repo edits.** Target path must stay explicit when standards and project
  sit side by side under `The-Focus-AI/`.
