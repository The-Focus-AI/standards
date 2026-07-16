# Agent issue workflow

This project uses agent-assisted planning through specs, tickets, and
wayfinder maps.

## Tracker

Default tracker: GitHub Issues.

Agents should detect the actual tracker at runtime:

1. If `git remote -v` points to GitHub and `gh auth status` works, use GitHub Issues.
2. Otherwise, use local markdown files in `docs/issues/`.
3. If the user names a different tracker, document it here before creating tickets.

Default label vocabulary:

- `ready-for-agent` — fully specified, AFK-ready work
- `needs-info` — waiting on more information
- `needs-triage` — maintainer needs to evaluate
- `wontfix` — will not be actioned

## Skills to use

Run `setup-matt-pocock-skills` once if this doc and tracker layout are not yet configured.
Use `ask-matt` when unsure which skill fits.

- `grill-me` / `grilling` — challenge and clarify a plan or design.
- `grill-with-docs` — challenge a plan against project docs and update docs as decisions settle.
- `wayfinder` — map large or foggy work into linked research, grilling, prototype, and task tickets.
- `research` — investigate primary sources and save a cited Markdown note.
- `to-spec` — convert conversation context into a spec.
- `to-tickets` — split a spec, plan, or conversation into vertical tickets with blocking edges.
- `triage` — move inbound issues/PRs through triage roles to agent-ready briefs.
- `prototype` — build throwaway validation before committing to a direction.
- `implement` — implement one ticket, using TDD where appropriate.
- `code-review` — review implementation against standards, spec, and refactoring smells.
- `tdd` — reference for red/green testing at agreed seams.
- `domain-modeling` — maintain ubiquitous language, `CONTEXT.md`, and ADRs.
- `handoff` — compact the conversation for another agent session.

## Recommended flow

1. Clarify with `grill-me`, `grilling`, or `grill-with-docs`.
2. If the work is too large or foggy for one session, use `wayfinder` to create a map.
3. Write a spec with `to-spec` for anything non-trivial.
4. Create or link the spec in the tracker.
5. Break the spec into tickets with `to-tickets`; use `triage` for inbound work.
6. Ensure every ticket has:
   - Goal / user outcome
   - Background links
   - Acceptance criteria
   - Test or verification plan
   - Blocking edges (`Blocked by`)
   - Out-of-scope notes
7. Work the frontier: any open, unassigned ticket whose blockers are complete.
8. Implement one ticket at a time with `implement`, then run `code-review` before marking it done.
9. Keep ticket status and docs updated as decisions change.

## Wayfinding operations

Use `wayfinder` for planning work that is bigger than one agent session or whose
route is not clear yet.

On GitHub Issues:

- Create one map issue labelled `wayfinder:map`.
- Put the destination, notes, decisions so far, not-yet-specified fog, and out-of-scope items in the map body.
- Create child issues for individual map tickets.
- Label child issues by type: `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, or `wayfinder:task`.
- Use native sub-issues and native blocking relationships where GitHub supports them.
- If native blocking is unavailable, include `## Parent` and `## Blocked by` sections in each child issue.
- Claim work by assigning the ticket to the person or agent session driving it.
- The frontier is the set of open, unassigned child issues whose blockers are closed.

Local markdown fallback:

- Put maps under `docs/wayfinder/<slug>/map.md`.
- Put child tickets under `docs/wayfinder/<slug>/tickets/NN-short-title.md`.
- Represent blocking edges with a `Blocked by:` line containing ticket filenames or titles.
- Keep the map as an index: link to ticket files rather than duplicating ticket answers.

## Local markdown fallback

If GitHub Issues are unavailable, create:

- `docs/specs/YYYY-MM-DD-short-title.md`
- `docs/issues/0001-short-title.md`
- `docs/wayfinder/<slug>/map.md` when using `wayfinder`

Use stable links between specs, ticket files, and wayfinder maps.
