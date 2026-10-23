---
standard: "012"
kind: standard
title: Testing and deployment
category: Practice
status: Draft
issued: "2026-10-23"
revision: R1
applies-to: Every repository worked by an agent that has tests or deploys
author: W. Schenk
---

## 1. Introduction

`STD-004` requires a `test` task and `STD-008` says how a deployment is
targeted, but nothing joins the two. It is unstated when tests run, which
results may block a merge, how a preview is shown to work before a person
reviews it, or what happens when something fails after nobody is watching.
The fleet answers each of those differently in every repository, and an
answer that has to be rediscovered is an answer agents get wrong.

This standard covers the loop from pull request to production and back:
checks run on every pull request and are classified as blocking or advisory,
previews are verified rather than assumed, data and model behaviour are held
to recorded benchmarks, production is reached through named gates, and a
failure becomes an issue, a notification, and a conversation routed back to
that issue.

The loop it specifies:

```mermaid
flowchart LR
    PR[pull request] --> CI[blocking + advisory checks]
    CI --> PV[preview deployment]
    PV --> SM[tests against preview]
    SM --> RV[human review]
    RV --> ST[stage] --> GT{sign-off gate} --> PROD[production]
    CI -- failure on main --> IS[issue opened or linked]
    PROD -- failure --> IS
    IS --> SL[Slack notification]
    SL -- reply or match --> IS
```

**Out of scope.** Which test runner or framework a repository uses (`STD-004`).
The shape of a pull request and who merges it (`STD-003`). Platform mechanics
for Vercel and GCP (`best-practices/GDE-010-vercel-deployment.md`,
`best-practices/GDE-005-gcp-deployment.md`). The walkthrough, templates and a
worked example are in `best-practices/GDE-014-testing-and-preview-pipeline.md`.

## 2. Requirements language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** and **MAY** in
this document are to be interpreted as in RFC 2119 [1]. A clause marked
**DEPRECATED** was normative in an earlier revision and is retained so that
repositories still running it can find out what replaced it.

## 3. Requirements

### 3.1

A repository with a `test` task MUST run `mise run lint` and `mise run test` in
CI on every pull request and on every push to the default branch.

A test that only runs on a laptop is a test that runs when someone remembers.
Running the same `mise` tasks a developer runs keeps CI and local results
answering the same question.

### 3.2

Every check MUST be classified as blocking or advisory, and the classification
MUST be recorded in `docs/testing.md`.

A blocking check means the change is wrong and must not proceed: a failed
build, a broken schema, a missing input. An advisory check means somebody
should look: a variance, an unknown column, a slower benchmark. Leaving the
class implicit makes every red mark negotiable, and the fleet learns to ignore
all of them.

### 3.3

Only blocking checks MUST be marked as required in branch protection.

`STD-003 §3.14` forbids merging over a failing required check, so the
required set is the blocking set. An advisory check made required turns a
judgement into a gate; a blocking check left optional turns a gate into a
suggestion.

### 3.4

A test that CI runs MUST NOT require secrets, data or services that exist only
on a developer's machine.

Use a disposable service in the job (a Postgres service container, a local
emulator), fixtures committed to the repository, or preview-scoped credentials
from fnox under `STD-007`. A test that needs a laptop to pass will be skipped
by the first agent that cannot reach one.

### 3.5

A web repository MUST produce a preview deployment for every pull request, or
state that its platform cannot, per `STD-008 §3.8`.

The preview is what a reviewer clicks instead of checking out the branch, and
what the tests in 3.7 run against.

### 3.6

The preview URL MUST be published as a commit status or check on the head
commit, not only as a comment.

Comments scroll away under review threads and do not move with new commits.
A status (`context=preview` or `context=preview/e2e`) with `target_url` set to
the preview origin is pinned to the commit it describes, so an agent can resolve
it deterministically without parsing prose:

```sh
gh api "repos/:owner/:repo/commits/$SHA/status" \
  --jq '.statuses[] | select(.context == "preview/e2e") | .target_url'
```

### 3.7

A pull request that changes a deployed surface MUST have smoke or end-to-end
tests run against its preview before it is marked ready for review.

A green unit suite says the code agrees with itself; a green run against the
preview says the deployment works with real routing, environment and build
output. The run's result is evidence under `STD-003 §3.8`.

### 3.8

A preview MUST use preview-scoped data and credentials.

This restates `STD-007` at the point where it is most often broken: a preview
that is convenient to point at production data is one bad migration away from
destroying it.

### 3.9

A repository whose output is data or model behaviour MUST keep a regression
benchmark, and a result below the recorded baseline MUST be a blocking check.

Matchers, extractors, classifiers and agents regress silently: the code still
runs and the numbers get worse. The benchmark runner MUST record the dataset
identifier, metric name, committed baseline score, measured score, and commit
SHA, and exit non-zero whenever the measured score falls below the baseline.

### 3.10

A confidence threshold that lets output be accepted without human review MUST
be recorded in `docs/testing.md` with its benchmark evidence and approved by a
person.

"Auto-accept above 80%" is a policy decision dressed as a constant. Record the
metric, the numeric bands (auto-accept, human review queue, and
insufficient-evidence), the benchmark run that justified them, and who approved
them with the date, so that a change to the number gets the same review as a
change to the code.

### 3.11

A production release MUST pass through a staging environment and a named
sign-off gate before it reaches production.

The gate names what must be true and who decides it — "five priority feeds
validated for HOV and revenue, signed off by the data owner" — so that "ready
for production" is a checkable statement rather than a feeling. An agent MUST
NOT pass a gate; it can report that the conditions hold.

### 3.12

A failing blocking check on the default branch, a failed production deployment,
or a failed scheduled check MUST open an issue or link to the open issue that
already describes it.

A failure nobody owns does not get fixed. Opening an issue puts it on the
frontier under `STD-002`; linking instead of opening keeps one failure from
becoming twenty duplicates, which `STD-002 §3.19` already asks for.

### 3.13

Automated issues MUST be deduplicated on a stable fingerprint recorded in the
issue body as `<!-- fp:<scope>:<target>:<rule> -->`.

`<scope>` is `ci`, `deploy` or `qa`; `<target>` is the workflow or feed; `<rule>`
is the job or check name (for example `<!-- fp:ci:ci.yml:check -->` or
`<!-- fp:qa:samsung:l1-arrival -->`), never a timestamp or run ID. Before
creating an issue, automation searches open issues for that exact marker and
comments on the match if one exists.

### 3.14

An automated issue MUST carry what failed, where, the first and latest
occurrence, a link to the run or log, and whether the check is blocking or
advisory.

An issue that says "CI failed" sends the reader back to find out everything
the automation already knew.

### 3.15

An automated issue MUST NOT be labelled `ready`.

`STD-002 §3.5` forbids an agent moving an issue into `ready`, and automation is
an agent for this purpose. Apply `automated` (and `bug` where applicable) so a
person can triage it.

### 3.16

A failure that opens or updates an issue MUST notify the repository's named
Slack channel, linking the issue.

The issue is the record; Slack is how a person finds out. The channel is
named in `docs/testing.md` (see 3.19), not hard-coded in a workflow, so
moving it is one edit.

### 3.17

A notification MUST link the issue it is about, and repeat failures MUST be
threaded under the first notification rather than posted again.

The first post records `<!-- slack:channel=<channel-id>;ts=<thread_ts> -->` on
the issue. Subsequent failures for the same issue read `ts` from that marker and
post with `thread_ts` set. One thread per issue keeps the channel readable and
gives replies a single place to land.

### 3.18

A reply to a notification, or a match that resolves it, MUST be routed back to
the issue as a comment.

People answer in Slack, and an answer that stays in Slack is lost to the next
agent reading the issue. A human reply in the Slack thread becomes an issue
comment attributed to its author; a resolving match — a later passing run of the
same `fp:…` fingerprint, a fix PR, or a recovered feed — posts a comment carrying
`<!-- resolved-by:<url-or-sha> -->` and mirrors that update to the Slack thread.
The issue closes only through its pull request or by a person, per `STD-002 §3.18`.

### 3.19

A repository MUST record its check classification, preview verification,
benchmarks and thresholds, sign-off gates, and Slack channel in
`docs/testing.md`.

`docs/testing.md` MUST contain five level-two sections — `## Checks`,
`## Preview verification`, `## Benchmarks and thresholds`, `## Sign-off gates`,
and `## Alerting` (marking `N/A` where a section does not apply) — so that an
agent scaffolding workflows and a person approving a release read and validate
the same file.

## 4. References

[1] Bradner, S., *Key words for use in RFCs to Indicate Requirement Levels*,
BCP 14, RFC 2119, March 1997.

[2] The Focus AI, `STD-002` — Issues and agent workflow. Draft.

[3] The Focus AI, `STD-003` — Pull requests and branches. Draft.

[4] The Focus AI, `STD-004` — Repository tooling and tasks. Draft.

[5] The Focus AI, `STD-007` — Secrets and credentials. Draft.

[6] The Focus AI, `STD-008` — Deployment. Draft.

[7] The Focus AI, `best-practices/GDE-014-testing-and-preview-pipeline.md` —
Testing and preview pipeline.
