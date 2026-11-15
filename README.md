# TheFocus.AI engineering handbook

Practical guidance, platform procedures, dated implementation evidence, and locked agent
skills for building, connecting, and shipping TheFocus.AI projects. Read by task rather
than by numbered clause codes. Markdown in this repository is the source of truth;
GitHub Pages publishes `main` at <https://standards.thefocus.ai>.

- **Live handbook:** <https://standards.thefocus.ai>
- **Skills catalog:** <https://standards.thefocus.ai/skills.html>
- **Changelog & RSS 2.0 feed:** [CHANGELOG.md](CHANGELOG.md) · <https://standards.thefocus.ai/feed.xml>
- **Agent Markdown endpoints:** <https://standards.thefocus.ai/handbook.md> (full bundle)
  and `https://standards.thefocus.ai/handbook/<topic>.md` (per-topic Markdown)

Start with [starting a project](handbook/project-setup.md), [updating an existing repo](handbook/update-project.md),
or [building an agent service](handbook/agent-services.md).

## Copy this prompt

Owned by [handbook/update-project.md](handbook/update-project.md) (validated to stay identical here and rendered
with a one-click Copy button on <https://standards.thefocus.ai> and
<https://standards.thefocus.ai/handbook/update-project.html>):

```text
Update this repository using TheFocus.AI engineering handbook at https://standards.thefocus.ai (Markdown guide: https://standards.thefocus.ai/handbook/update-project.md; full Markdown bundle: https://standards.thefocus.ai/handbook.md; source repository: https://github.com/The-Focus-AI/standards).

Read https://standards.thefocus.ai/handbook/update-project.md and https://standards.thefocus.ai/handbook.md, and fetch https://github.com/The-Focus-AI/standards main safely to record the revision and compare templates/default-project/ and skills-lock.json. Inspect this repo's instructions, tooling, skills, secrets, auth, CI, and deployment against the relevant handbook Markdown pages (https://standards.thefocus.ai/handbook/<topic>.md). Ensure 1Password secrets use TheFocus.AI's company account (thefocusai.1password.com) and a dedicated project vault (<Client> - <Project> or <Client>), never a personal 1Password account (my.1password.com) or a Private/Personal/default vault. Treat Draft pages as recommendations unless this project adopted them. Preserve product behavior and documented exceptions.

Report concrete gaps, then implement the smallest safe fixes authorized by this request. Work in a reproducible cloud workspace. Run lint, tests, and relevant preview checks; report evidence and remaining decisions. Ask before changing credentials, production infrastructure, public contracts, or release policy. Do not ratify policy, merge, or deploy. Push or open PRs only when authorized.
```

## Document authority statuses

Every published page declares its authority `status` in frontmatter, enforced by
`scripts/validate-documents.mjs` and documented in [Maintain the handbook](handbook/maintaining.md#authority-stays-explicit).
Restructuring or rendering a page never ratifies it; only a person can grant `In force`.

| Status | Current count | Meaning and ratification rule |
| --- | --- | --- |
| `Draft` | 14 topics | Proposed guidance. Not an organization-wide obligation unless a project explicitly adopts a named page revision locally. |
| `In force` | 0 topics | Organization policy ratified by a named person (`approved-by` and ISO `approved-on` required in frontmatter; never inferred by an agent). |
| `Reference` | 8 recipes | Concrete platform or CLI procedure behind an owning topic, not independent policy. |
| `Evidence` | 3 records | Dated implementation observation (`checked` ISO date required) with sources and limits, not a claim about current live deployments. |

## Project maturity model

Each target project records its own product maturity, owner approval date, and rationale
in its root `AGENTS.md` (see [Verify and release](handbook/release.md#name-who-can-release)
and [templates/default-project/AGENTS.md](templates/default-project/AGENTS.md)).

| Maturity | Verification required | Release approval |
| --- | --- | --- |
| Unassessed *(default when omitted)* | Missing maturity is unassessed, **never** an implicit `alpha`. | No delegated release or merge authority is inferred. |
| `alpha` | Lint, tests, changed-workflow smoke test, and documented known gaps in `docs/testing.md`. | Project owner may explicitly delegate bounded, reversible releases. |
| `client-testing` | `alpha` checks plus client scenarios and representative non-production data. | Named owner accepts client-visible changes; record agreed client acceptance. |
| `production` | Regression, auth/isolation/migration checks, candidate smoke test, and tested recovery path. | Recorded release approval and named operational recovery owner. |

Maturity never waives security, secret preflight rules, or independent code review
([Take work through review](handbook/work.md#keep-approval-independent)). An agent can
gather verification evidence, but cannot supply a person's required approval. This
standards repository's own verification coverage and open sign-off/alerting gaps are
recorded in [docs/testing.md](docs/testing.md) (maturity currently unassessed).

## Corpus index by task and status

### Handbook topics (`handbook/`)

| Section | Topic | Status |
| --- | --- | --- |
| 01 · Projects and development | [Start a project](handbook/project-setup.md) | `Draft` |
| 01 · Projects and development | [Update a project](handbook/update-project.md) | `Draft` |
| 01 · Projects and development | [Develop in the cloud](handbook/development.md) | `Draft` |
| 02 · Work and review | [Take work through review](handbook/work.md) | `Draft` |
| 03 · People, secrets, and access | [Give and remove access](handbook/access.md) | `Draft` |
| 03 · People, secrets, and access | [Handle secrets](handbook/secrets.md) | `Draft` |
| 03 · People, secrets, and access | [Isolate client sign-in](handbook/sign-in.md) | `Draft` |
| 03 · People, secrets, and access | [Authorize service calls](handbook/service-access.md) | `Draft` |
| 04 · Agent integration | [Build an agent service](handbook/agent-services.md) | `Draft` |
| 04 · Agent integration | [Run an agent conversation](handbook/conversations.md) | `Draft` |
| 04 · Agent integration | [Host interactive agent views](handbook/mcp-apps.md) | `Draft` |
| 05 · Verification and release | [Verify and release](handbook/release.md) | `Draft` |
| 06 · Skills and this handbook | [Install and maintain skills](handbook/skills.md) | `Draft` |
| 06 · Skills and this handbook | [Maintain the handbook](handbook/maintaining.md) | `Draft` |

### Platform recipes (`recipes/`) and dated evidence (`evidence/`)

| Kind | Document | Status / Checked |
| --- | --- | --- |
| Recipe | [Build an A2A server](recipes/a2a-server.md) | `Reference` |
| Recipe | [Configure CI and failure routing](recipes/ci.md) | `Reference` |
| Recipe | [Configure Clerk and social sign-in](recipes/clerk.md) | `Reference` |
| Recipe | [Configure fnox and secret delivery](recipes/fnox.md) | `Reference` |
| Recipe | [Deploy on GCP](recipes/gcp.md) | `Reference` |
| Recipe | [Generate the agent Dockerfile](recipes/generate-dockerfile.md) | `Reference` |
| Recipe | [Build and release single-file macOS menu bar apps](recipes/macos-menubar-app.md) | `Reference` |
| Recipe | [Deploy on Vercel](recipes/vercel.md) | `Reference` |
| Evidence | [Gaia runtime deployment record](evidence/gaia-runtime.md) | `Evidence` (`2026-07-25`) |
| Evidence | [Component lifecycle reference](evidence/component-lifecycle.md) | `Evidence` (`2026-08-27`) |
| Evidence | [Workbench, Specialist A, and Specialist B integration](evidence/workbench-integration.md) | `Evidence` (`2026-11-07`) |

## Run and verify

```sh
mise trust
mise install
mise run install
mise run lint
mise run test
mise run handbook:build
```

Useful individual tasks:

- `mise run handbook:preview` — build `out/handbook/` and serve at `http://localhost:8900/`.
- `mise run design:validate` — verify [DESIGN.md](DESIGN.md) token references and WCAG AA contrast ratios.
- `mise run docs:validate` — verify frontmatter metadata, dates, local links, and `handbook/navigation.json` coverage.
- `mise run skills:check` — validate owned `skills/` frontmatter and `skills/VENDORED.md` parity.
- `mise run deploy:status` — inspect the GitHub Pages workflow target and recent runs.

The static build uses Node built-ins, self-hosted `Source Serif 4` and `Courier Prime`
WOFF2 fonts (`scripts/assets/fonts/`), and [DESIGN.md](DESIGN.md) as the single token source.
Deployments run exclusively from `main` via `.github/workflows/pages.yml`.

## Source layout

- `DESIGN.md` — palette, typography tokens, visual rules, and verified contrast table.
- `CHANGELOG.md` — curated updates rendered to `changelog.html` and `feed.xml` (RSS 2.0).
- `handbook/` — task-oriented guidance and `handbook/navigation.json`.
- `recipes/` — platform and CLI procedures linked behind their owning topics.
- `evidence/` — dated implementation records with explicit verification limits.
- `skills/`, `skills-lock.json` — owned skills, attribution (`skills/VENDORED.md`), and immutable upstream pins.
- `templates/` — `default-project` scaffold (`AGENTS.md`, `mise.toml`, `docs/testing.md`) and access-map example.
- `scripts/`, `tests/` — static renderer, offline validators, secret sync, bootstrap, and test suites.
