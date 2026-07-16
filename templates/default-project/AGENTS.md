# Project agent guide

This project follows TheFocus.AI standards. Agents should optimize for durable, maintainable changes; keep tooling reproducible; and write down decisions that future agents need.

## First files to read

When starting work, inspect these files in order:

1. `AGENTS.md` — this project-specific guide.
2. `README.md` — product and developer overview, if present.
3. `docs/agents/issue-workflow.md` — how planning work maps to GitHub Issues, specs, tickets, and wayfinder maps.
4. `docs/adr/` — architecture decisions, if present.
5. `CONTEXT.md` — domain language and project context, if present.
6. `mise.toml` — tools, environment loading, and required tasks.
7. `fnox.toml` — secret declarations only; never secret values.
8. `skills-lock.json` — locked agent skills for reproducible setup.

If this repository also links to TheFocus.AI standards repository, read its `AGENTS.md` and relevant `best-practices/*` files before making broad tooling, security, deployment, or workflow changes.

## Required operating rules

- Start setup with `mise trust`, `mise install`, `mise run setup`, and `mise run install`.
- Use mise for project tools and runtimes. Do not use global `npm install -g`, `pip install`, or `brew install` for project tooling.
- Use `pnpm` for JavaScript/TypeScript packages unless this project explicitly documents another package manager.
- Keep these mise tasks available whenever applicable: `mise install`, `mise dev`, `mise lint`, `mise test`, and `mise deploy`.
- Use fnox and 1Password-backed secrets. Do not commit `.env` files or secret values.
- Install or update skills with `npx skills add ...`; do not manually copy skill directories.
- Prefer TypeScript for application code unless the project states otherwise.
- Before major edits, inspect existing conventions and preserve them unless changing them is the point of the task.

## Planning and issue workflow

This project uses the Matt Pocock planning skills installed in `skills-lock.json`:

- `grill-me` — use when a user wants to be challenged on a plan or design before implementation.
- `grill-with-docs` — use when a plan should be stress-tested against `CONTEXT.md`, ADRs, or other domain docs, and those docs should be updated as decisions crystallize.
- `wayfinder` — use when the work is too large or foggy for one agent session; it creates a shared map of research, grilling, prototype, and task tickets.
- `research` — use for background primary-source investigation that should produce a cited Markdown note.
- `to-spec` — use when current conversation context should become a durable specification.
- `to-tickets` — use when a spec, plan, or conversation should be broken into independently grabbable, blocked vertical-slice tickets.
- `prototype` — use when the team wants a throwaway prototype to validate a UI, state machine, data model, or design direction before committing.
- `implement` — use to implement one approved ticket, with tests at agreed seams.
- `code-review` — use after implementation to review against repo standards, the originating spec/ticket, and refactoring smells.
- `tdd` — use as reference material for red/green testing at agreed seams.

Default planning flow:

1. Use `wayfinder` first when the work is too large, cross-cutting, or foggy for one agent session.
2. Use `grill-me` or `grill-with-docs` to clarify goals, constraints, terminology, risks, and non-goals.
3. Use `to-spec` to produce a spec when the work is multi-step or ambiguous.
4. Publish or reference the spec through the configured issue tracker in `docs/agents/issue-workflow.md`.
5. Use `to-tickets` to split the spec into vertical tracer-bullet tickets with explicit blocking edges.
6. Use `prototype` before implementation when the design has high UX, architecture, or state-model uncertainty.
7. Use `implement` for one ticket at a time, then `code-review` before declaring the ticket complete.
8. Keep GitHub Issues, specs, tickets, ADRs, and `CONTEXT.md` in sync with the final decisions.

## GitHub Issues / tracker expectations

- Prefer GitHub Issues when this repo has a GitHub remote and `gh` is authenticated.
- If GitHub Issues are unavailable, use local markdown under `docs/issues/` and document that choice in `docs/agents/issue-workflow.md`.
- Issues should be small enough for an agent to complete independently.
- Each implementation ticket should include context, acceptance criteria, test expectations, blocking edges, and links to the spec or parent issue.
- Before creating issues, check existing open issues to avoid duplicates.

## Quality bar

- Run the relevant lint/test/typecheck commands before declaring work complete.
- If a command cannot be run, say why and describe the risk.
- Update docs when behavior, setup, architecture, or workflows change.
