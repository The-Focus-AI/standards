---
title: "Local development environment"
kind: guide
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-07-25"
---

> Replaces `deployment.md`, which was named for deployment but contained none.
> Deployment rules are `STD-008`; tooling rules are `STD-004`; agent environment
> bootstrap is `STD-005`. What remains here is the walkthrough for setting up a
> working machine.

# Local development environment

Shell activation, remote servers, pi, and tmux. Everything in this guide is
explanation — the binding rules live in the standards named above.

## Shell activation

`mise` activation is what makes entering a project directory configure the
shell, and fnox is what puts secrets into it. `STD-004 §3.7` requires this;
here is how it is set up.

```bash
# bash — ~/.bashrc
eval "$(mise activate bash)"
```

```zsh
# zsh — ~/.zshrc
eval "$(mise activate zsh)"
```

Both shells need it. A machine where only one is configured produces the
long-running confusion where a task works in one terminal and not another.

`.fnox/env` holds the bootstrap token and is gitignored — see `STD-007 §3.3`.

## Remote servers

Remote boxes get the same setup as a laptop: mise installed for the user, the
activation line in the shell rc, and the project cloned with `mise trust` run
once. Do not install project tooling with the system package manager; `STD-004
§3.2` applies on servers exactly as it does locally.

## pi

pi is installed per project through mise rather than globally, and its packages
are pinned in `.pi/settings.json`. The current package list is in
`pi-extensions.md`.

```sh
mise use npm:@earendil-works/pi-coding-agent
pi install -l
```

Project-local configuration lives in `.pi/settings.json`, with sessions written
to `.pi/sessions` so they stay inside the working tree and out of the home
directory.

## tmux

Long agent runs outlive terminal windows. tmux is the difference between an
interrupted session and a resumable one, particularly on remote hosts.

```sh
set -g mouse on
set -g extended-keys on
set -g extended-keys-format csi-u
```

The `pi-tmux` package integrates pi with a tmux session; it is in the standard
pi package set.

## See also

- `STD-004` — repository tooling and the four required tasks
- `STD-005` — agent environment bootstrap
- `STD-007` — secrets and credentials
- `STD-008` — deployment
- `reports/fnox-secrets.md` — the full fnox and 1Password playbook
