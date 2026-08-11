---
number: "012"
title: "Auditing an existing project against the standards"
kind: guide
issued: "2026-07-29"
author: W. Schenk
status: Current
verified: "2026-07-29"
---

> The companion to `GDE-011`. That one starts from nothing; this one starts from
> a repository that already works and asks what it would take to bring it into
> line. The rules being measured against are `STD-004` through `STD-011`.

# Auditing an existing project

A running project is not an empty one. It has decisions in it, some deliberate
and some accidental, and the first job is telling those two apart. A gap is
something nobody decided. An exception is something somebody did.

## The short version

```sh
cd my-existing-project
skills add The-Focus-AI/standards --skill standards-map --agent claude-code -y
```

Then: **"map this project against the standards"**. You get a dated report and
nothing changes on disk.

## Two skills, two different jobs

Pick by what you want to happen to the repository.

| | `standards-map` (`SKL-014`) | `standardize-project` (`SKL-011`) |
| --- | --- | --- |
| Changes files | **No.** Read-only. | Yes, after a plan you approve. |
| Produces | A dated mapping report | A migration, applied |
| Use when | You want to know where you stand | You have decided to close the gaps |
| Safe on a client repo | Yes | Only with the plan reviewed first |

Run `standards-map` first, always. An audit that starts by editing is an audit
nobody can check, and on a repository you did not write, the report *is* the
deliverable — it tells you whether the work is an afternoon or a fortnight.

## Running the map

```sh
skills add The-Focus-AI/standards --skill standards-map --agent claude-code -y
```

Then ask your agent to map the project. It will:

1. **Resolve the standards** — it reads them from the published corpus rather
   than from memory, so the report is against the current revision, and it says
   which revision that was.
2. **Work out what the project is.** A Next.js app on Vercel is measured against
   different guides than an A2A agent service. Guides that do not apply are
   listed as not applying rather than silently skipped.
3. **Inspect** tooling, tasks, secrets, skills, agent instructions, deployment.
4. **Classify every finding** — the part that matters, below.
5. **Write the report** to `reports/`, dated, per `STD-006`.

## Reading the report

The scorecard is the summary. The classification is the substance.

- **Conforms.** Nothing to do.
- **Exception.** The project deliberately does something else, and the reason is
  recorded. A CLI tool with no deployment loop is not failing `STD-008`; it is
  outside it. Exceptions are fine — *undocumented* exceptions are the problem,
  because the next reader cannot tell them from gaps.
- **Gap.** The standard applies, the project does not meet it, and nobody decided
  that. This is the actionable list.
- **Soft gap.** Met in spirit, not in form. Secrets resolve correctly but through
  a mechanism `STD-007` does not name. Real, lower priority, and often the right
  thing to leave.
- **Not applicable.** The standard's `applies-to` does not cover this project.

The distinction between an exception and a gap cannot be made mechanically —
it needs to know what was intended. Where the agent guesses, `STD-006 §3.8`
requires it to say so, and anything marked as an agent's judgement is the first
thing to check.

## Turning the report into work

The report is a note, not a plan. It records what is true on the day it was
written and stops there.

To act on it, file the gaps as issues and let the ordinary loop take them:
`STD-002` for issue states and the frontier, `STD-003` for branches and pull
requests, and `work-next-issue` (`SKL-013`) to work them one at a time. A gap
that becomes a ticket gets specified, claimed, reviewed and merged. A gap that
stays in a report gets rediscovered in six months by somebody running the audit
again.

Fix in this order, which is blast radius rather than effort:

1. **Secrets** (`STD-007`). A committed credential or a production instance
   serving previews is the only category where the cost of waiting keeps rising.
2. **Tooling and tasks** (`STD-004`). Everything else is easier once
   `mise install` and `mise dev` work, and it is what makes the repository
   legible to an agent.
3. **Agent environment** (`STD-005`). `AGENTS.md` is what stops the next agent
   re-deriving all of this.
4. **Deployment** (`STD-008`), then whatever is specific to the platform.
5. **Everything else.**

## Applying the migration

Once the gaps are agreed, `standardize-project` does the work:

```sh
skills add The-Focus-AI/standards --skill standardize-project --agent claude-code -y
```

It inspects, proposes a plan, and only then changes anything. Two things it is
strict about, both learned the hard way:

- **It does not overwrite project configuration blindly.** The goal is a
  repository that meets the standard *and* still works the way its team expects.
  A conforming repo that broke somebody's workflow is a failed migration.
- **It stops and asks** when a decision is a person's — vault names, deployment
  targets, anything that costs money or touches production.

## How you know it worked

Re-run the map. The scorecard should move, and every remaining item should be an
exception with a reason rather than a gap.

Then the same four commands as a new project:

```sh
mise install
mise dev
mise lint     # and it can fail
mise test     # and it can fail
```

## What an audit will not tell you

- **Whether the code is any good.** This measures the repository against the
  standards. Code review is a separate thing, and one the corpus does not yet
  cover — that absence is recorded in the gap register rather than papered over.
- **Whether the standards are right.** If a standard consistently produces
  exceptions across projects, the standard is wrong, not the projects. That is
  worth raising: the corpus is current understanding (`STD-001`), and a rule
  everybody exempts themselves from has already stopped being one.
