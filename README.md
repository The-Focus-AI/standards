# The Focus AI Standards

The issuing authority for a fleet of agents. This repository holds what The Focus AI
currently believes about building software, written so that a person and a parser get
the same answer from it, and distributed to every repository that runs an agent.

Agents read these documents while planning work and writing tickets. The website is not
the artifact — the markdown is. The site is its citable rendering, published from `main`
by CI at **<https://the-focus-ai.github.io/standards/>**.

## The corpus

Every document is numbered, and the prefix says what kind it is. Cite by number —
`STD-008`, `GDE-010` — because a number survives a retitling and a slug does not
(`STD-006 §3.10`).

| Prefix | Lives in | Is | Binds |
| ------ | ----------------- | ------------------------------------------------- | ------------------ |
| `STD` | `standards/` | numbered clauses with RFC 2119 requirement levels | **yes, when in force** |
| `GDE` | `best-practices/` | explanation, walkthroughs, reference implementations | no |
| `NOTE` | `reports/` | research at a point in time, cited and dated | no |
| `ADR` | `architecture/` | a settled question and its alternatives | no |
| `PRM` | `prompts/` | instructions an agent executes | no |
| `SKL` | `skills/` | a capability an agent loads on demand | no |

Standards are the only documents that bind anything. When a guide turns out to contain
rules, the rules move to a standard where they can be cited and checked, and the guide
keeps the explanation.

A note keeps its date in its filename because it is a capture of a moment and staleness
is the first thing a reader needs. A guide or a decision record does not: it is a topic
revised in place.

### Standards

| Ref | Covers | Status |
| --------- | ------------------------------------------------------------------ | -------- |
| `STD-001` | How a standard is written. Read before authoring or migrating one. | In force |
| `STD-002` | Issue states, the frontier, claiming, and what an agent comments. | Draft |
| `STD-003` | Branches, pull requests, the description format, and merge gates. | Draft |
| `STD-004` | Tooling through mise and the four required tasks. | Draft |
| `STD-005` | Cloud-first development and bootstrap for Amp, Cursor, and other agents. | Draft |
| `STD-006` | Provenance and numbering for every other document class. | Draft |
| `STD-007` | Secrets, vaults, and credential scoping. | Draft |
| `STD-008` | Deployment rules common to every platform. | Draft |
| `STD-009` | Authentication and per-client isolation. | Draft |
| `STD-010` | Agent services — the seven required patterns. | Draft |
| `STD-011` | Agent skills: installation, pinning, and updates. | Draft |
| `STD-012` | Testing, preview verification, release gates, and failure routing. | Draft |

A standard in **Draft** binds nothing. It reflects current understanding and is awaiting
ratification, which only a person can give (`STD-001 §3.14`).

## Render and validate

```bash
mise run standard:render    # renders the whole corpus to out/standards/
mise run docs:validate      # checks provenance, numbering, and document classes
mise run skills:check       # checks skills and their register
mise run design:validate    # checks design tokens and contrast
mise run standard:preview   # …and serves it at http://localhost:8900/
```

The renderer checks clause structure and required metadata; the validators cover
additional provenance, numbering, skill, and design constraints. Passing these checks
does not prove that requirements agree or examples work. `out/standards/standards.html`
bundles the published corpus in one self-contained file for sharing.

CI runs all four checks before publishing changes to the corpus on `main`.

## Using the standards on a project

Skills are installed from this repository, not from the website — the site is the
readable rendering, the repo is what the `skills` CLI pulls from. It is public, so no
authentication is needed.

Use the pinned-source installation procedure in `GDE-008`, selecting only the
capability needed: `setup-project` for a new project (`GDE-011`), `standards-map`
for an audit, or `standardize-project` for an approved migration (`GDE-012`).
Defaults retain the external inventory plus `setup-project` and `work-next-issue`;
other owned skills, including PPTX and Focus branding, remain available on demand.

`standards-map` is read-only and produces a dated report; `standardize-project` changes
files, after a plan you approve. Run the map first. For a copy-pasteable agent
prompt that diffs the canonical `skills-lock.json`, checks each standard and
guide, writes a gap report, then opens fix PRs without merging, use `PRM-002`.

## Quick start — this repository's container

Build and run the container in a Docker-capable cloud workspace:

```bash
docker build -t focus-ai-standards-agent .
docker run -it --rm --env OPENAI_API_KEY --env OP_SERVICE_ACCOUNT_TOKEN focus-ai-standards-agent
```

Use the selected model provider's environment variable instead of `OPENAI_API_KEY`
if different. Forward only scoped credentials injected by the cloud environment;
do not mount personal authentication directories or bake tokens into the image.
Installation and offline checks need neither credential.

Inside the container, install tools and prepare a project-specific agent handoff:

```bash
cd /standards
mise install
mise run install
./scripts/setup-default-project.sh /app --brief /path/to/brief.md --emit-prompt
```

Give that handoff to the chosen agent; it adapts the reviewed baseline rather than
inventing a new task contract. Emission alone creates no files and invokes no agent.
The empty baseline intentionally fails unconfigured checks. Sessions are ephemeral;
use an approved workspace volume for durable project work, not a personal auth mount.

## What's inside

| Path | Purpose |
| --- | --- |
| `standards/` | Numbered standards; status determines authority |
| `best-practices/` | Walkthroughs and reference implementations |
| `reports/` | Dated research; `NOTE-005` tracks corpus gaps |
| `architecture/` | Decision records and their alternatives |
| `prompts/` | `PRM-001` regenerates the Dockerfile; `PRM-002` audits and migrates projects |
| `skills/` | Owned capabilities, registered in `skills/VENDORED.md` |
| `DESIGN.md` | Published-site tokens, components, and voice |
| `AGENTS.md` | Instructions for agents working here |
| `scripts/` | Rendering, validation, bootstrap, verified skill restore, and secret sync |
| `mise.toml` | Managed tools/tasks; GDE-011 records host prerequisites |
| `Dockerfile` | Cloud agent container; `/app` is left empty for project work |
| `skills-lock.json` | Immutable source revisions and verified content hashes |
| `templates/` | Maintained bootstrap and configuration inputs |
| `tests/` | Offline regressions; Docker integration is `test:docker` |
| `docs/testing.md` | Actual checks, release gates, and unconfigured integrations |
| `out/` | Ignored generated site; rebuild with `standard:render` |
| `.pi/settings.json` | Project-local pi configuration |
| `.agents/skills/` | CLI-installed files verified by the restore helper |

## Tasks

```bash
mise install           # Install all tools (one-time, or after mise.toml changes)
mise run install       # Run the repository's install task (skills in this repo)
mise lint              # Offline markdown, lock, document, skill and design checks; render corpus
mise test              # Offline behavior and bootstrap regressions
mise run test:docker    # Separate image build/smoke test; Docker daemon and network required
mise dev               # Run lint + test

mise run standard:render    # Render the corpus and check its structure
mise run standard:preview   # Render and serve at http://localhost:8900/
mise run docs:validate      # Guides, notes, decisions and prompts against STD-006
mise run design:validate    # DESIGN.md: token references, WCAG AA pairs, contrast table
mise run skills:check       # Every skill under skills/, and the SKL register

mise run generate:dockerfile                        # Regenerate the Dockerfile via pi
./scripts/setup-default-project.sh ../my-project    # New/empty project bootstrap
pi @skills/standardize-project/SKILL.md "Target project: ../qbsync"   # Audit a project
pi @skills/standards-map/SKILL.md "Target project: ../local-library"  # Map a project against the corpus
```

## Design philosophy

- **Humble in the frame, absolute in the clause.** A standard states plainly that it
  reflects current understanding and expects revision — and then says MUST without
  hedging. The RFC form is the only one that holds both without flinching.
- **The undated, unattributed rule is the enemy.** Every clause carries who issued it,
  when, what it obsoletes, and what it binds, or it does not render.
- **Mise owns project tools.** Node, pi, and fnox come from `mise install` once
  the documented cloud host prerequisites exist.
- **No global installs.** Everything is project-scoped through `mise.toml`.
- **`/app` is a blank sandbox.** The container makes `/standards` operational; your
  project lives in `/app`, scaffolded by the `setup-project` skill.
- **Development stays in the cloud.** People review and authenticate from their
  laptops; agents build, test, and serve previews in an orb or equivalent workspace.
  People supply scoped tokens through cloud secret settings — see `STD-005`,
  `STD-007`, and `GDE-003`.
