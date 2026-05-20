# Project agent guide

This project follows TheFocus.AI standards. Agents should optimize for durable, maintainable changes; keep tooling reproducible; and write down decisions that future agents need.

## First files to read

When starting work, inspect these files in order:

1. `AGENTS.md` — this project-specific guide.
2. `README.md` — product and developer overview, if present.
3. `docs/agents/issue-workflow.md` — how planning work maps to GitHub Issues, PRDs, and implementation tickets.
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
- `to-prd` — use when current conversation context should become a Product Requirements Document.
- `to-issues` — use when a PRD, plan, or spec should be broken into independently grabbable implementation issues.
- `prototype` — use when the team wants a throwaway prototype to validate a UI, state machine, data model, or design direction before committing.

Default planning flow:

1. Use `grill-me` or `grill-with-docs` to clarify goals, constraints, terminology, risks, and non-goals.
2. Use `to-prd` to produce a PRD when the work is product-facing, multi-step, or ambiguous.
3. Publish or reference the PRD through the configured issue tracker in `docs/agents/issue-workflow.md`.
4. Use `to-issues` to split the PRD into vertical tracer-bullet issues that can be picked up independently.
5. Use `prototype` before implementation when the design has high UX, architecture, or state-model uncertainty.
6. Keep GitHub Issues, PRDs, ADRs, and `CONTEXT.md` in sync with the final decisions.

## GitHub Issues / tracker expectations

- Prefer GitHub Issues when this repo has a GitHub remote and `gh` is authenticated.
- If GitHub Issues are unavailable, use local markdown under `docs/issues/` and document that choice in `docs/agents/issue-workflow.md`.
- Issues should be small enough for an agent to complete independently.
- Each implementation issue should include context, acceptance criteria, test expectations, and links to the PRD or parent issue.
- Before creating issues, check existing open issues to avoid duplicates.

## Quality bar

- Run the relevant lint/test/typecheck commands before declaring work complete.
- If a command cannot be run, say why and describe the risk.
- Update docs when behavior, setup, architecture, or workflows change.
