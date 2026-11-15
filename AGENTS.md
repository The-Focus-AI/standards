# The Focus AI handbook agent guide

This repository owns the engineering handbook and shared project capabilities.
Read the target project's instructions first, then the applicable handbook pages.
Make concrete, verified changes when asked; do not invent policy from memory.

## Find the owner of a topic

- Setup, tooling, and cloud work: `handbook/project-setup.md`, `development.md`.
- Existing-project audit: `handbook/update-project.md`.
- Issues, claims, and review: `handbook/work.md`.
- Secrets and credential delivery: `handbook/secrets.md`; platform commands in `recipes/`.
- People, groups, onboarding, offboarding, and rotation: `handbook/access.md`.
- Client sign-in: `handbook/sign-in.md`. Machine and delegated access: `service-access.md`.
- Agent contracts: `handbook/agent-services.md`, `conversations.md`, `mcp-apps.md`.
- Verification, approval, release, and recovery: `handbook/release.md`.
- Skills and source selection: `handbook/skills.md`.
- Document structure, status, and changelog: `handbook/maintaining.md`, `CHANGELOG.md`.

Paths without a directory above are also under `handbook/`.
There is no numbered STD/GDE/NOTE registry. Put a decision and its explanation
together, link longer procedures, and keep dated observations in `evidence/`.
Do not rebuild the old hierarchy or maintain a second skill inventory.

## Authority and safety

- Draft guidance is a proposal unless a project explicitly adopts it. Only a person
  can ratify policy. This redesign does not ratify the former Draft standards.
- Preserve per-client Clerk/OAuth isolation, production-like preview behavior,
  protected production data, and the distinction between machine and human authority.
- Develop and verify in a reproducible cloud workspace. Record genuine local exceptions.
- Store project vaults, service accounts, and saved bootstrap tokens in TheFocus.AI's
  company 1Password account (`thefocusai.1password.com`), never in a personal
  `my.1password.com` account or a `Private`/`Personal`/`Employee`/`Shared`/`default`
  vault. A person retrieves the project-scoped bootstrap token through their seat in
  `thefocusai.1password.com` and supplies it through project cloud secret settings. Do
  not copy their session or persist an injected token into a reusable image/snapshot.
- Before a secret-file write, verify every intended path separately with
  `git check-ignore -q -- <path>` and `git ls-files -- <path>`. Stop on tracked
  secret files without printing contents. Ignore `.fnox/`, `.env`, `.env.*`, and
  project-specific credentials; preserve placeholder-only `.env.example`.
- Use mise for tools, the reviewed package lock for dependencies, and `skills add`
  for skill changes. Never manually copy installed skill folders or globally install
  project tooling. Never advance a lock pin to unpublished local changes.

## Implement and verify

`handbook/navigation.json` is the single topic navigation. Published Markdown
needs title, summary, and status. Evidence needs its actual checked date and source
revisions. Approval metadata is required for In force, never inferred by an agent.
Record substantive handbook, recipe, and skill changes in `CHANGELOG.md`
(`## YYYY-MM-DD — Title`), which renders `changelog.html` and `feed.xml`.

Build: `mise run handbook:build` → `out/handbook/`.
Validate: `mise run lint` and `mise run test`.
Individual checks: `docs:validate`, `skills:check`, `design:validate`.
Preview: `mise run handbook:preview`, through a managed cloud service/portal.

Inspect rendered desktop and narrow states after UI edits. Test copy/search/catalog
interactions in the browser. Structural checks do not prove that advice agrees,
commands work with live accounts, or a deployment has accepted authenticated traffic.

Keep `skills/VENDORED.md` attribution intact. The root and template skills locks
must match. The catalog derives their inventory rather than copying tables into prose.

GitHub Actions `.github/workflows/pages.yml` publishes `main`; it does not provide
PR previews. Do not push, deploy, provision credentials, or modify live access
without authorization. `docs/testing.md` records this repo's checks and operational gaps.
