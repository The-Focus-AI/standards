# Prompt: Generate Standards Dockerfile

Produce a `Dockerfile` that packages this standards repo into a containerized
development environment. The image provides a ready-to-use `/standards` with
all tooling available after `mise install`. `/app` is left empty as a sandbox
for whatever project the user scaffolds with `setup-project.md`.

The Dockerfile is the only artifact — write the file, do not explain.

## Constraints (hard requirements — do not deviate)

### Base image and user

- **`debian:stable-slim`** as the base image.
- Create a non-root user named **`agent`** with home at `/home/agent`.
- Switch to `USER agent` as soon as the user is created and **never switch back
  to root**. Use `COPY --chown=agent:agent` when copying files.
- Create `/standards` and `/app` directories, both owned by `agent`. `/app` is
  left **completely empty** — no mise.toml, no .gitignore, no tools, no config.
  It is a blank sandbox for the user's project.

### System packages

Install these packages (and only these) via `apt-get`:
`curl`, `ca-certificates`, `git`, `tmux`, `unzip`, `build-essential`.
Also install **GitHub CLI** (`gh`) — it requires its own apt repo (see the
existing package registration pattern).

Do NOT install zsh. Bash is the only shell.

### mise

- `mise` is the **only** tooling dependency baked into the image. Everything
  else (Node, pi, fnox, firecrawl-cli, etc.) flows from `mise install` inside
  `/standards` at runtime.
- Install mise via `curl https://mise.run | sh` as the `agent` user. This lands
  the binary at `/home/agent/.local/bin/mise`. Add `/home/agent/.local/bin` to
  `PATH` via ENV.
- **Do NOT run `mise install` at build time.** The user runs it manually.
- **Do run `mise trust /standards` at build time** so the user doesn't hit a
  trust prompt at runtime.
- **NEVER use `mise -g` (global).** All mise operations are project-scoped.

### Shell activation

Write mise activation to **both** `.bashrc` and `.bash_profile` so it works
whether the user runs `docker run ... bash` (non-login) or `docker run ...`
(login shell via CMD).

```bash
eval "$($HOME/.local/bin/mise activate bash)"
```

### tmux

Bake a minimal `~/.tmux.conf` (required by the pi-tmux extension):

```tmux
set -g mouse on
set -g extended-keys on
set -g extended-keys-format csi-u
```

### Git config

Set default identity so git operations work immediately:

```bash
git config --global user.name "TheFocus.AI"
git config --global user.email "agent@thefocus.ai"
```

### /standards

- `COPY --chown=agent:agent . /standards` to put the entire standards repo
  into the image.
- Do NOT set a WORKDIR — the CMD determines the working directory.

### CMD

```dockerfile
CMD ["/bin/bash", "-l"]
```

## Runtime contract (document in Dockerfile comments at the top)

The generated Dockerfile must include comments at the top documenting:

1. **Build:** `docker build -t focus-ai-standards-agent .`
2. **Run (interactive shell with LLM keys):**
   `docker run -it --rm -v ~/.pi:/home/agent/.pi focus-ai-standards-agent`
3. **First steps inside the container:**
   ```bash
   cd /standards
   mise install
   pi -p prompts/setup-project.md   # follow the prompt to scaffold /app
   ```
4. Explanation that `~/.pi` is mounted to give pi access to the host's LLM
   API keys, and that sessions are ephemeral (lost when the container exits).

## What NOT to do

- Do NOT install zsh or configure `.zshrc`.
- Do NOT create `/app/mise.toml` or any file inside `/app`.
- Do NOT install fnox, 1Password CLI, or configure secrets.
- Do NOT run `mise install` at build time.
- Do NOT install pi extensions (`pi install`). The `/standards/.pi/settings.json`
  declares them and pi auto-installs missing packages on startup.
- Do NOT install skills (`npx skills add`). They live in the standards repo
  and the user's project installs its own.
- Do NOT set up systemd, linger, or `loginctl`.
- Do NOT switch back to root after `USER agent`.
- Do NOT use `mise -g` (global install).
