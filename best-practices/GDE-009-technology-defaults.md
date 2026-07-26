---
number: "009"
title: "Technology defaults"
kind: guide
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-07-25"
---

> This file used to carry the tooling rules. Those are now `STD-004`
> (tooling and tasks) and `STD-011` (skills), where they can be cited and
> checked. What remains here is the set of default technology choices, which
> are preferences rather than requirements and have not been decided in enough
> detail to be clauses.

# Technology defaults

Unless a project states otherwise:

- **TypeScript** and **pnpm**. Avoid a build step where the runtime allows it;
  prefer commands that run TypeScript directly.
- **Neon / Postgres** as the database. Prefer Neon over Supabase for new work
  unless a client has already standardised on something else — document the
  exception in the project's `AGENTS.md`.
- **Clerk** for authentication. The rules are `STD-009`; the setup walkthrough
  is `best-practices/GDE-002-clerk.md`.

## Not yet decided

These are named in the gap register (`reports/NOTE-005-2026-07-25-standards-gap-register.md`)
as needing a decision before they can be written as standards:

- Module layout and error-handling conventions for TypeScript projects.
- What "avoid a build step" means in practice, and when it does not apply.
- Migrations, schema conventions, and connection handling for Postgres.

## Binding rules

- `STD-004` — every tool through mise; the four required tasks.
- `STD-007` — secrets, vaults, and credential scoping.
- `STD-011` — skills installed with the CLI and pinned in the lock.
