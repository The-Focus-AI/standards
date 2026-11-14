---
title: Give and remove access
summary: One organization account, one development vault per project, one group per client, and an access map that drives onboarding, offboarding, and rotation.
status: Draft
---

1Password exists to supply development environments: cloud workspaces, laptops,
and previews. Those credentials live in the organization's 1Password Business
account, never in a person's individual account. A person is granted access by
joining a group; a group is granted a vault. Nobody is added to a project vault
by name. Production values live where the deployment runs, not in a project vault.

[Handle secrets](secrets.md) owns how a credential is stored and delivered. This
page owns who may reach it, and what happens when that changes.

## Keep everything in the organization account

- Project vaults, their service accounts, and the saved bootstrap-token items all
  belong to the organization account. An individual account cannot have other
  members, so nothing stored there can be shared or recovered by a teammate.
- Name the account in every command: `op read --account <org>.1password.com ...`
  or `OP_ACCOUNT`. With several accounts signed in, an unqualified `op` command
  uses whichever signed in last.
- An owner or administrator creates each service account. Members who are merely
  granted the create permission manage only their own service accounts [1], which
  leaves the organization dependent on that person.
- Save the bootstrap token as an item in its own project vault. One vault grant
  then gives a developer both the runtime values and the token, and removes both.
  A service account cannot be granted the built-in Private, Employee, or default
  Shared vault [2]; do not keep project secrets there.

## Grant by client group

Create one group per client and one for internal work. Grant each project vault
to exactly one of them. This is the same boundary [sign-in](sign-in.md) draws for
OAuth applications: access to one client never implies access to another.

When a client serves clients of its own, the boundary is the end client. Give
each end client its own vault, service account, and group, and keep the
intermediary's own systems in a separate vault. A project that needs values from
two end clients is a sign that a shared value belongs in the intermediary's vault
or that the project should be split; do not widen one end client's vault to cover it.

Name each vault `<Client> - <Project>`, or just `<Client>` when the client has
one project. Each project has exactly one vault and one service account. Do not
create a vault per environment, and do not put the environment in an item name:
an item is titled with the variable it supplies.

| Role | Vault permission | Who |
| --- | --- | --- |
| Developer | View and copy | Members of the client group |
| Project owner | Edit and manage | One named person, plus the Owners group |
| Development environments | `read_items` | The project's service account |

Vault access is fixed when a service account is created and cannot be edited
later [1]. Changing what a project reads means issuing a new service account.

## Keep production out of the project vault

The project token is copied into every workspace that develops the project, so
it must not unlock anything that matters in production.

- The project vault holds development and preview values only. Where a provider
  offers separate development credentials, such as a Clerk development instance
  or a database branch, those are what the vault holds.
- An owner sets production values in the deployment platform. Access to them is
  a seat on that platform, recorded in the map.
- Administrative credentials, such as a database owner password or a migration
  role, do not belong in the project vault even when development needs the
  database. Give development a least-privilege role instead.
- Most production values can be re-issued by their provider and need no second
  copy. A value we generate ourselves and cannot re-issue without harm, such as a
  signing key or a push key, gets one recovery copy in an owner-only vault. No
  service account and no client group reads that vault.

When development and production must share one value, for example a single
shared database, record it in the map as an exception with the role's limits.
The value is then production-grade: rotate it when a developer leaves.

## Keep an access map

Keep one access map in a private repository. It records names and locations,
never values. Start from the [example map](../templates/access-map.example.md).

For each project it records the client group, vault, service account, where the
token item is saved, every environment that receives the token, where production
values live, each shared service the project uses, the owner, and the last
rotation date. For each person
it records their groups and their seat on each shared service.

The map is the checklist. A grant that is not in the map is drift: either record
it or remove it. Review the map against the providers' member lists on a schedule,
because nothing mechanical keeps a dashboard and a file in agreement.

## Separate human seats from machine credentials

On Vercel, Neon, Supabase, Clerk, GitHub, and cloud providers:

- A person signs in with their own seat on the organization's team, at the lowest
  role that lets them do the work. No shared logins and no personal tokens saved
  in a project vault.
- A machine credential is issued by the team or project, not from a person's own
  account, and is stored in the project vault. A key minted under a personal
  account stops working, or keeps working, when that person leaves.

## Add a person

1. Confirm which clients they work on. Invite them to the organization account
   and add them to those groups only.
2. For each project row in those groups, invite them to the listed shared
   services and repositories.
3. They run `mise run setup` in each project. A cloud workspace already has the
   token from its secret settings; on their own machine, setup fetches it with
   their own account.
4. Record the person, their groups, and their seats in the map.

## Remove a person

Removing a grant stops future reads. It does not recall a value already copied:
a developer with view access could have read every item in the vault.

1. The same day, suspend the person in 1Password and remove every seat and
   repository grant in their rows of the map.
2. Rotate the bootstrap token of every project they could read, as below.
3. Rotate the underlying values marked rotate-on-departure in the map. That
   always includes any production-grade value the project vault held as a
   recorded exception. Other development values may wait for the scheduled
   rotation if the map says so. Production values set only in the deployment
   platform need rotation only if the person had a seat that could read them.
4. Find and re-issue anything that was created under their personal provider
   account.
5. Record the date and what was rotated. Delete the suspended account only after
   confirming no service account or item depends on it.

Moving a person off one client is the same procedure limited to that group.

## Rotate a service-account token

Rotation in the 1Password web interface issues a new token with the same vault
access and lets the old token expire immediately or after a short overlap [1].
Use the overlap for scheduled rotation and immediate expiry after a departure
or suspected exposure.

1. Rotate the token and save the new value over the token item in the vault.
2. Update every cloud secret setting listed in the map, and refresh the
   processes that hold the old value. Developers run `mise run setup` on their
   own machines; it replaces a token that no longer works.
3. Verify real access with `mise run secrets:check`; presence is not proof.
4. Confirm the old token has expired, then record the date in the map.

Changing which vaults a service account can read is not a rotation. Create a new
service account, deliver its token the same way, then revoke the old one.

## Sources and limits

Checked against 1Password's developer documentation on 2026-11-14. No rotation
was performed while writing this page. The documentation does not say what
happens to a service account when its creator is removed; verify that on a
disposable service account before relying on step 5 of removal.

[1] 1Password, *Manage service accounts*, `1password.dev/service-accounts/manage-service-accounts/`.

[2] 1Password, *Get started with service accounts*, `1password.dev/service-accounts/get-started/`.
