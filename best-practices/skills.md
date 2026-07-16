# Standard Skills

Skills are managed with the `skills` CLI (npm package `skills`), pinned in
`mise.toml` as `"npm:skills"`. Always use `skills add ...` to install skills —
never manually copy skill directories. After `mise install`, the `skills` binary is
on PATH, so prefer it over `npx skills` to avoid version drift.

## How it works

- `skills add <github-repo>` — installs skill(s) into `.agents/skills/` (and other
  detected agent dirs) and records an entry in `skills-lock.json`, including a
  `computedHash` pinning the current version.
- `skills-lock.json` — the committed, reproducible source of truth (analogous to
  `package-lock.json`). This is what makes installs identical across machines and CI.
- `mise install` / `[tasks.install]` runs `skills experimental_install`, which
  restores every skill from `skills-lock.json` by hash — equivalent to `npm ci`.
- `skills update -y` — fetches the latest versions and rewrites the hashes in
  `skills-lock.json`. Run periodically, then review and commit the diff.
- `skills list` — shows what's installed and which agents each skill targets.

Notes:

- `experimental_install` and `experimental_sync` are still `experimental_`-prefixed
  as of skills v1.5.13; their names may change in future releases.
- `skills update` uses the GitHub API. We are `gh`-authenticated, so
  deletion-detection works locally; if you see "Failed to check for deleted skills"
  in CI, set `GH_TOKEN`.
- Removing a skill with `skills rm` deletes files but leaves the `skills-lock.json`
  entry, so the next `experimental_install` reinstalls it. To truly remove a skill,
  edit `skills-lock.json` by hand (or delete it and re-add the ones you want).

## Standard skill set

The following are installed on all projects and are recorded in `skills-lock.json`.
Source repos are GitHub (`sourceType: github`).

### Always installed

| Installed skill name | Source repo | Skill folder |
| --- | --- | --- |
| Nano Banana Image Generation | The-Focus-AI/nano-banana-cli | `nano-banana-imagegen` |
| Nano Banana Video Generation | The-Focus-AI/nano-banana-cli | `nano-banana-videogen` |
| Research Methodology | The-Focus-AI/focus-agents | (root) |
| firecrawl + 8 `firecrawl-*` skills | firecrawl/cli | `skills/firecrawl-*` |
| find-skills | vercel-labs/skills | `skills/find-skills` |

### Running a browser

| Installed skill name | Source repo | Skill folder |
| --- | --- | --- |
| browser-automation | The-Focus-AI/chrome-driver | `skills/browser-automation` |

### Design

| Installed skill name | Source repo | Skill folder |
| --- | --- | --- |
| swiss-design | zeke/swiss-design-skill | `swiss-design` |
| focus-ai-brand | The-Focus-AI/focus-ai-brand | `skills/focus-ai-brand` |

### Product / planning / architecture workflow

All from `mattpocock/skills`. The standard flow is: grill the idea, produce a
spec, break it into tickets, implement a ticket, then run code review. Use
`wayfinder` before the spec when the work is too large or foggy for one agent
session. Projects using this workflow must document tracker behavior, label
vocabulary, local fallbacks, and Wayfinder operations in
`docs/agents/issue-workflow.md`.

| Installed skill name | Skill folder | Role |
| --- | --- | --- |
| grill-me | `skills/productivity/grill-me` | Interactive questioning for an idea, plan, or decision |
| grill-with-docs | `skills/engineering/grill-with-docs` | Grilling informed by repo docs and existing code |
| wayfinder | `skills/engineering/wayfinder` | Multi-session planning map for large or foggy work |
| research | `skills/engineering/research` | Background primary-source research into a Markdown note |
| to-spec | `skills/engineering/to-spec` | Convert a conversation or plan into a specification |
| to-tickets | `skills/engineering/to-tickets` | Break a spec/plan into blocked vertical-slice tickets |
| prototype | `skills/engineering/prototype` | Throwaway logic/UI prototype to answer a design question |
| implement | `skills/engineering/implement` | Implement one ticket, using TDD where appropriate |
| code-review | `skills/engineering/code-review` | Review against standards, spec, and refactoring smells |
| tdd | `skills/engineering/tdd` | Reference material for red/green testing at agreed seams |

`mattpocock/skills` v1.1 renamed `to-prd` to `to-spec` and merged `to-plan` /
`to-issues` into `to-tickets`. Do not install the deprecated `to-prd` or
`to-issues` skills in new projects.

## Adding a new skill

```bash
skills add <owner>/<repo>            # interactive; picks agents + skills
skills add <owner>/<repo> -y        # non-interactive; all skills to detected agents
skills add <owner>/<repo> --skill <folder> -a pi -a claude-code
```

Then commit the updated `skills-lock.json`. Run `mise install` (or
`skills experimental_install`) to reproduce on another machine.

## Keeping skills current

```bash
skills update -y        # update all project skills, rewrite hashes
skills update find-skills firecrawl -y   # update a subset
git diff skills-lock.json   # review before committing
```
