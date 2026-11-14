---
title: Maintain the handbook
summary: One home for each decision, small procedures, and dated evidence instead of duplicate rule books.
status: Draft
---

Write for the task a reader needs to complete. Put the default, scope, exceptions,
failure/recovery behavior, and verification together. Link to a topic instead
of repeating its rules in a guide, skill, template, and standard.

## Authority stays explicit

| Status | Meaning |
| --- | --- |
| Draft | Proposed guidance. Not an organization-wide obligation unless a project explicitly adopts it. |
| In force | A person approved this policy; record `approved-by` and `approved-on`. Agents cannot grant this status. |
| Reference | A procedure or capability, not independent policy. |
| Evidence | A dated observation with sources and limits, not a claim about current deployments. |

This redesign changes organization, not approval. Existing proposed policies
remain Draft. A team can adopt a named page revision for a project and record
that decision locally. Protocol requirements apply only to implementations
claiming that version; local application profiles and policy exceptions do not
become protocol requirements.

## Keep pages small and findable

- `handbook/` owns task-oriented guidance. Add a page to `handbook/navigation.json`
  under the reader's task, not under its document type.
- `recipes/` holds longer platform-specific commands linked from their owner topic.
- `evidence/` holds dated implementation observations worth retaining.
- `skills/` holds installable skills. Keep their CLI-owned frontmatter and record
  attribution in `skills/VENDORED.md`. Generate the catalog from the lock and source.
- `templates/` and `scripts/` are executable starting points, not a second policy book.
- [CHANGELOG.md](../CHANGELOG.md) records substantive additions and revisions as
  newest-first `## YYYY-MM-DD — Title` sections with links to the affected pages.
  The build renders `changelog.html` and the RSS 2.0 feed `feed.xml` for Focus.AI
  Labs and other subscribers; omit typo and formatting fixes.

Use meaningful filenames and links. There are no document numbers, clause-number
registries, duplicate reference lists, or replacement-pointer paperwork. Git
retains removed material. Keep a dated evidence page only when a current decision
needs it, not to preserve every old plan.

Each published Markdown page declares `title`, `summary`, and `status` in
frontmatter. Evidence also declares `checked` as a real ISO calendar date.
Record source revisions and what was actually run in its body. A fresh edit date
is not a new verification date. Attribution is not inferred from repository ownership.

## Check the result

```sh
mise run lint
mise run test
mise run handbook:build
```

The build validates metadata, navigation coverage, and local links before writing.
The catalog derives selected sources/revisions from `skills-lock.json`; it does
not imply all optional skills or upstream dependencies are installed.

Inspect the rendered desktop and narrow layouts after visual changes. Mechanical
checks catch broken structure, not conflicting advice or unsafe commands.
