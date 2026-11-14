---
title: "Workbench, Specialist A, and Specialist B integration"
summary: "Source-checked behavior and reported fixture results; genuine issuance and deployed acceptance remain separate."
status: "Evidence"
checked: "2026-11-07"
---

## Service profiles

This record supports [service access](../handbook/service-access.md), checked against source on
2026-11-07. It distinguishes inspected behavior, reported candidate tests and
the owner's subsequent connection-policy decision.
It does not provision accounts, grant access or certify a deployment. The
earlier social-sign-in walkthrough retains its own verification dates.

The owner subsequently required that a human grant always pass through the
Workbench connection so Specialist A, Specialist B and other specialists can identify and
potentially refuse that human. The private coordinating record
supersedes the earlier Specialist B machine-only selection. The required profile is
now [service identity plus bound human delegation](../handbook/service-access.md#require-human-delegation-for-workbench-specialists)
for every Workbench external-specialist invocation. The Specialist B owner is revising
the receiver; this records a requirement, not shipped enforcement.

Choose a credential mechanism and an authorization profile separately. Clerk
native M2M JWTs, OAuth client-credentials access tokens, browser sessions and
administrative API keys are not interchangeable. The presence of a Clerk secret
proves neither that a machine exists nor that an application token can be issued.
Keep every client's OAuth applications isolated under `handbook/sign-in.md`; the
machine examples do not change that boundary.

| Profile | Verified identity and permission | Evidence and limits |
| --- | --- | --- |
| Browser session | Clerk human session for this client application | Browser routes retain session protection. Sign-in does not grant specialist entitlement. |
| Specialist A machine plus human | Native Clerk machine JWT plus independently signed Workbench grant; local entitlement for `(machine.sub, human.sub)` | Implemented at Specialist A `074330` (source A2 below). Fixed issuers are part of the identity boundary. The owner hash is SHA-256 of the JSON pair; it is not a protocol identifier. Initial integration entitlement was `operator=false`, not an administrator grant. |
| Specialist B selected delegated profile | Verified service identity plus target-bound human grant, `human.azp === machine.sub`, and receiver-owned human entitlement | Owner-required replacement for the machine-only candidate (A6). Missing or invalid grants cannot downgrade to shared-service access. Revised implementation, genuine issuance and deployed acceptance are not verified here. |
| Superseded Specialist B machine-only candidate | Trusted Specialist B issuer, receiver `aud`, allowed sender and `specialist:read`; rejected human-grant headers | Historical candidate and fixture evidence only. It is no longer the selected Workbench profile and does not satisfy the new requirement. |
| Specialist A temporary legacy demo | Exact existing opaque token, separate `shared-demo` owner, original expiry, no grant header | Implemented coexistence path, not the default machine profile. `operator=false`; old standalone operator authority is not restored. See [demo cutover](../handbook/service-access.md#preserve-bounded-demo-access-during-cutover). |

## Trace middleware before choosing a verifier

At Specialist B `9e763e4` (A3), `auth.protect()` runs before the
route's bearer verifier. The public card passes that middleware, but machine
invocation does not. The inspected Clerk Next.js **7.4.3** package defaults
`protect()` to session tokens and rejects other token classes. A coordinating
production check reported HTTP 200 for the card and Clerk protect-rewrite HTML
404 for a no-token POST. It also reported registry auth `none`, zero configured
machines and OAuth applications, and no verified reusable application token.
Those observations are dated evidence, not a fresh account inventory in this
documentation task. See the integration record in A6.

The earlier machine-only candidate passed only `POST /api/a2a/jsonrpc` through
browser-session protection to a strict route verifier. Ordinary browser routes
retained session protection. That candidate checked `RS256`, `typ: JWT`, native protected-header
`cat: cl_…`, trusted issuer, receiver audience, exact sender allowlist,
integer `iat`/`exp` with at most 300 seconds of lifetime, and top-level
`scope` containing `specialist:read`. Its five-second skew included
optional `nbf` checks. Its configuration names were `CLERK_DOMAIN`,
`SPECIALIST_A2A_CALLER_ID` and `SPECIALIST_A2A_AUDIENCE`.
The category value comes from the observed native Clerk token profile, not from
A2A or MCP; the skew is also a local choice. That candidate returned 403 for a
human-grant header and removed the assumed OAuth client-credentials endpoint.
Rejecting all grants is incompatible with the new selected profile; retaining
the machine verifier alone does not complete the revised receiver.

The implementer reported five interoperability fixture tests using the published
Workbench `c302e20` registry, `agentHeaders`, `askSpecialist` and direct relay
against that earlier Specialist B middleware, verifier, route and adapter. They covered
blocking and streaming calls, same-context/new-message follow-ups, native mint
caching, and wrong-scope 403 and wrong-audience 401 responses without a model call.
The fixtures replaced Clerk minting and JWKS, the model, host session lookup and
conversation persistence. Receiver/card/browser checks and a sandbox production
build also reportedly passed. These results were not rerun here. They establish
reported local interoperability for the superseded profile, not acceptance of
mandatory human delegation or a deployment.

The owner authorized M2M setup and assigned it to the laptop operator in the
coordinating thread. Provisioning completion and genuine issuance are not verified
here. That setup authorization does not approve publication, ratification or
deployment. The revised grant verifier, human entitlement policy, persisted-owner
mapping and deployed direct/routed acceptance remain separate verification work.
Direct and routed tests must prove the same verified sender/human principal, not
merely the presence of provenance fields. Broad-suite failures and their comparison
with the unchanged base remain in the implementation record, not a claim that all
Specialist B tests pass.

For acceptance, send a well-formed A2A request through the real middleware and
handler. Inspect status, content type and response semantics. An HTML 404 or
sign-in redirect is not the expected API authentication response, and a 400
parser error is not proof that authorization worked. Test the exact supported
method and path, other methods, adjacent API paths and normal browser routes.

## Service-profile evidence

Source inspection on 2026-11-07 confirmed the code paths below and refreshed
Clerk documentation. No credentials were resolved and no production calls or
account changes were made in this documentation task. The later owner requirement
above is policy evidence, not a new source or production verification. Specialist B's
revised candidate remains subject to its implementation report and live acceptance.

- A1. Workbench `c302e20` (private client repository):
  `app/lib/registry.ts`, `identity.ts`, `agent-auth.ts` and `agent-policy.ts`.
- A2. Specialist A `074330` (private client repository):
  `src/auth.ts`, `src/store.ts` and `app/api/session/route.ts`.
- A3. Specialist B `9e763e4` (private client repository):
  `app/middleware.ts`, `app/agent/auth/clerkJwt.ts` and `app/app/api/a2a/jsonrpc/route.ts`.
- A4. [Clerk Next.js 7.4.3 package](https://registry.npmjs.org/@clerk/nextjs/-/nextjs-7.4.3.tgz),
  `dist/esm/server/protect.js`; [current auth reference](https://clerk.com/docs/reference/nextjs/app-router/auth).
- A5. [Clerk OpenAPI](https://github.com/clerk/openapi-specs/blob/94753d1d8a648806e4dc529beec8bb76daa13859/bapi/2026-08-20.yml)
  and [M2M lifecycle](https://clerk.com/docs/guides/development/machine-auth/m2m-tokens).
- A6. Coordinating evidence and owner decisions (private coordinating record);
  Specialist B implementation, not production acceptance (private coordinating record).

## Conversation and view sources

- **2026-11-07** — Agent-authored integration proposal, source inspection only.
  Standards base fetched and fast-forward checked at `1b55f96`; no local work was
  present and remote `main` was already at that revision. Credential evidence
  and Specialist B's candidate are recorded above. Additional sources:
  - Workbench `c302e20` (private client repository):
    `app/lib/agent-card.ts`, `agent-policy.ts`, `agent-auth.ts`, `a2a/client.ts`,
    `a2a/transport.ts`, `mcp-app-contract.ts`, `mcp-apps.ts`, `app/components/mcp-app-tile.tsx`,
    `app/docs/mcp-apps.md` and `app/package.json`.
  - Specialist A `074330` (private client repository):
    `src/auth.ts`, `src/a2a.ts`, `src/store.ts`. This pin proves source behavior,
    not a fresh deployment or the later MCP candidate's release.
  - [A2A v1.0.0 source](https://github.com/a2aproject/A2A/tree/173695755607e884aa9acf8ce4feed90e32727a1):
    `docs/specification.md` and `docs/topics/life-of-a-task.md`, especially task
    immutability, context, idempotency and interrupted streams.
  - [Stable MCP Apps 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/19256f52cad5517ba8272581ed2e11d6a81273d5/specification/2026-01-26/apps.mdx):
    discovery, visibility, initialization, future-turn context, sandbox and CSP.
    Durable restoration is listed as a future extension, not a present guarantee.
  - Owner decisions and coordinating evidence (private coordinating record):
    direct trusted-renderer exception, reported production observations, and
    unresolved provider release and signed-in integration acceptance.
