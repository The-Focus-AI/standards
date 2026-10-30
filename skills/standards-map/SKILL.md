---
name: standards-map
description: >
  Maps an existing project to a revision-pinned TheFocus.AI standards corpus and
  reports conformance, documented exceptions, gaps, and guide applicability.
  Use for a read-only standards audit, compliance report, or skills inventory
  comparison. Does not migrate the project or open issues and pull requests.
---

# Standards Map

Produce evidence, not a migration. `GDE-012` owns the audit procedure and
classification vocabulary; `PRM-002` owns the full report → approved fixes →
draft PR loop. Read those documents rather than maintaining a parallel audit
checklist here. `standardize-project` applies approved tooling changes;
`setup-project` scaffolds new projects.

## Resolve the target and corpus

Use the named target, otherwise the current directory if it is a repository.
If neither is clear, ask. Keep explicit target and standards paths so a sibling
standards checkout is not edited by accident.

Resolve `The-Focus-AI/standards` from a user-provided path, `STANDARDS_REPO`, or
a known local clone. Record its full HEAD SHA and whether the worktree is dirty.
Do not reset, pull into, or switch branches in someone else's working tree.
For the latest published revision, use a disposable clone of `main` or compare
with `git ls-remote` before claiming freshness. If offline, label the report as
local-revision-only; do not invent missing standards from memory.

Read the resolved corpus's `AGENTS.md`, `GDE-012`, and the audit/report phases
of `PRM-002`. Load their referenced numbered standards and Current guides as
needed, including `GDE-008` for skill selection, `GDE-009` for technology
defaults, and applicable deployment/auth/testing guides. For a full-corpus map,
classify each In force/Draft STD and each Current GDE, including N/A rows with
reasons. Do not execute `PRM-002`'s issue/PR phases during a map.

## Interpret evidence

Use **Conforms**, **Exception**, **Gap**, **Soft gap**, and **Not applicable**
as defined in `GDE-012`. For each row record the source's kind and status,
applicability, exact clause (if any), project evidence, and next step.

- Only **In force standards** bind the fleet. Draft differences are adoption
  recommendations, not nonconformance, unless the project explicitly adopted
  them. Current guides explain; they do not create additional requirements.
- Cite intentional exceptions and who decided them. An undocumented assumption
  by the agent is not a project decision. Name unresolved conflicts rather than
  silently overriding project instructions.
- `GDE-009` choices are defaults, not laws requiring every product to use the
  same language, database, authentication provider, or host.
- Check tasks by behavior, not their names alone; lint/test need meaningful
  failure behavior. State when a check was read but not run. Do not execute
  install, setup, secret resolution, deployments, or other mutating tasks as
  part of a read-only audit without permission.
- Inspect workflow evidence against `STD-002` / `STD-003` and the target's
  actual agent instructions. Do not require a legacy issue-workflow document
  path. An audit is not authority to mark issues ready, claim work, merge, or
  ratify a standard.
- For secrets, inspect declarations and ignore/tracking status, never secret
  file contents. Check intended secret paths individually. Cloud-injected
  project bootstrap tokens are the default under `STD-005` / `STD-007`;
  absence of `.fnox/env` is not itself a gap. A local token file is an explicit
  exception, not an audit remediation to perform automatically.

## Skills comparison

Follow `GDE-008`, `STD-011`, and `PRM-002`'s skills-diff phase. Distinguish the
recommended default inventory from optional sources and the project's adopted
inventory. The internal default is `setup-project` plus `work-next-issue`;
other owned skills remain available by name when relevant. Their absence is
not automatically a gap, and legitimate extras are not automatically removed.

Compare names, sources, paths, and pins. Different hashes mean drift to review,
not proof that the project is stale; its revision may be newer. Preserve the
selected source for colliding names such as `tdd` / `teach` unless an approved
change says otherwise. Never copy locks or install skills during mapping.

## Report

Default to returning the dated report in the response, with no files changed.
If the user requests a saved report, write only that authorized file in the
target repository. In this corpus (or a project adopting `STD-006`), use the
next unassigned NOTE number:

```text
reports/NOTE-nnn-YYYY-MM-DD-standards-map.md
```

Read `STD-001` / `STD-006` before corpus metadata work. Do not reuse retired
numbers, invent an original author, or use a verification date for checks not
performed. Elsewhere follow the target's document conventions and state which
convention was used. For a new agent-authored note, identify the agent honestly.

```yaml
---
number: "<next free number>"
title: "Standards map: <project>"
kind: note
issued: "YYYY-MM-DD"
author: "<actual author or agent identity>"
status: Current
verified: "YYYY-MM-DD"
project: "<target path or remote>"
standards_source: "The-Focus-AI/standards"
standards_sha: "<full commit SHA>"
---
```

Use `GDE-012` / `PRM-002`'s report structure, including:

1. Product shape, target revision, corpus revision, freshness/dirty-tree caveats.
2. Scorecard and per-STD/GDE evidence table, separating binding gaps from
   proposed adoption recommendations; list conditional guides that are N/A.
3. Skills diff and evidence for task, secrets, workflow, deploy, and testing
   surfaces. No blanket requirement to match the standards repo's own tooling.
4. Exceptions and remaining gaps, suggested next steps, decisions needed,
   commands actually run and limitations.

Optional requested views: guides-only, skills-only, or two projects against one
corpus revision. State the narrower scope explicitly; do not present a partial
map as a full audit. Offer `standardize-project` or `PRM-002` for follow-up, but
do not start it implicitly.
