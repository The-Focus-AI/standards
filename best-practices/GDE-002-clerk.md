---
number: "002"
title: "Clerk authentication setup"
kind: guide
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-07-25"
---

> The isolation policy lives in `STD-009` (Draft); this is its per-provider
> walkthrough. `STD-007 §3.4` covers reuse across environments of the same client.

# Clerk authentication

Clerk is the default auth layer (see `GDE-009`). This walkthrough sets it up
across multiple client projects, including projects on subdomains of one root
domain (e.g. `thp.thefocus.ai`, `habitats.thefocus.ai`). Each client has its own
Clerk application and its own OAuth applications and credentials.

# One Clerk application per client

- **Each client project gets its own Clerk _application_.** The application is
  the user-pool boundary — two applications share no users, sessions, or
  sign-ins. This is what gives clients isolated logins.
- **Do NOT** use satellite domains or Organizations to separate clients. Both
  deliberately _share_ one user pool (satellite = one login across many
  domains; Organizations = many tenants in one app). They are the opposite of
  client isolation.
- Subdomains of one root domain are fine: since Sept 2024 Clerk scopes cookies
  per-subdomain, so independent apps on `thp.` and `habitats.` keep sessions
  isolated automatically. Keep current `@clerk/nextjs`.
- Cost is not a reason to consolidate: applications are unlimited and each gets
  50k free MAU.

# Always run a production instance in production

- **Never ship a development instance to production.** A dev instance
  (`pk_test_…`, Frontend API on `*.clerk.accounts.dev`) defaults to Clerk's
  _shared_ OAuth credentials, has stricter rate limits, and sends email from
  `accounts.dev`. It is for local dev only; the shared OAuth defaults are not
  the client-specific configuration described in `STD-009 §3.6`.
- Production uses `pk_live_…` / `sk_live_…` on your own custom domain.
- Sanity-check which instance a deployment uses by decoding the publishable key
  (the payload is base64 of the Frontend API host followed by `$`):

  ```bash
  node <<'JS'
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const match = key.match(/^pk_(live|test)_([A-Za-z0-9+/]+={0,2})$/);
  if (!match) throw new Error("Expected a Clerk publishable key (pk_live_ or pk_test_)");
  const decoded = Buffer.from(match[2], "base64").toString("utf8");
  if (Buffer.from(decoded).toString("base64").replace(/=+$/, "") !== match[2].replace(/=+$/, "") ||
      !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9-]+\$$/i.test(decoded)) {
    throw new Error("Invalid publishable-key host payload");
  }
  console.log(`${match[1] === "live" ? "production" : "development"}: ${decoded.slice(0, -1)}`);
  JS
  ```

This diagnostic checks key shape and identifies the instance type; it does not
test sign-in, OAuth ownership, or origin isolation. The decoder was checked
2026-10-30 against Clerk's [key implementation](https://github.com/clerk/javascript/blob/main/packages/shared/src/keys.ts)
with synthetic live/test keys and invalid inputs. It prints only type and host.

# Per-client production setup (repeat for each client)

1. Create the application, then **Create production instance** (clone dev — note
   SSO connections, integrations, and Paths do NOT copy and must be re-added).
2. Set the instance domain to the client subdomain, e.g. `thp.thefocus.ai`.
3. Add the CNAME records from the Clerk **Domains** page. Standard set (hosts
   shown relative to the `thefocus.ai` zone, for the `thp` subdomain):

   ```text
   clerk.thp              CNAME  frontend-api.clerk.services      # Frontend API
   accounts.thp           CNAME  accounts.clerk.services          # Account Portal
   clkmail.thp            CNAME  mail.<token>.clerk.services       # email
   clk._domainkey.thp     CNAME  dkim1.<token>.clerk.services      # DKIM
   clk2._domainkey.thp    CNAME  dkim2.<token>.clerk.services      # DKIM
   ```

4. **Cloudflare: set every Clerk record to "DNS only" (grey cloud).** A proxied
   (orange-cloud) record fails Clerk's domain/SSL verification.
5. Put `pk_live_…` / `sk_live_…` in that client's hosting env (each client is
   its own Vercel project). The #1 prod mistake is forgetting to swap the keys.
6. Add that client's social OAuth credentials (see "Social OAuth" below) and
   re-point webhooks to the production instance.
7. Lock origins in middleware so a token from one client is rejected by another:

   ```ts
   // middleware.ts (per project)
   import { clerkMiddleware } from "@clerk/nextjs/server";
   export default clerkMiddleware({ authorizedParties: ["https://thp.thefocus.ai"] });
   ```

8. Deploy certificates in the Dashboard (DNS can take up to 48h to propagate).

# Social OAuth (Google + Microsoft)

Clerk supplies _shared_ OAuth credentials by default for development instances;
production instances require custom credentials. That vendor convenience is
not a compliant client-specific setup under `STD-009 §3.6`. Configure **Use
custom credentials** with the client's own provider registration in development
as well as production. A sign-in that works with Clerk's shared defaults has not
tested the client's OAuth configuration.

For each instance and provider, **copy the exact redirect URI from the Clerk
Dashboard** (SSO Connections → provider → _Use custom credentials_). Production
examples look like the following; these two clients' callbacks belong in
different provider applications, not one shared registration:

```text
https://clerk.thp.thefocus.ai/v1/oauth_callback        # THP OAuth app only
https://clerk.habitats.thefocus.ai/v1/oauth_callback   # Habitats OAuth app only
```

## Per-client OAuth applications and credentials

Under `STD-009 §3.6`, each client gets its own Google OAuth application and
Microsoft app registration for the providers it uses, with client IDs and
secrets that are never copied into another client's Clerk application. This is
the isolation boundary even when clients share a root domain, consent-screen
branding, or the team administering their provider accounts.

- Separate Clerk applications isolate user pools. Separate provider
  applications additionally keep consent, credentials, rotation, and revocation
  within one client's boundary; different branding is not a prerequisite.
- Multiple redirect URIs can belong to one client's application: development,
  preview, and production can reuse that client's registration and credentials
  where supported and appropriately scoped (`STD-007 §3.4`). Each callback and
  origin belongs to that client, never another client.
- Store credentials in the client's project vault (`STD-007 §3.1`), and record
  their owner and renewal date where they expire (`STD-007 §3.9`). Within-client
  reuse means coordinating rotation across that client's environments, not
  across the whole client fleet.

## Google setup (repeat for each client)

1. In this client's Clerk application, open each instance being configured:
   **SSO Connections → Google** → enable + **Use custom credentials** → copy
   its Redirect URI.
2. In Google Cloud Console, select or create a project dedicated to this
   client. Configure its **OAuth consent screen / Google Auth Platform** with
   the client's app name and **External** audience. Set **Authorized domains**
   for the client's URLs (`thefocus.ai` for the THP example); a shared parent
   domain is not a reason to share the OAuth application. **Publish to "In
   production"** before production use (`STD-009 §3.8`), completing any Google
   verification required for the app's branding or scopes.
3. **Credentials → OAuth client ID → Web application**:
   - Name the OAuth client for this client project.
   - Authorized JavaScript origins: `https://thp.thefocus.ai`, plus the origins
     used by this same client's other environments as needed.
   - Authorized redirect URIs: add the exact Clerk Redirect URIs collected for
     this client, not callbacks from other clients.
4. Save Client ID + Secret in this client's project vault, then enter them into
   **Use custom credentials** in only this client's Clerk instances and save.

## Microsoft / Entra ID setup (repeat for each client)

1. In this client's Clerk application, open each instance being configured:
   **SSO Connections → Microsoft** → enable + **Use custom credentials** → copy
   its Redirect URI.
2. Azure → Microsoft Entra ID → **App registrations → New registration**:
   - Name this registration for the client; use a separate registration for
     every other client.
   - **Supported account types: "Accounts in any organizational directory
     (multitenant) and personal Microsoft accounts."** Required so external
     orgs (e.g. a client's tenant) can sign in. Clerk uses the `common` tenant.
     Multitenant describes who can sign in, not permission to share this
     registration across our client projects.
   - Redirect URI: platform **Web**, enter this client's Clerk Redirect URI.
     Add callbacks for other environments of this same client in the
     registration's **Authentication** settings as needed.
3. **Certificates & secrets → New client secret** → copy the Value. Note the
   expiry (≤24mo), record the renewal owner, and set a rotation reminder —
   expired secrets silently break Microsoft login.
4. **Token configuration**: add the `email` optional claim.
5. Save Application (client) ID + secret Value in this client's project vault,
   then enter them into **Use custom credentials** in only this client's Clerk
   instances and save. The secret **Value**, not the Secret ID, is the credential.

## Check the client boundary

Compare provider application/client IDs across clients: they differ. Review
each registration's callbacks and origins: none belongs to another client.
Then test each enabled provider from this client's Clerk Account Portal in
each configured environment, confirming the expected client application and
successful callback. A check against development defaults does not substitute
for this test.

# Access control per client

- Restrict self-signup to the client's email domain in
  **Dashboard → Configure → Restrictions → Allowlist** (per application, so
  policies never leak between clients).
- Pair with app-side provisioning that grants tool access on first sign-in for
  the client's domain.

# Anti-patterns

- Dev instance (`pk_test`) serving a production site.
- One shared Clerk app + satellite domains used to "separate" clients (leaks
  the user pool across clients).
- One Google OAuth app or Microsoft registration shared across clients, even
  with separate Clerk apps — couples provider consent and credential lifecycle.
- Treating Clerk's shared development OAuth defaults as a completed
  client-specific configuration.
- Setting the instance domain to the bare root (`thefocus.ai`) — that shares
  sessions across all subdomains and re-couples clients.
- Cloudflare-proxied Clerk CNAMEs (orange cloud) — verification fails.
- Shipping to prod with social login enabled but no custom OAuth credentials —
  the Google/Microsoft buttons break (dev shared creds don't carry over).
- Microsoft app registered as single-tenant — external client orgs can't sign
  in; must be multitenant.
- Letting a Microsoft client secret expire with no rotation reminder — silent
  login outage.
- Google OAuth app left in "Testing" publishing status — only 100 users can
  sign in.

# OAuth setup references

Checked for this OAuth credential setup update on 2026-10-29; the rest of the
Clerk configuration walkthrough was not reverified in this update. Consult the
provider guides for current dashboard labels and additional connection settings.

- [Clerk: social OAuth](https://clerk.com/docs/nextjs/guides/configure/auth-strategies/social-connections/overview).
- [Clerk: Google](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google).
- [Clerk: Microsoft](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/microsoft).
- [Google: manage OAuth clients](https://support.google.com/cloud/answer/6158849).
- [Google: manage OAuth app branding](https://support.google.com/cloud/answer/15549049).
- [Microsoft: redirect URIs](https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri).
