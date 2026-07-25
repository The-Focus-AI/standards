---
title: "Standards gap register: what is practised but not written"
kind: note
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-07-25"
---

# Standards gap register

An inventory of practice this organisation follows, or has decided to follow,
that no standard records. Produced while writing `STD-001` through `STD-006`, so
that the same gaps stop being rediscovered one conversation at a time.

Written per `STD-006`. Decided autonomously by an agent from repository evidence
and flagged as such per `STD-006 §3.8` — every judgement below about what
"should" be written is a recommendation, not a decision.

## The distinction that matters

`STD-001` records **current understanding**. That premise makes two of the three
categories below safe to write and one of them dangerous.

- **A — practised and unwritten.** The organisation already does it, consistently
  enough to observe. Writing it down is recording. Low risk.
- **B — practised inconsistently, or declared and never elaborated.** Writing it
  requires somebody to decide which way it goes. Cheap to write once decided,
  impossible to write before.
- **C — not practised at all.** Writing a standard here would be inventing rules
  at a desk and binding a fleet to them. That is the cargo-cult failure inverted,
  and it is worse than the gap.

## A — Practised and unwritten

| Gap | Evidence |
| --- | --- |
| Repository naming | Client repos prefix by client (`upperhand-ae`, `upperhand-cp`, `upperhand-versant`, `upperhand-landing`); experiments prefix `weekend-`; event repos lead with the date (`2026-04-20-ai-engineering-miami`). A real convention, followed, unwritten. |
| Commit messages | Agents author nearly all of them. A consistent shape is in use — imperative subject, body explaining why rather than restating the diff, trailers — but nothing specifies it. `git log` is the only record of intent that outlives a tracker. |
| Prompt files | `prompts/` holds four files on a `# Prompt: <Title>` convention, invoked by `pi -p` and read directly by agents. Nothing says what one must contain or how to tell when it has rotted against the standards it references. |
| pi extension set | `.pi/settings.json` pins five packages. `best-practices/pi-extensions.md` is 260 bytes and does not list them. Belongs in `STD-005`. |
| Test entry point | `mise test` is required by `STD-004`; `tests/test-dockerfile.sh` is the only implementation. Where tests live and what they must cover is unstated. |
| Lint configuration | `.markdownlint-cli2.jsonc` pins line length 120, disables MD025 and MD033. Covered by `STD-004 §3.9`; no separate standard needed. |

## B — Needs a decision before it can be written

| Gap | What is undecided |
| --- | --- |
| `best-practices/organization.md` | **The file is zero bytes**, and root `AGENTS.md` sends readers to it for "organization-level structure guidance". What layout is actually required of a repository? |
| "Verification plan" | `STD-002 §3.4` requires a `ready` issue to carry one, and the term is defined nowhere. `STD-003 §3.7` separately requires checkable success criteria. These are probably one concept with two names across two standards — **an outright defect in shipped text**, and the first thing to fix. |
| TypeScript and pnpm | `best-practices/AGENTS.md` gives it two lines: use TypeScript and pnpm, avoid a build step where possible. Module layout, error handling, and what "avoid a build step" means in practice are unstated. |
| Database | "Use neon/postgres" is one line. Migrations, schema conventions, connection handling, and what happens in preview environments are unstated — and `STD-003 §3.9` already leans on preview-scoped credentials that no standard defines. |
| Code review | A `code-review` skill exists and `STD-003` requires human approval, but what a reviewer must check is unwritten. Without it, "approved" means whatever the reviewer felt like that day. |
| Skill authoring | `best-practices/skills.md` covers installing skills. Nothing covers writing one, though `skill-creator` is installed. |
| Model selection | `.pi/extensions/gengen.ts`, `pi-local-models`, and the gateway model IDs in `DESIGN.md` all imply a policy. None is written. |
| Secrets policy | `best-practices/security.md` is 292 bytes for the subject with the worst failure mode. `STD-004 §3.7–3.8` specify how secrets reach a process; vault layout, rotation, and scoping are still undecided. |

## C — Not practised; writing it would be inventing

Recorded so nobody mistakes the silence for an oversight.

- Observability, logging, tracing, error tracking. The design prototypes showed
  an "Observability" section precisely because nothing exists behind it.
- Incident response and rollback.
- Data retention and privacy.
- Dependency update cadence. `skills update` is documented as a command, not as
  a policy.
- Accessibility beyond the standards site, which `DESIGN.md` covers for itself.

Each of these becomes category B the moment one project does it deliberately.
The right move is to notice when that happens, not to pre-write the rule.

## Recommended order

1. **Define "verification plan"**, or merge it into success criteria. It is a
   dangling normative reference in an already-written standard.
2. **Migrate category A**, which is recording rather than deciding: naming,
   commit messages, prompts, pi extensions.
3. **Take the category B decisions** in order of blast radius: secrets, then
   organisation layout, then code review.
4. **Leave category C alone** until somebody practises it.
