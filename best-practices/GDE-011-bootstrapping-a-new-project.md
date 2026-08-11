---
number: "011"
title: "Bootstrapping a new project"
kind: guide
issued: "2026-07-29"
author: W. Schenk
status: Current
verified: "2026-07-29"
---

> The rules this satisfies are `STD-004` (tooling and tasks), `STD-005` (agent
> environment), `STD-007` (secrets) and `STD-011` (skills). This is the
> walkthrough: what to type, in what order, and how to tell it worked.

# Bootstrapping a new project

From an empty directory to a repository that runs `mise dev`, with the tooling,
secrets and agent environment the standards require.

## The short version

```sh
mkdir my-project && cd my-project && git init
skills add The-Focus-AI/standards --skill setup-project --agent claude-code -y
```

Then tell your agent: **"set up this project"**. It loads `setup-project`
(`SKL-010`), which walks the sequence below and stops when `mise dev` runs.

## Where the skills come from

Not from the website. `standards.thefocus.ai` is the human-readable rendering of
the corpus; the machine-readable source is the GitHub repository, and the
`skills` CLI pulls from there:

```sh
skills add The-Focus-AI/standards --skill <name> --agent claude-code -y
```

The repository is public, so this needs no authentication. The install writes the
skill into `.agents/skills/` and records a `computedHash` in `skills-lock.json`,
which is what makes the next machine's install identical (`STD-011`). Commit that
lock file.

Read the site when you want to know *why* a rule exists. Install from the repo
when you want an agent to *apply* it.

## What you need first

**One thing: `mise`.** Node, pnpm, fnox, pi and the `skills` CLI all arrive
through it — `STD-004 §3.1` exists precisely so that a new machine needs one
install rather than eight.

```sh
curl https://mise.run | sh
```

If `mise` is already there, you are ready. Do not install project tooling
globally; `STD-004` forbids it, and the reason is that a global install makes the
project work on your laptop and nowhere else.

## Two paths

### Path A — let the agent do it

The one to use. `setup-project` reads the standards, asks what the project is,
and makes the choices that depend on the answer — which runtimes, which secrets,
which deployment target.

```sh
skills add The-Focus-AI/standards --skill setup-project --agent claude-code -y
```

Then ask your agent to set up the project. It will ask you for:

- **What the project is** — a web app, an agent service, a CLI. This determines
  the deployment guide that applies (`GDE-010` for Vercel, `GDE-005` for GCP,
  `GDE-004` for the self-hosted runtime).
- **The 1Password vault name.** One vault per project (`STD-007`). If it does not
  exist yet, create it first — the agent will not create vaults for you, and it
  will never write a secret value into a file.
- **Whether it deploys anywhere yet.** "Not yet" is a fine answer and skips
  `STD-008` entirely.

It will not write application source code. Scaffolding only — that boundary is
deliberate, and it is what makes the output reviewable.

### Path B — the mechanical parts only

When you want the standard files and nothing else, and you will do the rest
yourself:

```sh
git clone https://github.com/The-Focus-AI/standards
./standards/scripts/setup-default-project.sh ../my-project
```

That copies `mise.toml`, `.pi/settings.json`, `skills-lock.json` and `AGENTS.md`
from `templates/default-project/`, then runs `mise trust`, `mise install`,
`mise run setup` and `mise run install`. Existing files are left alone unless you
pass `--force`; pass `--no-install` to copy and stop.

This gets you a conforming skeleton. It does not configure secrets, choose a
deployment target, or write `fnox.toml` — those need the answers only you have.

## The sequence, if you are doing it by hand

The order matters; each step depends on the one before.

1. **Directory and git.** `mkdir`, `cd`, `git init`.
2. **Tools through mise.** `mise use node@22`, `mise use npm:pnpm`,
   `mise use fnox`, `mise use "npm:@earendil-works/pi-coding-agent"`. Never edit
   `mise.toml` by hand to add a tool — `mise use` writes it correctly.
3. **pi configuration.** `.pi/settings.json` with `npmCommand` routed through
   mise and `sessionDir` kept project-local.
4. **pi extensions.** Always `-l` for project-local. The set is `GDE-007`.
5. **Tasks.** `install`, `dev`, `lint`, `test` are required by `STD-004 §3.3`,
   plus `deploy`, `setup`, `secrets:check`, `secrets:list`. Add
   `[env]` with `_.file = ".fnox/env"`.
6. **`mise trust`.** Skip it and the project is unusable for the next person.
7. **Package manager.** `package.json`, `pnpm install`, then
   `pnpm approve-builds` for anything with build scripts.
8. **Secrets.** `fnox.toml` declaring the provider and the secret *mappings*
   against a 1Password vault named for the project. Never a value — `STD-007`.
9. **Skills.** Copy the locked `skills-lock.json` from the template, then
   `mise install`.
10. **`AGENTS.md`.** What this project is, which standards apply, which
    deployment guide, and anything that deviates. `STD-005` requires it.

## How you know it worked

Not "the files exist" — the tasks run:

```sh
mise install     # tools and skills resolve from the lock
mise dev         # the thing actually starts
mise lint        # and can fail (STD-004 §3.6)
mise test        # and can fail
mise run secrets:check
```

`lint` and `test` that always pass are worse than absent, because they read as
coverage. If there is nothing to lint yet, say so in `AGENTS.md` rather than
wiring a task that exits zero regardless.

Then commit `mise.toml`, `skills-lock.json`, `fnox.toml`, `.pi/settings.json` and
`AGENTS.md` together. `.fnox/env` is never committed — it holds a resolved token.

## Deliberately not done

- **No application code.** Bootstrapping produces an environment, not a product.
- **No deployment.** `STD-008` applies when you first deploy, not before. Leave
  `deploy` saying there is nothing to deploy until there is.
- **No vault creation.** The agent maps secrets; a person creates the vault and
  scopes the service account.
- **No ratification.** Most standards are `Draft` and bind nothing (`STD-001
  §3.14`). Bootstrapping follows them because they are current understanding, not
  because they are enforced.

## When something is missing

If the standards do not cover something the project needs, that is a gap in the
corpus and worth recording — see the gap register in `reports/`. Do not invent a
rule locally and let it drift; either raise it or write it down as a project
exception in `AGENTS.md`, dated and reasoned.
