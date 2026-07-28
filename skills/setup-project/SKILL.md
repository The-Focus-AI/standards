---
name: setup-project
description: >
  Scaffold a new TheFocus.AI project from scratch — mise-managed tooling, pi config and
  extensions, required mise tasks, fnox + 1Password secrets, locked agent skills,
  AGENTS.md, and gitignore — so it runs with `mise dev` immediately. Scaffolding and
  configuration only, never application code.
  Use when starting a new project, bootstrapping a repo, or setting up tooling from zero.
  Triggers on: "new project", "start a project", "scaffold", "bootstrap", "set up a repo",
  "get this project started", "standard setup".
---

# Set Up a New Project

Take an empty directory to a project that runs with `mise dev`. Scaffolding,
configuration, and tooling only — **do not write application source code**.

## Where the standards live

The normative rules are in the standards repository, `The-Focus-AI/standards`:
`STD-004` (tooling and tasks), `STD-007` (secrets), and `STD-011` (skills). The
walkthroughs are `best-practices/GDE-006-local-environment.md` (mise + fnox + pi),
`best-practices/GDE-003-fnox-secrets.md` (the full secrets reference),
`best-practices/GDE-008-skills.md` (the locked skill set), and
`best-practices/GDE-007-pi-extensions.md`. If you are running inside that repo, read them directly. If not, and you
have `gh` access, fetch them. If neither, the sequence below is the minimum bar — say
in your summary that you worked without the full standards.

There is a bootstrap script for the mechanical parts:
`./scripts/setup-default-project.sh ../my-project`.

## Setup order (follow exactly, in this sequence)

### 1. Create directory and git

`mkdir <project-name>` + `cd <project-name>` + `git init`

### 2. Install tools via mise (never edit mise.toml by hand)

- `mise use node@22`
- `mise use npm:pnpm`
- `mise use fnox`
- `mise use "npm:@earendil-works/pi-coding-agent"`
- Add any other runtimes the project needs now (ripgrep, fd, gh).

### 3. Configure pi

Write `.pi/settings.json` with `npmCommand: ["mise", "exec", "node", "--", "npm"]` and
`sessionDir: ".pi/sessions"`.

### 4. Install pi extensions

Always `-l` for project-local. The required set is in `best-practices/GDE-007-pi-extensions.md`.

### 5. Write mise.toml tasks

Required `[tasks]`: `install` (`pnpm install --frozen-lockfile`), `dev`, `lint`, `test`,
`deploy`, `setup` (pulls the service-account token from 1Password into `.fnox/env`),
`secrets:check` (`fnox check`), `secrets:list` (`fnox list`).

Add `[env]` with `_.file = ".fnox/env"`.

### 6. Trust mise config

`mise trust` — skip this and the project is unusable for the next person.

### 7. Initialize the package manager

Write `package.json`, run `pnpm install`, then `pnpm approve-builds <pkgs>` for anything
needing build scripts (electron, esbuild).

### 8. Configure secrets (fnox + 1Password)

Write `fnox.toml` declaring the provider and secrets, against a 1Password vault named
for the project. Declare the API keys the project will need. **Never write actual secret
values** — only the mappings to 1Password items.

### 9. Install skills

Copy the locked `skills-lock.json` from the standards repo's default-project template, then `mise install`
(which runs `skills experimental_install`). To add one later:
`skills add <owner>/<repo> --skill <folder> -y`. Do not run `skills add mattpocock/skills -y`
bare — it pulls course and writing extras that are not part of the standard set.

### 10. Write AGENTS.md

Adapt from the standards `AGENTS.md`. Keep the mise-only tooling constraint, the required
tasks, fnox for secrets, the skill set, and TypeScript + pnpm. Add the project's stack.

### 11. Write .gitignore

`node_modules/`, `out/`, `dist/`, `dist-installer/`, `.agents`, `agent/skills/`,
`.fnox/`, `*.env`, `*.env.local`, `.pi/sessions/`, `.pi/npm/`, `.pi/git/`, `.pi/skills/`,
`.DS_Store`, `*.log`

### 12. Write project configs

`tsconfig.json` — strict, ES2022, bundler resolution, path aliases. Then any
framework-specific config (electron-vite, next.config).

### 13. Verify

- [ ] `mise ls --current` shows all tools
- [ ] `mise tasks` shows install/dev/lint/test/deploy
- [ ] `.pi/settings.json` lists both extensions in `packages`
- [ ] `.agents/skills/` has the locked skills
- [ ] `AGENTS.md` exists and is adapted for this project
- [ ] `fnox.toml` declares provider and secrets, with no values
- [ ] `.gitignore` covers generated and secret paths
- [ ] `pnpm ls --depth 0` shows the dependencies installed

Run the checklist. A scaffold reported as done without it is usually missing `mise trust`
or the skills install.

## What NOT to do

- **No application source code** — no main process, renderer, components, or routes.
- **No global installs** — not `npm install -g`, `pip install`, `brew install`, or
  `npx -y ... init`.
- **Never hand-edit mise.toml to add a tool** — always `mise use`, so the pin is real.
- **Never hardcode a secret.** Declare it in `fnox.toml`; the value lives in 1Password.
- **Never skip `mise trust`.**
