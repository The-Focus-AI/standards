# Prompt: Audit and Standardize Another Project

You are running from inside TheFocus.AI standards repository. Your job is to audit another existing repository against these standards and produce a concrete migration plan. Do **not** overwrite existing project configuration blindly. Inspect first, propose a diff-style plan, then ask before applying changes that may affect workflows or secrets.

## Target project

The user should provide a target project path, for example:

```text
Target project: ../qbsync
```

If no target project is provided, ask for one and stop. Resolve the target path relative to the standards repository working directory. Use explicit paths when reading or editing files in the target project.

## Source of truth

The standards repository is the current working directory. Read these files before making recommendations:

- `AGENTS.md` — how agents should navigate and apply standards
- `best-practices/AGENTS.md` — baseline project setup rules
- `best-practices/skills.md` — required agent skills; install with `skills add`
- `best-practices/security.md` — fnox and 1Password policy
- `best-practices/local-environment.md` — mise/fnox/pi setup (rules: `STD-004`, `STD-005`)
- `best-practices/vercel-deployment.md` — Vercel Git previews, fnox sync, Neon/Blob/Clerk
- `best-practices/gcp-deployment.md` — Cloud Run / App Engine, gcloud configs via mise
- `best-practices/gce-gaia-runtime.md` — GCE Gaia/habitats runtime (if applicable)
- `best-practices/clerk.md` — Clerk prod vs dev instances
- `best-practices/pi-extensions.md` — required pi extensions
- `reports/fnox-secrets.md` — detailed fnox + 1Password migration reference
- `templates/default-project/` — examples for missing files only; do not copy over existing files without review

If these standards conflict with target-project instructions, identify the conflict and ask how to resolve it.

## Audit order in the target project

Inspect:

1. Agent instructions: `AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, or equivalents.
2. Tooling: `mise.toml`, `.tool-versions`, package manager files, lockfiles, and scripts.
3. Secrets: `.env`, `.env.*`, `fnox.toml`, `.fnox/`, CI secret references, README setup instructions.
4. pi setup: `.pi/settings.json`, pi packages, local session/cache ignores.
5. Skills: `skills-lock.json`, `.agents/skills/`, `.pi/skills/`.
6. Project workflow: README, docs, GitHub remote, issue tracker usage, spec/ticket docs, and wayfinder maps.
7. Git hygiene: `.gitignore`, committed generated files, committed secret risk.

## Required output before changes

Produce a plan with these sections:

1. **Current state** — what exists and what is missing.
2. **Compliance gaps** — map each gap to the standards file that requires it.
3. **Proposed diff** — list exact target-project files to create or edit, with summary of intended changes.
4. **Secrets migration plan** — list discovered secret keys only, never values. Explain which 1Password vault and service account should be used.
5. **Commands to run from the target project** — include `mise use ...`, `mise trust`, `mise install`, `skills add ...`, `fnox check`, etc.
6. **Questions / approvals needed** — especially before moving secrets or changing deployment behavior.

Do not apply changes until the user approves the plan, unless the user explicitly asked to execute immediately.

## How to update existing projects after approval

### mise

Use `mise use`, not hand-written replacement, to add missing tools. Run these from the target project as needed:

```bash
mise use node@22
mise use npm:pnpm
mise use fnox
mise use gh
mise use ripgrep
mise use fd
mise use npm:@earendil-works/pi-coding-agent
mise use npm:markdownlint-cli2
```

Then inspect the resulting `mise.toml`. Merge required tasks additively; preserve project-specific tasks.

Required tasks, when applicable:

- `install`
- `setup`
- `dev`
- `lint`
- `test`
- `deploy`
- `secrets:check`
- `secrets:list`

Add this environment loading if missing:

```toml
[env]
_.file = ".fnox/env"
```

### fnox and 1Password

Follow `reports/fnox-secrets.md`.

Expected end state:

- Dedicated 1Password vault per project.
- Scoped 1Password service account with access only to that vault.
- `.fnox/env` contains `OP_SERVICE_ACCOUNT_TOKEN` only or other bootstrap-only values.
- `fnox.toml` maps environment variables to 1Password item names.
- Plaintext env files are removed from active use after confirmation and quarantined under `.fnox/migrated-env/` or replaced with `.env.example`.
- `.fnox/`, `.env`, and `.env.*` are gitignored, except `.env.example`.

Never print, commit, or copy secret values into the conversation beyond key names.

### Skills

Read `best-practices/skills.md`. Install missing skills using `skills add` (mise-pinned); do not manually copy skill directories. Prefer `--skill <folder>` over `skills add mattpocock/skills -y` so course/writing extras are not pulled in.

The canonical lock in this standards repo (and `templates/default-project/skills-lock.json`) is the source of truth: Focus always-installed skills (nano-banana, firecrawl, find-skills, research-methodology, browser-automation, design) plus the 22 Matt Pocock skills listed in `best-practices/skills.md`.

Planning workflow skills that must be available and referenced in project instructions include at least:

- `setup-matt-pocock-skills`, `ask-matt`
- `grill-me`, `grilling`, `grill-with-docs`
- `wayfinder`, `research`, `to-spec`, `to-tickets`, `triage`
- `prototype`, `implement`, `code-review`, `tdd`
- `domain-modeling`, `codebase-design`, `improve-codebase-architecture`
- `diagnosing-bugs`, `resolving-merge-conflicts`, `handoff`, `teach`, `writing-great-skills`

Remove deprecated `to-prd` and `to-issues` installs and lock entries when migrating existing projects. Drop title-case lock keys in favor of kebab-case names. Use GitHub Issues via `gh` when the repo has a GitHub remote and auth is available. Otherwise record the fallback in the project's `AGENTS.md`. The issue states, label vocabulary, claiming rules, and Wayfinder operations come from `STD-002` and are not copied into the project.

### pi

Ensure `.pi/settings.json` includes project-local sessions and required packages from `best-practices/pi-extensions.md`. Merge settings; do not delete project-specific pi config.

### Agent instructions

Update or create target-project `AGENTS.md` additively. It should tell future agents:

- where to read project context
- that tooling goes through mise
- that secrets go through fnox + 1Password
- how to use the planning workflow (`ask-matt` / `grill-*` → `to-spec` → `to-tickets` → `implement` → `code-review`, with `wayfinder` for large or foggy work and `triage` for inbound issues)
- how issues are tracked (GitHub Issues or documented fallback)
- what commands prove the project is healthy

## Verification

After approved changes, run what is available from the target project:

```bash
mise trust
mise install
mise tasks
mise run install
mise run lint
mise run test
fnox check
```

If a command cannot run, explain why and what remains to be done.
