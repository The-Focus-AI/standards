---
name: setup-project
description: >
  Scaffold a new TheFocus.AI project from scratch — mise-managed tooling, pi config and
  extensions, required mise tasks, fnox + 1Password secrets, locked agent skills,
  AGENTS.md, and gitignore — adapting a reviewed baseline to a project brief. Scaffolding and
  configuration only, never application code.
  Use when starting a new project, bootstrapping a repo, or setting up tooling from zero.
  Triggers on: "new project", "start a project", "scaffold", "bootstrap", "set up a repo",
  "get this project started", "standard setup".
---

# Set Up a New Project

Adapt the reviewed baseline to a project's actual requirements. Scaffolding,
configuration, and tooling only — **do not write application source code** or
invent application tests to make an empty project look finished.

## Read the handbook

In `The-Focus-AI/standards`, read `handbook/project-setup.md`,
`handbook/development.md`, `handbook/secrets.md`, and `handbook/skills.md`.
Follow linked recipes when needed. Check each page's status and project adoption;
invoking this skill does not ratify Draft guidance for the organization.
If working elsewhere, fetch the handbook separately without changing another
working tree. If unavailable, report the limitation instead of inventing guidance.

There is a bootstrap script for the mechanical parts:
`./scripts/setup-default-project.sh ../my-project`.

## Setup order (follow exactly, in this sequence)

### 0. Read the brief and baseline, then adapt

Reuse the user's project brief and existing repository instructions/manifests.
Read the standards repository's `default-project` directory under `templates`
before generating configuration. It is the maintained baseline, not an answer to every project.
Identify the product, stack, package manager, client/auth boundaries, secrets
needed, cloud workspace, deployment target or non-deploying intent, real checks,
and owner approvals. Ask only for missing decisions that materially affect setup.
Never ask for passwords, secret values, or personal login sessions.

For a self-contained handoff to an existing agent session, run in the standards repo:

```sh
scripts/setup-default-project.sh ../my-project --brief /path/to/brief.md --emit-prompt
```

This prints the brief, this skill, all baseline files, and the canonical restore
helper; it installs nothing, creates no target files, and invokes no agent or SDK.
Keep secret values out of the brief. Follow the handoff in the current session;
do not treat it as permission to spawn another agent or deploy anything.

Copy with `--no-install` when useful, then adapt the result rather than overwriting
existing work. `lint` and `test` fail closed until real project checks exist;
`deploy` fails until the release path or an explicit non-deploying reason is
recorded. No application yet means an honest verification gap, not a fake test.

### 1. Create directory and git

Start inside an Amp orb, Cursor cloud environment, or equivalent reproducible
workspace. Create the project directory and initialize Git there; do not make
the scaffold depend on laptop services. Record genuine local-only exceptions.

### 2. Install tools via mise (never edit mise.toml by hand)

- Select the reviewed Node version from the baseline, unless the project requires another runtime.
- Declare pnpm and `npm:markdownlint-cli2` at the pinned versions in the template
  with `mise use --pin`, not a floating linter or an ad-hoc `npx` download.
- `mise use fnox`
- Declare `op` and `npm:skills` through `mise use`, using the versions in the
  maintained default-project template. Use its canonical restore helper rather
  than assuming the upstream skills CLI enforces locked content (`handbook/skills.md`).
- `mise use "npm:@earendil-works/pi-coding-agent"`
- Add any other runtimes the project needs now (ripgrep, fd, gh).

### 3. Configure pi

Write `.pi/settings.json` with `npmCommand: ["mise", "exec", "node", "--", "npm"]` and
`sessionDir: ".pi/sessions"`.

### 4. Install pi extensions

Always `-l` for project-local. The required set is in `handbook/development.md`.

### 5. Write mise.toml tasks

Adapt `mise.toml` from the standards repository's default-project template
(`handbook/project-setup.md`), rather than maintaining a second setup recipe.
Keep `install`, `dev`, `lint`, `test`, `deploy`, `setup`,
`secrets:check`, and `secrets:list`. `setup` checks the injected bootstrap token;
it does not retrieve a person's login or write a token file. `.fnox/env` loading
is only a local-development fallback, not a cloud prerequisite.

Keep lint/test offline and credential-free where feasible; do not hide `fnox check`
inside lint. Preserve failing exit codes. Use POSIX `set -eu` for inline tasks;
tasks needing Bash features such as `pipefail` declare a Bash shebang. A build-only
task is not a deployment. Keep an existing pnpm lock frozen; never retry a failed
frozen install without the lock. For a genuinely new manifest, create and review
the lock once before committing it.

### 6. Trust mise config

`mise trust` — skip this and the project is unusable for the next person.

### 7. Initialize the package manager

For a JavaScript/TypeScript project, write the actual `package.json`, run `pnpm install`
once to create the lock, and review any dependencies needing build scripts with
`pnpm approve-builds`. Do not create a Node application manifest for a non-Node
project just to satisfy the baseline; adapt tasks to its real tooling instead.

### 8. Configure secrets (fnox + 1Password)

When secrets are needed, write `fnox.toml` declaring the provider and secrets against a
dedicated project vault (`<Client> - <Project>` or `<Client>`) in TheFocus.AI's company
1Password Business account (`thefocusai.1password.com`). Never use a personal 1Password
account (`my.1password.com`) or built-in `Private`, `Personal`, `Employee`, `Shared`, or
`default` vaults. Declare the API keys the project will need. **Never write actual secret
values** — only the mappings to 1Password items.

A person retrieves the scoped bootstrap token through their seat in `thefocusai.1password.com`
(always passing `--account thefocusai.1password.com` on interactive `op` commands) and
supplies it through the project's cloud secret settings. Run `mise run setup` for
bootstrap verification, then `mise run secrets:check` for access. Do not print the token
or persist it into a reusable image. Before any secret-file write, perform the
ignore/tracked-file preflight in the template's `AGENTS.md`.

### 9. Install skills

Copy the locked `skills-lock.json` from the standards repo's default-project template
and `scripts/restore-skills.mjs` from the standards repo's `scripts/` directory (the
bootstrap script does both). Then `mise run install` runs
`node scripts/restore-skills.mjs`; `mise install` only installs tools. For additions
or updates, follow `handbook/skills.md`: select a reviewed published full commit SHA, install
only named skills with `skills add` from that immutable tree URL, and verify the
result before committing the lock. Moving branch refs are rejected by the helper.
Do not run `skills add mattpocock/skills -y` or `skills add cursor/plugins -y` bare —
both pull extras outside the standard set (`handbook/skills.md`). The locked set includes
Focus-owned skills, Matt Pocock's planning workflow, firecrawl, and canonical
pstack skills. For `tdd`/`teach` collisions, retain the lock's chosen source and
follow `handbook/skills.md`'s explicit alternative-selection procedure.

### 10. Testing record and CI (`handbook/release.md`)

Copy from the standards default-project template (or write them by hand):

- `docs/testing.md` — five required headings (`## Checks`, `## Preview verification`,
  `## Benchmarks and thresholds`, `## Sign-off gates`, `## Alerting`). Mark genuinely
  inapplicable sections `N/A`; missing applicable configuration is an open gap.
  In particular, default-branch CI without failure routing is not `N/A` alerting.
- `.github/workflows/ci.yml` — on `pull_request` and `push` to `main`, run
  `mise run install`, `mise run lint`, and `mise run test`.

When the project later adds a web preview or data/model evals, fill those sections
and add `preview.yml` / eval workflows per
`recipes/ci.md`.
Do not claim branch protections are configured merely because a workflow exists.
Keep maturity unassessed until an owner approves its value, date, and rationale.
Use production-like previews with documented differences and protected data;
OAuth applications are per client, and no separate staging environment is required.

### 11. Write AGENTS.md

Adapt `AGENTS.md` from the standards repository's default-project template. Keep cloud-first development,
the secret-file preflight, mise-managed tooling, required tasks, fnox, the skill
set, and TypeScript + pnpm. Add the project's stack and cloud bootstrap path.

### 12. Write .gitignore

Use `.gitignore` from the standards repository's default-project template, merging into an existing file rather
than replacing its rules. Confirm secret paths are ignored and untracked and
placeholder-only `.env.example` files remain trackable.

### 13. Write project configs

Write only configs the selected stack needs: for example, strict `tsconfig.json`
with the chosen runtime's target and module resolution, then framework-specific
config (electron-vite, next.config). Do not apply bundler settings to a plain Node CLI.

### 14. Verify

- [ ] `mise ls --current` shows all tools
- [ ] `mise tasks` shows install/dev/lint/test/deploy
- [ ] `.pi/settings.json` lists the extensions selected from `handbook/development.md` in `packages`
- [ ] `.agents/skills/` has the locked skills
- [ ] `AGENTS.md` exists and is adapted for this project
- [ ] `fnox.toml` declares provider and secrets when needed, with no values
- [ ] `.gitignore` covers generated and secret paths
- [ ] The selected package manager shows the intended dependencies installed
- [ ] Actual lint/test commands were run; missing app checks remain explicit gaps
- [ ] Cloud platforms are listed as supported only after their bootstrap is verified
- [ ] Testing/release records distinguish configured checks from external approval gaps

Run the checklist and report exact commands/results. A successful file copy or
dependency install is not a passing application test suite or a verified deployment.

## What NOT to do

- **No application source code** — no main process, renderer, components, or routes.
- **No global installs** — not `npm install -g`, `pip install`, `brew install`, or
  `npx -y ... init`.
- **Never hand-edit mise.toml to add a tool** — always `mise use`, so the pin is real.
- **Never hardcode a secret.** Declare it in `fnox.toml`; the value lives in 1Password.
- **Never skip `mise trust`.**
