---
name: work-next-issue
description: >
  Take the next piece of work off the issue tracker and carry it to an open pull request.
  Reads the frontier (ready, unassigned, unblocked), judges which issue is worth the most
  right now and says why, rechecks eligibility and claim ownership,
  cuts the branch, does the work, and opens a pull request with success criteria at the
  top. Stops at the merge gate — a person merges.
  Use when asked to pick up work, start the next thing, or clear the queue.
  Triggers on: "next ticket", "next issue", "what should I work on", "pick something up",
  "start the next thing", "work the queue", "take the top of the backlog", "grab an issue",
  "keep going" after a merge.
---

# Work the next issue

One pass: frontier → choose → claim → branch → build → pull request → stop.

This skill executes `STD-002` (issues and agent workflow) and `STD-003` (pull requests
and branches). Where this file and a standard disagree, the standard wins.

## The three gates you never cross

Read these before anything else. Each exists because crossing it converts a small
mistake into merged code.

1. **You never invent an unresolved decision to make a ticket `ready`**
   (`STD-002 §3.4–3.5`). A person or agent may mark a fully specified ticket ready
   after checking its acceptance criteria, verification plan, and dependencies.
   Record the assessment; ask for missing product or approval decisions rather
   than assuming them. Readiness grants neither merge nor deployment authority.
2. **You never merge your own pull request** (`STD-003 §3.12`). Opening it is where your
   pass ends.
3. **You never take work from outside the frontier** (`STD-002 §3.11`). Outside it, the
   work is either unaccepted, already claimed, or blocked on something that does not
   exist yet.

## 1. Read the frontier

The frontier is every open implementation issue that is `ready`, unassigned,
and has no open blocking relationship (`STD-002 §3.11`, `§3.16`). This query
collects candidates, not a complete eligibility decision; paginate when needed:

```sh
gh issue list --label ready --state open --json number,title,body,labels,assignees,url \
  --limit 100 | jq '[.[] | select(.assignees == [])]'
```

Read native blocking relationships where the tracker supports them; otherwise
resolve the references in its `## Blocked by` section (`STD-002 §3.10`). Exclude
open blockers, `type:spec`, `type:epic`, and `wayfinder:map` planning containers.
If blocker state cannot be read, do not assume the issue is unblocked.

If the frontier is empty, assess close-to-ready backlog items against §3.4–3.5.
An agent may prepare and mark a genuinely complete issue ready, then recompute
the frontier. If a decision is missing, stop and name it instead of creating
work for its own sake.

## 2. Choose, and say why

**This is your judgement.** There is no priority label and no ordering rule; the
organisation decided deliberately that picking the next piece of work is a reading of the
situation rather than a sort (`ADR-004`). What is required is not a particular answer but
a stated one.

Weigh, roughly in this order:

- **What it unblocks.** An issue that several others are blocked by is worth more than its
  own size suggests. This is the one factor you can check mechanically — look at what
  names it in a `## Blocked by` section.
- **Whether it is finishable.** A ticket you can carry to a reviewable pull request in one
  pass beats a larger one you will abandon half-done, holding a claim.
- **Whether it removes a live failure.** Something broken in production outranks something
  merely absent.
- **What the repository is currently for.** Read `AGENTS.md` and the recent commits. Work
  that moves the stated current goal beats work that is merely tidy.
- **Cost of delay.** Some tickets get more expensive the longer they wait — anything
  blocking a person, anything about to be overtaken by a dependency change.

Then write the reason down. When you claim, the comment says which issue you took **and
what you judged it above**. Judgement that is not recorded is indistinguishable from
picking the first row, and the next reader — usually another agent — has no way to tell
whether the choice was considered.

## 3. Claim it and verify ownership

Several agents read the same frontier at the same time, so what you learned in step 1 is
already stale. Re-read at the moment of claiming, and read back after writing
(`STD-002 §3.7`, `§3.8`).

Follow the complete claim contract in `STD-002 §3.7–3.8`: recheck all frontier
conditions, replace `ready` with `active` while assigning, and verify the result
before branching. The old assignee-only shell snippet was not a complete check.

These GitHub writes are not an atomic lock. If multiple sessions share one GitHub
identity, assignee equality cannot distinguish them; use the repository's
session-claim mechanism or stop for coordination. Do not claim race safety from
a read-after-write alone. If eligibility or ownership is unclear, do not start
work or remove another session's claim.

Once the claim holds, comment. State what happened and what happens next, in one or two
sentences, with the reason from step 2 (`STD-002 §3.12`, `§3.13`). No preamble, no
enthusiasm, no emoji.

> Claimed. Taking this ahead of #98 and #103 because both of those are blocked by it.
> Next: branch `142-preview-check-not-comment`, then a pull request with the preview
> reachable from the check list.

## 4. Cut the branch

Named `<issue-number>-<slug>`, from the default branch, at the moment work starts
(`STD-003 §3.1`, `§3.2`). Not from another feature branch and not from a stale local copy.

```sh
set -eu
test -z "$(git status --porcelain)" || { echo "Preserve existing work before branching" >&2; exit 1; }
DEFAULT=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
BRANCH=$(gh issue view "$N" --json number,title \
  --jq '(.number | tostring) + "-" + (.title | ascii_downcase | gsub("[^a-z0-9]+"; "-"))')
git fetch origin "$DEFAULT"
git switch -c "$BRANCH" FETCH_HEAD
```

If the branch already exists, stop and inspect its owner and work instead of
resetting it. The command deliberately creates rather than overwrites a branch.

## 5. Do the work

Ordinary work, against the acceptance criteria in the issue. Two things specific to
working a ticket:

- **If the issue turns out not to be ready** — the criteria contradict, a decision is
  missing, the approach needs an answer only a person has — stop and move it to `blocked`
  with a comment naming exactly what you need and who from (`STD-002 §3.9`). `blocked`
  means waiting on a person. Waiting on another issue is a blocking relationship, not a
  label.
- **If it grows past one pass**, say so on the issue and open the pull request for what is
  done, marked draft, rather than holding the claim silently.

## 6. Open the pull request

Success criteria first — above the why, above the diff summary, above everything
(`STD-003 §3.6`). A reviewer who has to scroll to find out what the change was supposed to
achieve reviews the code instead of the outcome.

Four sections, in this order (`STD-003 §4`):

```text
## Success criteria     — checkable statements, one per box
## Why                  — Closes #N, and what was wrong before
## What changed         — the shape of the diff in prose
## Evidence             — a table mapping each criterion to what proves it
```

Evidence lives in the pull request itself — attached screenshots and recordings, or command
output pasted in — not behind a link that expires. For a change that is not a feature
build, evidence may reduce to the check that proves it.

## 7. Stop

Say what you took, why you took it over what else was there, and what state it is in.
Then stop.

A person merges (`STD-003 §3.12`). If the repository uses the `auto-merge` opt-in
(`STD-003 §3.13`), a person still applies it.

Running this again is a fresh pass: back to step 1, against a frontier that has changed.

## What this skill does not do

- It does not invent product scope or approval decisions during triage. It may
  prepare a complete ticket and mark it ready under `STD-002 §3.5`.
- It does not decide the ordering rule. There isn't one. See `ADR-004` for why, and for
  what would change the answer.
- It does not review or merge. Both need someone other than the author.
