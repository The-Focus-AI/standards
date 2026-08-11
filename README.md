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
| `STD-005` | Agent environment bootstrap for Cursor, Copilot, and Claude Code. | Draft |
| `STD-006` | Provenance and numbering for every other document class. | Draft |
| `STD-007` | Secrets, vaults, and credential scoping. | Draft |
| `STD-008` | Deployment rules common to every platform. | Draft |
| `STD-009` | Authentication and per-client isolation. | Draft |
| `STD-010` | Agent services — the seven required patterns. | Draft |
| `STD-011` | Agent skills: installation, pinning, and updates. | Draft |

A standard in **Draft** binds nothing. It reflects current understanding and is awaiting
ratification, which only a person can give (`STD-001 §3.14`).

## Rendering is the conformance check

```bash
mise run standard:render    # renders the whole corpus to out/standards/
mise run standard:preview   # …and serves it at http://localhost:8900/
```

The renderer refuses to emit a page for a document that does not conform — missing
frontmatter, a clause with no requirement level, a filename that disagrees with its
number. Conformance is not a separate audit: if it renders, it conforms. `out/standards/`
also carries `standards.html`, the entire corpus as one self-contained file for sharing.

The same command runs in CI. A push to `main` that touches a document rebuilds the site
and publishes it; a document that does not conform fails the job and nothing deploys, so
the published corpus is always a conforming one.

## Using the standards on a project

Skills are installed from this repository, not from the website — the site is the
readable rendering, the repo is what the `skills` CLI pulls from. It is public, so no
authentication is needed.

```bash
# a new project: empty directory to `mise dev`          — see GDE-011
skills add The-Focus-AI/standards --skill setup-project --agent claude-code -y

# an existing project: where does it stand?             — see GDE-012
skills add The-Focus-AI/standards --skill standards-map --agent claude-code -y

# …then close the gaps
skills add The-Focus-AI/standards --skill standardize-project --agent claude-code -y
```

`standards-map` is read-only and produces a dated report; `standardize-project` changes
files, after a plan you approve. Run the map first.

**`--agent claude-code` is load-bearing.** Claude Code reads project skills from
`.claude/skills/`; the CLI's own `skills experimental_install` writes only to
`.agents/skills/` and ignores `--agent`, so it reports success and leaves the agent with
nothing. `GDE-008` has the detail and `STD-011 §3.3` binds it.

## The skills

Fourteen skills are maintained here. Every one installs the same way —
`skills add The-Focus-AI/standards --skill <name> --agent claude-code -y`.

| Skill | What it does |
| --- | --- |
| `activity-report` | Live production usage joined against git history → client-ready report |
| `browser-automation` | Drive Chrome: navigate, extract, screenshot, fill forms, print PDFs |
| `develop-design-md` | Take a project from no identity to a validated `DESIGN.md` |
| `focus-ai-brand` | The Focus.AI brand: palettes, type, grid, components, voice |
| `nano-banana-imagegen` | Generate images — icons, headers, illustrations, photo edits |
| `nano-banana-videogen` | Generate video — image-to-video, scene extension, dialogue |
| `paged-reports` | Markdown → paged HTML → PDF, with page-break control and magazine mode |
| `pptx-decks` | Markdown → branded `.pptx` via PptxGenJS, with visual QA |
| `research-methodology` | Research method and report templates — literature review, comparative, exec summary |
| `setup-project` | Scaffold a new project to these standards |
| `standardize-project` | Audit an existing project against these standards, plan the migration |
| `standards-map` | Latest standards → dated mapping report (applicability, exceptions, gaps) |
| `tech-research` | Pick the best library/tool for a need; write a dated, cited report into `reports/` |
| `work-next-issue` | Take the next issue off the frontier and carry it to an open pull request |

A project installs those alongside thirty-two third-party skills — the Matt Pocock
planning and implementation set, the firecrawl scraping set, `find-skills` and
`swiss-design`. All forty-six are pinned in `skills-lock.json`, listed with their
sources in `GDE-008`, and published for agents at
**<https://standards.thefocus.ai/llms.txt>**, which is generated from the lock and is
the one inventory that cannot go stale.

To install or update the whole set, see
[GDE-008 § Installing every locked skill](best-practices/GDE-008-skills.md).

## Quick start — this repository's container

Build and run the container:

```bash
docker build -t focus-ai-standards-agent .
docker run -it --rm -v ~/.pi:/home/agent/.pi focus-ai-standards-agent
```

Inside the container, install tools and scaffold a project:

```bash
cd /standards
mise install
pi -p skills/setup-project/SKILL.md
```

The `~/.pi` mount gives the container's pi access to your host's LLM API keys. Sessions
are ephemeral — lost when the container exits. Mount a volume to `/app` if you need to
persist project work.

## What's inside

| Path                | Purpose                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `standards/`        | The binding corpus — `STD-001`–`STD-011`, one file per standard                                                        |
| `best-practices/`   | Guides `GDE-001`–`GDE-012` — bootstrapping, auditing, deployment, Clerk, secrets, skills, pi extensions                |
| `reports/`          | Research notes `NOTE-001`–`NOTE-006` — fnox secrets, the skills CLI guide, the standards gap register                  |
| `architecture/`     | Decision records `ADR-001`–`ADR-004` — PRDs and settled questions                                                      |
| `prompts/`          | Pi prompts — `PRM-001` regenerates this Dockerfile (the rest became skills)                                            |
| `skills/`           | The fourteen skills we own, numbered `SKL-nnn` in `skills/VENDORED.md`                                                 |
| `DESIGN.md`         | The design system for the published site: tokens, components, voice                                                    |
| `AGENTS.md`         | Mandatory tools, constraints, task structure for agents working here                                                   |
| `scripts/`          | The renderer, the design/document/skill validators, the bootstrap script                                               |
| `mise.toml`         | Tool declarations (mise is the only dependency — everything else flows from here)                                      |
| `Dockerfile`        | Minimal container: `debian:stable-slim`, mise, bash, tmux, git, gh. `/app` is left empty for your project.             |
| `skills-lock.json`  | All 46 company-approved skills, pinned by hash. Kept identical to the copy in `templates/`                             |
| `templates/`        | Source templates used by the bootstrap script                                                                          |
| `tests/`            | Dockerfile integration tests — `mise test` validates the image                                                         |
| `out/`              | Generated site. Not committed; rebuild with `mise run standard:render`                                                 |
| `.pi/settings.json` | Project-local pi config (npmCommand routes through mise, sessionDir keeps sessions local)                              |
| `.claude/skills/`   | Installed skill files, where Claude Code reads them (managed by `mise run install`; not committed)                     |

## Tasks

```bash
mise install           # Install all tools (one-time, or after mise.toml changes)
mise lint              # Everything: markdownlint, mise doctor, fnox check, and all four validators
mise test              # Build and validate the Docker image
mise dev               # Run lint + test

mise run standard:render    # Render the corpus; refuses to emit a non-conforming document
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
- **Mise is the only bootstrap dependency.** Node, pi, fnox, and everything else come
  from `mise install` inside `/standards`.
- **No global installs.** Everything is project-scoped through `mise.toml`.
- **`/app` is a blank sandbox.** The container makes `/standards` operational; your
  project lives in `/app`, scaffolded by the `setup-project` skill.
- **Secrets stay on your host.** Mount `~/.pi` for LLM keys. fnox and 1Password are
  configured per project — see `STD-007` and `GDE-003`.
