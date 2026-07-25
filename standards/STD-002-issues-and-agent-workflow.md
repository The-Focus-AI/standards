---
standard: "002"
title: Issues and agent workflow
category: Practice
status: Draft
issued: "2026-07-25"
revision: R1
applies-to: Every repository worked by an agent
author: W. Schenk
---

## 1. Introduction

Agents pick up work from the issue tracker without a person in the loop. That
only works if the tracker states, unambiguously and at a glance, what is
specified, what is being worked, and what is stuck. This standard fixes the
state vocabulary, who may move an issue between states, and what an agent says
when it does.

It replaces the per-project `docs/agents/issue-workflow.md` template as the
source of the rules. That file remains, but only for configuration a repository
genuinely varies: which tracker it uses and where its local fallback lives. It
no longer restates the vocabulary, because twenty editable copies of a rule are
twenty rules.

**Out of scope.** Pull requests, branch naming, and review are `STD-003`. This
standard does not cover which planning skills produce a ticket, nor the contents
of a spec beyond where it lives.

## 2. Requirements language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** and **MAY** in
this document are to be interpreted as in RFC 2119 [1]. A clause marked
**DEPRECATED** was normative in an earlier revision and is retained so that
repositories still running it can find out what replaced it.

## 3. Requirements

### 3.1

Every open issue MUST carry exactly one state label from `backlog`, `ready`,
`active`, `blocked`, `wontfix`.

Exactly one, always. An issue with no state label is invisible to the frontier
and to every board built on it; an issue with two states is a question nobody
can answer. State is a single axis, and a tracker where that is not enforced
stops being a source of truth within a week.

### 3.2

A newly created issue MUST enter `backlog`.

`backlog` means captured but not yet specified or accepted — it absorbs what the
previous vocabulary called `needs-triage`. Nothing is skipped straight to
`ready` on creation, including by an agent filing follow-up work it discovered
while doing something else.

### 3.3

An issue MUST NOT be labelled `ready` unless it states a goal, background links,
acceptance criteria, a verification plan, and what is out of scope.

`ready` is a promise that an agent can complete the work without asking anyone
anything. Those five sections are what make that promise checkable. An issue
missing any of them is `backlog`, however obvious the work seems.

### 3.4

An agent MUST NOT move an issue into `ready`.

This is the triage gate, and it is the one place a person is structurally
required. Without it an agent can declare its own underspecified ticket ready
and then pick it up, which converts a planning failure into merged code. An
agent that believes an issue is ready says so in a comment and leaves the label
alone.

### 3.5

An agent MUST assign itself to an issue before labelling it `active`.

`active` answers "is anyone on this"; the assignee answers "who". Both are
needed when several sessions share a frontier, and an `active` issue with no
assignee is indistinguishable from an abandoned one.

### 3.6

`blocked` MUST mean the issue is waiting on a person.

A question, a decision, an access grant, an external dependency. It is a human
queue, and it is meant to be worked. Blocking on *another issue* is not this —
see 3.7. Conflating the two is why boards stop being trusted: a `blocked` column
full of items that will unblock themselves teaches everyone to ignore it.

### 3.7

A dependency between issues MUST be recorded as a blocking relationship, never
as a label.

Use the tracker's native blocked-by relationship where it exists, and a
`## Blocked by` section listing issue references where it does not. The
dependency then resolves itself when the blocker closes, with nobody
relabelling anything.

### 3.8

An agent MUST take work only from the frontier.

The frontier is every issue that is `ready`, unassigned, and has no open
blocking relationship. An agent that reaches outside it is either working
something a person has not accepted, something already claimed, or something
whose prerequisites do not exist yet.

### 3.9

An agent MUST comment on the issue whenever it changes that issue's state.

The label says what the state is; the comment says why it changed. A state
change with no comment leaves the next reader — usually another agent —
guessing at intent from a timestamp.

### 3.10

A state-change comment MUST state what happened and what happens next.

One or two sentences. No preamble, no apology, no restating the ticket title.
"Blocked: the preview vault has no `NEON_URL` for this project. Needs an
operator to create it, then this returns to `ready`." Voice follows `DESIGN.md`
— factual, no enthusiasm, no emoji.

### 3.11

An issue labelled `wontfix` MUST carry the reason in a comment before it is
closed.

`wontfix` is a decision, and a decision with no recorded reason gets relitigated
every quarter. Name what was decided and what would change the answer.

### 3.12

A spec or PRD MUST exist as its own tracker item, and every ticket derived from
it MUST link back to that item.

Specs live where the work lives, so an agent reading a ticket can reach the
reasoning behind it in one hop. The spec item carries a type label and moves
through the same states; it is excluded from the frontier by 3.13 rather than by
being kept somewhere else.

### 3.13

An issue that is not directly workable MUST carry a type label, and an agent
MUST NOT take type-labelled planning items as work.

Type is a second axis, independent of state: `type:spec`, `type:epic`, and the
existing `wayfinder:map` are containers, not tickets. They may be `ready` —
meaning ready to be broken down — without being something to implement.

### 3.14

An issue SHOULD NOT be created for work already described by an open issue.

At the volume this fleet generates, duplicates are the main way a tracker
becomes unusable. Search before filing; when work turns out to be a duplicate,
close it referencing the original rather than merging the two descriptions.

## 4. The state machine

```text
    (created)
        │
        ▼
   ┌─────────┐   specified + accepted    ┌───────┐
   │ backlog │ ───────────────────────►  │ ready │ ◄──────────┐
   └─────────┘   (human only — 3.4)      └───┬───┘            │
        ▲                                    │ agent claims   │ person
        │                                    │ + assigns      │ answers
        │                                    ▼                │
        │                               ┌────────┐      ┌─────┴─────┐
        │                               │ active │ ───► │  blocked  │
        │                               └────┬───┘      └───────────┘
        │                                    │ work merged
        │                                    ▼
        │                                (closed)
        │
        └──── any state ────► wontfix ────► (closed)
```

Closing is not a label. An issue that is done is closed with its state label
left as it was; `wontfix` is the only state that describes *why* something
closed.

## 5. Label reference

| Label | Axis | Meaning | Who sets it |
| --- | --- | --- | --- |
| `backlog` | state | Captured, not yet specified or accepted | Anyone |
| `ready` | state | Fully specified; an agent can finish it unaided | Person only |
| `active` | state | An agent is working it; assignee names which | Agent |
| `blocked` | state | Waiting on a person | Agent or person |
| `wontfix` | state | Decided against; reason recorded | Person |
| `type:spec` | type | A spec or PRD, not a ticket | Anyone |
| `type:epic` | type | A container for tickets | Anyone |
| `wayfinder:*` | type | Wayfinder map and child-ticket kinds | Wayfinder |

Migrating from the previous vocabulary: `ready-for-agent` becomes `ready`,
`needs-triage` becomes `backlog`, and `needs-info` becomes `blocked`.

## 6. References

[1] Bradner, S., *Key words for use in RFCs to Indicate Requirement Levels*,
BCP 14, RFC 2119, March 1997.

[2] The Focus AI, `STD-001` — How a standard is written. In force.

[3] The Focus AI, `STD-003` — Pull requests and branches. Not yet issued.
