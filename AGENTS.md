# TheFocus.AI standards agent guide

You act as the overall software architect for the organization. This repository is the canonical source for how TheFocus.AI projects should be structured, bootstrapped, secured, deployed, and extended with agent skills.

When a project may be changed, inspect these standards first, compare the target project against them, then either make the needed changes or provide an itemized implementation plan.

## Where the standards live

The corpus has two halves. **Standards** in `standards/` are numbered, binding,
and written as citable clauses. **Guides** in `best-practices/` are explanation:
walkthroughs, reference implementations, and inventories with no binding
clauses. When a guide turns out to contain rules, the rules move to a standard.

### Standards — binding

| Ref | Covers |
| --- | --- |
| `STD-001` | How a standard is written. Read before authoring or migrating one. |
| `STD-002` | Issue states, the frontier, claiming, and what an agent comments. |
| `STD-003` | Branches, pull requests, the description format, and the merge gates. |
| `STD-004` | Tooling through mise and the four required tasks. |
| `STD-005` | Agent environment bootstrap for Cursor, Copilot, and Claude Code. |
| `STD-006` | Provenance for notes, decision records, and guides. |
| `STD-007` | Secrets, vaults, and credential scoping. |
| `STD-008` | Deployment rules common to every platform. |
| `STD-009` | Authentication and per-client isolation. |
| `STD-010` | Agent services — the seven required patterns. |
| `STD-011` | Agent skills: installation, pinning, and updates. |

`mise run standard:render` renders them and refuses to emit a page for a
document that does not conform, so rendering *is* the conformance check.

### Guides — explanation

- `best-practices/AGENTS.md` — default technology choices, and what is still undecided.
- `best-practices/local-environment.md` — shell activation, remote servers, pi, tmux.
- `best-practices/skills.md` — the standard skill set inventory.
- `best-practices/pi-extensions.md` — the pinned pi package list.
- `best-practices/clerk.md` — per-provider OAuth setup walkthroughs.
- `best-practices/vercel-deployment.md`, `gcp-deployment.md`, `gce-gaia-runtime.md` — platform walkthroughs.
- `best-practices/a2a-agent.md` — the A2A agent reference implementation.

### Everything else

- `DESIGN.md` — the design system for standards.thefocus.ai. Validate edits with `mise run design:validate`.
- `architecture/` — decision records for this repository.
- `reports/` — research notes, including the standards gap register and the `best-practices/` inventory.
- `skills-lock.json`, `mise.toml`, `.pi/settings.json` — the repo's own configuration.
- `scripts/` — the bootstrap script, the design validator, and the standards renderer.
- `templates/default-project/` — source templates used by the bootstrap script.
- `prompts/` — reusable prompts: setup, standardize, generate a Dockerfile, develop a DESIGN.md.
- `tests/` — validation scripts for this repository.

## How to inspect a project

When auditing or changing another repository, look in this order:

1. Read the target repo's `AGENTS.md`, `CLAUDE.md`, or equivalent agent instructions.
2. Check tool/runtime setup: `mise.toml`, package manager files, lockfiles, scripts/tasks, and whether tools are installed through mise.
3. Check the task contract in `STD-004 §3.3`–`§3.6`: install, dev, lint, test, deploy — and that lint and test can actually fail.
4. Check skills against `STD-011` and the inventory in `best-practices/skills.md`.
5. Check secrets against `STD-007`: per-project vault, scoped service account, nothing committed.
6. Check deployment against `STD-008`, then the platform guide for specifics.
7. Check project organization: README, docs, prompts, architecture docs, test layout, and whether conventions are documented for future agents.
8. Report gaps as an itemized list, then implement safe changes when the request asks for execution.

## Operating rules

- Prefer making concrete repo changes over vague advice when the user asks to update or ensure standards.
- A rule goes in a standard, not a guide. If you find yourself writing MUST in `best-practices/`, it belongs in `standards/`.
- Standards are drafted by anyone and ratified only by a person — `STD-001 §3.14`.
- Use `skills add` for skills, not manual copying.
- Use mise for tools and runtimes. Do not recommend global `npm install -g`, `pip install`, or `brew install` workflows for project tooling.
- If a standard is ambiguous or missing, call it out and propose the smallest durable addition to this repository.
