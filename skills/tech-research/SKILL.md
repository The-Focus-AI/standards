---
name: tech-research
description: >
  Find the single best library, tool, or technique for a specific project need, judged on
  simplicity, popularity, and maintenance — then write it up as a dated, citation-backed
  report in reports/ that another agent can implement from without re-researching.
  Use when choosing between libraries, picking a tool, evaluating an approach, or asking
  what the current best practice is.
  Triggers on: "what library should", "which tool", "best way to", "evaluate options",
  "compare libraries", "is X or Y better", "what's the current best practice",
  "research this", "pick a framework".
---

# Tech Research

Find the optimal library, tool, or technique for a specific need in this project, and
leave behind a report that makes the decision reusable.

Optimize for three things, in this order: **simplicity**, **popularity**, and **good
support and maintenance**. A clever library with 40 stars and one maintainer is a
liability; boring and widely used wins.

This skill answers "which one should we use." For open-ended investigation with no
decision attached, use `research-methodology` instead — it has the report templates for
literature reviews, comparative analyses, and executive summaries.

## Process

### 1. Understand the project context first

Before searching anything, read the project:

- Language and runtime — `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `mise.toml`
- Dependencies already chosen, and the patterns they imply
- Config that signals preferences — `tsconfig.json`, linter configs, CI
- `AGENTS.md` / `CLAUDE.md` for stated constraints

A recommendation that doesn't fit what's already there is a wrong answer, however good
the library is on its own.

### 2. Ask at most three discriminating questions

Ask **2–3** questions, each chosen to eliminate whole categories of options — bundle
size ceilings, SSR requirements, self-hosting, a specific integration, expected scale.
Do not ask more than three, and do not ask what you could have determined by reading
the repo.

### 3. Research

Search for, and record:

1. Current best-practice recommendations — prefer sources from the last 12 months
2. Popularity: GitHub stars, weekly downloads, or the ecosystem's equivalent
3. Maintenance: recent commits, release cadence, open-to-closed issue ratio
4. Documentation quality
5. Known criticisms and limitations — search for these deliberately, they don't
   surface on their own

Note the version you researched. Libraries move; an unversioned claim rots silently.

### 4. Write the report

Write to `reports/YYYY-MM-DD-descriptive-topic-name.md`, using today's actual date.
That path and naming convention is the standard across TheFocus.AI projects — see the
`reports/` directory in the standards repo for worked examples.

## Report format

````markdown
---
title: "[Topic]: [Recommendation Name]"
date: YYYY-MM-DD
topic: [short topic slug]
recommendation: [library/tool name]
version_researched: [version number if applicable]
use_when:
  - [condition when this is the right choice]
avoid_when:
  - [condition when this is NOT the right choice]
project_context:
  language: [detected language]
  relevant_dependencies: [related deps already in the project]
---

## Summary

2–3 paragraphs: what you found and why it wins. Include the hard numbers — stars,
weekly downloads, last release date. Annotate every factual claim with a numbered
reference[1].

## Philosophy & Mental Model

The core concepts and design philosophy. What mental model should an agent hold when
working with this? What are the key abstractions?[2]

## Setup

Step-by-step installation and configuration. Be explicit about every step, including
the config files that need to exist.

## Core Usage Patterns

3–5 patterns covering ~80% of real use. Each one teaches a specific concept, with a
short code example and a sentence on when to reach for it.

## Anti-Patterns & Pitfalls

3–5 common mistakes, each as a ❌ Don't / ✅ Instead pair with code and an explanation
of *why* the wrong version is wrong.

## Caveats

Where this recommendation stops being right, and what to use instead at that point.

## References

[1] [Source title](URL) — what this source provided
[2] [Source title](URL) — ...
````

## Guidelines

1. **Be definitive.** Recommend one solution. A comparison table with no verdict pushes
   the decision back onto the reader — that was the job.
2. **Cite everything.** Every factual claim carries a numbered reference.
3. **Write for an agent to implement from.** Explicit structure, unambiguous language,
   real code. The test: could someone build the integration from this report alone?
4. **Stay current.** Prefer the last 12 months and say so when information may be stale.
5. **Match the project.** The recommendation must sit well with what's already chosen.
6. **Record versions.** Note what you actually researched.

## Pitfalls

- **Don't recommend from memory.** Model knowledge of library ecosystems ages badly —
  versions, maintainership, and best practice all move. Search, then cite.
- **Popularity is not a proxy for fit.** The most-downloaded option is often the wrong
  size for the job. Say so when it is.
- **Check whether the project already solved this.** A grep for the problem sometimes
  turns up an existing utility, and the right answer is "use what's there."
- **Abandonment hides behind stars.** A repo with 20k stars and no release in two years
  is a worse bet than a boring one that ships monthly.
