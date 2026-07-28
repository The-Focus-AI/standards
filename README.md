# The Focus AI Standards

The issuing authority for a fleet of agents. This repository holds what The Focus AI
currently believes about building software, written so that a person and a parser get
the same answer from it, and distributed to every repository that runs an agent.

Agents read these documents while planning work and writing tickets. The website at
`standards.thefocus.ai` is not the artifact — the markdown is. The site is its citable
rendering.

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

## Quick start

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
| `best-practices/`   | Guides `GDE-001`–`GDE-010` — deployment, Vercel, GCP, GCE Gaia, Clerk, secrets, skills, pi extensions                  |
| `reports/`          | Research notes `NOTE-001`–`NOTE-006` — fnox secrets, the skills CLI guide, the standards gap register                  |
| `architecture/`     | Decision records `ADR-001`–`ADR-004` — PRDs and settled questions                                                      |
| `prompts/`          | Pi prompts — `PRM-001` regenerates this Dockerfile (the rest became skills)                                            |
| `skills/`           | Every skill we own, numbered `SKL-nnn` in `skills/VENDORED.md`. `work-next-issue` runs the ticket loop end to end.     |
| `DESIGN.md`         | The design system for the published site: tokens, components, voice                                                    |
| `AGENTS.md`         | Mandatory tools, constraints, task structure for agents working here                                                   |
| `scripts/`          | The renderer, the design/document/skill validators, the bootstrap script                                               |
| `mise.toml`         | Tool declarations (mise is the only dependency — everything else flows from here)                                      |
| `Dockerfile`        | Minimal container: `debian:stable-slim`, mise, bash, tmux, git, gh. `/app` is left empty for your project.             |
| `skills-lock.json`  | Company-approved skills (locked hashes for reproducibility)                                                            |
| `templates/`        | Source templates used by the bootstrap script                                                                          |
| `tests/`            | Dockerfile integration tests — `mise test` validates the image                                                         |
| `out/`              | Generated site. Not committed; rebuild with `mise run standard:render`                                                 |
| `.pi/settings.json` | Project-local pi config (npmCommand routes through mise, sessionDir keeps sessions local)                              |
| `.agents/skills/`   | Installed skill files (managed by `skills experimental_install`)                                                       |

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
