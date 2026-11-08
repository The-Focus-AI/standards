---
title: Isolate client sign-in
summary: Separate clients at both the Clerk user pool and the OAuth provider registration.
status: Draft
---

Use a separate Clerk application for each client. Organizations and satellite
domains share a user pool; they do not replace this boundary.

Give each client its own Google OAuth application and Microsoft registration,
including client IDs and secrets, in every environment. Clerk's shared
development credentials do not satisfy that policy. One client's credentials
may serve its development, preview, and production environments where callback
support and permissions allow. Another client's credentials may not.

## Configure production deliberately

- Use a Clerk production instance for production and the client's own subdomain,
  not the organization's bare root domain.
- Leave Clerk DNS records unproxied so verification can complete.
- Configure Google publishing and Microsoft tenant support for the intended
  users. External client organizations need the appropriate multitenant registration.
- Record OAuth secret expiry and a renewal owner.
- Restrict signup and provision application permissions according to the client's
  access policy. A successful login alone does not grant specialist entitlement.

The [Clerk procedure](../recipes/clerk.md) includes the publishable-key diagnostic,
provider setup, and callback checks. Preview configuration follows the same
[parity and data-protection rules](secrets.md#match-production-behavior-in-previews).

## Treat OAuth clients as a different direction

When our product accesses a third-party or MCP authorization server, it is an
OAuth client rather than the sign-in provider. Use existing pre-registered
information first. Where supported, use Client ID Metadata Documents for new
registration; retain DCR only as a version-specific compatibility path.

The product owns its HTTPS client-identity URL on an organization-controlled
domain, with a path component and an exactly matching `client_id`. Keep it
reachable while granted consents remain live. Do not centralize every product's
client identity behind one unrelated registry site's deployment.

Store registration credentials keyed by the issuing authorization server and
do not reuse them across issuers. Refresh protocol-version claims against the
[MCP authorization specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
when implementing. OAuth registration is not native Clerk machine provisioning.

For backend-to-backend requests, select a [service access profile](service-access.md).
Do not put browser-session middleware in front of a machine-only API and assume
that a route-level bearer verifier can still run.
