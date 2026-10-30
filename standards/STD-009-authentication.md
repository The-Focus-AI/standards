---
standard: "009"
kind: standard
title: Authentication
category: Practice
status: Draft
issued: "2026-07-25"
revision: R3
applies-to: Every client-facing project with sign-in, and every product acting as an OAuth client
author: W. Schenk
---

## 1. Introduction

Clerk is the default authentication layer. The rules that matter are about
isolation between clients and about the difference between a development
instance and a production one — both of which are easy to get wrong in ways that
work fine in testing and fail in front of a client.

Almost every clause here was recovered from an anti-pattern list. They are
recorded as requirements because each one has already cost somebody an outage or
a leak.

R3 makes the per-client boundary explicit for OAuth applications and credentials
in every environment, not just for Clerk user pools in production. Reuse across
environments of the same client is distinct from sharing between clients.

**Out of scope.** The per-provider OAuth setup walkthroughs, which stay in
`best-practices/GDE-002-clerk.md`. Secret storage, which is `STD-007`. Authorisation
inside an application.

Sections 3.1–3.9 govern **user sign-in**. Sections 3.10–3.12 (added in R2)
govern the reverse direction: **our software acting as an OAuth client** —
an agent or CLI authenticating to a third-party or MCP authorization
server. MCP spec 2026-07-28 deprecated Dynamic Client Registration in
favour of Client ID Metadata Documents [4], which makes client *identity*
a hosted artifact somebody has to own; these clauses record whose it is.

## 2. Requirements language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** and **MAY** in
this document are to be interpreted as in RFC 2119 [1]. A clause marked
**DEPRECATED** was normative in an earlier revision and is retained so that
repositories still running it can find out what replaced it.

## 3. Requirements

### 3.1

Each client project MUST have its own Clerk application.

The application is the user-pool boundary: two applications share no users,
sessions, or sign-ins. That boundary is what client isolation means here.
Applications are unlimited and each carries its own free tier, so cost is never
a reason to merge two clients into one.

### 3.2

Satellite domains and Organizations MUST NOT be used to separate clients.

Both features exist to *share* one user pool — satellite domains give one login
across many domains, Organizations give many tenants inside one application.
Using either for isolation achieves the exact opposite of the intent, and the
failure is invisible until a client sees another client's user.

### 3.3

A production deployment MUST use a Clerk production instance.

A development instance defaults to Clerk's shared OAuth credentials, has stricter
rate limits, and sends email from `accounts.dev`. It is for development. The
publishable key decodes to the frontend API host, so which instance a deployment
is running is checkable rather than assumed.

Use the publishable-key diagnostic in `GDE-002`; it recognizes both `pk_live_`
and `pk_test_` rather than silently trying to decode the wrong prefix.

### 3.4

A production instance MUST NOT use the bare root domain as its instance domain.

Setting it to the root shares sessions across every subdomain, which re-couples
the clients that separate applications were created to isolate. Use the client's
own subdomain.

### 3.5

Clerk DNS records MUST NOT be proxied.

A proxied CNAME — Cloudflare's orange cloud and equivalents — breaks domain
verification. The symptom is a verification that never completes, which reads as
a Clerk fault rather than a DNS setting.

### 3.6

Every client's social sign-in MUST use client-specific OAuth applications and
credentials in every environment.

Client-specific means the provider application or registration, client ID, and
client secret are never shared with another client, even when both clients use
subdomains of the same root. Separate Clerk applications isolate user pools;
separate OAuth applications isolate consent, credentials, rotation, and
revocation at the provider.

Clerk's shared development credentials are provider-supplied defaults, not a
compliant client-specific configuration. Custom credentials replace those
defaults in development as well as production; a working development sign-in
with shared defaults does not establish compliance.

The same client-specific OAuth application and credentials can serve that
client's development, preview, and production environments where the provider
supports their callbacks and the credential permissions are appropriate.
`STD-007 §3.4` governs production parity and documented environment differences;
it does not permit cross-client sharing.

### 3.7

A Microsoft application registration MUST be multitenant.

Single-tenant registration means users in an external client's directory cannot
sign in at all. Since every client here is an external organisation, single
tenant is always wrong.

### 3.8

A Google OAuth application MUST be published before production use.

An application left in Testing publishing status admits one hundred users and
then stops, silently, partway through a rollout.

### 3.9

An OAuth client secret MUST have a recorded expiry and renewal owner, per
`STD-007 §3.9`.

Microsoft client secrets expire. The outage is total, arrives without warning,
and looks like an application fault rather than a calendar one.

### 3.10

An OAuth client identity published as a Client ID Metadata Document MUST be
an HTTPS URL with a path component, on an apex the organisation controls,
and the document's `client_id` MUST equal that URL exactly.

The URL *is* the client's identity: every authorization server that ever
granted a consent against it will fetch, display, and trust it. A URL on a
domain we might lose, or one whose `client_id` drifts from its address,
invalidates consents in a way no rotation procedure recovers.

### 3.11

A Client ID Metadata Document MUST be hosted by the product that owns the
client, at a URL of that product's choosing, and the product MUST keep the
document reachable for as long as any consent granted against it remains
live. A shared organisation-wide registry site MUST NOT be the host.

Decided in umwelten ADR 0020 after considering central hosting: client
identity is decoupled from any single deploy pipeline, so no one site
outage or migration can strand every OAuth client in the organisation at
once. The accepted cost is that there is no single place to audit all
client documents — discovery is per-product.

### 3.12

A new integration SHOULD register via Client ID Metadata Documents when the
authorization server advertises support
(`client_id_metadata_document_supported`), falling back to Dynamic Client
Registration only where it does not; and client credentials obtained by
registration MUST be stored keyed by the issuing authorization server and
MUST NOT be reused across issuers.

DCR is deprecated in the MCP authorization spec [4] and survives only as a
compatibility path. Credentials keyed by server URL rather than issuer
collide the moment a resource changes authorization servers — the failure
is silent until a token from the wrong issuer is refused in production.

## 4. References

[1] Bradner, S., *Key words for use in RFCs to Indicate Requirement Levels*,
BCP 14, RFC 2119, March 1997.

[2] The Focus AI, `STD-007` — Secrets and credentials. Draft.

[3] The Focus AI, `best-practices/GDE-002-clerk.md` — per-provider setup walkthroughs.

[4] Model Context Protocol, *Client Registration*, spec revision 2026-07-28,
<https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration>.
See also The-Focus-AI/umwelten `docs/adr/0020-client-identity-is-hosted-per-product.md`.
