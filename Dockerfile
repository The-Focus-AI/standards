# Generated from prompts/PRM-001-generate-dockerfile.md.
# Do not hand-edit; edit the prompt and regenerate with mise run generate:dockerfile.
# Dockerfile for Focus.AI Standards Agent
#
# Build:
#   docker build -t focus-ai-standards-agent .
#
# Run in a cloud workspace (forward scoped credentials only when needed):
#   docker run -it --rm --env OPENAI_API_KEY --env OP_SERVICE_ACCOUNT_TOKEN focus-ai-standards-agent
# Use the selected model provider's variable instead of OPENAI_API_KEY if different.
#
# First steps inside the container:
#   cd /standards
#   mise install
#   mise run install
#   pi -p "$(cat skills/setup-project/SKILL.md)"   # supply a project brief; target /app
#
# A person retrieves the project-scoped bootstrap token using their own 1Password
# account and injects it through cloud secret settings. Never mount personal auth
# directories (~/.pi, ~/.config, ~/.ssh, or a 1Password session), persist tokens,
# or bake credentials into the image. Install and offline checks need no secrets.
# Sessions are ephemeral: store durable work in an approved workspace, not an
# auth-directory mount. Container-local changes are lost when it exits.

FROM debian:stable-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates git tmux unzip build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -d /home/agent -s /bin/bash agent \
    && mkdir -p /standards /app \
    && chown -R agent:agent /standards /app

USER agent

ENV PATH="/home/agent/.local/bin:${PATH}"

RUN curl https://mise.run | sh

COPY --chown=agent:agent . /standards

RUN mise trust /standards \
    && cd /standards && mise use gh@latest

RUN echo 'eval "$($HOME/.local/bin/mise activate bash)"' >> /home/agent/.bashrc \
    && echo 'eval "$($HOME/.local/bin/mise activate bash)"' >> /home/agent/.bash_profile

RUN printf 'set -g mouse on\nset -g extended-keys on\nset -g extended-keys-format csi-u\n' > /home/agent/.tmux.conf

RUN git config --global user.name "TheFocus.AI" \
    && git config --global user.email "agent@thefocus.ai"

CMD ["/bin/bash", "-l"]
