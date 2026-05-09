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
RUN useradd --create-home --shell /bin/bash ${WORKER_USER} && \
    mkdir -p /app /standards && \
    chown ${WORKER_USER}:${WORKER_USER} /app /standards

USER ${WORKER_USER}
WORKDIR /home/${WORKER_USER}

# All RUN commands below need bash (mise activate output uses bash syntax)
SHELL ["/bin/bash", "-c"]

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

# --------------- working directory ---------------
WORKDIR /app

# --------------- root steps (linger) ---------------
USER root
RUN mkdir -p /var/lib/systemd/linger && \
    touch /var/lib/systemd/linger/${WORKER_USER}

# --------------- copy standards (at the end — cache-friendly) ---------------
COPY . /standards
RUN chown -R ${WORKER_USER}:${WORKER_USER} /standards

USER ${WORKER_USER}

# --------------- entrypoint ---------------
CMD ["/bin/bash", "-l"]
