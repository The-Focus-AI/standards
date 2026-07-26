---
standard: "010"
kind: standard
title: Agent services
category: Practice
status: Draft
issued: "2026-07-25"
revision: R1
applies-to: A2A-discoverable agent services
author: W. Schenk
---

## 1. Introduction

`best-practices/GDE-001-a2a-agent.md` documents the pattern proven in the first
production agent deployment. Section 4 of that document is headed "The seven
required patterns" and opens by saying everything in it is load-bearing rather
than stylistic — which makes it a set of requirements sitting at line 100 of a
694-line walkthrough, where nobody looking for rules will find it.

This standard extracts those seven. The walkthrough keeps everything else: the
reference stack, the directory layout, the AgentCard, auth, local development,
and the deployment steps.

**Out of scope.** The reference implementation itself. Which model an agent
uses. Deployment, which is `STD-008`.

## 2. Requirements language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** and **MAY** in
this document are to be interpreted as in RFC 2119 [1]. A clause marked
**DEPRECATED** was normative in an earlier revision and is retained so that
repositories still running it can find out what replaced it.

## 3. Requirements

### 3.1

Every tool MUST be either a visual tool or a discovery tool, and a tool that
does both MUST be split.

A visual tool makes a verifiable factual claim and carries provenance with it. A
discovery tool answers "what can I ask about" and carries no claim. The shape
declares the intent, so a tool that lists options *and* asserts something is two
tools wearing one name — and the claim it makes is the one that escapes audit.

### 3.2

A tool MUST be defined once and projected to every surface that exposes it.

One `ToolSpec` object, from which the AI SDK tool and the MCP tool are derived.
Two hand-maintained definitions drift, and the drift shows up as a tool that
behaves differently depending on which surface called it — which is close to
undebuggable from either side.

### 3.3

A refusal MUST be typed and advertised.

Every agent has things it will not compute: missing data, a blocked stakeholder
decision, a methodologically unsafe input. Those are outcomes, not errors, and
they carry a rule identifier and their own media type declared on the AgentCard.
A refusal rendered as prose is indistinguishable from a failure, and a caller
cannot handle what it cannot recognise.

### 3.4

A quantitative claim MUST carry a citation.

Every visual tool returns a citation alongside its data, typed and advertised
the same way refusals are. A number an agent produced with no trace of where it
came from is a number nobody can defend to a client, and it will eventually be
put in front of one.

### 3.5

The system prompt MUST live in markdown, with any code mirror kept in lockstep.

The prompt is the most-edited and least-reviewed artefact in an agent service.
Keeping it as prose makes it reviewable as prose; keeping the mirror in lockstep
stops the deployed behaviour diverging from the document everyone reads.

### 3.6

Agent sessions MUST persist to Postgres.

Not optional. It is the single feature that turns a silent agent bug from a
days-long mystery into a SQL query, and it has to be there before the bug
arrives rather than added while chasing one.

### 3.7

Every surface MUST call one agent entry point.

The A2A endpoint and any internal chat route call the same function, tagged with
the surface it came from. Two entry points become two behaviours, and the one
with fewer users is the one that quietly rots.

## 4. References

[1] Bradner, S., *Key words for use in RFCs to Indicate Requirement Levels*,
BCP 14, RFC 2119, March 1997.

[2] The Focus AI, `best-practices/GDE-001-a2a-agent.md` — the reference walkthrough.

[3] The Focus AI, `STD-008` — Deployment. Draft.
