# Project agent guide

This project follows TheFocus.AI standards. Agents should optimize for durable, maintainable
changes; keep tooling reproducible; and write down decisions that future agents need.

## Baseline adaptation

This is a baseline, not a completed project. Read the project brief and existing manifests,
then adapt the stack, tasks, cloud bootstrap, tests, and release record to the actual project.
The default `lint`, `test`, and `deploy` tasks fail until configured; do not turn them green
with empty commands, unconditional success, or invented application tests. For a repository
that does not deploy, explicitly record why in its `deploy` task.

The bootstrap script can emit a complete handoff without invoking an agent:
`scripts/setup-default-project.sh TARGET --brief /path/to/brief.md --emit-prompt`
(run from the standards repository). Keep secret values out of the brief.

## First files to read

When starting work, inspect these files in order:

1. `AGENTS.md` — this project-specific guide.
2. `README.md` — product and developer overview, if present.
3. `STD-002` in The-Focus-AI/standards — issue states, the frontier, claiming, and what an agent
   comments. Check the adopted revision and status; not copied into this repo.
4. `docs/adr/` — architecture decisions, if present.
5. `CONTEXT.md` — domain language and project context, if present.
6. `mise.toml` — tools, environment loading, and required tasks.
7. `fnox.toml` — secret declarations only; never secret values.
8. `skills-lock.json` — locked agent skills for reproducible setup.

If this repository also links to TheFocus.AI standards repository, read its `AGENTS.md` and relevant
`best-practices/*` files before making broad tooling, security, deployment, or workflow changes.

## Product maturity

- Maturity: not yet assessed.
- Owner approval and date: not yet recorded.
- Rationale: not yet recorded.

Ask the project owner to approve `alpha`, `client-testing`, or `production` under
`STD-012 §3.20–3.21` and replace these placeholders. An agent may recommend a value;
do not assume `alpha` or infer maturity from a deployment URL. Record owner approval,
date, and rationale when the value changes too.

Keep release checks, evidence, approvers, and any explicit bounded delegation in
`docs/testing.md`, referring back here rather than copying the maturity value.
Maturity does not change ticket readiness, waive security, or authorize external actions.

## Development workspace

Develop, install dependencies, run tests, and serve previews in a reproducible cloud workspace
such as an Amp orb or Cursor cloud environment (`STD-005 §3.10`). The laptop is for browser
review and personal authentication, not a required build server or database host.
Record supported platforms and any genuine local hardware/network exceptions here.

A person retrieves the project's scoped service-account token through their own 1Password
account and supplies `OP_SERVICE_ACCOUNT_TOKEN` through this project's cloud secret settings.
Do not request their account password or session, or save an injected token into a reusable
image or snapshot. Keep bootstrap and service configuration in the repository.

## Secret-file preflight

Before running setup or creating credential files (`STD-004 §3.8`, `STD-007 §3.3`):

- Ensure `.gitignore` excludes `.fnox/`, `.env`, `.env.*`, and any project-specific credential files.
  Merge missing rules without replacing existing entries. Keep `.env.example` trackable with placeholders only.
- Check each intended secret path separately with `git check-ignore -q -- <path>` before writing it.
  Also check `git ls-files -- <path>`: ignore rules do not protect files already tracked by Git.
- If a secret file is tracked, stop and report it without printing its contents. Do not force-add
  secret files or treat an ignore-rule change as removing a secret from Git history.

## Required operating rules

- Install dependencies with `mise trust`, `mise install`, and `mise run install`.
  The install task runs `node scripts/restore-skills.mjs`, copied from the standards
  repository's canonical helper. Do not substitute a bare upstream restore command.
  Run `mise run setup` and `mise run secrets:check` separately when runtime secrets are needed.
- Use mise for project tools and runtimes. Do not use global `npm install -g`, `pip install`, or
  `brew install` for project tooling.
- Use `pnpm` for JavaScript/TypeScript packages unless this project explicitly documents another package manager.
- Keep these mise tasks available: `mise run install`, `mise run dev`,
  `mise run lint`, `mise run test`, and `mise run deploy`.
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

## pstack skills (Lauren Tan / @poteto)

This project's `skills-lock.json` also pins the pstack engineering workflow and
principle skills from `cursor/plugins` (`pstack/skills/…`, MIT). Inventory,
canonical install URL, and update verification live in
`best-practices/GDE-008-skills.md` and `STD-011 §3.8–3.9` in The-Focus-AI/standards.

**Same-name skills (`tdd`, `teach`):** both `mattpocock/skills` and pstack define
these names. The lock can hold only one entry per name. Defaults:

| Name | Locked default | Use the other when |
| --- | --- | --- |
| `tdd` | `mattpocock/skills` (feature / vertical-slice red-green) | Bug fix with a cheap local test under `/poteto-mode` → `skills use https://github.com/cursor/plugins/tree/main/pstack/skills --skill tdd` |
| `teach` | `mattpocock/skills` (multi-session teaching workspace) | Explain a subsystem/diff via how+why → `skills use https://github.com/cursor/plugins/tree/main/pstack/skills --skill teach` |

Do not run `skills add cursor/plugins -y` or `skills add mattpocock/skills -y` bare —
both repos carry skills outside the standard set (`STD-011 §3.7`).

## GitHub Issues / tracker expectations

- Prefer GitHub Issues when this repo has a GitHub remote and `gh` is authenticated.
- A person or agent can mark a fully specified ticket `ready` under `STD-002 §3.4–3.5`.
  Readiness is not approval to merge or deploy; the label reference lives in `STD-002 §5`.
- If GitHub Issues are unavailable, use local markdown under `docs/issues/` and record that choice
  here — tracker configuration is per-repo, the workflow rules are not.
- Issues should be small enough for an agent to complete independently.
- Each implementation ticket should include context, acceptance criteria, test expectations,
  blocking edges, and links to the spec or parent issue.
- Before creating issues, check existing open issues to avoid duplicates.

## Testing and release (`STD-012`)

- Keep `docs/testing.md` current: checks (blocking vs advisory), preview verification,
  benchmarks/thresholds, sign-off gates, and alerting. Required headings must stay even
  when a section is `N/A`. Missing applicable configuration is a gap, not `N/A`.
- PR CI is `.github/workflows/ci.yml` and runs `mise run install`, `mise run lint`, and
  `mise run test`. Branch protection has not been verified by copying this workflow;
  ask an authorized owner to configure only blocking checks as required.
- When this project has a web preview, publish the preview URL as a commit status
  (`preview/e2e`) and run smoke/e2e against it before marking a PR ready (`STD-012 §3.5–3.7`).
- Keep previews production-like, with documented differences and protected production data
  (`STD-007`). Use client-specific OAuth applications (`STD-009`); do not share credentials
  across clients. No separate staging environment is required.
- Walkthrough and templates: `best-practices/GDE-014-testing-and-preview-pipeline.md` in
  The-Focus-AI/standards.

## Quality bar

- Run the relevant lint/test/typecheck commands before declaring work complete.
- If a command cannot be run, say why and describe the risk.
- Update docs when behavior, setup, architecture, or workflows change.
