# Focus.AI Standards Agent — Containerized Development Environment
#
# This image packages the standards repo into a ready-to-use /standards
# directory with all tooling available after `mise install`.  /app is left
# empty as a sandbox for whatever project the user scaffolds.
#
# Build:
#   docker build -t focus-ai-standards-agent .
#
# Run (interactive shell with LLM keys):
#   docker run -it --rm -v ~/.pi:/home/agent/.pi focus-ai-standards-agent
#
#   ~/.pi is mounted so pi inside the container can read the host's LLM API
#   keys (Anthropic, OpenAI, etc.).  Without this mount pi has no credentials
#   and cannot call models.
#
#   Sessions are **ephemeral** — everything except /standards is lost when the
#   container exits.  Mount an external volume to /app if you need to persist
#   project work across container restarts.
#
# First steps inside the container:
#   cd /standards
#   mise install
#   pi -p prompts/setup-project.md   # follow the prompt to scaffold /app

FROM debian:stable-slim

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
    && rm -rf /var/lib/apt/lists/*

# GitHub CLI (gh) — requires its own apt repo
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | \
    dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    > /etc/apt/sources.list.d/github-cli.list && \
    apt-get update && apt-get install -y --no-install-recommends gh && \
    rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------------------
# Layer 2: Create non-root user, directories
# ------------------------------------------------------------------
RUN useradd -m -s /bin/bash agent && \
    mkdir -p /standards /app && \
    chown agent:agent /standards /app

# ------------------------------------------------------------------
# Switch to non-root user — NEVER switch back to root
# ------------------------------------------------------------------
USER agent
ENV PATH="/home/agent/.local/bin:${PATH}"

# ------------------------------------------------------------------
# Layer 3: Install mise (as agent user — lands at ~/.local/bin/mise)
# ------------------------------------------------------------------
RUN curl https://mise.run | sh

# ------------------------------------------------------------------
# Layer 4: Copy standards repo (as agent)
# ------------------------------------------------------------------
COPY --chown=agent:agent . /standards

# ------------------------------------------------------------------
# Layer 5: Trust /standards so mise doesn't prompt at runtime
# ------------------------------------------------------------------
RUN /home/agent/.local/bin/mise trust /standards

# ------------------------------------------------------------------
# Layer 6: Shell activation — mise in both bashrc and bash_profile
# ------------------------------------------------------------------
RUN echo 'eval "$($HOME/.local/bin/mise activate bash)"' >> ~/.bashrc && \
    printf 'eval "$($HOME/.local/bin/mise activate bash)"\n' > ~/.bash_profile

# ------------------------------------------------------------------
# Layer 7: Minimal tmux config (required by pi-tmux extension)
# ------------------------------------------------------------------
RUN printf 'set -g mouse on\nset -g extended-keys on\nset -g extended-keys-format csi-u\n' > ~/.tmux.conf

# ------------------------------------------------------------------
# Layer 8: Git identity (default, so git operations work immediately)
# ------------------------------------------------------------------
RUN git config --global user.name "TheFocus.AI" && \
    git config --global user.email "agent@thefocus.ai"

# ------------------------------------------------------------------
# Runtime
# ------------------------------------------------------------------
CMD ["/bin/bash", "-l"]
