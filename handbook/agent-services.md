---
title: Build an agent service
summary: Find the integration state machines, their owners, and the checks between them.
status: Draft
---

A2A carries conversations. MCP exposes tools, resources, and interactive Apps.
Neither protocol decides who can access a client's data, which database to use,
or who may approve a release. Record the adopted protocol version, local
application profile, and policy choices separately.

## Find the integration state machine

These nine state machines describe the Workbench integration with external
specialists. They are separate lifecycles, not one shared status. A discovered
card can coexist with a denied invocation; a disconnected stream can coexist
with a running task. The linked tables own the transitions, guards, effects,
failures, and recovery rules. State labels describe behavior, not necessarily
literal database values or SDK enums.

| State machine | Who controls it | Question the transition table answers |
| --- | --- | --- |
| [Discovery and readiness](conversations.md#discovery-is-not-invocation-readiness) | Host card fetcher and acceptance runner | Did discovery succeed, or did an authenticated invocation pass? |
| [Registry and dispatch](conversations.md#registry-policy-and-dispatch) | Operator, policy store, and dispatcher | Does the current revision still permit this target and identity? |
| [Browser session](service-access.md#browser-session) | Clerk and host backend | Can the host establish a human for a new grant? |
| [Machine credential and token](service-access.md#machine-credential-and-token) | Operator, issuer, caller cache, and receiver | Can the caller mint a token, and does the receiver accept it? |
| [Human delegation and entitlement](service-access.md#human-delegation-and-entitlement) | Grant issuer and receiving specialist | Is the human bound to this sender and allowed this operation? |
| [Bounded demo access](service-access.md#preserve-bounded-demo-access-during-cutover) | Provider operator and verifier | Does the separate, approved demo path still permit access? |
| [A2A task and transport](conversations.md#conversations-tasks-and-transport) | Provider task store and caller recovery code | Is the task finished, paused, or merely no longer observable? |
| [MCP view and snapshot](mcp-apps.md#view-transitions) | Host bridge, view store, and provider | Does the action restore a snapshot, call a tool, or update future-turn context? |
| [Cutover and recovery](release.md#integration-cutover-and-recovery) | Release owner and approved operator | Can this code, schema, and identity configuration receive traffic or roll back? |

## Read transitions without inventing guarantees

A transition needs an event, a guard that permits it, and an owner that applies
its effects. A failed guard follows the stated failure path, not a weaker
authorization profile. Recovery can be a supported read, reauthentication,
configuration repair, or an operator decision; it is not automatically a retry.

Keep each statement's basis explicit:

- Protocol requirements apply to the named version and supported operations.
- Inspected behavior is bounded to the revisions in the [source record](../evidence/workbench-integration.md),
  not a claim about today's deployment.
- Selected policy states what this integration requires, including a human grant
  on every Workbench specialist call. Implementation acceptance remains separate.
- Proposed gates, such as live-probe enablement, are not implemented guarantees
  or release approval.

Before changing a transition, name its guard and failure outcome in the change
description. Exercise both an allowed transition and a rejected one using the
owning page's acceptance checks. Record unsupported recovery operations and
unverified deployment behavior instead of marking them passed. These tables are
an operational description, not an exhaustive protocol model or a formal proof.

## Put responsibility on the owning service

A specialist owns its model loop, guardrails, data, and persisted state. The host
owns its registry, dispatch policy, and host-user session. They communicate
through authenticated interfaces, not imports of another service's code or
queries against its database.

Workbench uses registry-derived specialist calls and keeps credentials on the
server. Its resident agent also uses the A2A relay; its repository forbids a
private chat route. That is Workbench's application architecture, not an A2A
requirement on every vendor.

## Use one definition through the adapters

| Concern | Focus default | Verification |
| --- | --- | --- |
| Tool shape | A name, description, input schema, and execution handler in one `ToolSpec` | Validate public inputs at the boundary. |
| Tool catalog | Derive model and MCP tool exposure from that definition | No divergent second schema or handler. |
| Refusal | Structured result with a stable reason, not an ambiguous successful string | Tests distinguish denial from empty data and execution failure. |
| Citation | Structured provenance tied to the returned result | Source identifiers survive every adapter. |
| System prompt | One canonical prompt; generate or compare any runtime mirror | A changed prompt cannot leave the runtime on stale instructions. |
| Persistence | Postgres task/session state with verified-owner scoping | Restart, missing configuration, failed writes, and cross-owner reads are tested. |
| Model entry point | One `runAgent` used by conversational adapters | An MCP rendering action does not implicitly invoke the model. |

The [UpperHand onboarding packet](https://standards.upperhandai.com/packet)
defines its own refusal/citation Parts and extensions. Use those types when
adopting that contract; do not claim they are universal A2A fields. A vendor's
framework, model, database, and cloud remain implementation choices.

## Persist at the selected owner boundary

Derive the owner from verified identities, not request metadata. Workbench
external specialists use the [required human-delegation profile](service-access.md#require-human-delegation-for-workbench-specialists),
including on coordinator-routed calls. The receiver authorizes the sender and
human independently of task provenance. A machine-only profile is an option
for explicitly approved nonhuman workloads outside that integration; it scopes
data to the authorized service and does not segregate humans.
Check context/task ownership on every operation. Do not rely on an SDK's
default anonymous owner to isolate callers.

Await required writes before terminal success, or use an explicitly supported
durable completion mechanism. Do not silently fire and forget persistence.
Production fails closed without its database; in-memory state is an explicit
mock mode. Apply migrations before traffic shifts, not on application boot.

## Implement only the contract you advertise

Publish a card whose interfaces, versions, streaming, security, and extensions
match the actual endpoint. A native Clerk bearer profile must not advertise an
invented OAuth token endpoint. Use one handler for supported dialects, and make
unsupported operations explicit rather than retrying through another dialect.

The [server recipe](../recipes/a2a-server.md) gives the versioned layout and event
ordering. Test task-before-update and artifact-before-terminal ordering only
on task-producing paths; a standalone Message need not create a task.

The [component lifecycle evidence](../evidence/component-lifecycle.md) covers
local resource ownership behind these interfaces. It is not a protocol contract.
