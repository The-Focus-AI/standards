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

From a project brief and reviewed baseline to project-specific tooling, secrets
declarations, and a cloud agent environment. An empty scaffold is not a working
application or evidence of passing application tests.

## The short version

Start in an Amp orb, Cursor cloud environment, or equivalent workspace with mise
available (`STD-005`). From an empty workspace, declare the tools before invoking them:

```sh
mkdir my-project && cd my-project && git init
mise use node@22 npm:skills@1.7.4
: "${STANDARDS_REF:?Set STANDARDS_REF to the reviewed published 40-character commit SHA}"
skills add "https://github.com/The-Focus-AI/standards/tree/$STANDARDS_REF" --skill setup-project -y
```

Choose and review that immutable revision using the update procedure in `GDE-008`;
the restore helper rejects moving branch refs. Do not point at unpublished edits.

Then give your agent the project brief and ask it to **set up this project**.
It loads `setup-project` (`SKL-010`), adapts the baseline, runs the actual checks,
and reports any remaining gaps instead of inventing application behavior.

## Where the skills come from

Not from the website. `standards.thefocus.ai` is the human-readable rendering of
the corpus; the machine-readable source is the GitHub repository, and the
`skills` CLI pulls from there:

```sh
skills add "https://github.com/The-Focus-AI/standards/tree/$STANDARDS_REF" --skill setup-project -y
```

The repository is public, so this needs no authentication. The install writes the
skill into `.agents/skills/` and records a `computedHash` in `skills-lock.json`,
but the current CLI does not enforce a hash-identical restore (`STD-011`,
`GDE-008`). The maintained `install` task uses `node scripts/restore-skills.mjs`
rather than delegating verification to the bare upstream restore command.
Commit the reviewed lock and preserve that helper when adapting the template;
`GDE-008` describes its restore and update behavior.

Read the site when you want to know *why* a rule exists. Install from the repo
when you want an agent to *apply* it.

## What you need first

**A cloud workspace with `mise`.** Node, pnpm, fnox, op, pi and the `skills` CLI all arrive
through it — `STD-004 §3.1` exists precisely so that a new machine needs one
install rather than eight.

```sh
curl https://mise.run | sh
```

If `mise` is already there, declare Node and the skills CLI as above before
calling `skills`. Do not install project tooling
globally; `STD-004` forbids it, and the reason is that a global install makes the
project work on your laptop and nowhere else.

## Two paths

### Path A — let the agent do it

The one to use. `setup-project` reads the standards, asks what the project is,
and makes the choices that depend on the answer — which runtimes, which secrets,
which deployment target.

The agent reads the checked-in template first, then generates project-specific
configuration from it. The shell script can copy that baseline and run bootstrap
tasks, or emit a complete setup handoff without running anything else. It does
not invoke an LLM or produce a complete application.
One project brief can drive the agent's whole setup pass. Reuse answers already
provided and inspect existing manifests before asking again; keep credentials,
client ownership, maturity approval, and deployment authority explicit.

```sh
mise use node@22 npm:skills@1.7.4
: "${STANDARDS_REF:?Set STANDARDS_REF to the reviewed published 40-character commit SHA}"
skills add "https://github.com/The-Focus-AI/standards/tree/$STANDARDS_REF" --skill setup-project -y
```

Then ask your agent to set up the project. It will ask you for:

- **What the project is** — a web app, an agent service, a CLI. This determines
  the deployment guide that applies (`GDE-010` for Vercel, `GDE-005` for GCP,
  `GDE-004` for the self-hosted runtime).
- **The 1Password vault name.** One vault per project (`STD-007`). If it does not
  exist yet, create it first — the agent will not create vaults for you, and it
  will never write a secret value into a file.
- **Whether it deploys anywhere yet.** "Not yet" is a fine answer and skips
  configuring a release path; record that explicitly rather than treating a
  build as a deployment.
- **What real checks exist.** For a new app, record missing behavior tests as a
  gap; setup does not fabricate tests to make CI green.
- **Who approves maturity and releases.** Leave maturity unassessed until the
  owner approves it, with date and rationale. No deployment authority is inferred.

It will not write application source code. Scaffolding only — that boundary is
deliberate, and it is what makes the output reviewable.

To prepare a self-contained handoff for an existing agent session:

```sh
./standards/scripts/setup-default-project.sh ../my-project \
  --brief /path/to/project-brief.md --emit-prompt > /tmp/project-setup-prompt.md
```

The brief is a Markdown/text description with no secret values. The output includes
the supplied brief, setup skill, baseline files, and canonical restore helper.
This mode creates no target files, installs nothing, and invokes no agent or SDK.
Review the prompt, then give it to the current agent session to carry out setup.

### Path B — the mechanical parts only

When you want the standard files and nothing else, and you will do the rest
yourself:

```sh
git clone https://github.com/The-Focus-AI/standards
./standards/scripts/setup-default-project.sh ../my-project
```

That copies `mise.toml`, `.pi/settings.json`, `skills-lock.json`, `AGENTS.md`,
`.gitignore`, `docs/testing.md`, and `.github/workflows/ci.yml` from
`templates/default-project/`, plus the canonical `scripts/restore-skills.mjs`
from the standards repo. It then runs `mise trust`, `mise install`, and
`mise run install`. Runtime token/access checks (`setup`, `secrets:check`) are
separate, not dependency-install prerequisites. Existing files are left alone
unless you pass `--force`; pass `--no-install` to copy and stop.

This gets you a baseline, not a conforming finished project. Unadapted lint/test
tasks fail until real checks exist; deploy fails until a release path or explicit
non-deploying reason is recorded. It does not configure secrets, choose a
deployment target, or write `fnox.toml` — those depend on the brief.

## The sequence, if you are doing it by hand

The order matters; each step depends on the one before.

1. **Directory and git.** `mkdir`, `cd`, `git init`.
2. **Tools through mise.** `mise use node@22`,
   `mise use fnox`, `mise use "npm:@earendil-works/pi-coding-agent"`. Never edit
   `mise.toml` by hand to add a tool — `mise use` writes it correctly. Include
   pnpm, `npm:markdownlint-cli2`, `op`, and `npm:skills` at the pinned versions in
   `templates/default-project/mise.toml`, using `mise use --pin`.
3. **pi configuration.** `.pi/settings.json` with `npmCommand` routed through
   mise and `sessionDir` kept project-local.
4. **pi extensions.** Always `-l` for project-local. The set is `GDE-007`.
5. **Tasks.** `install`, `dev`, `lint`, `test` are required by `STD-004 §3.3`,
   plus `deploy`, `setup`, `secrets:check`, `secrets:list`. Adapt the maintained
   template; `setup` checks cloud-injected credentials rather than writing a token file.
6. **`mise trust`.** Skip it and the project is unusable for the next person.
7. **Package manager.** For a Node project, `package.json`, an initial `pnpm install`,
   then `pnpm approve-builds` for reviewed dependencies with build scripts.
   Thereafter use `pnpm install --frozen-lockfile`; a failed frozen install is not
   retried unfrozen. For another stack, adapt the package manager and tasks.
8. **Secrets, when needed.** `fnox.toml` declaring the provider and the secret *mappings*
   against a 1Password vault named for the project. Never a value — `STD-007`.
   A person retrieves the scoped bootstrap token using their 1Password account
   and supplies it in the project's cloud secret settings (`GDE-003`).
9. **Skills.** Copy the locked `skills-lock.json` from the template and the canonical
   `scripts/restore-skills.mjs` helper, then `mise run install`.
10. **`AGENTS.md`.** What this project is, which standards apply, which
    deployment guide, and anything that deviates. `STD-005` requires it.

## How you know it worked

Not "the files exist" — the tasks run:

```sh
mise install     # install declared tools
mise run install # install project dependencies and skills
mise run dev     # the adapted development loop, not a claim that an app exists
mise run lint    # real checks, failing on violations (STD-004 §3.6)
mise run test    # real behavior checks, not empty placeholders
# Only when runtime secrets are declared and injected:
mise run setup
mise run secrets:check
```

`lint` and `test` that always pass are worse than absent, because they read as
coverage. Record missing checks in `AGENTS.md` and `docs/testing.md`, leaving
incomplete gates failing rather than inventing tests. Keep credential checks
out of offline lint/test. A copied CI workflow does not configure branch
protection, and default-branch CI without alerting is a gap, not `N/A`.

Then commit `mise.toml`, `skills-lock.json`, `fnox.toml`, `.pi/settings.json` and
`AGENTS.md` together. `.fnox/env` is an optional local exception, never committed;
cloud workspaces receive the bootstrap token without writing that file.

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
