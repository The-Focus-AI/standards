# Project setup

- **ALL tools, CLIs, and runtimes (npm packages, python packages, system
  tools) must be installed via mise.** Use `mise use <tool>` to add to
  mise.toml before using a new tool.
- **NEVER use `npm install -g`, `pip install`, `brew install`, or
  `npx -y <pkg>@<ver> init -y` to install tools globally.** Always go
  through mise.
- If a skill or documentation tells you to run `npm install -g` or
  `npx -y ... init`, adapt it: add the tool with
  `mise use npm:<package>` instead, run `mise install`, then use the tool.
- make sure every project as the following tasks
  - mise install
  - mise dev
  - mise lint
  - mise test
  - mise deploy
- use fnox for security
- mise install should call out to pnpm install, or `skills experimental_install` and everything needed to start the project

# Skills

- use `skills add` (mise-pinned `npm:skills`) to add a skill; see `best-practices/skills.md`

# Technologies

- unless otherwise specifed, use typescript and pnpm as a package manager
- avoid having a build step for typescript if possible, have commands that run it exactly.
- use neon/postgres as database
- use clerk as an authentication layer — see @clerk.md (one app per client, production instances, custom domains)
