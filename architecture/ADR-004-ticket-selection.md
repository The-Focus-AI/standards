---
number: "004"
title: "Ticket selection is judged, not sorted"
kind: decision
issued: "2026-07-26"
author: W. Schenk
status: Accepted
---

# Ticket selection is judged, not sorted

`STD-002 §3.11` defines the **frontier** — every issue that is `ready`, unassigned, and
has no open blocking relationship — and says an agent takes work only from it. It does not
say which item to take. The frontier is a set, not a queue.

That gap surfaced when writing the `work-next-issue` skill, which cannot run without an
answer.

## Decision

**An agent picks the most valuable item on the frontier using its own judgement, and
records the reason when it claims.** No priority label, no ordering clause, no sort.

The obligation is on the *stating*, not on the *answer*. A claim comment that names what
the agent took and what it took that above is auditable: a person reading the tracker can
see the reasoning was wrong, which is a thing they can correct. A claim with no reason is
indistinguishable from taking the first row, and nobody can tell the difference after the
fact.

The skill lists what to weigh — what the item unblocks, whether it is finishable in one
pass, whether it removes a live failure, what the repository is currently for, cost of
delay — as guidance rather than as a formula. Weights are not specified because the right
weighting is situational, which is the whole reason this is judgement.

## Alternatives considered

| Option | Why not |
| --- | --- |
| **FIFO — oldest `ready` first** | No judgement required and no gaming, which is its appeal. But it is actively wrong whenever an old ticket is stale and a new one is on fire, and it makes the tracker's order the plan without anyone deciding that. |
| **Priority labels (`P0`/`P1`/`P2`)** | Moves the judgement to triage rather than removing it, and adds a second axis that drifts against `ready` — the failure `STD-002 §3.1` exists to prevent. Somebody has to relabel as circumstances change, and nobody will. |
| **Blocking-count descending** | The most defensible mechanical rule, and the data already exists because `STD-002 §3.10` requires dependencies as blocking relationships. Rejected as the *rule* because it optimises one factor into the only factor: an issue blocking three trivial tickets outranks a production outage blocking nothing. Kept as the first thing to weigh. |
| **Leave it unspecified** | What we had. It makes the skill unwritable and guarantees every agent invents its own answer, silently and differently. |

## What would change the answer

- **Claim comments stop carrying reasons.** The whole decision rests on the choice being
  recorded. If reasons degrade into "taking this one", the audit trail is gone and a
  mechanical rule becomes better than a fake judgement.
- **Agents systematically take the small ones.** If the record shows large valuable
  tickets ageing on the frontier while agents pick off easy ones, the "finishable in one
  pass" factor is doing too much work and needs a counterweight.
- **The frontier gets big.** Judgement over five items is a reading; over eighty it is a
  guess. At that size a triage layer earns its keep.
- **Several agents run concurrently at scale.** Independent judgement over a shared
  frontier means every agent reasons about the same top item and all but one wastes the
  claim race. A queue is worth more than a reading when the contention is real.

## Provenance

The gap was identified by an agent from repository evidence and put to the user, who
decided that selection is left to the model's judgement. The obligation to record the
reason, the factors to weigh, and everything under *what would change the answer* are the
agent's, and are flagged as such per `STD-006 §3.8`.
