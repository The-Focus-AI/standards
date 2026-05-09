# The Focus AI — Standards Environment
#
# Clones the standards repo into /standards, drops you into /app,
# and pre-applies all best practices (mise, fnox, pi, tmux, gh).
#
# Build:
#   docker build -t focus-ai-standards .
#
# Run (interactive shell):
#   docker run -it focus-ai-standards
#
# Run (app mode — mounts a project at /app):
#   docker run -it -v $(pwd):/app focus-ai-standards

FROM ubuntu:24.04

ARG DEBIAN_FRONTEND=noninteractive
ARG WORKER_USER=worker_user

# --------------- system packages ---------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    tmux \
    unzip \
    build-essential \
    zsh \
    # gh CLI
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install -y --no-install-recommends gh \
    && rm -rf /var/lib/apt/lists/*

# --------------- non-root user ---------------
RUN useradd --create-home --shell /bin/bash ${WORKER_USER}
USER ${WORKER_USER}
WORKDIR /home/${WORKER_USER}

# --------------- mise ---------------
RUN curl https://mise.run | sh

ENV PATH="/home/${WORKER_USER}/.local/bin:${PATH}"

# --------------- mise tools ---------------
RUN eval "$($HOME/.local/bin/mise activate bash)" && \
    mise use --global fnox@latest && \
    mise use --global node@latest

# --------------- pi (coding agent harness) ---------------
RUN eval "$($HOME/.local/bin/mise activate bash)" && \
    mise use --global npm:@earendil-works/pi-coding-agent

# --------------- pi plugins ---------------
RUN eval "$($HOME/.local/bin/mise activate bash)" && \
    pi install git:github.com/offline-ant/pi-tmux && \
    pi install git:github.com/tmustier/pi-extensions

# --------------- shell activation ---------------
# mise activation + fnox chpwd hook so secrets are auto-loaded on cd
RUN printf '%s\n' \
    'eval "$($HOME/.local/bin/mise activate bash)"' \
    'command -v fnox >/dev/null 2>&1 && eval "$(fnox activate bash)"' \
    >> ~/.bashrc

# --------------- enable linger (systemd user services) ---------------
# Best practice: loginctl enable-linger for long-running user services.
# Requires root — done as a final root step below.

# --------------- clone standards into /standards ---------------
RUN git clone https://github.com/The-Focus-AI/standards.git /standards

# --------------- working directory ---------------
# /app is where project code gets mounted or created.
# The Dockerfile doesn't create it here because it's meant to be
# a volume mount point at runtime. But we pre-set WORKDIR so you
# land there on container start.
RUN mkdir -p /app
WORKDIR /app

# --------------- root steps (linger) ---------------
USER root
# Enable linger so systemd user services persist across SSH sessions
RUN mkdir -p /var/lib/systemd/linger && \
    touch /var/lib/systemd/linger/${WORKER_USER}

USER ${WORKER_USER}

# --------------- entrypoint ---------------
# Default: bash shell with everything activated
CMD ["/bin/bash", "-l"]
