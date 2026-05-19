# Dockerfile for Focus.AI Standards Agent
#
# Build:
#   docker build -t focus-ai-standards-agent .
#
# Run (interactive shell with LLM keys):
#   docker run -it --rm -v ~/.pi:/home/agent/.pi focus-ai-standards-agent
#
# First steps inside the container:
#   cd /standards
#   mise install
#   pi -p prompts/setup-project.md   # follow the prompt to scaffold /app
#
# ~/.pi is mounted to give pi access to the host's LLM API keys.
# Sessions are ephemeral — all changes are lost when the container exits.

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
