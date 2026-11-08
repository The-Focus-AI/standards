---
title: Build an agent service
summary: One model entry point, one tool catalog, and explicit ownership across the wire.
status: Draft
---

A2A carries conversations. MCP exposes tools, resources, and interactive Apps.
Neither protocol decides who can access a client's data, which database to use,
or who may approve a release. Record the adopted protocol version, local
application profile, and policy choices separately.

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

Continue with the topics that own the runtime decisions:

- [Service access](service-access.md): credential profiles, grants, and entitlements.
- [Conversations](conversations.md): discovery, registry, tasks, interruption, and next turns.
- [Interactive views](mcp-apps.md): initialization, ownership, snapshots, and refresh.
- [Release](release.md): schema/code cutover, acceptance, and recovery.

The [component lifecycle evidence](../evidence/component-lifecycle.md) covers
local resource ownership behind these interfaces. It is not a protocol contract.
