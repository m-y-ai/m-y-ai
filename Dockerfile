FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Full OS deps: Node.js 20 via NodeSource + runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    gnupg \
    bash \
    sudo \
    python3 \
    python3-pip \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-npm.gpg.key \
       | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
       > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install backend npm dependencies
COPY package*.json ./
RUN npm install --production

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Install Opencode CLI
RUN curl -fsSL https://opencode.ai/install | bash

# Copy backend source (ui/ is a separate container)
COPY backend/ ./backend/

# Bake storage defaults into a seed directory — the entrypoint copies these
# into the persistent agent-home volume on first run (--no-clobber keeps edits).
COPY --chown=root:root backend/storage/ /app/storage-seed/

# Also seed Claude Code settings into the seed dir so they land in ~/.claude
RUN mkdir -p /app/storage-seed/.claude \
    && echo '{}' > /app/storage-seed/.claude/statsig_metadata.json \
    && echo '{"hasCompletedOnboarding":true}' > /app/storage-seed/.claude/settings.json

# Create the agent user — username mirrors the product name
RUN useradd -m -s /bin/bash m-y-ai \
    && chown -R m-y-ai:m-y-ai /app

ENV HOME=/home/m-y-ai
ENV PATH="/home/m-y-ai/.opencode/bin:/home/m-y-ai/.local/bin:${PATH}"

# Move opencode install from root to agent home
RUN cp -r /root/.opencode /home/m-y-ai/.opencode 2>/dev/null || true \
    && chown -R m-y-ai:m-y-ai /home/m-y-ai

RUN chmod +x /app/backend/scripts/entrypoint.sh \
    && chmod +x /app/backend/tools/install.js

# Allow the agent user to run apt-get and pip3 without a password
# so the /api/install endpoint and entrypoint installer can work.
RUN echo "m-y-ai ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /usr/bin/pip3, /usr/bin/pip" \
    >> /etc/sudoers.d/m-y-ai \
    && chmod 0440 /etc/sudoers.d/m-y-ai

USER m-y-ai

# gateway HTTP health/QR + web adapter + mobile-app adapter
EXPOSE 2700 2701 2702

ENTRYPOINT ["/app/backend/scripts/entrypoint.sh"]
