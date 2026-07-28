---
name: work-next-issue
description: >
  Take the next piece of work off the issue tracker and carry it to an open pull request.
  Reads the frontier (ready, unassigned, unblocked), judges which issue is worth the most
  right now and says why, claims it race-safely so two agents never land on one ticket,
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

1. **You never move an issue into `ready`** (`STD-002 §3.5`). `ready` is a person saying
   the work is specified well enough to do without asking anyone anything. An agent that
   promotes its own underspecified ticket and then picks it up has turned a planning
   failure into a pull request. If you believe an issue is ready, say so in a comment and
   leave the label alone.
2. **You never merge your own pull request** (`STD-003 §3.12`). Opening it is where your
   pass ends.
3. **You never take work from outside the frontier** (`STD-002 §3.11`). Outside it, the
   work is either unaccepted, already claimed, or blocked on something that does not
   exist yet.

## 1. Read the frontier

The frontier is every issue that is `ready`, unassigned, and has no open blocking
relationship (`STD-002 §3.11`).

```sh
gh issue list --label ready --state open --json number,title,body,labels,assignees,url \
  --limit 100 | jq '[.[] | select(.assignees == [])]'
```

Blocking relationships are recorded natively where the tracker supports it and as a
`## Blocked by` section listing issue references where it does not (`STD-002 §3.10`). Read
the body for that section and drop any issue whose blockers are still open.

If the frontier is empty, stop and say so. Name what is in the backlog that looks close to
ready and what each one is missing — that is the useful answer, and it is a triage prompt
for a person rather than an invitation to promote something yourself.

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

## 3. Claim it, race-safely

Several agents read the same frontier at the same time, so what you learned in step 1 is
already stale. Re-read at the moment of claiming, and read back after writing
(`STD-002 §3.7`, `§3.8`).

```sh
gh issue view "$N" --json assignees,state,labels \
  | jq -e '.assignees == [] and .state == "OPEN"' || exit 0
gh issue edit "$N" --add-assignee "@me" --add-label active
gh issue view "$N" --json assignees \
  | jq -e '[.assignees[].login] == ["'"$AGENT"'"]' || exit 0
```

If either check fails, another session won. Take the next issue instead — silently. Do not
comment and do not unassign the winner.

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
git fetch origin && git checkout -B "$(gh issue view "$N" --json title \
  | jq -r '"'"$N"'-" + (.title | ascii_downcase | gsub("[^a-z0-9]+"; "-"))')" origin/HEAD
```

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

- It does not write issues. Specifying work is triage, and triage is `ready`, which is a
  person's decision.
- It does not decide the ordering rule. There isn't one. See `ADR-004` for why, and for
  what would change the answer.
- It does not review or merge. Both need someone other than the author.
