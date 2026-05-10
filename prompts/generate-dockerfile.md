# Prompt: Generate Standards Dockerfile

Read every file in this repo, then produce a Dockerfile that bakes this entire
standards repo into a containerized development environment. The Dockerfile is
the artifact — do not explain, just write the file.

Remember that you are writing an environment that will be used to develop 
something, and then the app directory will be moved somewhere else eventually. 
It needs to have all of its self-contained stuff, and nothing should be global.

## What to read

- `AGENTS.md` — mandatory tools, constraints, task structure
- `best-practices/` - many different files that may reference other files
- `reports/fnox-secrets.md` — fnox reference architecture (may inform activation)

## Desired end result.

- debian:stable-slim
- worker_user is configured and the bash shell has the right things on it
- /app is configured as a working agent
- /app/mise.toml has the proper things for the agent to be developed
- NEVER USE mise -g because we want mise.toml in /app to be correct
- pi needs mise use ripgrep and mise use fd
- ALWAYS USE pi install -l because we want to make sure that pi has project level only
- /standards is a copy of this directory as an independant agent