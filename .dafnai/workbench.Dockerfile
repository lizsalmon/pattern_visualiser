FROM node:24-bookworm-slim

# Avoid interactive Nuxt telemetry consent prompts during the non-interactive
# installs/builds the agent runs.
ENV NUXT_TELEMETRY_DISABLED=1
