# Clerk authentication

Clerk is the default auth layer (see @AGENTS.md). These rules cover how to set
it up across multiple client projects that live on subdomains of one root
domain (e.g. `thp.thefocus.ai`, `habitats.thefocus.ai`).

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
  (`pk_test_…`, Frontend API on `*.clerk.accounts.dev`) uses Clerk's _shared_
  OAuth credentials, has stricter rate limits, and sends email from
  `accounts.dev`. It is for local dev only.
- Production uses `pk_live_…` / `sk_live_…` on your own custom domain.
- Sanity-check which instance a deployment uses by decoding the publishable key
  (it is base64 of the Frontend API host):

  ```bash
  echo "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY#pk_live_}" | base64 -d
  # → clerk.thp.thefocus.ai   (a *.clerk.accounts.dev result means it's a DEV instance)
  ```

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
6. Add your own social OAuth credentials (see "Social OAuth" below) and
   re-point webhooks to the production instance.
7. Lock origins in middleware so a token from one client is rejected by another:

   ```ts
   // middleware.ts (per project)
   import { clerkMiddleware } from "@clerk/nextjs/server";
   export default clerkMiddleware({ authorizedParties: ["https://thp.thefocus.ai"] });
   ```

8. Deploy certificates in the Dashboard (DNS can take up to 48h to propagate).

# Social OAuth (Google + Microsoft)

Development instances use Clerk's _shared_ OAuth credentials, so social login
"just works" in dev. **Production instances require your own credentials** — any
social button that worked in dev breaks in prod until you add them.

Each Clerk production instance has one redirect URI, tied to its Frontend API
domain. **Copy the exact value from the Clerk Dashboard** (SSO Connections →
provider → _Use custom credentials_); it looks like:

```text
https://clerk.thp.thefocus.ai/v1/oauth_callback        # THP instance
https://clerk.habitats.thefocus.ai/v1/oauth_callback   # Habitats instance
```

## One shared OAuth app per provider (standard)

Because every client lives under `thefocus.ai`, use **one Google app and one
Microsoft app for all clients**, each listing **multiple redirect URIs** (one
per Clerk instance). Paste the same Client ID/Secret into each client's Clerk
instance.

- Least to manage; a single Google consent screen (authorized domain
  `thefocus.ai`) and one multitenant Microsoft app cover every `*.thefocus.ai`
  subdomain.
- Sharing the OAuth _app_ does NOT weaken isolation: it only brokers "this is
  the user's Google/MS account." The user pool still lives in each separate
  Clerk application.
- Trade-off: one consent-screen brand for all clients, shared secret rotation.
  Only split to a per-client OAuth app when a client needs branded consent or
  must own the provider relationship.

## Google setup (per provider, once)

1. Clerk Dashboard → SSO Connections → Google → enable + **Use custom
   credentials** → copy the Redirect URI.
2. Google Cloud Console → **OAuth consent screen**: External; set the app name
   (shown to users); **Authorized domains** = `thefocus.ai` (covers all
   subdomains); **publish to "In production"** (Testing mode caps at 100 users).
3. **Credentials → OAuth client ID → Web application**:
   - Authorized JavaScript origins: `https://thp.thefocus.ai` (add each client
     origin).
   - Authorized redirect URIs: add the Clerk Redirect URI for each instance.
4. Paste Client ID + Secret into each client's Clerk instance.

## Microsoft / Entra ID setup (per provider, once)

1. Clerk Dashboard → SSO Connections → Microsoft → enable + **Use custom
   credentials** → copy the Redirect URI.
2. Azure → Microsoft Entra ID → **App registrations → New registration**:
   - **Supported account types: "Accounts in any organizational directory
     (multitenant) and personal Microsoft accounts."** Required so external
     orgs (e.g. a client's tenant) can sign in. Clerk uses the `common` tenant.
   - Redirect URI: platform **Web**, add the Clerk Redirect URI for each
     instance.
3. **Certificates & secrets → New client secret** → copy the Value. Note the
   expiry (≤24mo) and set a rotation reminder — expired secrets silently break
   Microsoft login.
4. **Token configuration**: add the `email` optional claim.
5. Paste Application (client) ID + secret Value into each client's Clerk
   instance.

# Access control per client

- Restrict self-signup to the client's email domain in
  **Dashboard → Configure → Restrictions → Allowlist** (per application, so
  policies never leak between clients).
- Pair with app-side provisioning that grants tool access on first sign-in for
  the client's domain.

# Anti-patterns

- Dev instance (`pk_test`) serving a production site.
- One shared app + satellite domains used to "separate" clients (leaks the user
  pool across clients).
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
