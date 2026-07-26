---
name: standardize-project
description: >
  Audit an existing repository against TheFocus.AI standards — mise tooling, required
  tasks, fnox/1Password secrets, pi config, locked skills, agent instructions, git
  hygiene — and produce a diff-style migration plan before changing anything.
  Use when asked to bring a project up to standard, audit a repo, check compliance,
  or migrate a project onto mise/fnox.
  Triggers on: "standardize", "audit this project", "bring up to standard",
  "compliance check", "does this follow our standards", "migrate to fnox",
  "migrate to mise", "clean up this repo's setup".
---

# Audit and Standardize a Project

Inspect first, propose a plan, then change. Never overwrite existing project
configuration blindly — the goal is a repo that meets the standard *and* still works
the way its team expects.

## Target

Resolve the target repository before doing anything. If none was given, ask and stop.
Use explicit paths for every read and edit — it is easy to audit one repo and
accidentally edit another.

## Source of truth

The standards live in `The-Focus-AI/standards`. Read these before recommending anything:
`AGENTS.md`, `best-practices/AGENTS.md`, `best-practices/skills.md`,
`best-practices/security.md`, `best-practices/deployment.md`, and whichever deployment
guide applies — `vercel-deployment.md`, `gcp-deployment.md`, or `gce-gaia-runtime.md`.
Also `best-practices/clerk.md`, `best-practices/pi-extensions.md`,
`reports/fnox-secrets.md`, and the default-project template for missing-file examples
only.

If the standards conflict with the target project's own instructions, name the conflict
and ask — do not silently pick a side.

## Audit order

1. **Agent instructions** — `AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, equivalents.
2. **Tooling** — `mise.toml`, `.tool-versions`, package manager files, lockfiles, scripts.
3. **Secrets** — `.env`, `.env.*`, `fnox.toml`, `.fnox/`, CI secret references, README setup steps.
4. **pi setup** — `.pi/settings.json`, packages, local session/cache ignores.
5. **Skills** — `skills-lock.json`, `.agents/skills/`, `.pi/skills/`.
6. **Workflow** — README, docs, GitHub remote, tracker usage, spec/ticket docs, wayfinder maps.
7. **Git hygiene** — `.gitignore`, committed generated files, committed-secret risk.

## Required output before any change

1. **Current state** — what exists, what is missing.
2. **Compliance gaps** — each mapped to the standards file that requires it.
3. **Proposed diff** — exact files to create or edit, with the intended change.
4. **Secrets migration plan** — discovered key *names* only, never values, plus which
   1Password vault and service account to use.
5. **Commands to run** from the target project.
6. **Questions and approvals needed** — especially before touching secrets or deploys.

Do not apply changes until the user approves, unless they asked for immediate execution.

## Applying the migration

### mise

Add tools with `mise use`, never by hand-editing:

```bash
mise use node@22 npm:pnpm fnox gh ripgrep fd
mise use npm:@earendil-works/pi-coding-agent
mise use npm:markdownlint-cli2
```

Merge tasks **additively** and preserve project-specific ones. Required where
applicable: `install`, `setup`, `dev`, `lint`, `test`, `deploy`, `secrets:check`,
`secrets:list`. Add `[env]` with `_.file = ".fnox/env"` if missing.

### fnox and 1Password

Follow `reports/fnox-secrets.md`. Target end state:

- A dedicated 1Password vault per project.
- A scoped service account with access to that vault only.
- `.fnox/env` holding `OP_SERVICE_ACCOUNT_TOKEN` and nothing else beyond bootstrap values.
- `fnox.toml` mapping environment variables to 1Password items.
- Plaintext env files quarantined under `.fnox/migrated-env/` or replaced with
  `.env.example`, after confirmation.
- `.fnox/`, `.env`, `.env.*` gitignored — except `.env.example`.

**Never print, commit, or paste a secret value.** Key names only, in the plan and in
conversation.

### Skills

Install missing skills with `skills add` (mise-pinned); never copy skill directories by
hand. Prefer `--skill <folder>` over adding a whole upstream repo. The canonical set is
`best-practices/skills.md` and the locked `skills-lock.json`.

Remove deprecated `to-prd` and `to-issues` entries when migrating. Replace title-case
lock keys with kebab-case. Ensure the planning workflow skills are present and referenced
in the project's agent instructions.

### pi

Merge `.pi/settings.json` — project-local sessions plus the required packages. Do not
delete project-specific pi config.

### Agent instructions

Update or create the target's `AGENTS.md` additively. It should tell a future agent where
to read project context, that tooling goes through mise, that secrets go through fnox and
1Password, how the planning workflow runs, how issues are tracked, and which commands
prove the project is healthy.

## Verification

From the target project, run what is available:

```bash
mise trust && mise install && mise tasks
mise run install && mise run lint && mise run test
fnox check
```

If a command cannot run, say why and what remains. An audit that ends with unverified
claims is half an audit.

## Pitfalls

- **Inspect before proposing.** A plan written from assumptions about the repo wastes
  the review it asks for.
- **Additive, not replacing.** Project-specific tasks and pi settings are there for a
  reason.
- **Secrets are the dangerous part.** Get explicit approval before moving them, and
  verify the project still starts afterward.
- **A gap you cannot fix is still a finding.** Report it rather than quietly dropping it.
