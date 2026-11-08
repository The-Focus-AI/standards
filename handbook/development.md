---
title: Develop in the cloud
summary: One tool manifest and the same runnable tasks for people, agents, and CI.
status: Draft
---

Use an Amp orb, Cursor cloud environment, or equivalent reproducible workspace.
A person's laptop is for review and personal authentication, not a required
database host or build server. Record genuine hardware or network exceptions
in the project's agent instructions, with the supported verification path.

## Keep tooling in mise

Declare project runtimes and CLIs through `mise use`; pin the versions actually
tested. Do not depend on global npm, pip, or Homebrew installations. Use the
project's package manager and committed dependency lock. A failed frozen install
is an error to diagnose, not permission to retry without the lock.

```sh
mise trust
mise install
mise run install
```

Trust configuration only after reading it. Installation restores dependencies
and [locked skills](skills.md), not credentials or a person's login session.

## Give every repository the same entry points

| Task | Contract |
| --- | --- |
| `install` | Install from the reviewed lock and restore verified skills. Fail on incomplete restoration. |
| `dev` | Start the development workflow using repository-owned configuration. |
| `lint` | Run the actual static checks. Preserve their exit status. |
| `test` | Exercise observable behavior and fail on regression. An empty suite is not success. |
| `deploy` | Use the documented release path and explicit target, or fail with the non-deploying reason. A build is not a deployment. |

For projects that use secrets, keep `setup` for bootstrap-token presence,
`secrets:check` for authorized resolution, and `secrets:list` for declarations.
Keep credential/network checks out of offline lint and tests where feasible.

Inline mise shell tasks use POSIX `set -eu`. A task needing `pipefail` declares
a Bash shebang. Forward user arguments rather than silently dropping them.

## Commit workspace setup

Keep bootstrap, service definitions, required ports, and setup instructions in
the repository. Use the cloud platform's supervised service mechanism so
processes survive workspace lifecycle events. Publish the authenticated portal
or preview URL, not an inaccessible sandbox-local address.

Use the [default project configuration](../templates/default-project/) as the
starting point for agent instructions and CI. For pi, the maintained package
selection is [.pi/settings.json](../.pi/settings.json); do not copy a second
extension inventory into a guide. Keep sessions under ignored `.pi/sessions/`.

Check that a fresh workspace can install and run without your shell history,
personal authentication directory, or a token baked into its snapshot.
