---
title: Take work through review
summary: Make work actionable, claim it safely, and keep acceptance separate from permission to merge.
status: Draft
---

Use the repository's issue tracker. Record only tracker configuration and local
exceptions in its agent guide, not another copy of this workflow. GitHub Issues
is the default when available; local `docs/issues/` is an explicit fallback.

## Make the next action visible

| State | Meaning | Next transition |
| --- | --- | --- |
| No state label | Backlog; incomplete specification | A person or agent establishes readiness. Do not add a `backlog` label. |
| `ready` | Goal, background, acceptance criteria, verification plan, and non-goals are complete | Claim only if unassigned with no open dependencies. |
| `active` | One owner is implementing | Open a linked draft PR, or state the human decision that blocks progress. |
| `blocked` | Waiting on a person, access grant, or decision | Name who must do what before returning to ready. |
| `wontfix` | Deliberate decision not to do the work | Record why and what would reopen the decision, then close. |
| Closed | Implemented through the linked PR, or explicitly declined/duplicated | Keep the result and its reason traceable. |

An open issue has at most one state label. Record issue dependencies with native
blocking links, or a `Blocked by` section, not with the human-waiting label.
Specs and epics are planning items, not implementation work: use `type:spec`,
`type:epic`, or `wayfinder:map`, and link derived tickets to the spec.

Readiness is not permission to merge, deploy, spend, or change credentials.
A complete ticket with an unresolved product decision is not ready to implement.

## Claim before implementing

The eligible work is open, ready, unassigned, non-planning work with no open
blocker. Choose the issue worth doing now and say why; do not invent a priority
scoring scheme. Check existing issues before creating a duplicate.

1. Read the issue and every dependency again immediately before claiming.
2. Assign the owner, replace `ready` with `active`, and read back the result.
3. Yield if another owner holds the claim. Do not remove that owner's assignment.
4. If sessions share one tracker identity, use explicit session coordination.
   Sole assignment does not distinguish two sessions using the same account.

Comment on state changes with what happened and what happens next. One or two
sentences are enough. Never treat an unreadable dependency as a closed one.

## Open one reviewable change

Start from the current default branch. Name the branch `<issue-number>-<slug>`
and open one PR per implementation issue. If the work cannot fit, split the
issue before implementing. Use a closing reference such as `Closes #142`.

Put these sections in the PR description, in this order:

1. **Success criteria**: observable outcomes a reviewer can check.
2. **Why**: the problem and relevant constraints.
3. **What changed**: decisions worth reviewing, not a file-by-file diff summary.
4. **Evidence**: commands and results tied to each criterion; preview and images
   for visual changes, a short recording for interactions.

Keep the PR draft until ready. Distinguish a failure caused by the change from
a failure reproduced on the unchanged base. Neither permits ignoring a required
check. Reply when addressing review; do not force-push after human review.

## Keep approval independent

Do not approve and merge your own work. A person may grant bounded auto-merge
permission by applying `auto-merge` to the issue before implementation; required
checks still have to pass. Ticket readiness and product maturity do not imply
that permission. The [release gate](release.md) is a separate decision.

Merging the linked PR closes implemented work. A duplicate can be closed with a
link to the original and an explanation. A passing recovery notification alone
does not authorize closing the original issue.
