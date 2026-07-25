---
standard: "009"
title: Authentication
category: Practice
status: Draft
issued: "2026-07-25"
revision: R1
applies-to: Every client-facing project with sign-in
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

**Out of scope.** The per-provider OAuth setup walkthroughs, which stay in
`best-practices/clerk.md`. Secret storage, which is `STD-007`. Authorisation
inside an application.

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

A development instance uses Clerk's shared OAuth credentials, has stricter rate
limits, and sends email from `accounts.dev`. It is for local development. The
publishable key decodes to the frontend API host, so which instance a deployment
is running is checkable rather than assumed.

```sh
echo "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY#pk_live_}" | base64 -d
# a *.clerk.accounts.dev result means this is a DEV instance
```

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

Social sign-in in production MUST use the project's own OAuth credentials.

Development shares Clerk's credentials and they do not carry over. Shipping with
social login enabled and no custom credentials produces sign-in buttons that
simply fail, and they fail only in production.

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

## 4. References

[1] Bradner, S., *Key words for use in RFCs to Indicate Requirement Levels*,
BCP 14, RFC 2119, March 1997.

[2] The Focus AI, `STD-007` — Secrets and credentials. Draft.

[3] The Focus AI, `best-practices/clerk.md` — per-provider setup walkthroughs.
