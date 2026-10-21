---
number: "001"
title: "Building an A2A agent"
kind: guide
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-10-21"
---

> Rules extracted to STD-010; this is the reference walkthrough.

# Building an A2A Agent

This guide walks through setting up an A2A agent server: a specialist agent,
or the UpperHand Workbench's resident agent. It explains how the pieces fit and
what each deployment has to record. It contains no rules. The rules are in:

- `STD-010` — agent services: tool shapes, one tool definition, typed refusals,
  citations, prompt lockstep, Postgres sessions, one entry point.
- `STD-009` — authentication and OAuth client identity.
- `STD-007` — secrets, vaults, expiry and renewal owners.
- `STD-008` — deployment targets, environment scopes, CI-built artefacts.
- The [UpperHand vendor onboarding packet](https://standards.upperhandai.com/packet)
  and its [extension specs](https://standards.upperhandai.com) — what any
  agent, from any vendor, implements to plug into the Workbench.

The guide links those documents instead of copying their schemas. If this guide
and one of them disagree, the standard or the packet wins. Report the drift so
it can be fixed here.

**Out of scope:** UI frameworks, domain data modelling, and eval frameworks.
For component lifecycles behind MCP-UI tiles, see
[`GDE-013`](./GDE-013-pluggable-component-systems.md).

---

## 1. Independent deployments

The Workbench and each specialist are separate deployments. Each one has its own
repository, its own domain, cloud project, database, secrets vault, OAuth
registration and deploy pipeline. None of them imports another's code or reads
another's database.

```text
 browser ──session──▶ Workbench (workbench.upperhandai.com)
                       ├─ UI ──same A2A relay as every agent──▶ resident agent
                       │                                          (/api/a2a/jsonrpc)
                       └─ A2A relay / ask_<agent> tools ──OAuth──▶ specialist A
                                                         ──OAuth──▶ specialist B
                                                                    (each: own card,
                                                                     own DB, own deploy)
```

- **A specialist** owns its model loop, guardrails, data and state. It is
  callable through its authenticated A2A endpoint, with a public card for
  discovery and optional MCP for interactive tiles. It may also host its own
  authenticated web views and documented companion APIs.
- **The Workbench** holds threads, registry rows, probe transcripts and
  preferences. Its resident agent is also an A2A agent: it publishes its own
  card, and the Workbench UI reaches it through the same relay used for every
  registered agent. It has no private chat route. Its only tools are `ask_<agent>`
  A2A calls generated from the registry, plus conversation utilities. The
  binding version of these rules is the Workbench repository's `CLAUDE.md`
  ("seam doctrine").
- **Capability comes from the live card.** The registry stores a URL and policy.
  Skills, views and extensions are read from the agent's card, so a specialist
  ships a new skill by deploying its own card.

## 2. Obligations and recommendations

Only the wire contract is an obligation for a vendor. Your model, runtime,
framework, database engine and cloud are implementation choices. They are not
part of the contract.

| Source | Applies to | What it fixes |
| --- | --- | --- |
| UpperHand packet + extension specs | Every agent in the Workbench, any vendor | A2A wire, AgentCard, citation/refusal/data-source/views extensions, auth model, probe |
| `STD-010`, `STD-009`, `STD-007`, `STD-008` | Services The Focus AI builds | Tool shapes, persistence, auth hygiene, secrets, deployment |
| This guide's stack table | A recommendation for Focus builds | Nothing; replace any row when you have a reason |

**Recommended stack** (versions checked 2026-10-21; pin exact versions in the
lockfile):

| Layer | Recommendation | Note |
| --- | --- | --- |
| Framework / runtime | Next.js App Router on the Node.js runtime | The MCP SDK does not run on Edge |
| A2A | `@a2a-js/sdk` 1.3.0 | v1.0 protocol, v0.3 compat layer, Postgres task store |
| MCP | `@modelcontextprotocol/sdk` + `@mcp-ui/server` | Only if you render interactive tiles |
| Model | `ai` SDK through a gateway, model id from env | Swappable; not a contract |
| Storage | Postgres (Neon on Vercel) | `STD-010 §3.6` requires Postgres sessions |
| Auth | Clerk, one application per client | `STD-009` |
| Secrets / tooling | fnox + 1Password, mise, pnpm, vitest | `STD-007`, `STD-004`, [`GDE-003`](./GDE-003-fnox-secrets.md) |
| Hosting | Vercel or GCP | [`GDE-010`](./GDE-010-vercel-deployment.md), [`GDE-005`](./GDE-005-gcp-deployment.md) |

## 3. Server layout

```text
app/
├── agent/
│   ├── loop.ts                 ← runAgent(): the one entry point (STD-010 §3.7)
│   ├── system-prompt.md        ← canonical prompt; .ts mirror + lockstep test (§3.5)
│   ├── tools/                  ← one ToolSpec per file, one barrel (§3.1, §3.2)
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
tool and the MCP tool are both derived from it (`STD-010 §3.2`). The A2A executor
and the MCP route both import the same catalog. Every surface calls
`runAgent` with the verified caller and a `surface` tag. A UI you ship sends its
requests to your own A2A endpoint. Do not add a separate chat route for it:
`STD-010 §3.7` permits one if it calls the same entry point, but on the
Workbench a private route is forbidden.

**Refusals and citations** are typed Parts. Their media types and shapes are the
packet's: `application/vnd.upperhand.refusal+json` and
`application/vnd.upperhand.citations+json`, declared under the extension URIs at
`https://standards.upperhandai.com/ext/…/v1`. Use these shared types for citations
and refusals rather than replacing them with per-project types. Domain output
can have its own media type alongside the shared provenance Parts.

## 4. Persistence: Postgres, owned and isolated

`STD-010 §3.6` requires Postgres sessions. The recommended setup has two parts:

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

- Record the verified owner on every row: the OAuth client and, once human
  identity is in place, the human subject. The machine claim is issuer-specific;
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
  (`STD-007 §3.5`).

## 5. Endpoints

| Route | Auth | Purpose |
| --- | --- | --- |
| `GET /api/health` | public | Uptime; reports no secrets or config |
| `GET /.well-known/agent-card.json` | public | AgentCard (RFC 8615); respects `A2A-Version`, sets `Vary: A2A-Version` and cache headers |
| `POST /api/a2a/jsonrpc` | OAuth bearer | A2A v1.0 + v0.3 on one endpoint |
| `POST/GET/DELETE /api/mcp` | OAuth bearer | Optional; only for interactive tiles |
| `/api/cron/*` | `CRON_SECRET` | Optional scheduled jobs |

### 5.1 The card

Build the card from the same tool catalog. Skill ids match tool names. It
contains `supportedInterfaces[]` with the JSON-RPC URL built from `APP_URL`,
the interface's `protocolVersion: "1.0"`, `capabilities.streaming: true`, the packet's
extensions, `securitySchemes` naming the OAuth issuer's token URL and scopes,
and skill `examples` for the probe to use. Field shapes are in the
[A2A v1.0 specification](https://a2a-protocol.org/v1.0.0/specification/) and the
packet. They are not repeated here.

### 5.2 The JSON-RPC wire (SDK 1.3)

| | v1.0 | Legacy v0.3 |
| --- | --- | --- |
| Selected by | PascalCase method, sent with `A2A-Version: 1.0` | slash-separated method; omitted version header uses the SDK's 0.3 default |
| Methods | `SendMessage`, `SendStreamingMessage`, `GetTask`, `CancelTask`, `SubscribeToTask`, … | `message/send`, `message/stream`, `tasks/get`, `tasks/cancel`, `tasks/resubscribe` |
| Result / stream payload | one of `task`, `message`, `statusUpdate`, `artifactUpdate` | objects discriminated by `kind` |
| Task states | `TASK_STATE_SUBMITTED`, `TASK_STATE_WORKING`, `TASK_STATE_COMPLETED`, `TASK_STATE_FAILED`, … | `submitted`, `working`, `completed`, `failed`, … (plus a computed `final`) |

Wire both through one `DefaultRequestHandler`. Configure
`legacyCompat: { enabled: true }` on the JSON-RPC transport and card handlers,
not on `DefaultRequestHandler`. The SDK picks the dialect per request, and
your executor only sees v1 types. Use the SDK's own documents and samples,
versioned with the code:

- [Migration guide v0.3 → v1.0](https://github.com/a2aproject/a2a-js/blob/v1.3.0/docs/migration-guide.md)
- [v0.3 compatibility guide](https://github.com/a2aproject/a2a-js/blob/v1.3.0/docs/compatibility-v0_3.md)
  and the runnable `compat-v1-server` sample
- [Persistent stores and migrations](https://github.com/a2aproject/a2a-js/blob/v1.3.0/docs/persistent-stores.md)
- [CHANGELOG](https://github.com/a2aproject/a2a-js/blob/v1.3.0/CHANGELOG.md)

### 5.3 Event order in a task-producing executor

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
- Follow-ups reuse the `contextId`, and the history is loaded from the
  persistent store. A dropped client polls `GetTask`.
- If you do not support an operation, say so. Set `pushNotifications: false` on
  the card. Have `CancelTask`/`SubscribeToTask` return the SDK's
  unsupported-operation error until they really work. Do not advertise a
  capability and then fail it.

## 6. Authentication

Discovery is public; invocation is authenticated. The packet defines the model,
and `STD-009` covers registration and client identity. In outline:

- **Machine credential.** OAuth2 client credentials. The Workbench is registered
  as a client of each specialist. The specialist verifies the bearer token's
  signature against the issuer's JWKS, and checks `iss`, `aud` (its own resource
  identifier), expiry and scope on every JSON-RPC and MCP call. Prefer a Client
  ID Metadata Document over dynamic registration (`STD-009 §3.10`–`§3.12`).
- **Human identity.** The packet requires a short-lived grant naming the human
  user, and the specialist enforces its own entitlement for that user. How the
  grant travels is **not settled**:
  - The Workbench plan proposes an `X-Upperhand-Identity-Grant` header: a signed
    JWT with `iss/sub/aud/iat/exp`, a lifetime of ten minutes or less, and `azp`
    bound to an agreed issuer-specific OAuth client identity. The Roblox pilot
    accepts the header but does not enforce that binding. Workbench now has
    local session-derived signing and public JWKS code; production trust is
    not provisioned or certified. The full profile is not ratified. Review the
    [identity draft](https://standards.upperhandai.com/drafts/identity-v1) before
    treating it as a contract.
  - The IETF
    [Identity Assertion JWT Authorization Grant](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)
    (ID-JAG) works differently. The client obtains the ID-JAG from the IdP by
    RFC 8693 token exchange. It then redeems the ID-JAG at the resource's
    authorization server as an RFC 7523 JWT-bearer grant, and receives an
    ordinary access token. The resource server never sees a custom header.
    Do not describe the header proposal as ID-JAG.
- **Production fails closed.** Without the auth configuration (issuer, audience,
  JWKS), `/api/a2a/jsonrpc` and `/api/mcp` return 401, or the server refuses to
  start. An unauthenticated "keys not set yet" passthrough is allowed only
  when `NODE_ENV !== "production"` and an explicit local flag such as
  `AUTH_MODE=dev` is set. Add a test that asserts a production build rejects
  unauthenticated calls.
- **Browser sign-in** on any specialist UI is a separate Clerk application per
  client, a production instance in production, and a sign-up allowlist set in
  the Clerk dashboard (`STD-009 §3.1`–`§3.9`,
  [`GDE-002`](./GDE-002-clerk.md)).

## 7. Optional MCP for interactive tiles

Add `/api/mcp` only if your results include interactive MCP-UI tiles. A click
inside the Workbench's sandboxed tile becomes an authenticated `tools/call` or
`resources/read` sent back to you. Use the
[MCP 2026-07-28 Streamable HTTP transport](https://modelcontextprotocol.io/specification/2026-07-28),
stateless per request (`sessionIdGenerator: undefined`). Register the same
`ToolSpec` catalog, and apply the same bearer verification and owner checks as
on A2A. A pure-A2A agent without tiles does not need this route.

## 8. The deployment record

Record one row set per environment (local, preview, production) in the repo's
deployment doc (`STD-008 §3.1`, `§3.4`, `§3.9`). Put references in the record,
never values:

| Item | Record |
| --- | --- |
| Domain / `APP_URL` | Public origin; the card's interface URL is derived from it |
| Cloud target | Platform, named project/config (`STD-008 §3.2`), region, deploy pattern |
| Database + TLS | Provider, database/branch per environment, certificate verification/CA settings, who runs migrations |
| Machine OAuth | Issuer, audience/resource id, JWKS URL, authenticated client claim, client ids allowed, scopes |
| Human identity | Profile in use (none / proposed grant / ID-JAG), issuer, JWKS URL, audience |
| Secrets | fnox/1Password reference for each, expiry, renewal owner (`STD-007 §3.9`, `STD-009 §3.9`) |
| Model provider | Gateway/provider, model id env var, key reference, spend owner |
| Deploy / rollback | Who deploys, CI workflow, how to roll back, and who owns the rollback |

Secrets reach the runtime through fnox locally and through the platform's
environment store in deployed scopes. Never pass them as CLI flags
(`STD-007 §3.6`), print them in logs, or paste them into docs, issues or
transcripts.

## 9. Pipeline and smoke verification

**Pipeline.** Use the `STD-004` task contract (`mise run install|dev|lint|test|deploy`).
Unit tests cover tool shape, prompt lockstep, session-log writers, the executor's
event order (task first, artifacts before terminal), refusal Parts, the
production auth fail-closed case, and cross-owner "not found". CI builds the
production artefact (`STD-008 §3.10`). Migrations run as a separate step before
traffic shifts.

**Discovery smoke, after every deploy:**

```sh
BASE=https://agent.example.com
curl -fsS "$BASE/api/health"
curl -fsS -H 'A2A-Version: 1.0' "$BASE/.well-known/agent-card.json" | jq '.supportedInterfaces, .capabilities'
# unauthenticated invoke must fail
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/a2a/jsonrpc" -d '{}'
```

Confirm the unauthenticated call returns an auth failure, not just a malformed
JSON-RPC error. Then run the service's authenticated integration harness with
the machine token and human identity required by its selected profile. Keep
credentials in the secret store/environment, not command arguments or logs.
Check blocking and streaming calls, a follow-up on the same `contextId`,
`GetTask` after completion, both wire dialects, and cross-owner denial. See the
packet's [acceptance checklist](https://standards.upperhandai.com/conformance).

**Probe (partial diagnostic).** The probe's source is at
[The-Focus-AI/agent-probe](https://github.com/The-Focus-AI/agent-probe). As of
2026-10-21, `@upperhand/agent-probe` is not on npm (404), so
`npx @upperhand/agent-probe` does not work. Build it from source and run the
card checks:

```sh
git clone https://github.com/The-Focus-AI/agent-probe && cd agent-probe
git checkout 17db3755fac61f610d716a73105d86ab4c0000dc
mise install
npm ci && npm run typecheck && npm test && npm run build
node dist/index.js https://agent.example.com --card-only
```

`--card-only` checks the card and the declared extensions; it does not check
invocation. The probe's own roadmap lists what v0 does not cover: per-skill
sweeps, artifact-before-terminal order, `GetTask`/`CancelTask`, human identity,
and MCP. Its authenticated mode takes `--client-secret`/`--token` on the
command line, which conflicts with `STD-007 §3.6`. Use it only with a throwaway
local fixture with no real authority until it reads secrets from the environment;
use the service's harness for real authenticated tests. A green probe is a
diagnostic, not certification or acceptance.

## 10. Source provenance

- **2026-07-25** — First written from the first production agent (the Versant
  Mega Tracker reference implementation). Its seven load-bearing patterns
  became `STD-010`.
- **2026-07-30** — SDK 0.3 → 1.0.1 field notes from the umwelten fleet migration
  (`umwelten/reports/2026-07-29-a2a-v1-assessment.md`, The-Focus-AI/umwelten#334).
  Two of those workarounds are now obsolete: the cross-bundle error-class bridge
  (fixed in SDK 1.1.0, #612) and reshaping v0.3 webhook bodies (1.1.0, #658).
  Normalising 0.3-era task stores on read still applies if you carry old state
  forward.
- **2026-10-21** — Rewritten as a setup walkthrough. Removed obsolete material:
  "streaming unsupported", private chat routes, an unauthenticated
  missing-key fallback, fire-and-forget persistence, per-project `urn:`
  citation/refusal types, and a nonexistent probe repository.
  Checked against:
  - `@a2a-js/sdk` v1.3.0 (npm latest, released 2026-09-29) and its docs at tag
    `v1.3.0`.
  - The UpperHand packet and extension specs (`upperhandai-standards` @
    `762c0cd`), live at `standards.upperhandai.com`.
  - The agent-probe source (`main` @ `17db375`); npm 404 for
    `@upperhand/agent-probe`.
  - The ID-JAG draft (IETF OAuth WG, May 2026 revision).
  - The Workbench `docs/plan.md`, for the status of the grant-header proposal.

## See also

- `STD-010`, `STD-009`, `STD-008`, `STD-007`, `STD-004`.
- [`GDE-002`](./GDE-002-clerk.md) Clerk · [`GDE-003`](./GDE-003-fnox-secrets.md) fnox ·
  [`GDE-009`](./GDE-009-technology-defaults.md) defaults ·
  [`GDE-010`](./GDE-010-vercel-deployment.md) Vercel ·
  [`GDE-013`](./GDE-013-pluggable-component-systems.md) components.
- Workbench: [The-Focus-AI/upperhandai-workbench](https://github.com/The-Focus-AI/upperhandai-workbench)
  (`README.md`, `DEPLOYMENT.md`, `CLAUDE.md`).
