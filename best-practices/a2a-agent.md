---
title: "Building an A2A agent"
kind: guide
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-07-25"
---

> Rules extracted to STD-010; this is the reference walkthrough.

# Building an A2A Agent

How to spin up a new A2A-discoverable AI agent on Vercel using the AI Gateway, with MCP-emitted UI
resources, typed refusals + citations, and Postgres session tracking.

This document describes the working pattern proven in the first production deployment. New agents
follow this shape; deviate only when you can name a specific reason.

> **Scope.** This is a backend agent template. The chat harness at `/chat` is one reference consumer
> — use [`focus/a2a-probe`](#11-testing--probing) (TODO repo) to verify a new agent without writing any
> web UI. UI frameworks, data modeling, multi-tenant patterns, and eval frameworks are explicitly
> out of scope.

---

## 1. What you get from this pattern

A deployed agent that exposes:

- **`GET /.well-known/agent-card.json`** — public A2A AgentCard per RFC 8615, advertises skills,
  transport, auth, and custom extensions (refusal posture, data source identity).
- **`POST /api/a2a/jsonrpc`** — authenticated A2A JSON-RPC endpoint. Discovery is public, invocation
  requires Clerk M2M JWT (browser sessions also accepted for same-origin callers).
- **`POST /api/mcp`** — MCP server over `WebStandardStreamableHTTPServerTransport`. Serves the same
  tool catalog as the A2A endpoint; powers MCP-UI resource rendering for any MCP client.
- **`POST /api/chat`** *(optional reference)* — internal route for the in-repo chat harness if you want one.
- **`GET /api/health`** — public uptime ping.
- **`/api/cron/*`** *(optional)* — scheduled-job entrypoints gated by `CRON_SECRET` header.

The agent is **session-tracked**: every conversation, user message, assistant message, and tool call
(with full args + output as `jsonb`) is appended to Postgres. Silent tool bugs become diagnosable in
production.

---

## 2. The reference stack

Lock these unless you have a specific reason to swap one out:

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 15 App Router | Vercel-native; one project hosts both A2A endpoint and any web UI |
| Runtime | `nodejs` (Vercel Fluid Compute) | Edge can't import the MCP SDK; persistent state survives invocation reuse |
| LLM | Vercel AI Gateway via `ai` SDK v6 | Plain `"provider/model"` strings, no provider-specific packages |
| Default model | `anthropic/claude-opus-4-7` | Override with `AGENT_MODEL` env var |
| A2A | `@a2a-js/sdk@1.0.0-alpha.0` | v1.0 protocol, supports custom extensions |
| MCP server | `@modelcontextprotocol/sdk@1.29.0` | Web-standard HTTP transport |
| MCP-UI | `@mcp-ui/server@6.x` (tools) + `@mcp-ui/client@7.x` (renderer) | `createUIResource` server-side, `AppRenderer` client-side |
| Auth | `@clerk/nextjs@7.x` | Native Vercel Marketplace integration; supports M2M JWT for A2A clients |
| Storage | Neon Postgres via `pg` | Vercel-native, SQL queries over `jsonb` tool args |
| Validation | `zod@^4` | Tool input schemas, single source of truth |
| Secrets | `fnox` + 1Password | Local dev injection; Vercel env for production |
| Dev tooling | `mise` + `pnpm` workspace | Reproducible Node version + monorepo (`app/` + `extractor/`) |
| Tests | `vitest` | Fast, works with the workspace setup |

---

## 3. Directory layout

```text
my-agent/
├── app/                          ← Next.js project (the agent host)
│   ├── app/
│   │   ├── .well-known/
│   │   │   └── agent-card.json/route.ts    ← AgentCard
│   │   ├── api/
│   │   │   ├── a2a/jsonrpc/route.ts        ← A2A JSON-RPC entry
│   │   │   ├── mcp/route.ts                ← MCP server
│   │   │   ├── chat/route.ts               ← (optional) internal chat route
│   │   │   ├── health/route.ts             ← uptime ping
│   │   │   └── cron/{job}/route.ts         ← (optional) scheduled jobs
│   │   ├── chat/page.tsx                   ← (optional) reference harness
│   │   ├── sign-in/[[...sign-in]]/page.tsx ← Clerk catch-all
│   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   └── layout.tsx                      ← <ClerkProvider>
│   ├── agent/
│   │   ├── loop.ts                         ← runAgent(): one entry, both surfaces
│   │   ├── system-prompt.md                ← canonical, edit this
│   │   ├── system-prompt.ts                ← string-literal mirror
│   │   ├── refusals.ts                     ← typed Refusal contract
│   │   ├── citations.ts                    ← typed Citation contract
│   │   ├── a2a/
│   │   │   ├── adapter.ts                  ← AI SDK parts → A2A Parts
│   │   │   └── types.ts                    ← JSON-RPC envelope types
│   │   └── tools/
│   │       ├── _spec.ts                    ← ToolSpec + DiscoveryToolSpec
│   │       ├── _shared.ts                  ← ToolOutput shape, helpers
│   │       ├── index.ts                    ← catalog barrel
│   │       └── {toolName}.ts               ← one file per tool
│   ├── middleware.ts                       ← Clerk gate (no-op without keys)
│   ├── __tests__/                          ← vitest
│   ├── package.json
│   └── next.config.ts
├── extractor/                    ← (rename per project) workspace package for domain code
│   ├── src/
│   │   ├── db.ts                           ← pool() singleton
│   │   ├── chat-log.ts                     ← persistence writers
│   │   └── {your-domain}.ts                ← async functions returning JSON
│   └── package.json
├── fnox.toml                     ← secret manifest (values in 1Password)
├── mise.toml                     ← tool versions + tasks
├── pnpm-workspace.yaml
└── CLAUDE.md                     ← project guide for AI agents working on the repo
```

The `extractor/` name above is illustrative — rename it for your project (`crawler/`, `analytics/`,
`crm-client/`). What matters is the **shape**: it's a workspace package that exposes async functions
returning plain JSON. The agent only imports from there; it never touches your domain logic
directly.

---

## 4. The seven required patterns

Everything in this section is **load-bearing** — not stylistic preference. Drop or weaken any of
these and the agent loses a guarantee the template promises.

### 4.1 Two-tier tool contract

Every tool is one of two shapes. The shape declares intent: *does this tool make a verifiable factual claim?*

**Visual tools** (`ToolSpec`) — claims that need provenance:

```ts
// agent/tools/_shared.ts
export type SuccessOutput<TJson = unknown> = {
  text: string;          // model-facing prose
  json: TJson;           // structured data for downstream
  ui: ReturnType<typeof createUIResource>;  // MCP-UI renderable
  citation: Citation;    // audit trail (see §4.4)
  refusal?: undefined;
};

export type RefusalOutput = {
  refusal: Refusal;
  text?: undefined; json?: undefined; ui?: undefined; citation?: undefined;
};

export type ToolOutput<TJson = unknown> = SuccessOutput<TJson> | RefusalOutput;
```

**Discovery tools** (`DiscoveryToolSpec`) — answer "what can I ask about?" questions:

```ts
export interface DiscoveryToolSpec<Shape extends ZodRawShape = ZodRawShape> {
  name: string;
  description: string;
  inputSchema: Shape;
  run: (args, extra) => Promise<{ text: string; json: unknown }>;  // no ui, no citation
}
```

**Rule:** if a tool both lists options and makes a claim, split it into two tools.

### 4.2 Single source of truth: `ToolSpec` → AI SDK + MCP

Each tool exports **one** `ToolSpec` object. From that, derive:

1. An AI SDK v6 `tool({...})` via `toAiTool(spec)` — registered on `streamText`.
2. An MCP server registration via `registerOnMcp(server, spec)` — registered on the MCP route.

Same `run(args, { signal })` function in both cases. **Zero per-tool duplication, zero drift.** New
tool? One file. Add to `tools/index.ts` barrel. Done — appears on both the LLM tool surface and the
external MCP surface automatically.

```ts
// agent/tools/_spec.ts (abbreviated)
export interface ToolSpec<Shape extends ZodRawShape = ZodRawShape> {
  name: string;
  description: string;
  inputSchema: Shape;
  uiResourceUri?: `ui://${string}`;
  run: (args, extra: { signal?: AbortSignal }) => Promise<ToolOutput>;
}

export function toAiTool(spec: ToolSpec) { /* wraps for ai SDK */ }
export function registerOnMcp(server: McpServer, spec: ToolSpec) { /* wraps for MCP */ }
```

### 4.3 Refusals are typed, advertised, intentional

Every agent has things it won't compute (missing data, blocked stakeholder decisions,
methodologically-unsafe inputs). Make this explicit:

```ts
// agent/refusals.ts
export const REFUSAL_MEDIA_TYPE = "application/vnd.{project}.refusal+json";

export type RefusalRule = "missing-data" | "blocked-methodology" | /* ... */;

export interface Refusal {
  rule: RefusalRule;
  reason: string;        // user-facing one-liner
  detail?: string;       // optional per-call context
}

export const REFUSAL_REASONS: Record<RefusalRule, string> = {
  "missing-data": "Field X isn't in the current data drop. ...",
  // ...
};
```

**Three appearance points, single source of truth:**

1. `agent/refusals.ts` (canonical).
2. System prompt (instructs the LLM to refuse before tool-calling).
3. AgentCard `capabilities.extensions[urn:{project}:refusals/v1]` (advertises to other agents).

**Tools enforce refusals as a backstop:** every tool calls `detectInputRefusal(args)` before any
I/O. If it fires, return `{ refusal }`; the rest never runs. The system prompt + tool guard form a
double-enforcement.

**A2A adapter emits refusals as a typed Part:**

```ts
// In adapter.ts — refusal branch
if (output.refusal) {
  parts.push({ content: { $case: "text", value: output.refusal.reason }, mediaType: "text/plain" });
  parts.push({ content: { $case: "data", value: { rule, reason } }, mediaType: REFUSAL_MEDIA_TYPE });
}
```

JSON-RPC response is **successful** — the refusal is intentional behavior, not an error. Consumer
agents filter on the mediaType.

**Any consumer (chat harness, probe CLI, other agent) shows refusals visibly** — a yellow notice in
a UI, a flagged line in a CLI. Never swallow.

### 4.4 Citations on every quantitative claim

Every visual tool returns a `Citation` alongside its data. Same pattern as refusals — typed Part
with its own mediaType, advertised on AgentCard.

```ts
// agent/citations.ts
export const CITATION_MEDIA_TYPE = "application/vnd.{project}.citations+json";

export interface Citation {
  study: string;                 // dataset name
  period: string;                // snapshot id / date range / version
  fielded?: string;              // ISO date range if applicable
  base: string;                  // population (e.g. "Adults 18-74", "active users")
  weight?: string;               // weight column name, or "unweighted"
  source: {
    table: string;
    column: string;
    function: string;            // extractor function name — re-runnable
  };
}
```

The `source` triple is the audit hook: a debugger pastes it into a SQL console (or calls the named
function) and reproduces the number. **Every visual tool, every call, no exceptions.**

### 4.5 System prompt as `.md` + lockstep `.ts` mirror

Two files in `agent/`:

- `system-prompt.md` — canonical, edit this. PR reviewers read it as markdown.
- `system-prompt.ts` — exports `SYSTEM_PROMPT` string literal. The agent loop imports this.

**Why two files:** Next.js route bundling can't reliably `readFileSync` arbitrary `.md` at runtime
in production. Bundling the string into a TS module avoids the issue. The `.md` exists for
human/diff/grep ergonomics.

**Lockstep enforcement:** a vitest test asserts the two contents match:

```ts
// __tests__/system-prompt.test.ts
import { readFileSync } from "node:fs";
import { SYSTEM_PROMPT } from "../agent/system-prompt";

it("system-prompt.ts mirrors system-prompt.md", () => {
  const md = readFileSync("agent/system-prompt.md", "utf8");
  expect(SYSTEM_PROMPT).toBe(md);
});
```

**Refusal rules appear in BOTH** the system prompt's "Refusal rules" section and
`agent/refusals.ts`. Same wording. The LLM may try to compute a refused thing anyway; the tool-level
guard catches it.

### 4.6 Postgres session persistence (required)

The single feature that turns silent agent bugs from days-long mysteries into 10-minute SQL queries. **Not optional.**

**Two tables:**

```sql
CREATE TABLE conversations (
  context_id text PRIMARY KEY,
  surface text NOT NULL,           -- 'chat' | 'a2a'
  user_id text,                    -- Clerk user id, nullable for anon A2A
  started_at timestamptz NOT NULL DEFAULT now(),
  last_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX conversations_user_id_last_at_idx ON conversations (user_id, last_at DESC);

CREATE TABLE chat_messages (
  id bigserial PRIMARY KEY,
  context_id text NOT NULL REFERENCES conversations(context_id),
  role text NOT NULL,              -- 'user' | 'assistant' | 'tool'
  text text,                       -- prose for user/assistant
  tool_name text,                  -- tool messages only
  tool_args jsonb,                 -- full structured input
  tool_output jsonb,               -- full structured output (HTML stripped)
  tool_citation jsonb,
  refusal_rule text,
  user_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_context_id_idx ON chat_messages (context_id, created_at);
```

**Four writers + one reader** (in `extractor/src/chat-log.ts`):

- `ensureConversation(contextId, surface, userId?)` — upsert; `COALESCE(user_id)` preserves first attribution.
- `insertUserMessage(contextId, text, userId?)`.
- `insertAssistantText(contextId, text, userId?)`.
- `insertToolCall({ contextId, toolName, args, output, citation?, refusalRule?, userId? })`.
- `listRecentConversations(opts)` — reader, for a future history UI.

**Best-effort, non-blocking:** every writer wraps its own try/catch and logs to stderr. Callers wrap
in `void` or `.catch()` — Vercel Fluid Compute may end the instance before the write completes,
that's fine, the response already shipped.

**Wiring point:** `runAgent` calls these in `streamText`'s `onFinish` callback:

```ts
const result = streamText({
  // ...
  onFinish: async ({ steps }) => {
    if (!contextId) return;
    await ensureConversation(contextId, surface ?? "chat", userId);
    await insertUserMessage(contextId, lastUserText(messages), userId);
    for (const step of steps) {
      for (const part of step.content) {
        if (part.type === "tool-call") {
          await insertToolCall({ contextId, toolName: part.toolName,
            args: part.input, output: part.output, /* ... */ userId });
        }
      }
    }
    await insertAssistantText(contextId, finalText, userId);
  },
});
```

**Why `tool_args` + `tool_output` as `jsonb`:** SQL-queryable. You'll write things like:

```sql
SELECT context_id, tool_args, tool_output
  FROM chat_messages
 WHERE tool_name = 'getBrandFunnel'
   AND tool_args->>'brand' = 'AcmeCo'
   AND tool_output->>'familiarity' IS NULL
 ORDER BY created_at DESC LIMIT 20;
```

That query finds every call where a specific input produced a null where you expected a number — the
kind of silent bug that eats days of debugging when this layer doesn't exist.

### 4.7 One `runAgent`, two surfaces

`agent/loop.ts` exposes a single function called by both the A2A endpoint AND any internal chat
route. Tag the entry point with `surface`:

```ts
export type RunAgentOptions = {
  messages: UIMessage[];
  signal?: AbortSignal;
  model?: string;             // override AGENT_MODEL env
  contextId?: string;         // if set, persist this turn
  surface?: "chat" | "a2a";   // for filtering historical traffic
  userId?: string | null;     // Clerk user (null for unauthenticated A2A)
};

export async function runAgent(opts: RunAgentOptions) { /* streamText(...) */ }
```

A2A route and chat route both call this; the only difference is what they do with the returned
stream (A2A adapter translates parts; chat route calls `.toUIMessageStreamResponse()`).

---

## 5. The AgentCard

`app/app/.well-known/agent-card.json/route.ts` serves a static (cached 5 min) AgentCard. Required fields:

```ts
const card: AgentCard = {
  name: "My Agent",
  description: "One paragraph: what data, what answers, who it's for.",
  provider: { organization: "The Focus AI", url: "https://thefocus.ai" },
  version: "0.1.0",
  documentationUrl: "https://my-agent.thefocus.ai/docs",

  supportedInterfaces: [{
    url: `${BASE_URL}/api/a2a/jsonrpc`,
    protocolBinding: "JSONRPC",
    tenant: "",
    protocolVersion: A2A_PROTOCOL_VERSION,  // "1.0"
  }],

  capabilities: {
    streaming: true,
    pushNotifications: false,
    extensions: [
      // Refusal posture — single source of truth via REFUSAL_REASONS
      { uri: "urn:my-agent:refusals/v1", required: false, params: REFUSAL_REASONS,
        description: "..." },
      // Data source identity
      { uri: "urn:my-agent:data-source/v1", required: false,
        description: "...", params: { study: "...", universe: "...", /* ... */ } },
    ],
  },

  // Discovery public, invocation auth'd — declare M2M JWT requirement
  securitySchemes: {
    clerkOAuth2: {
      scheme: { $case: "oauth2SecurityScheme", value: {
        flows: { flow: { $case: "clientCredentials", value: {
          tokenUrl: `${CLERK_DOMAIN}/oauth/token`,
          scopes: { "my-agent:read": "Read access to ..." },
        }}},
      }},
    },
  },
  securityRequirements: [{ schemes: { clerkOAuth2: { list: ["my-agent:read"] } } }],

  defaultInputModes: ["text/plain"],
  defaultOutputModes: [
    "text/plain", "application/json", "text/html+mcp",
    "application/vnd.my-agent.citations+json",
  ],

  // Skill IDs MUST match tool file names (agent/tools/{skillId}.ts)
  skills: [ /* ... */ ],
  signatures: [],
};
```

**Two custom extensions every Focus agent declares:**

- `urn:{project}:refusals/v1` — what we won't compute (mirrors `REFUSAL_REASONS`).
- `urn:{project}:data-source/v1` — identity of the underlying dataset.

**Skill IDs are the contract** — they match `agent/tools/{id}.ts` AND `tool-{id}` part-type names.
Don't rename without updating all three.

---

## 6. Auth

**Discovery public, invocation authenticated.** The callers + auth matrix:

| Caller | Hits | Auth |
| --- | --- | --- |
| Anyone | `/.well-known/agent-card.json`, `/api/health` | None — these advertise the agent |
| Browser user | `/chat`, internal pages, `/api/chat` | Clerk session cookie |
| External A2A agent | `/api/a2a/jsonrpc` | Clerk M2M JWT (Bearer) |
| Browser user (same origin) | `/api/a2a/jsonrpc` | Clerk session cookie (also accepted) |
| Vercel Cron | `/api/cron/*` | `Authorization: Bearer ${CRON_SECRET}` header check |

**Middleware** (`app/middleware.ts`) — Clerk gate with dev-mode passthrough:

```ts
const PUBLIC_ROUTE_PATTERNS = [
  "/api/health", "/.well-known/(.*)", "/sign-in(.*)", "/sign-up(.*)",
  "/favicon.ico",
];

// Dev-mode escape: if NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY isn't set,
// middleware is a no-op. Lets unprovisioned local dev still boot.
const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const middlewareImpl = clerkConfigured
  ? (() => {
      const isPublic = createRouteMatcher(PUBLIC_ROUTE_PATTERNS);
      return clerkMiddleware(async (auth, req) => {
        if (isPublic(req)) return;
        await auth.protect();
      });
    })()
  : (_req: NextRequest) => NextResponse.next();

export default middlewareImpl;
export const config = { matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|...)).*)", "/(api|trpc)(.*)"] };
```

**Sign-up restriction:** configure in **Clerk dashboard → Restrictions → "Restrict sign-ups by email
domain"**, NOT in code. The allowlist lives in Clerk so you can edit it without redeploys. Default
for Focus agents: `thefocus.ai` + the project's customer domain.

**Cron auth** (when applicable):

```ts
// app/api/cron/{job-name}/route.ts
export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/, "");
  if (token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  // ... do the work
}
```

Add the route to `vercel.ts`:

```ts
crons: [{ path: "/api/cron/nightly-refresh", schedule: "0 6 * * *" }],
```

And add `/api/cron/(.*)` to the middleware's public list so Clerk doesn't gate it.

---

## 7. The MCP server route

`/api/mcp/route.ts` registers the same tools the agent loop uses, over Streamable HTTP transport.
Stateless per request — Vercel Fluid Compute can suspend instances between calls.

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { VISUAL_TOOL_SPECS, DISCOVERY_TOOL_SPECS } from "../../../agent/tools";
import { registerOnMcp, registerDiscoveryOnMcp } from "../../../agent/tools/_spec";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function buildServer(): McpServer {
  const server = new McpServer(
    { name: "my-agent-mcp", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );
  for (const spec of VISUAL_TOOL_SPECS) registerOnMcp(server, spec);
  for (const spec of DISCOVERY_TOOL_SPECS) registerDiscoveryOnMcp(server, spec);
  return server;
}

async function handle(req: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,  // stateless
  });
  const server = buildServer();
  await server.connect(transport);
  req.signal.addEventListener("abort", () => { transport.close().catch(() => {}); });
  return transport.handleRequest(req);
}

export const POST = handle;
export const GET = handle;     // server-initiated SSE
export const DELETE = handle;  // session terminate (no-op stateless)
```

**Why a separate MCP route exists when we already have A2A:** MCP-UI's `AppRenderer` (used by the
chat harness OR by any external MCP client) needs an MCP server it can connect to so its sandboxed
iframe can forward UI actions (`tools/call`, `resources/read`) back into the tool surface. A2A's
JSON-RPC envelope doesn't expose that sandbox-proxy protocol.

For a pure-A2A agent (no MCP-UI rendering), you can skip this route. **If your tools emit UI resources, you need it.**

---

## 8. Environment variables

Source of truth: `fnox.toml` mapping env vars to 1Password items in a per-project vault. Locally
`fnox exec -- pnpm dev` injects them; on Vercel they live in the project's env vars.

**Required:**

| Var | Where | Notes |
| --- | --- | --- |
| `DATABASE_URL` | 1P, Vercel | Neon Postgres connection string |
| `AI_GATEWAY_API_KEY` | 1P, Vercel | Vercel AI Gateway key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | 1P, Vercel | `pk_test_...` / `pk_live_...`. `NEXT_PUBLIC_` prefix bundles for the browser |
| `CLERK_SECRET_KEY` | 1P, Vercel | `sk_test_...` / `sk_live_...` |

**Optional:**

| Var | Default | Notes |
| --- | --- | --- |
| `AGENT_MODEL` | `anthropic/claude-opus-4-7` | Override to swap models without code change |
| `A2A_BASE_URL` | `https://{project}.thefocus.ai` | Baked into AgentCard `url` |
| `CLERK_DOMAIN` | `https://clerk.{project}.thefocus.ai` | For M2M token URL in AgentCard |
| `CRON_SECRET` | — | Required if `/api/cron/*` routes exist |

**fnox.toml** ships with `if_missing = "ignore"` on every entry that isn't strictly required, so
`fnox check` stays green for partially-provisioned projects.

**Dev-mode without Clerk:** if `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is absent, the middleware no-ops
and the app boots unauthenticated. Useful for local dev before keys are provisioned.

---

## 9. Local dev

```bash
# One-time
mise install              # Node 22, pnpm, fnox, gh
mise trust
mise run setup            # pulls service-account token from 1P into .fnox/env

# Daily
cd app && fnox exec -- pnpm dev
```

`mise.toml` wires:

```toml
[tools]
node = "22"
"npm:pnpm" = "latest"
fnox = "latest"

[env]
_.file = ".fnox/env"

[tasks.setup]
run = '''
mkdir -p .fnox && chmod 700 .fnox
TOKEN="$(op read 'op://thefocus/{project} service account token/credential')"
printf 'OP_SERVICE_ACCOUNT_TOKEN=%s\n' "$TOKEN" > .fnox/env
chmod 600 .fnox/env
'''
```

---

## 10. Deployment

Vercel project, framework = Next.js, build command = `pnpm --filter app build`, output = `app/.next`.

**Project structure config** in `vercel.ts` at repo root:

```ts
import { type VercelConfig } from "@vercel/config/v1";
export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "pnpm --filter app build",
  // crons live here if you have them
  crons: [{ path: "/api/cron/nightly-refresh", schedule: "0 6 * * *" }],
};
```

**Env var sync:** add all four required vars in Vercel dashboard (Production + Preview). Or wire
`mise run sync-vercel-env` task that walks fnox and `vercel env add` each.

**First-deploy checklist:**

1. `pnpm --filter app build` locally — confirm green.
2. `curl https://{project}.vercel.app/api/health` → `200`.
3. `curl https://{project}.vercel.app/.well-known/agent-card.json` → AgentCard JSON.
4. In an unauthenticated browser: visit `/` → bounces to Clerk sign-in.
5. Sign in with an allowlisted email → reach `/chat` (if harness shipped) or any protected route.
6. From the `focus/a2a-probe` CLI (see §11): point at the agent URL, M2M-auth, invoke a tool, verify
   Citation Part comes back.

---

## 11. Testing & probing

**Unit tests** (`vitest`):

- One `tools-shape.test.ts` asserting every tool in the catalog conforms to `ToolSpec` or `DiscoveryToolSpec`.
- One `system-prompt.test.ts` enforcing `.md` ↔ `.ts` lockstep.
- One `chat-log.test.ts` covering the four writers.
- One `a2a-adapter.test.ts` covering parts translation, refusal branch, refusal mediaType.
- One `mcp-server.test.ts` covering tool registration.
- Per-tool tests for any non-trivial logic in `run()`.

**End-to-end probing:** use `focus/a2a-probe` (TODO — separate repo). The probe is a CLI/TUI that:

- Fetches an AgentCard from any URL.
- Authenticates via Clerk M2M (client_credentials grant) or session cookie.
- Lists discovered skills.
- Invokes any tool with arbitrary args.
- Renders MCP-UI resources in a terminal-friendly way (or pops them into a local browser).
- Logs the full JSON-RPC round-trip.

The point of the probe: **new agents don't need to ship a `/chat` harness just to verify they
work.** Drop the probe at a deployed agent URL, run through every skill, confirm citations come
back.

---

## 12. CLAUDE.md for the project

Every Focus agent repo ships a `CLAUDE.md` at the root that points future AI agents (Claude Code
working on the codebase) at the structure. Required sections:

- Layout (where code lives, where docs live, where inputs live).
- Quick reference table (most-asked questions and where to find the answer).
- Conventions (TS in `app/`, domain code in `{extractor}/`, secrets in fnox).
- "When you're asked to do X" runbooks for common changes (add a new tool, add a new data source,
  refresh the underlying dataset).
- Status snapshot dated at the top.

See the reference implementation's `CLAUDE.md` for an example.

---

## 13. What to copy when starting agent #2

1. Clone the reference-implementation repo (or run `standards/scripts/setup-a2a-agent.sh` once it exists).
2. Strip:
   - `extractor/src/*.ts` except `db.ts` and `chat-log.ts`.
   - All `app/agent/tools/*.ts` except `_spec.ts` and `_shared.ts`.
   - `app/agent/system-prompt.{md,ts}` — rewrite for new domain.
   - `app/agent/refusals.ts` — rewrite `RefusalRule` keys for what your agent can't do.
   - `app/agent/citations.ts` — rewrite for your dataset's identity fields.
   - `app/app/.well-known/agent-card.json/route.ts` — rewrite skills, extensions, descriptions.
   - `app/app/chat/page.tsx` — keep or drop (optional reference harness).
   - `app/__tests__/*` — keep `tools-shape`, `system-prompt`, `chat-log`, `a2a-adapter`,
     `mcp-server`; delete per-tool tests.
3. Rename the workspace package (`{reference}-extractor`) to `{project}-{domain}`.
4. Update `CLAUDE.md` with new project context.
5. Provision: create 1P vault, populate `DATABASE_URL` / `AI_GATEWAY_API_KEY` / Clerk keys, run
   migration SQL against new Neon DB.
6. Write your first tool. Follow §4.1. Add to `tools/index.ts` barrel.
7. Probe: point `focus/a2a-probe` at `http://localhost:3000` — confirm AgentCard + tool invocation.

That's the agent. The work after that is your domain logic in `{domain}/`.

---

## 14. Future work

Items not yet in the template but planned:

- **`focus/a2a-probe`** — the standalone test client referenced in §11. Once it exists, the chat
  harness becomes truly optional.
- **`standards/scripts/setup-a2a-agent.sh`** — automate §13.
- **`AGENT_TOOL_MODEL`** — second model env var for tools that themselves make LLM calls (e.g.
  summarizer tools). Add when an agent first needs it.
- **Streaming (`SendStreamingMessage`)** — A2A v1.0 supports SSE for token streaming. The reference
  implementation declares `streaming: true` on the AgentCard but the adapter currently returns
  `UNSUPPORTED_OPERATION`. Wire when the first consumer asks for it.
- **Task cancellation (`CancelTask`)** — same as above, declared but not implemented.
- **JWS signatures on AgentCard** — `signatures: []` is empty; add when we have a keypair for
  verifying agent authenticity.

---

## See also

- `STD-008` — deployment rules; `best-practices/vercel-deployment.md` for Vercel specifics.
- Repository layout conventions are not yet written; see the gap register in `reports/`.
- `STD-007` — secrets and credentials. It absorbed `security.md`, which is gone.
- `STD-009` — authentication; [`clerk.md`](./clerk.md) for the Clerk walkthrough.
- [`AGENTS.md`](./AGENTS.md) — the technology defaults for Focus repos.
- Reference implementation: ask in `#engineering` for the current pointer — read its `app/` and the
  workspace-package directory.
