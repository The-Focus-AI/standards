# Project agent guide

This project follows TheFocus.AI standards. Agents should optimize for durable, maintainable
changes; keep tooling reproducible; and write down decisions that future agents need.

## First files to read

When starting work, inspect these files in order:

1. `AGENTS.md` — this project-specific guide.
2. `README.md` — product and developer overview, if present.
3. `STD-002` in The-Focus-AI/standards — issue states, the frontier, claiming, and what an agent
   comments. Binding; not copied into this repo.
4. `docs/adr/` — architecture decisions, if present.
5. `CONTEXT.md` — domain language and project context, if present.
6. `mise.toml` — tools, environment loading, and required tasks.
7. `fnox.toml` — secret declarations only; never secret values.
8. `skills-lock.json` — locked agent skills for reproducible setup.

If this repository also links to TheFocus.AI standards repository, read its `AGENTS.md` and relevant
`best-practices/*` files before making broad tooling, security, deployment, or workflow changes.

## Required operating rules

- Start setup with `mise trust`, `mise install`, `mise run setup`, and `mise run install`.
- Use mise for project tools and runtimes. Do not use global `npm install -g`, `pip install`, or
  `brew install` for project tooling.
- Use `pnpm` for JavaScript/TypeScript packages unless this project explicitly documents another package manager.
- Keep these mise tasks available whenever applicable: `mise install`, `mise dev`, `mise lint`,
  `mise test`, and `mise deploy`.
- Use fnox and 1Password-backed secrets. Do not commit `.env` files or secret values.
- Install or update skills with `skills add ...` (mise-pinned CLI); do not manually copy skill directories.
- Prefer TypeScript for application code unless the project states otherwise.
- Before major edits, inspect existing conventions and preserve them unless changing them is the point of the task.

## Planning and issue workflow

This project uses the Matt Pocock skill set recorded in `skills-lock.json`
(see `best-practices/GDE-008-skills.md` in the standards repo for the full table).
Run `setup-matt-pocock-skills` once if tracker/label/domain layout is not set up.
Use `ask-matt` when unsure which skill fits.

Core planning skills:

- `grill-me` / `grilling` / `grill-with-docs` — stress-test a plan; docs-aware grilling updates ADRs/glossary.
- `wayfinder` — multi-session map for large or foggy work.
- `research` — primary-source investigation into a Markdown note.
- `to-spec` / `to-tickets` / `triage` — spec, blocked tickets, and triage to agent-ready briefs.
- `prototype` — throwaway validation before committing.
- `implement` / `tdd` / `code-review` — implement one ticket, then review against standards and spec.
- `domain-modeling` / `codebase-design` / `improve-codebase-architecture` — ubiquitous language and deep modules.
- `diagnosing-bugs` / `resolving-merge-conflicts` / `handoff` / `teach` — debug, merge, hand off, teach.

Default planning flow:

1. Use `wayfinder` first when the work is too large, cross-cutting, or foggy for one agent session.
2. Use `grill-me`, `grilling`, or `grill-with-docs` to clarify goals, constraints, terminology, risks, and non-goals.
3. Use `to-spec` to produce a spec when the work is multi-step or ambiguous.
4. Publish or reference the spec through the issue tracker, per `STD-002 §3.15`.
5. Use `to-tickets` to split the spec into vertical tracer-bullet tickets with explicit blocking
   edges; use `triage` for inbound issues/PRs.
6. Use `prototype` before implementation when the design has high UX, architecture, or state-model uncertainty.
7. Use `implement` for one ticket at a time, then `code-review` before declaring the ticket complete.
8. Keep GitHub Issues, specs, tickets, ADRs, and `CONTEXT.md` in sync with the final decisions.

## GitHub Issues / tracker expectations

- Prefer GitHub Issues when this repo has a GitHub remote and `gh` is authenticated.
- If GitHub Issues are unavailable, use local markdown under `docs/issues/` and record that choice
  here — tracker configuration is per-repo, the workflow rules are not.
- Issues should be small enough for an agent to complete independently.
- Each implementation ticket should include context, acceptance criteria, test expectations,
  blocking edges, and links to the spec or parent issue.
- Before creating issues, check existing open issues to avoid duplicates.

## Quality bar

- Run the relevant lint/test/typecheck commands before declaring work complete.
- If a command cannot be run, say why and describe the risk.
- Update docs when behavior, setup, architecture, or workflows change.
