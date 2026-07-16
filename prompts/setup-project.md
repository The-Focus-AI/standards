# Prompt: Set Up a New Project

Read every file in this repo, then set up a new project directory from scratch
following all best practices. Do not write any application code — only
scaffolding, configuration, and tooling. The project must be immediately
runnable with `mise dev` after setup.

## What to read first

- `AGENTS.md` — mandatory tools, constraints, task structure
- `best-practices/deployment.md` — mise + fnox activation, pi config
- `best-practices/security.md` — fnox + 1Password secrets setup
- `best-practices/skills.md` — required skills to install
- `best-practices/pi-extensions.md` — required pi extensions
- `best-practices/organization.md` — project structure conventions
- `reports/fnox-secrets.md` — full secrets reference

## Setup order (follow exactly, in this sequence)

### 1. Create directory and git

- `mkdir <project-name>` + `cd <project-name>` + `git init`

### 2. Install tools via mise (never edit mise.toml by hand)

- `mise use node@22`
- `mise use npm:pnpm`
- `mise use fnox`
- `mise use "npm:@earendil-works/pi-coding-agent"`
- If the project needs other runtimes (ripgrep, fd, etc.), add them now.

### 3. Configure pi

- Write `.pi/settings.json` with:
  - `npmCommand`: `["mise", "exec", "node", "--", "npm"]`
  - `sessionDir`: `".pi/sessions"`

### 4. Install pi extensions (always use -l for project-local)

These are defined in @best-practices/pi-extensions.md

### 5. Write mise.toml tasks

- Add `[tasks]` section with these required tasks:
  - `install` — runs `pnpm install --frozen-lockfile`
  - `dev` — starts the project in development mode
  - `lint` — runs the project linter (biome, oxlint, eslint, etc.)
  - `test` — runs type-check / tests
  - `deploy` — builds for distribution
  - `setup` — one-time onboarding: pulls SA token from 1Password into `.fnox/env`
  - `secrets:check` — `fnox check`
  - `secrets:list` — `fnox list`
- Add `[env]` section with `_.file = ".fnox/env"`

### 6. Trust mise config

- `mise trust`

### 7. Initialize package manager

- Write `package.json` with project dependencies
- `pnpm install`
- `pnpm approve-builds electron esbuild` (or whatever needs build scripts)

### 8. Configure secrets (fnox + 1Password)

- Write `fnox.toml` declaring the provider and secrets
- Use 1Password vault named after the project
- Declare API keys the project will need (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
- Never write actual secret values — only the mappings to 1Password items

### 9. Install skills

Skills are defined in `best-practices/skills.md` and locked in
`skills-lock.json` / `templates/default-project/skills-lock.json`. Prefer
copying the template lockfile, then `mise install` (runs
`skills experimental_install`). To add one skill later: `skills add
<owner>/<repo> --skill <folder> -y` — do not `skills add mattpocock/skills -y`
(pulls course/writing extras). See `reports/` for CLI details.

### 10. Write AGENTS.md

- Copy and adapt from the standards `AGENTS.md`
- Keep: mise-only tooling constraint, required tasks, fnox for secrets, skills, TypeScript + pnpm
- Add: project-specific tech stack notes

### 11. Write .gitignore

- `node_modules/`, `out/`, `dist/`, `dist-installer/`, `.agents`,
  `agent/skills/`, `.fnox/`, `*.env`, `*.env.local`, `.pi/sessions/`,
  `.pi/npm/`, `.pi/git/`, `.pi/skills/`, `.DS_Store`, `*.log`

### 12. Write project configs

- `tsconfig.json` — strict, ES2022, bundler resolution, paths alias
- Framework-specific configs (electron-vite, next.config, etc.)

### 13. Verification checklist

- [ ] `mise ls --current` shows all tools
- [ ] `mise tasks` shows install/dev/lint/test/deploy
- [ ] `.pi/settings.json` has both extensions in packages array
- [ ] `.agents/skills/` has all required skills
- [ ] `AGENTS.md` exists and is adapted for the project
- [ ] `fnox.toml` declares provider and secrets (no actual values)
- [ ] `.gitignore` covers all generated/secret paths
- [ ] `pnpm ls --depth 0` shows all deps installed

## What NOT to do

- Do NOT write application source code (main process, renderer, components, routes, etc.)
- Do NOT use `npm install -g`, `pip install`, `brew install`, or `npx -y ... init`
- Do NOT edit mise.toml by hand — always use `mise use`
- Do NOT hardcode secrets — always declare them in fnox.toml, values live in 1Password
- Do NOT skip `mise trust` or the project won't be usable
