# Prompt: Generate Standards Dockerfile

Read every file in this repo, then produce a Dockerfile that bakes this entire
standards repo into a containerized development environment. The Dockerfile is
the artifact — do not explain, just write the file.

## What to read

- `AGENTS.md` — mandatory tools, constraints, task structure
- `best-practices/deployment.md` — remote server setup, mise + fnox + pi install steps
- `best-practices/security.md` — fnox + 1Password vault rules
- `best-practices/organization.md` — (image) organizational structure
- `mise.toml` — which tools and versions are declared
- `skills-lock.json` — which skills are approved
- `reports/fnox-secrets.md` — fnox reference architecture (may inform activation)
- `.dockerignore` — what NOT to copy
- `.gitignore` — what's already ignored

## Design decisions (apply without asking)

1. **Base image:** `debian:stable-slim` (stripped down, not Ubuntu).
2. **Shell:** Add `SHELL ["/bin/bash", "-c"]` after the USER switch because
   `mise activate bash` emits bash-specific syntax that dash chokes on.
3. **Non-root user:** `worker_user`. Create early, switch to it.
4. **Directories:** `/standards` (this repo) and `/app` (working directory).
   Create and chown both while still root.
5. **Tools installed via mise (global):**
   - `fnox@latest`
   - `node@latest`
   - `npm:@earendil-works/pi-coding-agent`
6. **Pi plugins:**
   - `pi-tmux` from `git:github.com/offline-ant/pi-tmux`
   - `pi-extensions` from `git:github.com/tmustier/pi-extensions`
7. **System packages:** `curl`, `ca-certificates`, `git`, `tmux`, `unzip`,
   `build-essential`, `zsh`, and `gh` (GitHub CLI, via its apt repo).
8. **Shell activation:** Append to `~/.bashrc`:
   - `eval "$($HOME/.local/bin/mise activate bash)"`
   - `command -v fnox >/dev/null 2>&1 && eval "$(fnox activate bash)"`
9. **Linger:** `touch /var/lib/systemd/linger/${WORKER_USER}` (as root).
10. **Layer ordering (CRITICAL):**
    - Install-heavy steps (apt, mise, node, pi) come FIRST so they cache.
    - `COPY . /standards` and `chown -R worker_user:worker_user /standards`
      must be the VERY LAST step before CMD, so source file changes don't
      invalidate the tool-install cache.
11. **WORKDIR** = `/app` at the end.
12. **CMD** = `["/bin/bash", "-l"]` (login shell, so `.bashrc` fires).
13. **Header comments:** Include usage comments at the top showing how to
    build and run the image.

## Constraints

- **NEVER** use `npm install -g`, `pip install`, `brew install`. Everything
  goes through mise.
- Do NOT install global npm packages directly — use `mise use npm:<pkg>`.
- The image should land the user in `/app` with a fully activated shell
  (mise + fnox hooks loaded via `.bashrc`).
- The `/standards` directory should be readable/writable by `worker_user`.
