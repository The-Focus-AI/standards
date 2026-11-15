---
title: Handle secrets
summary: Keep credentials project-scoped, out of transcripts, and separate from runtime permissions.
status: Draft
---

Use one dedicated project vault (`<Client> - <Project>` or `<Client>`) in
TheFocus.AI's company 1Password Business account (`thefocusai.1password.com`)
and a service account scoped to that vault. Never store project secrets,
service accounts, or bootstrap tokens in a personal 1Password account
(`my.1password.com`) or in built-in `Private`, `Personal`, `Employee`,
`Shared`, or `default` vaults.

The vault supplies development environments and previews; production values are
set where the deployment runs. `fnox.toml` declares references, not values. A
fnox profile selects values; it is not an access boundary or a deployment destination.

The vault, its service account, and the saved token belong to the company
account (`thefocusai.1password.com`). [Give and remove access](access.md) owns
who can reach them and what to rotate when that changes.

## Bootstrap without taking a person's identity

A person retrieves the project token through their individual seat in the
company 1Password account (`thefocusai.1password.com`, never a personal
`my.1password.com` account) and supplies `OP_SERVICE_ACCOUNT_TOKEN` through the
project's cloud secret settings. Do not request their password, Secret Key, or
login cache. Never save an injected token into a reusable image or snapshot.

Record the token item's location, recovery owner, scope, and receiving environments.
Recovery uses an authorized member's seat in `thefocusai.1password.com`. Save
the token in the project vault it unlocks, so one grant gives a developer both.

On a person's own machine, `mise run setup` fetches the token from
`thefocusai.1password.com` (`--account thefocusai.1password.com`) and writes it
to `.fnox/env`, a mode-600 ignored file. It refuses personal `my.1password.*`
accounts and built-in `Private`, `Personal`, `Employee`, `Shared`, or `default`
vaults, and is not a prerequisite for cloud injection. Setup checks that the
token actually reads the vault, not merely that one is present, and replaces
one that does not.

## Check before writing a credential file

Keep `.fnox/`, `.env`, `.env.*`, and project-specific credential files ignored.
Keep placeholder-only `.env.example` trackable. Preserve existing ignore rules.

For each intended path, run both checks before writing:

```sh
git check-ignore -q -- .fnox/env
git ls-files -- .fnox/env
```

The first must succeed; the second must print nothing. Repeat for every path,
not one representative. If a secret file is tracked, stop and report the path
without printing contents. Adding an ignore rule does not untrack or erase it.

## Separate runtime and administrative authority

Give the app only the credentials it needs. Bootstrap tokens, platform write
credentials, usage-report admin keys, and personal account sessions do not belong
in application profiles, model context, renderer HTML, command arguments, or logs.
Record an expiry and renewal owner for expiring credentials.

Sync from the project vault only to development and preview destinations. An
owner sets production values in the deployment platform directly, from the
provider that issued them; see [what stays out of the project vault](access.md#keep-production-out-of-the-project-vault).

Use a named sync target tying together project, destination, source profile,
credential environment names, and runtime-key allowlist. Dry-run first, apply
only with approval. Parse structured values; never split dotenv lines or pass
passwords through shell arguments. After an uncertain write, inspect remote
state before retrying. A multi-key sync is not an atomic transaction.

The [fnox procedure](../recipes/fnox.md) owns setup and the common sync behavior.
[Vercel](../recipes/vercel.md) and [GCP](../recipes/gcp.md) own destination details.

## Match production behavior in previews

Give previews the same integrations and configuration shape as production,
using the project vault's development and preview values. Separate vaults or
provider accounts for every environment are not the default requirement. Where
a preview can only work with a production value, record that exception in the
access map and use the narrowest role the provider offers.

Keep preview database writes off production. Isolate storage writes, webhooks,
and other harmful effects as needed. Record each configuration difference, its
reason, and what the preview cannot verify. This does not permit sharing OAuth
applications or credentials across clients; see [sign-in](sign-in.md).

After rotation, update every receiving environment, refresh affected processes,
verify actual access, then revoke old credentials. A presence check alone is
not evidence that a rotated token has the correct permissions.
