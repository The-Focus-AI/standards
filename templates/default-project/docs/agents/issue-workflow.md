# Agent issue workflow

This project uses agent-assisted planning through PRDs and issues.

## Tracker

Default tracker: GitHub Issues.

Agents should detect the actual tracker at runtime:

1. If `git remote -v` points to GitHub and `gh auth status` works, use GitHub Issues.
2. Otherwise, use local markdown files in `docs/issues/`.
3. If the user names a different tracker, document it here before creating tickets.

## Skills to use

- `grill-me` — challenge and clarify a plan or design.
- `grill-with-docs` — challenge a plan against project docs and update docs as decisions settle.
- `to-prd` — convert conversation context into a PRD.
- `to-issues` — split a PRD or plan into vertical implementation issues.
- `prototype` — build throwaway validation before committing to a direction.

## Recommended flow

1. Clarify with `grill-me` or `grill-with-docs`.
2. Write a PRD with `to-prd` for anything non-trivial.
3. Create or link the PRD in the tracker.
4. Break the PRD into issues with `to-issues`.
5. Ensure every issue has:
   - Goal / user outcome
   - Background links
   - Acceptance criteria
   - Test or verification plan
   - Out-of-scope notes
6. Keep issue status and docs updated as decisions change.

## Local markdown fallback

If GitHub Issues are unavailable, create:

- `docs/issues/0001-short-title.md`
- `docs/prd/YYYY-MM-DD-short-title.md`

Use stable links between PRDs and issue files.
