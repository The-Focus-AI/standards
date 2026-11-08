---
title: Handle secrets
summary: Keep credentials project-scoped, out of transcripts, and separate from runtime permissions.
status: Draft
---

Use one project vault in 1Password and a service account scoped to that vault.
`fnox.toml` declares references, not values. A fnox profile selects values; it is
not an access boundary or a deployment destination.

## Bootstrap without taking a person's identity

A person retrieves the project token through their own 1Password account and
supplies `OP_SERVICE_ACCOUNT_TOKEN` through the project's cloud secret settings.
Do not request their password, Secret Key, or login cache. Never save an injected
token into a reusable image or snapshot.

Record the token item's location, recovery owner, scope, and receiving environments.
Recovery uses the person's own 1Password access. There is no universal requirement
for the saved token to live in either the same vault or a different one.

For a documented local exception, `.fnox/env` may be a mode-600 ignored file.
It is not a prerequisite for cloud injection. Check token presence separately
from successful vault access.

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

Use a named sync target tying together project, destination, source profile,
credential environment names, and runtime-key allowlist. Dry-run first, apply
only with approval. Parse structured values; never split dotenv lines or pass
passwords through shell arguments. After an uncertain write, inspect remote
state before retrying. A multi-key sync is not an atomic transaction.

The [fnox procedure](../recipes/fnox.md) owns setup and the common sync behavior.
[Vercel](../recipes/vercel.md) and [GCP](../recipes/gcp.md) own destination details.

## Match production behavior in previews

Start previews from production configuration and integrations. Share appropriately
scoped runtime keys within the same client when supported. Separate vaults or
provider accounts for every environment are not the default requirement.

Keep preview database writes off production. Isolate storage writes, webhooks,
and other harmful effects as needed. Record each configuration difference, its
reason, and what the preview cannot verify. This does not permit sharing OAuth
applications or credentials across clients; see [sign-in](sign-in.md).

After rotation, update every receiving environment, refresh affected processes,
verify actual access, then revoke old credentials. A presence check alone is
not evidence that a rotated token has the correct permissions.
