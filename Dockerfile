# Focus.AI Standards Agent — Containerized Development Environment
#
# Build:
#   docker build -t focus-ai-standards-agent .
#
# Run (interactive shell with full mise + fnox activation):
#   docker run -it --rm focus-ai-standards-agent
#
# Run with volume mount for persistent /app work:
#   docker run -it --rm -v $(pwd)/work:/app focus-ai-standards-agent
#
# Validate:
#   ./tests/test-dockerfile.sh
#
# This image contains:
#   - Full Focus.AI standards repo at /standards (readable/writable by worker_user)
#   - mise with node, fnox, firecrawl-cli, pi-coding-agent (all via /app/mise.toml — NO global)
#   - pi with tmux and powerline-footer extensions (installed project-local via -l)
#   - GitHub CLI, tmux, zsh, git, build-essential
#   - Shell auto-activation: mise + fnox via ~/.bashrc and ~/.zshrc
#   - Non-root user worker_user with linger enabled
#   - /app preconfigured as a working agent with its own mise.toml

FROM debian:stable-slim

ARG WORKER_USER=worker_user

# ------------------------------------------------------------------
# Layer 1: System packages (caches well — changes rarely)
# ------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    tmux \
    unzip \
    build-essential \
    zsh \
    && rm -rf /var/lib/apt/lists/*

# GitHub CLI (gh) — requires its own apt repo
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | \
    dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    > /etc/apt/sources.list.d/github-cli.list && \
    apt-get update && apt-get install -y --no-install-recommends gh && \
    rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------------------
# Layer 2: Install mise (as root; copied to user home below)
# ------------------------------------------------------------------
RUN curl -fsSL https://mise.run | sh

# ------------------------------------------------------------------
# Layer 3: Create non-root user, directories, enable linger
# ------------------------------------------------------------------
RUN mkdir -p /standards /app && \
    useradd -m -s /bin/bash ${WORKER_USER} && \
    mkdir -p /home/${WORKER_USER}/.local/bin && \
    cp /root/.local/bin/mise /home/${WORKER_USER}/.local/bin/mise && \
    chown -R ${WORKER_USER}:${WORKER_USER} /home/${WORKER_USER}/.local && \
    chown ${WORKER_USER}:${WORKER_USER} /app && \
    mkdir -p /var/lib/systemd/linger && \
    touch /var/lib/systemd/linger/${WORKER_USER}

# ------------------------------------------------------------------
# Switch to non-root user + bash shell
# (mise activate emits bash-specific syntax; dash chokes on it)
# ------------------------------------------------------------------
USER ${WORKER_USER}
SHELL ["/bin/bash", "-c"]
ENV PATH="/home/${WORKER_USER}/.local/bin:${PATH}"

# ------------------------------------------------------------------
# Layer 4: /app mise.toml — all tools live here (NEVER mise -g)
# ------------------------------------------------------------------
COPY --chown=${WORKER_USER}:${WORKER_USER} <<'APP_MISE' /app/mise.toml
[tools]
fnox = "latest"
node = "latest"
"npm:firecrawl-cli" = "1.16.2"
"npm:@earendil-works/pi-coding-agent" = "latest"

[tasks.install]
description = "Install tools and skills needed for the project"
run = "npx skills experimental_install"

[tasks.dev]
description = "Run development checks (lint, typecheck, format)"
run = '''
echo "==> Running development checks..."
echo "  Set up your dev task in /app/mise.toml [tasks.dev]"
'''

[tasks.test]
description = "Run project tests"
run = '''
echo "==> Running tests..."
echo "  Set up your test task in /app/mise.toml [tasks.test]"
'''

[tasks.deploy]
description = "Deploy the project"
run = '''
echo "==> Deploying..."
echo "  Set up your deploy task in /app/mise.toml [tasks.deploy]"
'''
APP_MISE

# ------------------------------------------------------------------
# Layer 5: Install tools via /app/mise.toml (project-local, no -g)
# ------------------------------------------------------------------
WORKDIR /app
RUN mise trust && mise install

# ------------------------------------------------------------------
# Layer 6: .pi/settings.json — project-local pi (sessionDir, npmCommand)
# ------------------------------------------------------------------
RUN mkdir -p .pi && \
    printf '{\n  "npmCommand": ["mise", "exec", "node", "--", "npm"],\n  "sessionDir": ".pi/sessions"\n}\n' > .pi/settings.json

# ------------------------------------------------------------------
# Layer 7: Install pi-extensions (ALWAYS pi install -l for project-level)
# ------------------------------------------------------------------
RUN mise exec -- pi install -l git:github.com/offline-ant/pi-tmux && \
    mise exec -- pi install -l npm:pi-powerline-footer

# ------------------------------------------------------------------
# Layer 8: Shell activation — mise + fnox in both bash and zsh
# ------------------------------------------------------------------
RUN echo 'eval "$($HOME/.local/bin/mise activate bash)"' >> ~/.bashrc && \
    echo 'command -v fnox >/dev/null 2>&1 && eval "$(fnox activate bash)"' >> ~/.bashrc && \
    printf 'eval "$($HOME/.local/bin/mise activate bash)"\ncommand -v fnox >/dev/null 2>&1 && eval "$(fnox activate bash)"\n' > ~/.bash_profile

RUN echo 'eval "$($HOME/.local/bin/mise activate zsh)"' >> ~/.zshrc && \
    echo 'command -v fnox >/dev/null 2>&1 && eval "$(fnox activate zsh)"' >> ~/.zshrc

# ------------------------------------------------------------------
# Layer 9: tmux config (from best-practices/deployment.md)
# ------------------------------------------------------------------
RUN printf 'set -g mouse on\nset -g extended-keys on\nset -g extended-keys-format csi-u\n' > ~/.tmux.conf

# ------------------------------------------------------------------
# Layer 10: Git config (from best-practices/deployment.md — identity set by user at runtime)
# ------------------------------------------------------------------
RUN git config --global user.name "Focus.AI Agent" && \
    git config --global user.email "agent@focus.ai"

# ------------------------------------------------------------------
# Layer 11: Copy standards repo (LAST before CMD — source changes cache-bust everything above)
# ------------------------------------------------------------------
COPY . /standards
USER root
RUN chown -R ${WORKER_USER}:${WORKER_USER} /standards
USER ${WORKER_USER}

# ------------------------------------------------------------------
# Layer 12: .gitignore for /app — protect per-developer artifacts
# ------------------------------------------------------------------
RUN printf '.agents\n.firecrawl/\n.fnox/\n*.env\n*.env.local\n.pi/sessions/\n.pi/npm/\n.pi/git/\nnode_modules/\n' > /app/.gitignore

# ------------------------------------------------------------------
# Runtime
# ------------------------------------------------------------------
WORKDIR /app
CMD ["/bin/bash", "-l"]
