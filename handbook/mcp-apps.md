---
title: "Host interactive agent views"
summary: "Let providers own their tools and UI; authorize every interaction at the host boundary."
status: "Draft"
---


A2A owns the conversation. A provider can additionally publish MCP tools and
resources for interactive results. The provider owns its domain data and renderer;
the host owns authorization and placement. A pure-A2A agent needs no MCP route.

The inspected Workbench pins MCP Apps **2026-01-26**, ext-apps **2.0.4** and MCP
client/core/server **2.4.0**. Apps extension version, base MCP transport version,
SDK version and A2A dialect are distinct. Record them separately and use the
selected SDK's Streamable HTTP transport. Do not rename legacy `text/html+mcp`
tiles to Apps resources or assume the legacy renderer implements this handshake.

## Protocol and application boundaries

| Contract | What it defines |
| --- | --- |
| Stable MCP Apps | `io.modelcontextprotocol/ui`, tool `_meta.ui.resourceUri`, `ui://` resource discovery with `resources/read`, MIME `text/html;profile=mcp-app`, app visibility and initialization messages |
| Workbench A2A association | `urn:upperhand:workbench:mcp-apps:1` advertises a same-origin MCP endpoint; `application/vnd.upperhand.mcp-app+json` associates a saved answer with `viewId`, tool, arguments, resource and result |
| Workbench permissions | Same owning provider/resource, app-visible tools, `readOnlyHint: true`; no mutating tools, sampling, conversational `ui/message`, arbitrary resources or external-link handler |
| Workbench persistence | Current arguments, result, revision and selected text context in `mcp_app_views`; original answer remains unchanged |

No official A2A-to-Apps association was found in the inspected upstream specs.
The two UpperHand identifiers are local contracts, not standards-defined names.
Generic MCP hosts discover the UI resource from the provider tool without that
A2A association. Read-only hints describe tools; they do not enforce data access.

The host resolves associations from the signed-in user's stored transcript,
checking provider origin and machine-client binding. It does not accept a
browser-supplied endpoint, HTML document or substitute result. Historical answers
without an acceptable binding stay readable but cannot invoke an app.
Apply the same [credential destination checks](service-access.md#bind-credentials-to-the-approved-destination)
to MCP requests; a trusted starting endpoint does not authorize redirecting its
credentials elsewhere.

Under the selected [Workbench delegation policy](service-access.md#require-human-delegation-for-workbench-specialists),
provider tool and protected-resource calls on the user's behalf also carry the
service identity and target-bound human grant. The receiver can deny that
human independently. A saved result or task-origin label is not signed authority.
This is a required policy check, not a claim that the inspected implementation
or Versant's revised receiver has passed it.

## The trusted-renderer exception is local policy

The stable web-host specification requires a different-origin intermediate
sandbox and enforced resource CSP. The Workbench owner explicitly chose to trust
registered agent renderers. Workbench uses direct opaque-origin `srcdoc` with
`sandbox="allow-scripts"`, without `allow-same-origin`, a separate sandbox service
or enforced network CSP. Renderer code can send displayed data to outside
services. This is an approved local exception, not full stable MCP Apps
host-security conformance and not a universal recommendation.

The exception does not expose backend credentials or waive user, target, tool,
resource, result and revision checks. Adding untrusted renderers or extending the
exception to another host needs a new policy decision. A provider resource can
still work in a host that implements the full standard security contract.

## View transitions

The following states describe the inspected Workbench implementation. Saved
snapshots and concurrency control are its application contract, not standard
durable widget state. Provider compatibility remains an integration test.
The [state-machine index](agent-services.md#find-the-integration-state-machine)
links the separate credential, conversation, and release lifecycles.

The host controls closed, resolving, initializing, ready, updating, and uncertain
view states. A committed snapshot revision is stored data, not a new model turn.
Restoring or refreshing a view returns it to ready; neither reopens the original
A2A task or changes its answer.

| Transition | Trigger, guard and owner | Failure or recovery |
| --- | --- | --- |
| Closed to resolving | User opens a saved result; host verifies transcript ownership and binding, current registry policy, same-origin endpoint and matching app-visible tool | Missing, disabled, rebound or inaccessible result is denied. Keep the original text answer. |
| Resolving to initializing | Host reads the matching `ui://` resource with the Apps MIME, connects the bridge before loading HTML, then waits for `ui/initialize` and `ui/notifications/initialized` | Missing resource, invalid MIME or handshake timeout shows an error. Close/reopen retries resource loading, not the original analysis. |
| Initialized to ready | Host sends tool input before tool result, using a saved snapshot or the original result | Check whether updated renderer code can read old snapshots; old-renderer retention is not established. A cached result does not justify skipping current authorization. |
| Ready to updating | Explicit refresh or selection requests an allowed tool for the same resource; host locks the view row and checks expected revision before calling the provider | Stale revision yields 409 before tool execution. This is a new provider call, not restoration of the snapshot. No automatic call retry. |
| Updating to ready | Successful provider call and persistence save arguments/result, increment revision and clear stale selected context | Provider `isError` retains old state. The original answer stays unchanged. Failure after possible execution follows the uncertain path below. |
| Ready to ready with new context revision | App sends supported text `ui/update-model-context`; host saves it at the next revision | No model turn starts. Latest authorized text is added as untrusted selected data on the next user turn, not as system instructions or replayed chat history. |
| Closed through resolving and initializing to ready | Reopen loads current snapshot and re-resolves the renderer resource | No tool execution occurs on reopen. Resource reads still use the provider. Unsubmitted in-memory selections are not restored. |
| Updating to uncertain | Network or persistence fails after a provider call may have executed | Reopen to reconcile saved state before choosing an action. A database rollback cannot undo the provider call; do not promise exactly-once behavior. |
| Open to closed | User closes, component unmounts or navigation removes the view; host aborts its browser request and closes the bridge | Abort is not proof of provider cancellation. Current cleanup does not establish full protocol teardown conformance. |

## Acceptance checks

| Case | Observable acceptance criterion |
| --- | --- |
| MCP ownership | Wrong provider, tool, resource, user, result binding or revision fails. With successful provider responses, two updates competing at one revision produce one commit and one 409 before the second call. A failed call can leave that revision reusable, so this is not deduplication of failed attempts. |
| Provider delegation | Tool and protected-resource calls carry both credentials for the current authorized human and target. Missing or invalid grants and denied entitlements fail without shared-service downgrade; saved snapshots and task provenance cannot authorize a new call. |
| Snapshot versus refresh | Reopen preserves the saved result without a tool call. Explicit refresh makes a provider call; a changed result updates the view, not the original answer. |
| Model context | Selection sends no new A2A turn. The next user turn carries the latest authorized text context; renderer HTML and resource code never enter model history. |
| Failure after provider execution | Simulate failed response/persistence after a provider call. Show uncertainty and no automatic retry; reopening reflects whatever snapshot actually committed. |
| Renderer policy | Verify opaque-origin parent isolation and server-side credentials without claiming outbound network blocking. Record the owner-approved exception, not full host-security conformance. |

[Source revisions and limits](../evidence/workbench-integration.md).
Use [Release](release.md) for rollback and approval.
