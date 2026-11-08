---
title: "Authorize service calls"
summary: "Choose a credential class and an authorization boundary before implementing the verifier."
status: "Draft"
---

Browser sessions, native Clerk machine JWTs, OAuth access tokens, and administrative
API keys are not interchangeable. Enforce the declared profile across middleware
and the handler. Passing an exact machine method/path to its strict verifier is
not permission to exempt every API route. Browser pages retain session protection.

## Record the receiver contract

Name the issuer, verification keys or introspection, token class, permitted algorithms,
receiver audience, sender claim and allowlist, permissions, lifetime, and required
protected-header/payload claims. Missing configuration fails closed. A signature
from a trusted issuer alone is insufficient to distinguish token classes.

Choose authorization separately from authentication:

| Profile | Owner boundary | What it does not establish |
| --- | --- | --- |
| Machine-only service | Explicitly approved nonhuman workload, sender, receiver, and service permission | No per-human segregation or delegated user rights. Not the Workbench specialist profile. |
| Machine plus human | Independently verified human grant bound to the sender, then local entitlement | Signatures alone do not grant entitlement or operator authority. |
| Temporary demo | Separately approved exact credential, shared-demo owner, original expiry | No fallback after JWT/grant failure and no administrator rights. |

Check ownership on context, task, history, feedback, and interactive-view access.
Return the same not-found behavior for another owner's data as for missing data.
A changed identity mapping requires an entitlement and stored-owner migration.

## Require human delegation for Workbench specialists

Every Workbench invocation of an external specialist, including Roblox and
Versant, carries both verified service identity and a signed, target-bound human
delegation grant. Public card discovery is not an invocation. This is the
owner-selected Workbench integration policy, not an A2A or MCP protocol rule.
Versant's revised receiver is under implementation; this policy is not a claim
that it has shipped. See the [dated evidence](../evidence/workbench-integration.md).

Derive the human subject from the verified server session. Verify the grant's
signature, trusted issuer, receiver audience, subject and lifetime independently
of the service credential. For the native Clerk profile, require
`human.azp === machine.sub`, using the actual verified machine token's `sub`,
not a registry alias or an unverified configured identity. A grant for one target
cannot authorize another specialist.

The receiver independently decides that human's entitlement under the verified
sender. It can refuse a correctly signed request. Missing, invalid, expired,
wrong-target or sender-mismatched grants fail without a shared-service or demo
downgrade. Workbench membership and coordinator authority do not enroll a user
or grant operator privileges. Machine-only access remains valid for explicitly
approved nonhuman workloads outside this integration, never as its fallback.

For the same user, sender and target, direct Workbench relay and coordinator-routed
calls preserve the same verified `(machine.sub, human.sub)` principal. Routing
can change task provenance, not signed authority. Task ids, parent-agent names,
context ids and recap text are attribution or input, not credentials. See
[conversation checks](conversations.md#verify-the-configured-paths).

The lifecycle below records inspected Workbench and Roblox behavior separately
from this selected policy. Clerk's category, clock skew and grant lifetime caps
are application-profile details, not A2A or MCP mandates.

## Issue native Clerk tokens without inventing an OAuth flow

The [Clerk API definition](https://github.com/clerk/openapi-specs/blob/94753d1d8a648806e4dc529beec8bb76daa13859/bapi/2026-08-20.yml)
requires a **machine secret** for
`POST https://api.clerk.com/v1/m2m_tokens`. The Workbench implementation sends
this JSON body and reads the response's `token` property:

```json
{
  "token_format": "jwt",
  "seconds_until_expiration": 300,
  "claims": { "scope": "bls:invoke" }
}
```

Use the profile's permission, such as `versant:read`, rather than copying
`bls:invoke` to every service. Issue from the backend with a scoped machine
secret, not a Clerk administrative secret and not a browser-held credential.
This endpoint is not `/oauth/token`; its response is not `access_token`.

Clerk's configured **machine scopes** select allowed receiver machines. In the
recorded issuance experiment, those scopes produced JWT `aud`; setting custom
`claims.aud` did not. The custom `scope` string is an additional application
permission checked by the receiver. Inspect an actual issued token's verified
claims without logging the token before accepting a configuration.

The [inspected Workbench registry](../evidence/workbench-integration.md#service-profile-evidence)
supports both native `clerk-m2m` and a
separate OAuth `client-credentials` mechanism. A Client ID Metadata Document is
an OAuth client registration mechanism, not native Clerk machine provisioning.
The MCP registration order starts with existing pre-registered information,
then supported metadata documents, then the deprecated DCR compatibility path
([client sign-in and OAuth](sign-in.md)).

## Credential and authorization transitions

These tables describe this integration, not every possible authentication flow.
The caller owns issuance and caching; the provider owns verification, entitlement
and data ownership. Desired guarantees beyond these observations need a separate
implementation and acceptance test.

| Machine | Transition and guard | Owner and effect | Failure, retry or recovery |
| --- | --- | --- | --- |
| Browser session | Signed out to signed in after Clerk sign-in; signed in to signed out on logout or expiry | Workbench derives the human subject from the server session, never from request metadata | No signed-in human means no delegated grant. Reauthenticate in the browser; do not substitute a machine subject. Logout does not revoke an already signed grant. |
| Machine credential | Unprovisioned to configured after approved sender/receiver provisioning and scoped secret delivery | Operator records issuer, receiver, sender, scope, TTL and credential reference | Stop on missing resources or access. Administrative credentials do not stand in for the missing token. Preview uses the same flow, with only documented differences under `handbook/secrets.md`. |
| Token cache | Empty or within 30 seconds of expiry to minting; successful native mint to cached for the requested 300-second lifetime | Workbench `bearerFor` caches server-side by auth configuration; changing the machine secret changes its cache key | Mint errors stop dispatch. It does not use an old token as a fallback and implements no automatic unauthorized retry. Multiple processes have separate caches. |
| Token verification | Presented to verified only after the selected class, signature, issuer, audience, sender, time and permission checks | Specialist constructs the machine principal | Invalid credentials remain authentication failures. JWKS or config failures fail closed. A valid token without permission is denied, not retried as another credential class. |
| Human delegation | Verified session to signed grant for a pinned target and sender; paired credentials to bound principal | Inspected Workbench signs a 300-second grant. Roblox verifies its issuer, audience, signature and timestamps, caps accepted grant lifetime at 600 seconds, and requires `human.azp === machine.sub`. The selected Workbench policy requires bound grants for every external specialist; Versant acceptance remains pending | Missing, expired or mismatched grant fails without shared-service downgrade. A new grant requires a valid session and current target policy. This custom header is not ID-JAG. |
| Entitlement | Bound principal to authorized when the provider finds the exact sender/human row; removal to denied on the next checked request | Roblox checks local entitlement and scopes task, context, history and feedback to the resulting owner | Valid signatures without entitlement yield 403. No shadow user, automatic enrollment or operator privilege. Existing in-flight work is not known to stop when a row is removed. |
| Rotation and revocation | Secret rotation changes future minting; entitlement or policy changes deny later checks; expiry ends token validity | Issuer, Workbench operator and provider each own a different control | Clerk JWTs are offline-verified and not individually revocable through its opaque-token revocation API. Scope changes affect newly minted tokens. Immediate invalidation, key overlap and in-flight cancellation need a separate tested design. |

Roblox's native verifier requires `RS256`, the protected M2M category, a machine
`sub`, audience, application scope, and a maximum machine age and lifetime of
300 seconds. Its grant verifier accepts configured RSA or EC keys. Do not infer
that it enforces Versant's proposed `typ` check: the profiles and implementations
are distinct. When changing an issuer or identity claim, plan the entitlement
and stored-owner migration before switching the verifier.

The [ID-JAG draft](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)
describes token exchange and redemption for an access
token. It does not describe Workbench's independently signed
`X-Upperhand-Identity-Grant` header. Adoption would be a separate profile change.

## Preserve bounded demo access during cutover

The machine-auth cutover broke an original demo token that had not expired.
The recovery kept `AUTH_MODE=clerk-m2m` and added explicit coexistence instead
of weakening JWT verification. It also removed global operator access from that
legacy path: restoring the old privilege would expose other owners' analytics.
This recorded standalone demo path is not a Workbench connection profile. The
mandatory delegation policy does not select it or revoke it by implication.

| State or event | Guard and effect | Recovery and approval boundary |
| --- | --- | --- |
| Legacy path disabled | All requests use the configured primary profile | Enabling coexistence is a separately approved access change, not an automatic rollback. |
| Coexistence enabled | `LEGACY_DEMO_ENABLED=true`, no identity-grant header, token has no JWT separator, exact SHA-256 digest match, and current time before recorded expiry | The matching request owns only `shared-demo` data and has `operator=false`. Any failed guard stays on the strict path or is denied. |
| Wrong JWT, wrong grant or no entitlement | Primary profile fails without selecting demo | Never catch a primary-profile failure and try the demo credential. |
| Original expiry reached | Recorded recovery retained `2026-11-19T23:59:59Z`; at or after the cutoff, demo denies | Retirement owner removes the opt-in after checking outstanding users. This proposal does not extend that date or authorize deletion of saved history. |

## Agent and operator acceptance checks

Before changing code, write the profile and current state from evidence. Inspect
middleware, handler, issuance, registry and persistence together. Use fixtures
for negative tests, then an approved credential for a real route check. Keep
tokens and private keys out of logs, command arguments, renderer HTML and reports.
Agents can prepare code, tests and a provisioning plan in the cloud workspace;
operators approve production machines, grants, entitlements and cutover.

| Case | Observable acceptance criterion |
| --- | --- |
| Credential confusion | A trusted-issuer session/template JWT, OAuth token, administrative secret and opaque token each fail a native-M2M-only route. Wrong issuer, audience, category, sender, scope, expiry and overlong lifetime also fail. |
| Mandatory grant | Every Workbench external-specialist path rejects missing, invalid, expired and wrong-target human grants, even with a valid machine token. No model or tool execution, shared-service downgrade or demo retry follows. |
| Delegation binding | A valid machine A plus a valid grant bound to machine B fails. Test the actual token `sub` differing from a configured sender alias. Removing the exact entitlement denies the next request. |
| Direct and routed identity | For the same user, sender and target, direct relay and coordinator-routed calls resolve to the same verified principal and entitlement outcome. A second human remains distinct. |
| Provenance is not authority | Changing task, context, parent-agent or claimed-user metadata cannot change the verified principal, bypass a denied entitlement or replace a missing grant. |
| Route boundary | Correct credentials reach a well-formed A2A response; no-token calls get the selected API auth error, not HTML. Session-protected pages and neighboring routes retain protection. |
| Delegated owner isolation | For delegated/per-human profiles such as Roblox's sender/human pair, two humans under one machine and one human under two machines cannot read each other's context, task, history or feedback. Test the same context id under both owners. |
| Approved nonhuman workload | Outside Workbench specialist connections, a separately approved machine-only profile checks its service boundary without claiming per-human segregation. Its existence cannot enable a downgrade on a delegated route. |
| Cache and expiry | Test immediately before and at the refresh threshold and token expiry with a controlled clock. An issuance failure and an unauthorized response cause no second invocation. |
| Demo coexistence | The exact token works only before its unchanged expiry and without a grant. One changed byte, a JWT-shaped token, a grant-bearing request and an expired token never enter demo. Demo cannot use operator analytics. |
