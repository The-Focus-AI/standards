---
number: "001"
title: "Standards Dockerfile redesign"
kind: decision
issued: "2026-07-23"
author: W. Schenk
status: Accepted
---

# PRD: Standards Dockerfile Redesign

## Problem Statement

A developer who clones the Focus.AI standards repo needs a reproducible,
containerized environment to run standards tooling and scaffold new projects.
The existing Dockerfile pre-bakes too much — it pre-populates `/app` with a
template mise.toml, installs all tools at build time, and configures fnox and
pi extensions inside the image. This creates three problems:

1. **Stale tooling.** When the standards mise.toml changes (new tools, version
   bumps), the image must be rebuilt. The user can't just `git pull` and
   `mise install` — they need a full Docker rebuild.
2. **Blurred boundaries.** The image conflates the *standards environment*
   (`/standards`) with the *user's workspace* (`/app`). The user can't tell
   what came from the image vs. what setup-project.md would scaffold.
3. **Unnecessary weight.** fnox, secrets infrastructure, zsh, and systemd
   linger are baked into an image that's meant to be a lightweight dev sandbox.

## Solution

A minimal Dockerfile with a single responsibility: make `/standards` fully
operational after `mise install`. Everything else — project scaffolding,
secrets, skills, pi extensions for the user's project — is deferred to the
`setup-project.md` prompt run at runtime inside `/app`.

The image is lean: system packages, mise, shell activation, tmux config, git
identity, and the standards repo. That's it. The user mounts their host's
`~/.pi` directory for LLM API keys, starts the container, runs `mise install`
inside `/standards`, and they're ready to scaffold.

## User Stories

1. As a developer new to Focus.AI standards, I want to `docker build` and
   `docker run` a single image and land in a shell where mise is active and
   `/standards` is present, so that I can start working immediately without
   installing anything on my host machine.

2. As a developer, I want `mise install` inside `/standards` to fetch the
   exact versions of Node, pi, fnox, firecrawl-cli, and any other tools
   declared in the standards mise.toml, so that my environment always matches
   what the team expects.

3. As a developer, I want pi to have access to my LLM API keys without baking
   them into the image or passing them as `-e` flags, so that my keys stay on
   my host machine and never appear in shell history or `docker inspect`.

4. As a developer, I want `/app` to be a completely empty directory at
   container start, so that I can scaffold any project into it without
   colliding with pre-existing config files or tools.

5. As a developer, I want to run `pi -p prompts/setup-project.md` targeting
   `/app` and have it scaffold a fully working project from scratch, so that
   I can go from zero to `mise dev` in a single prompt.

6. As a developer, I want the Dockerfile to respect the "never use `mise -g`"
   constraint, so that all tooling is project-scoped and the standards mise.toml
   is the single source of truth for what's installed.

7. As a developer, I want shell activation (mise) to work whether I run
   `docker run ... bash` or `docker run ...`, so that I don't have to remember
   which invocation pattern activates mise.

8. As a developer, I want tmux to be configured with mouse support and extended
   keys, so that pi's tmux-based subagents work correctly with mouse scrolling
   and multi-line input.

9. As a developer, I want git to be pre-configured with a default identity,
   so that pi can perform git operations (commits, branches) without prompting
   me for name and email.

10. As a developer, I want the GitHub CLI available in the container, so that
    I can authenticate with GitHub and push scaffolded projects without leaving
    the container.

11. As a developer, I want pi extensions (pi-tmux, pi-powerline-footer) to be
    auto-installed from the standards `.pi/settings.json` on first use, so that
    I don't need to run `pi install` commands manually.

12. As a developer, I want the container to run as a non-root `agent` user, so
    that file permissions on mounted volumes and git operations use a predictable
    identity.

13. As a developer, I want to `git pull` inside `/standards` when the standards
    repo updates and run `mise install` again, so that my tooling stays current
    without rebuilding the Docker image.

14. As a developer, I want the Dockerfile's top comment block to document the
    exact `docker build`, `docker run`, and first-steps commands, so that I can
    copy-paste them without reading source code.

15. As a developer, I want pi sessions to be ephemeral (lost when the container
    exits), so that I start fresh each time and don't accumulate stale session
    state across container runs.

16. As a CI pipeline, I want to build the standards image and run the existing
    test suite against it, so that every change to the Dockerfile or standards
    repo is validated automatically.

17. As a developer, I want the image to exclude zsh, fnox, 1Password CLI,
    systemd linger, and `/app` pre-population, so that the image is small,
    focused, and fast to build.

18. As a developer, I want `mise trust` to already be done for `/standards` at
    build time, so that my first `mise install` doesn't present an interactive
    trust prompt.

19. As a developer, I want build-time dependencies (curl, build-essential, git,
    tmux, ca-certificates, unzip) to be installed in an early layer that caches
    well, so that iterative Dockerfile changes don't re-download system packages.

20. As a developer, I want the `prompts/PRM-001-generate-dockerfile.md` prompt to produce a
    Dockerfile consistent with all these decisions, so that the generated artifact
    matches the documented design.

## Implementation Decisions

### Boundary: build-time vs. runtime

The Dockerfile bakes only what's needed to make mise operational inside
`/standards`. `mise install` is a runtime step — the user runs it. This
keeps the image small, the tooling always current, and the Dockerfile simple.

### Boundary: `/standards` vs. `/app`

- **`/standards`** is the standards repo. It contains mise.toml, pi config,
  prompts, best-practices, reports, skills-lock.json. It is fully
  self-contained. `mise install` makes all tools available; pi uses
  `.pi/settings.json` for extensions and npm routing.
- **`/app`** is a blank directory. Nothing is created there at build time —
  no mise.toml, no .gitignore, no config files. It is the sandbox where
  `setup-project.md` scaffolds a new project at runtime.

These two directories are independent domains. The standards environment is
ready the moment the container starts; the user's project is built on demand.

### User identity

A single non-root user named `agent` (home: `/home/agent`). The Dockerfile
switches to `agent` once the user is created and never switches back to root.
File ownership is handled via `COPY --chown=agent:agent` rather than
post-hoc `chown` in a root RUN block.

### mise installation

Mise is installed by `curl https://mise.run | sh` as the `agent` user. The
binary lands at `/home/agent/.local/bin/mise`. `/home/agent/.local/bin` is
added to `PATH` via ENV. Mise is never installed globally (`mise -g`).

### mise trust

`mise trust /standards` runs at build time (after the standards COPY) so the
user's first `mise install` does not trigger an interactive trust prompt.

### mise install

Not run at build time. The user runs `cd /standards && mise install` as their
first step inside the container. This fetches Node, pi, fnox, firecrawl-cli,
and any other tools declared in the standards mise.toml.

### pi and LLM keys

Pi does not have baked-in API keys. The user mounts their host's `~/.pi`
directory into the container at `/home/agent/.pi`. Pi finds its user-level
config (including API keys) there, while also reading project-level config
from `/standards/.pi/settings.json`.

### pi extensions

Pi extensions are declared in `/standards/.pi/settings.json` (under
`packages`). Pi auto-installs missing packages on startup. The Dockerfile
does not run `pi install` commands.

### Shell activation

Mise activation is written to both `.bashrc` and `.bash_profile` so that
mise tools are available whether the user runs `docker run ... bash`
(non-login shell, reads `.bashrc`) or `docker run ...` (login shell via CMD,
reads `.bash_profile`).

Bash is the only shell. Zsh is not installed or configured.

### System packages

Only these packages are installed: `curl`, `ca-certificates`, `git`, `tmux`,
`unzip`, `build-essential`. GitHub CLI (`gh`) is installed separately via
its own apt repository.

Not installed: `zsh`, fnox, 1Password CLI, systemd, or any other tool not
required for the base image to function.

### tmux configuration

A minimal `~/.tmux.conf` is baked with mouse mode and extended keys enabled.
This is required by the pi-tmux extension for subagent pane interaction.

### Git configuration

Default identity is set: `TheFocus.AI` / `agent@thefocus.ai`. This allows pi
and the user to perform git operations without identity prompts.

### Layer ordering

Layers are ordered from least-frequently-changing to most-frequently-changing
to maximize Docker build cache reuse:

1. System packages (rarely changes)
2. Create `agent` user and directories `/standards`, `/app` (rarely changes)
3. Switch to `USER agent` (permanent)
4. Install mise (rarely changes)
5. Shell activation, tmux config, git config (rarely changes)
6. Copy standards repo + `mise trust` (cache-busted when any source file in
   the repo changes)

### CMD

`CMD ["/bin/bash", "-l"]` — starts a login shell with mise activated.
Working directory is the filesystem root; the user navigates to `/standards`
or `/app` as needed.

### PRM-001-generate-dockerfile.md prompt

The prompt that guides pi to produce this Dockerfile enumerates every
constraint explicitly. Pi does not need to discover them by reading the
entire repo — the prompt is the specification. The prompt is the source of
truth; the generated Dockerfile is the derived artifact.

### Runtime contract

The Dockerfile's top comment block documents:

- Build command: `docker build -t focus-ai-standards-agent .`
- Run command: `docker run -it --rm -v ~/.pi:/home/agent/.pi focus-ai-standards-agent`
- First steps: `cd /standards && mise install` then `pi -p prompts/setup-project.md`
- Key mount explanation: host `~/.pi` provides LLM API keys
- Session ephemerality: sessions are lost when the container exits

## Testing Decisions

### What makes a good test

Tests validate external, observable behavior of the built image — not
implementation details of the Dockerfile. Tests check: what user is logged in,
what directories exist, what tools are on PATH, what shell activation lines
exist, what repo files are present, and what anti-patterns are absent.

### Tested modules

The existing integration test suite (`test-dockerfile.sh`) validates the
container image as a black box. It covers:

- Identity and filesystem (whoami, /standards, /app, permissions)
- Tool availability (mise, fnox, node, git, tmux, gh, curl, bash)
- Mise-managed tool detection
- Shell activation lines in `.bashrc`
- Pi binary presence and version
- Standards repo file and directory presence
- Anti-pattern checks (no `npm install -g`, no `pip install` in Dockerfile)
- .gitignore coverage for generated paths

### Prior art

The existing `test-dockerfile.sh` follows this black-box pattern. The
redesigned Dockerfile should pass the same suite with adjustments: fnox is
not expected on PATH (it comes from `mise install` at runtime, not baked),
and `/app` contains no .gitignore (it's empty). The test suite will be
updated to reflect these new expectations.

## Out of Scope

- **fnox and secrets infrastructure.** The image does not include fnox,
  1Password CLI, or any secrets management. Secrets are configured by
  `setup-project.md` for the user's project, not for the standards container.
- **Skills installation.** Skills declared in `skills-lock.json` are not
  installed at build time. They're part of the standards repo as reference;
  the user's project installs its own skills via `setup-project.md`.
- **`/app` pre-population.** No mise.toml, .gitignore, pi config, or any
  other file is created in `/app` by the Dockerfile.
- **zsh support.** Bash is the only shell. Zsh is neither installed nor
  configured.
- **Systemd / linger.** No `loginctl enable-linger`, no systemd integration.
- **Multi-architecture builds.** Only `linux/amd64` is targeted. No
  cross-platform manifest lists.
- **CI/CD pipeline for the image itself.** Publishing to a registry is out
  of scope. The Dockerfile is a reference artifact built locally.

## Further Notes

The `prompts/PRM-001-generate-dockerfile.md` prompt and the Dockerfile have a producer/consumer
relationship: the prompt is the specification, the Dockerfile is the generated
output. When standards evolve (new tools, new best-practices, new extensions),
the prompt should be updated first, then the Dockerfile regenerated.

The two prompts in this repo serve different audiences:

- `prompts/PRM-001-generate-dockerfile.md` — consumed by pi to produce the standards
  container image
- `setup-project.md` — consumed by pi at runtime inside the container to
  scaffold the user's actual project into `/app`
