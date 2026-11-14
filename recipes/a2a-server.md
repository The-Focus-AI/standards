---
title: "Build an A2A server"
summary: "A versioned reference layout, task store, and transport adapter, not a universal vendor stack."
status: "Reference"
---

This recipe retains the SDK 1.3.0 implementation guidance checked on 2026-10-21.
Use [Agent services](../handbook/agent-services.md) for the proposed defaults,
[Service access](../handbook/service-access.md) for authentication, and the
[conversation lifecycle](../handbook/conversations.md) for runtime behavior.

For a Workbench external specialist, apply the
[required human-delegation profile](../handbook/service-access.md#require-human-delegation-for-workbench-specialists)
before the executor runs. Verify service identity and the target-bound human
grant, bind `human.azp` to the actual verified `machine.sub`, then check the
receiver's human entitlement. Exercise direct and coordinator-routed calls with
the same principal. Task provenance is not authority; a missing or invalid grant
never falls back to shared-service access. Specialist B's revised receiver still
needs implementation and acceptance evidence for this contract.

## Server layout

```text
app/
├── agent/
│   ├── loop.ts                 ← runAgent(): the one entry point (handbook/agent-services.md)
│   ├── system-prompt.md        ← canonical prompt; verify any runtime mirror
│   ├── tools/                  ← one ToolSpec per file, one barrel
│   └── a2a/executor.ts         ← AgentExecutor: runAgent events → A2A events
├── app/
│   ├── .well-known/agent-card.json/route.ts   ← public card
│   ├── api/health/route.ts                    ← public health
│   ├── api/a2a/jsonrpc/route.ts               ← authenticated JSON-RPC
│   └── api/mcp/route.ts                       ← optional, for tiles
├── lib/{db,auth,env}.ts        ← pool, token verification, env parsing
└── __tests__/
```

**One `runAgent`, one set of tools.** Each tool is one `ToolSpec`. The model
tool and the MCP tool are both derived from it (`handbook/agent-services.md`). The A2A executor
and the MCP route both import the same catalog. Conversational requests call
`runAgent` with the verified caller and a `surface` tag. MCP rendering interactions
call authorized tools without implicitly starting a model turn. A chat UI sends its
requests to your own A2A endpoint. Do not add a separate chat route for it:
`handbook/agent-services.md` permits one if it calls the same entry point, but on the
Workbench a private route is forbidden.

When adopting the client's onboarding packet,
refusals and citations are typed Parts. Its media types are
`application/vnd.<client>.refusal+json` and
`application/vnd.<client>.citations+json`, declared under the extension URIs at
`https://<client-standards-host>/ext/…/v1`. Use these shared types for citations
and refusals rather than replacing them with per-project types. Domain output
can have its own media type alongside the shared provenance Parts.

## Persistence: Postgres, owned and isolated

The Focus default in [Agent services](../handbook/agent-services.md) uses Postgres
sessions. It is not an A2A requirement. This setup has two parts:

1. **A2A task state** in the SDK's `DatabaseTaskStore`
   (`@a2a-js/sdk/server/database`, new in 1.3.0). It holds task snapshots,
   status, history and artifacts, so follow-ups, `GetTask` and polling keep
   working when instances are recycled. Apply migrations as a deploy step, not
   at boot. Run `a2a-db upgrade` under `fnox exec`, so the CLI reads
   `DATABASE_URL` from the environment. Do not pass `--url` with credentials in it.
2. **A session log** that the agent owns: conversation, user turn, assistant
   turn, and each tool call with arguments, output, citation and refusal rule as
   `jsonb`. This log is what turns a silent tool bug into a SQL query.

Ownership and isolation:

- Record the verified owner on every row: the selected service principal and,
  for delegated profiles, the human subject. The machine claim is issuer-specific;
  `sub`, `azp` and `client_id` are not interchangeable. Read the agreed identity
  from verified tokens, never the request body. Changing that mapping needs a
  migration for existing entitlements and history. Never create shadow users.
- Look up a context or task by owner as well as by id. A caller asking for
  another owner's task gets the same "not found" response as a missing task.
  The SDK's built-in stores scope by tenant and owner from `context.user`;
  without a verified user, callers share the `unknown` owner. Populate the
  verified principal through the user builder. Custom stores need their own
  scoping. Test cross-owner access even when using the built-in store.
- Await the writes. Do not fire and forget. A serverless instance can freeze
  after the response, so wait for the write before the terminal event, or use
  the platform's `waitUntil`. A failed write is logged with the context id, not
  hidden.
- In production, the server refuses to start without `DATABASE_URL`. An
  in-memory fallback is for local mock mode only.
- Each environment has its own database. Preview never writes to production
  (`handbook/secrets.md`).

## Endpoints

| Route | Auth | Purpose |
| --- | --- | --- |
| `GET /api/health` | public | Uptime; reports no secrets or config |
| `GET /.well-known/agent-card.json` | public | AgentCard (RFC 8615); respects `A2A-Version`, sets `Vary: A2A-Version` and cache headers |
| `POST /api/a2a/jsonrpc` | Selected service credential profile | A2A v1.0 + v0.3 where implemented |
| Advertised MCP endpoint, e.g. `/mcp` or `/api/mcp` | Selected service credential profile | Optional; expose only the HTTP methods the selected transport implements |
| `/api/cron/*` | `CRON_SECRET` | Optional scheduled jobs |

### The card

Build the card from the same tool catalog. Skill ids match tool names. It
contains `supportedInterfaces[]` with the JSON-RPC URL built from `APP_URL`,
the interface's `protocolVersion: "1.0"`, `capabilities.streaming: true`, the packet's
extensions, `securitySchemes` naming the OAuth issuer's token URL and scopes,
and skill `examples` for the probe to use. Field shapes are in the
[A2A v1.0 specification](https://a2a-protocol.org/v1.0.0/specification/) and the
packet. They are not repeated here.

Use that OAuth description only for an actual OAuth flow. Native Clerk M2M uses
the declared HTTP bearer profile instead. A card's security declaration describes
the service; it neither issues credentials nor proves an invocation succeeds.

### The JSON-RPC wire (SDK 1.3)

| | v1.0 | Legacy v0.3 |
| --- | --- | --- |
| Selected by | PascalCase method, sent with `A2A-Version: 1.0` | slash-separated method; omitted version header uses the SDK's 0.3 default |
| Methods | `SendMessage`, `SendStreamingMessage`, `GetTask`, `CancelTask`, `SubscribeToTask`, … | `message/send`, `message/stream`, `tasks/get`, `tasks/cancel`, `tasks/resubscribe` |
| Result / stream payload | one of `task`, `message`, `statusUpdate`, `artifactUpdate` | objects discriminated by `kind` |
| Task states | `TASK_STATE_SUBMITTED`, `TASK_STATE_WORKING`, `TASK_STATE_COMPLETED`, `TASK_STATE_FAILED`, … | `submitted`, `working`, `completed`, `failed`, … (plus a computed `final`) |

When both dialects are required, wire them through one `DefaultRequestHandler`. Configure
`legacyCompat: { enabled: true }` on the JSON-RPC transport and card handlers,
not on `DefaultRequestHandler`. The SDK picks the dialect per request, and
your executor only sees v1 types. Use the SDK's own documents and samples,
versioned with the code:

- [Migration guide v0.3 → v1.0](https://github.com/a2aproject/a2a-js/blob/v1.3.0/docs/migration-guide.md)
- [v0.3 compatibility guide](https://github.com/a2aproject/a2a-js/blob/v1.3.0/docs/compatibility-v0_3.md)
  and the runnable `compat-v1-server` sample
- [Persistent stores and migrations](https://github.com/a2aproject/a2a-js/blob/v1.3.0/docs/persistent-stores.md)
- [CHANGELOG](https://github.com/a2aproject/a2a-js/blob/v1.3.0/CHANGELOG.md)

### Event order in a task-producing executor

- Publish a `task` first. The server rejects a stream that opens with a status
  or artifact update. A2A also permits a standalone Message result; for a
  durable task workflow, return a Task from blocking `SendMessage` too.
- Stream `statusUpdate` (`TASK_STATE_WORKING`) and `artifactUpdate` events as
  work progresses. Keep Part order as produced.
- Publish all artifacts, including citation and refusal Parts, **before** the
  terminal status. Put the reply text on the terminal status's `status.message`.
  v1 has no `final` flag; the terminal state closes the stream.
- A refusal is a successful completion that carries a refusal Part. It is not a
  JSON-RPC error.
- After a terminal task, an SDK-profile follow-up sends the new turn with a fresh
  `messageId`, the same authorized `contextId`, and no old `taskId`. An unfinished
  task awaiting input can instead receive a message addressed to that task if
  the implementation supports it. Context history is an application persistence
  contract, not guaranteed by the existence of a context id. Workbench's legacy
  Specialist B direct transport additionally sends a bounded recap; see
  [conversation behavior](../handbook/conversations.md#conversations-tasks-and-transport).
- On disconnection, preserve the known task id and use supported `GetTask` reads.
  Polling is an available recovery operation, not proof that every caller has
  implemented it. Workbench's `askSpecialist` does not poll or resume.
- If you do not support an operation, say so. Set `pushNotifications: false` on
  the card. Have `CancelTask`/`SubscribeToTask` return the SDK's
  unsupported-operation error until they really work. Do not advertise a
  capability and then fail it.
