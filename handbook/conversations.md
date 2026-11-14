---
title: "Run an agent conversation"
summary: "Discovery, registry dispatch, new turns, and interrupted tasks have different success conditions."
status: "Draft"
---

A public card is discovery, not proof of authenticated invocation. Record the
configured protocol dialect and the operations both caller and provider support.
The implementation examples below were inspected on 2026-11-07; they do not
establish live acceptance. [Source record](../evidence/workbench-integration.md).
Use the [state-machine index](agent-services.md#find-the-integration-state-machine)
to find the credential, view, and release lifecycles that surround a conversation.

## Discovery is not invocation readiness

Track card freshness, configuration enablement, and invocation evidence
separately. None is a substitute for the others. The acceptance states below
are a proposed way to record readiness, not an implemented enablement gate.

| Transition | Guard, owner and recorded effect | Failure or recovery |
| --- | --- | --- |
| Unknown or expired card to discovered | Workbench fetches and parses the public AgentCard. Cache uses `max-age` minus `Age`, capped at 300 seconds; no freshness permission means no cache | Expiry evicts the old entry. Fetch/parse errors are discovery failures, not failed token validation or permission revocation. |
| Configuration disabled to enabled | Operator provides credentials and the selected policy; managed enablement checks configuration blockers | A green discovery dot and an enabled record still do not prove an authenticated operation. Specialist B's public card succeeded while invocation was blocked. |
| Enabled to invocation-verified, proposed acceptance gate | Approved harness exercises positive and negative calls through the deployed route; record target, code, policy, profile, operation, timestamp and result | Changed target/profile/revision invalidates that evidence. Readiness lifetime and whether the UI toggle blocks on a probe remain design decisions; current enablement has no live-probe gate. |
| Verified to failed or unverified acceptance | A new acceptance call fails, or the recorded target/profile/revision changes | Keep the card and configuration results separate. Repair the failing path and run new acceptance checks; do not reuse the old success as proof. |

## Registry policy and dispatch

At Workbench `c302e20`, these revision controls apply to entries opting into
`identityPolicy: "admin"`; other registry configurations do not acquire those
controls implicitly. `WORKBENCH_AGENTS` replaces the whole fleet, not one row.

| Transition | Guard, owner and recorded effect | Failure or recovery |
| --- | --- | --- |
| Absent or disabled to enabled | Authorized operator saves expected revision with valid configuration; `savePolicy` increments revision and commits policy plus audit together | Compare-and-swap conflict returns 409; reload and reassess instead of overwriting. A failed transaction saves neither policy nor audit. |
| Enabled to suppressed | `resolvePolicy` sees missing/disabled policy, blockers or mismatched target binding | New resolution returns no managed agent. Restore configuration and explicitly save/review a new policy; no legacy fallback. |
| Resolved to dispatched | `agentHeaders` re-resolves the managed entry and checks revision, URL and identity before minting headers | Changed or disabled policy blocks this dispatch. It does not cancel an already dispatched call. |
| Configuration changed | Binding includes slug, JSON-RPC URL, dialect, machine identity/scope and signer identity; OAuth binding also includes token URL | Machine secret is not in this policy binding, although token cache keys include auth configuration. Rotation is not equivalent to policy revision or immediate revocation. |

The selected [Workbench delegation policy](service-access.md#require-human-delegation-for-workbench-specialists)
requires both credentials on every external-specialist dispatch, beyond these
inspected registry controls. Direct relay and coordinator-routed requests to
the same specialist retain the same verified sender and human. A coordinator
task or parent-agent label records provenance; it cannot replace the human
grant, change its subject or supply entitlement. Reject missing delegation
before dispatch and at the receiver. Existing fixture results do not establish
that every path already enforces this policy.

The dispatcher also owns [credential destination checks](service-access.md#bind-credentials-to-the-approved-destination).
A redirect or changed target is not permission to forward the minted headers.

## Conversations, tasks and transport

These A2A v1.0 concepts are protocol-defined. The caller's recovery support and
the provider's stored history are separate implementation facts. Full normative
wire details remain in the [A2A specification](https://a2a-protocol.org/v1.0.0/specification/).

### Task state belongs to the provider

Active tasks are submitted or working. Input-required and auth-required tasks
are interrupted, not terminal. Completed, failed, rejected, and canceled tasks
are terminal. A standalone Message has no task lifecycle.

| Transition | Guard, owner and effect | Failure or recovery |
| --- | --- | --- |
| New turn to Message or new Task | Caller creates a fresh message id; server can return a standalone Message or create its own task id | An accepted Message need not create a task. A client-supplied context is used only by prior agreement; otherwise retain the server-issued context. |
| Active to terminal | Provider publishes applicable task progress and artifacts, then a completed, failed, rejected or canceled state | Persist results under the verified owner. Transient stream events are not a reliable durable record. Not every task must pass through every active state. |
| Working to input-required or auth-required | Provider pauses for input or authorization; an authorized continuation addresses the unfinished task | Interrupted is not terminal. Resume only through implemented operations; never interpret this state as permission to bypass auth. |
| Interrupted to working | Required input or authorization arrives through a supported continuation; provider resumes the unfinished task. Negotiated out-of-band authorization can permit resumption without another message | If either side lacks continuation support, report that limit. A new send is not an automatic recovery path. |
| Terminal task remains terminal; next turn starts separately | Caller sends a new message id and no terminal task id; server starts a new task or Message. Input history follows the configured profile described below | Terminal tasks do not restart. Workbench retains a child context per conversation/specialist; provider checks the selected profile's ownership boundary even if another caller reuses the id. |
| Cancellation requested to confirmed or refused | Caller invokes supported cancellation; server acknowledges its actual outcome | A local Stop button is not remote cancellation. A terminal or noncancelable task can refuse; unsupported operations stay explicit. |

### Transport state belongs to the caller

Attached, disconnected with unknown outcome, and recovered observation describe
what the caller knows. A broken connection does not change the provider's task
to failed, canceled, or input-required.

| Transition | Guard, owner and effect | Failure or recovery |
| --- | --- | --- |
| Attached to observed pause or terminal result | Provider reports an interrupted or terminal state; caller records it even if the stream then closes | An observed input-required or auth-required state is a known pause, not an unknown transport failure. Follow its supported continuation path. |
| Attached stream to disconnected/unknown | Client loses transport without observing an interrupted or terminal result | Preserve task/context ids. Poll `GetTask` or subscribe only when implemented; an abort does not establish cancellation. Do not resend the question to discover the result. |
| Known task to recovered observation | Authorized caller reads a persisted task snapshot when both caller and provider support that operation | Specialist A supports polling, rejects live resubscription and has no successful cancellation path at the inspected revision. Workbench `askSpecialist` rejects a noncompleted SDK task with “do not repeat the request” and has no polling/resume loop. Its direct transport's `reconnectToStream` returns `null`. |
| Unknown outcome remains unresolved | No supported read/resume path exists, or its result is unavailable | Caller reports uncertainty with known ids for operator reconciliation. Lack of observation does not authorize replay or prove cancellation. |

### A new turn is not a task retry

Workbench `c302e20` has distinct input-history paths. Its direct
`A2AChatTransport` sends only the latest user text for configured `v1` and
`a2a-0.3` dialects. For the legacy specialist-specific dialect, `composeOutboundText` instead sends a
`<conversation-so-far>` recap followed by the current question. The recap contains
up to eight prior user/assistant text turns, capped at 1,500 characters each.
This is an explicit compatibility path for the stateless legacy receiver, not
A2A history persistence. The transport sends no `taskId` and uses the supplied
new-turn `messageId` or generates a UUID. The server-side `askSpecialist` client
forwards its supplied question without calling this recap composer. Keep these
paths distinct in tests; a shared `contextId` does not give them identical history.

A2A makes `GetTask` idempotent but only permits, rather than guarantees, send
deduplication by message id. No general exactly-once, automatic resume, lost-event
replay or cancellation guarantee follows from using the SDK.

## Verify the configured paths

Confirm the unauthenticated call returns an auth failure, not just a malformed
JSON-RPC error. Then run the service's authenticated integration harness with
the service identity and human grant required by its selected profile. For
Workbench external specialists both are mandatory on direct and routed paths. Keep
credentials in the secret store/environment, not command arguments or logs.
Record the configured dialect and the operations advertised and supported by
both caller and provider. Exercise blocking calls, streaming, same-context
follow-ups and post-completion `GetTask` only for supported paths. Test each
dialect the integration configures; do not assume both v1 and v0.3 are supported.
For unsupported operations or dialects, record an explicit unsupported outcome,
not a successful check or an implicit retry through another path. Test owner
isolation under the selected authorization profile. See the packet's
acceptance checklist.

| Case | Observable acceptance criterion |
| --- | --- |
| Discovery without access | Valid public card plus missing/invalid invocation credentials never reports invocation-verified. |
| Registry race | Two saves at one revision produce one success and one conflict; policy/audit stay atomic. Disable or target rebind prevents the next managed dispatch. |
| Delegated dispatch | Direct and coordinator-routed Workbench calls carry a target-bound grant for the same human, bound to the actual machine `sub`. Missing or mismatched grants and denied human entitlements stop execution on both paths. Altering task provenance cannot change this result. |
| Next-turn identity | New turns use distinct message ids, retain the authorized context where supported and never address a completed task id. New Task results have distinct task ids; standalone Messages need not create tasks. Test isolation at the selected profile's owner boundary. |
| SDK-profile input | Workbench's direct `v1`/`a2a-0.3` transport sends only the latest user text. The server-side specialist client forwards the supplied question without adding a recap. |
| Legacy Specialist B direct input | A follow-up contains the current question plus the delimited, capped recap described above. It does not reopen a completed task or establish server-side history. Keep this compatibility assertion separate from the SDK-profile test. |
| Known pause | Observe input-required or auth-required before the stream closes. Retain that task state; continue only through supported operations, without reporting unknown failure or bypassing auth. |
| Interrupted send | Drop the stream after task acceptance. Recover by a supported read or report the missing client capability; no duplicate send or false cancellation success. |

Credential tests live in [Service access](service-access.md); view checks in
[MCP Apps](mcp-apps.md). Plan cutover and rollback under [Release](release.md).
