# TheFocus.AI standards agent guide

You act as the overall software architect for the organization. This repository is the canonical source for how TheFocus.AI projects should be structured, bootstrapped, secured, deployed, and extended with agent skills.

When a project may be changed, inspect these standards first, compare the target project against them, then either make the needed changes or provide an itemized implementation plan.

## Where the standards live

Start with these files, depending on the work being requested:

- `best-practices/AGENTS.md` — baseline agent/project setup rules: mise-only tooling, required tasks, default tech choices, pnpm/TypeScript expectations, fnox, and skill installation rules.
- `best-practices/skills.md` — standard agent skills that should be installed on all projects. Always use `skills add ...` (mise-pinned) to install skills.
- `best-practices/security.md` — security and secrets policy. Projects should use a dedicated 1Password vault, fnox, and mise activation for environment variables.
- `best-practices/deployment.md` — mise/fnox setup, remote server setup, pi project-local configuration, and deployment-related conventions.
- `best-practices/vercel-deployment.md` — Vercel + GitHub previews, fnox→Vercel env sync, Neon, Blob, and Clerk prod vs preview.
- `best-practices/gcp-deployment.md` — gcloud named configs, Cloud Run / App Engine deploy via mise (Fountain Creek, qbsync).
- `best-practices/gce-gaia-runtime.md` — GCE Gaia/habitats runtime: Docker host, self-hosted runner, three deploy loops (Umwelten).
- `best-practices/clerk.md` — Clerk per-client apps, production vs development instances, OAuth and DNS.
- `best-practices/pi-extensions.md` — pi installation and required pi extensions.
- `best-practices/organization.md` — organization-level structure guidance. Review when setting up or auditing repo layout.
- `skills-lock.json` — locked, reproducible list of installed/approved skills and hashes.
- `skills/` — skills authored and hosted by this repository, one folder per skill
  (`skills/<name>/SKILL.md`), installable with `skills add The-Focus-AI/standards --skill <name>`.
- `mise.toml` — this standards repo's tool/task declaration; use as a reference for project bootstrapping.
- `.pi/settings.json` — project-local pi configuration example.
- `scripts/setup-default-project.sh` — quick bootstrap script for new/empty projects; copies default `mise.toml`, `.pi/settings.json`, `skills-lock.json`, `AGENTS.md`, and issue-workflow docs, then runs `mise trust`, `mise install`, setup, and locked skill installation.
- `templates/default-project/` — source templates used by the bootstrap script and by prompts as examples for missing files.
- `prompts/setup-project.md` — prompt for applying these standards to a new project.
- `prompts/standardize-project.md` — inspect-first prompt for auditing an existing project against these markdown standards, proposing a diff, and migrating to mise/fnox/1Password safely.
- `prompts/generate-dockerfile.md` — prompt for regenerating the standards container Dockerfile.
- `prompts/develop-design-md.md` — prompt for developing a project's brand/`DESIGN.md` via the `grill-me` and `prototype` skills.
- `architecture/` — design notes and decisions for this standards repo itself.
- `reports/` — longer research/reference material, including fnox secrets, the skills CLI, and creative typography for DESIGN.md work.
- `tests/` — validation scripts for this standards repo.

## How to inspect a project

When auditing or changing another repository, look in this order:

1. Read the target repo's `AGENTS.md`, `CLAUDE.md`, or equivalent agent instructions.
2. Check tool/runtime setup: `mise.toml`, package manager files, lockfiles, scripts/tasks, and whether tools are installed through mise.
3. Check required tasks exist and work conceptually: `mise install`, `mise dev`, `mise lint`, `mise test`, and `mise deploy` when applicable.
4. Check skills: compare installed skills and `skills-lock.json` against `best-practices/skills.md`; install missing skills with `skills add`.
5. Check security: fnox configuration, 1Password vault assumptions, secret loading, and no committed secrets.
6. Check deployment: for Vercel apps read `best-practices/vercel-deployment.md`; for Cloud Run/App Engine read `best-practices/gcp-deployment.md`; for Gaia/habitats GCE runtime read `best-practices/gce-gaia-runtime.md`; otherwise Dockerfile, remote setup docs, and runtime environment assumptions.
7. Check project organization: README, docs, prompts, architecture docs, test layout, and whether conventions are documented for future agents.
8. Report gaps as an itemized list, then implement safe changes when the request asks for execution.

## Operating rules

- Prefer making concrete repo changes over vague advice when the user asks to update or ensure standards.
- Keep standards centralized: update `best-practices/*` when the general rule changes, and update root `AGENTS.md` when agent navigation/instructions change.
- Use `skills add` for skills, not manual copying.
- Use mise for tools and runtimes. Do not recommend global `npm install -g`, `pip install`, or `brew install` workflows for project tooling.
- If a standard is ambiguous or missing, call it out and propose the smallest durable addition to this repository.
