---
number: "002"
title: "Bring a project up to current Focus standards"
kind: prompt
issued: "2026-10-28"
author: W. Schenk
status: Current
---

# Prompt: Bring a project up to current Focus standards

Paste **from the heading "Agent prompt" through the end of this file** into an
agent that is working inside an existing repository. The agent diffs that
project against `The-Focus-AI/standards`, writes a conformance gap report, then
opens fix branches and pull requests per `STD-003`. It never ratifies a Draft
standard and never merges.

| Skill or prompt | Job |
| --- | --- |
| `standards-map` (`SKL-014`) | Read-only mapping report only |
| `standardize-project` (`SKL-011`) | Tooling / mise / fnox migration after you approve a plan |
| **This prompt (`PRM-002`)** | Full STD / GDE / skills gap report **and** fix PRs, no merge |

Find it at `prompts/PRM-002-bring-project-up-to-standards.md` in
`The-Focus-AI/standards`, or as `prm-002` on the published standards site.
Companion guide: `GDE-012`.

---

# Agent prompt

You are bringing THIS repository up to the current Focus.AI standards corpus.
Follow this prompt exactly. Do not invent standards from memory.

## Hard rules (non-negotiable)

1. Source of truth is the GitHub repo `The-Focus-AI/standards` (default branch
   `main`, plus any open Draft PRs you are told to include). Clone or fetch it;
   do not rely on training data.
2. NEVER set a document status to In force. NEVER merge a pull request. NEVER
   close an issue by hand (use `Closes #N` on PRs only). NEVER force-push after
   human review. NEVER print or commit secret values.
3. Every change lands on its own issue → branch `<issue>-<slug>` cut from the
   default branch → draft PR with `STD-003` sections, in that order.
4. Prefer additive edits. Preserve project-specific mise tasks, pi settings,
   and documented exceptions. Classify Exception vs Gap vs Soft gap vs N/A
   using `GDE-012` language; do not silently treat an Exception as a Gap.
5. Definition of done for THIS run is listed at the end. Stop when it is met.

## Phase 0 — Resolve paths and standards revision

Run (adapt paths):

    TARGET="$(pwd)"   # the project being updated
    STANDARDS="${STANDARDS:-/tmp/focus-standards}"
    if [ ! -d "$STANDARDS/.git" ]; then
      git clone --depth 1 https://github.com/The-Focus-AI/standards.git "$STANDARDS"
    else
      git -C "$STANDARDS" fetch origin
      git -C "$STANDARDS" checkout main
      git -C "$STANDARDS" pull --ff-only
    fi
    STANDARDS_SHA=$(git -C "$STANDARDS" rev-parse HEAD)
    STANDARDS_DATE=$(git -C "$STANDARDS" show -s --format=%ci HEAD)
    echo "standards=$STANDARDS_SHA at $STANDARDS_DATE"

Record `STANDARDS_SHA` in every report and PR body. Optionally also list open
PRs on `The-Focus-AI/standards` that add Draft STDs/GDEs (for example testing)
and treat those documents as Draft — check against them, but do not require
full conformance until they are In force / Current on `main`.

Read before judging anything:

- `$STANDARDS/AGENTS.md`
- `$STANDARDS/best-practices/GDE-008-skills.md` (including tdd/teach selection)
- `$STANDARDS/best-practices/GDE-009-technology-defaults.md`
- `$STANDARDS/best-practices/GDE-011-bootstrapping-a-new-project.md`
- `$STANDARDS/best-practices/GDE-012-auditing-an-existing-project.md`
- `$STANDARDS/templates/default-project/` (canonical skeleton)
- Every `standards/STD-*.md` with status In force or Draft
- Every `best-practices/GDE-*.md` with status Current (and Draft if present)

## Phase 1 — Skills lock diff (including tdd/teach)

Canonical lock: `$STANDARDS/templates/default-project/skills-lock.json`
(fallback: `$STANDARDS/skills-lock.json` if the template lock is absent).

    CANON="$STANDARDS/templates/default-project/skills-lock.json"
    [ -f "$CANON" ] || CANON="$STANDARDS/skills-lock.json"
    PROJ="$TARGET/skills-lock.json"

Produce a machine-readable and human-readable diff:

1. Names only in canonical → Missing skill (gap) unless N/A for this stack.
2. Names only in project → Extra / unapproved (soft gap or exception; say which).
3. Same name, different `computedHash` or `source`/`skillPath` → Stale pin (gap).
4. For names `tdd` and `teach`: apply `GDE-008` / `STD-011` §3.9 selection rule:
   - Default lock entry MUST be `mattpocock/skills` for both unless the project
     has a recorded Exception to use pstack.
   - pstack variants are invoked with
     `skills use https://github.com/cursor/plugins/tree/main/pstack/skills --skill tdd`
     (same for `teach`). Do NOT require both sources in `skills-lock.json`
     (one name → one lock entry).
5. Never recommend bare `skills add mattpocock/skills -y` or
   `skills add cursor/plugins -y` (`STD-011` §3.7). Prefer
   `skills add <owner>/<repo> --skill <folder> -y` or copy the canonical lock
   then `mise install` / `skills experimental_install`.

Write findings into the gap report under heading "Skills".

## Phase 2 — Standards and guides checklist

For each In force or Draft STD and each Current (and Draft) GDE, in numeric
order:

1. Decide Applies / Not applicable (use applies-to and `GDE-012`).
2. If Applies: Conforms | Exception (cite where documented) | Gap | Soft gap.
3. Cite the concrete file/path/command that proves the classification.
4. Map Gaps to the default-project template file that shows the expected shape
   when one exists (for example `docs/testing.md`, `.github/workflows/ci.yml`,
   mise tasks, `AGENTS.md` sections).

Minimum surfaces to inspect (extend if the STD/GDE requires more):

- Agent instructions: `AGENTS.md` / `CLAUDE.md` / `.cursor/rules`
- Tooling: `mise.toml`, package manager, lockfiles, required tasks
  (`install`, `setup`, `dev`, `lint`, `test`, `deploy`, `secrets:check`,
  `secrets:list`)
- Secrets: `fnox.toml`, `.fnox/`, no committed secret values (`STD-007`)
- Skills: `skills-lock.json`, `.agents/skills/`
- Deployment: per `STD-008` + applicable `GDE-004` / `GDE-005` / `GDE-010`
- Testing/CI: `docs/testing.md` five headings when `STD-012`/`GDE-014` apply;
  CI workflow; mise `test`/`lint` tasks
- Git hygiene: `.gitignore`, no generated site committed unless intentional

## Phase 3 — Conformance gap report (before any edit)

Write
`$TARGET/reports/NOTE-audit-YYYY-MM-DD-focus-standards-conformance.md`
(or the next free NOTE number if this repo uses `STD-006` numbering).
Frontmatter `kind: note` if the project follows `STD-006`; otherwise a plain
markdown report is fine. Must include:

- Target repo, date, `STANDARDS_SHA`
- Scorecard counts: Conforms / Exception / Gap / Soft gap / N/A
- Skills lock diff summary
- Full per-STD and per-GDE table
- Proposed fix batches (grouped by blast radius per `GDE-012`):
  Secrets → Tooling/tasks → Agent environment → Deployment → Testing/CI →
  Skills lock → Everything else
- Explicit list of human decisions needed (vault names, deploy targets, etc.)

Do not edit product code until this report exists on a branch/PR (a report-only
PR is allowed) or the user already approved skipping straight to fixes.

## Phase 4 — Fix gaps with issues, branches, and PRs

For each approved fix batch (or each gap if the user said "fix them"):

1. Open a GitHub issue describing the gap and pointing at the report section.
   Do NOT add the `ready` label (`STD-002` — humans label ready).
2. When the user labels ready OR explicitly authorizes work without ready for
   this run, cut branch `<issue-number>-<slug>` from the default branch.
3. Apply the smallest additive change that closes that gap. Match
   `$STANDARDS/templates/default-project/` when adding missing skeleton files.
4. Open a **draft** pull request whose body starts with `STD-003` sections in
   order: Success criteria → Why → What changed → Evidence. Include
   `Closes #<issue>` and `standards SHA: <STANDARDS_SHA>`.
5. Run the project's available verification: `mise lint`, `mise test`, and any
   project-specific checks. Paste evidence in the PR.
6. Do NOT merge. Do NOT ratify Draft standards in the standards repo.

If `standardize-project` covers a batch (mise/fnox/pi/AGENTS hygiene), you MAY
load that skill for the mechanical steps, but still open PRs per `STD-003` and
still obey this prompt's hard rules.

## Phase 5 — Stop and report

Return to the user:

1. Link to the conformance gap report
2. Table of issues and PR URLs opened
3. Remaining Gaps / Exceptions left untouched and why
4. `STANDARDS_SHA` used
5. Confirmation: no merges, no In force changes, no secret values exposed

## Definition of done

- [ ] Standards corpus fetched; `STANDARDS_SHA` recorded
- [ ] `skills-lock.json` diff completed with tdd/teach rule applied
- [ ] Every In force/Draft STD and Current/Draft GDE classified
- [ ] Gap report written under `reports/`
- [ ] Each fix that was authorized has issue + branch + draft PR (`STD-003`)
- [ ] No PR merged; no document ratified; no secrets printed
- [ ] User-facing summary with links delivered
