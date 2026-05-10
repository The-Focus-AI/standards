# Focus.AI Standards

Reference implementation of Focus.AI development standards — tooling,
best-practices, prompts, and a containerized environment for scaffolding new
projects.

## Quick Start

Build and run the container:

```bash
docker build -t focus-ai-standards-agent .
docker run -it --rm -v ~/.pi:/home/agent/.pi focus-ai-standards-agent
```

Inside the container, install tools and run the project setup prompt:

```bash
cd /standards
mise install
pi -p prompts/setup-project.md
```

The `~/.pi` mount gives the container's pi access to your host's LLM API keys.
Sessions are ephemeral — lost when the container exits. Mount a volume to
`/app` if you need to persist project work.

## What's Inside

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Mandatory tools, constraints, task structure for pi agents |
| `mise.toml` | Tool declarations (mise is the only dependency — everything else flows from here) |
| `Dockerfile` | Minimal container: `debian:stable-slim`, mise, bash, tmux, git, gh. `/app` is left empty for your project. |
| `skills-lock.json` | Company-approved skills (locked hashes for reproducibility) |
| `best-practices/` | Deployment, security, skills, pi extensions, project organization |
| `prompts/` | Pi prompts — `setup-project.md` scaffolds new projects, `generate-dockerfile.md` regenerates this Dockerfile |
| `reports/` | Technical research (fnox secrets reference, npx skills CLI guide, electron shell) |
| `tests/` | Dockerfile integration tests — `mise test` validates the image |
| `architecture/` | Design documents — PRDs and decision records |
| `.pi/settings.json` | Project-local pi config (npmCommand routes through mise, sessionDir keeps sessions local) |
| `.agents/skills/` | Installed skill files (managed by `npx skills install`) |

## Tasks

```bash
mise install           # Install all tools (one-time, or after mise.toml changes)
mise run generate:dockerfile   # Regenerate the Dockerfile via pi
mise test              # Build and validate the Docker image
mise dev               # Validate best-practice docs
```

## Design Philosophy

- **Mise is the only bootstrap dependency.** Node, pi, fnox, and everything
  else come from `mise install` inside `/standards`.
- **`/app` is a blank sandbox.** The container makes `/standards` operational.
  Your project lives in `/app`, scaffolded by `setup-project.md`.
- **No global installs.** Everything is project-scoped through mise.toml.
- **Secrets stay on your host.** Mount `~/.pi` for LLM keys. fnox and
  1Password are configured by `setup-project.md` per project.
