---
name: standards-map
description: >
  Audits a project against a revision-pinned Focus engineering handbook and reports
  adopted-policy gaps, proposed improvements, exceptions, and skill differences.
  Use for a read-only standards audit. Does not install tools, migrate the project,
  open issues, or create pull requests.
---

# Audit a project against the handbook

Produce evidence, not a migration. Read `handbook/update-project.md` for the
audit order and `handbook/skills.md` for source selection. `standardize-project`
applies authorized fixes; `setup-project` starts new projects.

## Establish the two revisions

Use the named target or the current repository. Resolve `The-Focus-AI/standards`
from a supplied path, `STANDARDS_REPO`, or a disposable clone. Record both full
HEAD revisions and dirty-worktree caveats. Do not reset, switch, or pull into
someone else's working tree. Check the published `main` before claiming freshness;
if offline, label the report local-revision-only.

Read target instructions first, then the handbook's `AGENTS.md` and applicable
topic pages. For a full audit, cover each topic in `handbook/navigation.json`.
Mark irrelevant topics with a reason; read linked recipes only when applicable.

## Classify each finding

Use the update page's vocabulary: adopted-policy gap, proposed improvement,
documented exception, conforms, or not applicable. Cite the topic and heading,
its status, the project's adoption decision if any, and the evidence.

- Draft guidance does not bind a project unless explicitly adopted. Reference
  recipes do not create independent policy. Do not infer approval from a template.
- Distinguish commands inspected from commands run. Do not install, resolve
  secrets, deploy, or run mutating checks during a read-only audit without permission.
- Inspect secret declarations and per-path ignore/tracking status, not secret
  contents. A missing `.fnox/env` is not a cloud-bootstrap gap.
- Compare selected skill names, sources, paths, and pins, not just counts or
  hashes. Different revisions need review; they may be newer. Preserve deliberate
  extras and source choices. Optional skills are not mandatory installations.
- Report conflicts with project instructions; do not silently choose an authority.

## Deliver the report

Return the report in the response unless a saved file was requested. Include:

1. Scope, project and handbook revisions, freshness, and checks not run.
2. Findings with evidence, status/adoption, and the smallest useful next action.
3. Skill differences, intentional exceptions, and decisions needed.

If saving in this corpus, follow `handbook/maintaining.md` and write
`evidence/<topic>.md` with this envelope. Follow the target's own convention
elsewhere. Record the actual author and source revisions in the body.

```yaml
---
title: "Project audit: <project>"
summary: "<What was examined and the principal finding>"
status: Evidence
checked: "YYYY-MM-DD"
---
```

Use the date checks actually ran. Do not convert formatting work into fresh
verification. An audit grants no permission to mark work ready, claim an issue,
merge a change, or ratify a proposal.
