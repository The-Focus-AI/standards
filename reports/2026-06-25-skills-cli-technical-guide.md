---
title: "skills CLI: Technical Implementation Guide for Agent Skill Management"
date: 2026-06-25
updated_from: "2026-05-10 (v1.5.6)"
topic: agent-skills-cli
recommendation: "skills CLI (npm: skills), pinned at v1.5.13"
version_researched: 1.5.13
use_when:
  - You need to extend AI coding agent capabilities with reusable, shareable instruction sets
  - Your team needs consistent agent behavior across developers and CI/CD environments
  - You want to discover and install community-maintained agent skills from GitHub
  - You need to author custom skills for your organization's specific workflows
avoid_when:
  - Your agent doesn't support the Agent Skills specification (rare for modern agents)
  - You need network-isolated or air-gapped installations without a git connection
  - A simple one-off prompt would suffice instead of a reusable skill
project_context:
  language: TypeScript/Node.js
  relevant_dependencies:
    - pi coding agent (primary agent in use)
    - skills npm package (~14.2M weekly downloads, MIT license)
  our_convention: "Pinned in mise.toml as `\"npm:skills\" = \"1.5.13\"` and invoked as `skills ...` (not `npx skills`). See best-practices/skills.md."
kind: note
author: W. Schenk
status: Current
issued: "2026-06-25"
verified: "2026-06-25"
---

## Summary

The `skills` CLI (npm package [`skills`](https://www.npmjs.com/package/skills)) is the package manager for the open agent skills ecosystem, built by Vercel Labs. It functions as a package manager for AI agent capabilities—analogous to npm for JavaScript packages or pip for Python libraries, but for teaching coding agents how to perform specialized tasks. With approximately **14.2 million weekly downloads** (up from ~863K at v1.5.6 in May 2026) and support for 55+ AI coding agents, it has become the de facto standard tool for distributing and managing agent skills across the industry.[1]

The tool installs skill packages from GitHub repositories into agent-specific configuration directories (`.agents/skills/`, `.claude/skills/`, `.pi/skills/`, etc.). Each skill is a directory containing a `SKILL.md` file with YAML frontmatter that provides an agent with procedural knowledge, workflows, and optionally executable scripts. At v1.5.13, the tool supports the full lifecycle: add, list, find, update, remove, and initialize skills.[2]

The core architecture follows a progressive disclosure model: only the skill's `name` and `description` metadata are loaded into the agent's system prompt at startup (~100 tokens per skill); the full `SKILL.md` body is loaded on-demand when the agent detects a relevant task; and bundled reference files, scripts, and data are accessed only as needed. This design enables projects to have dozens of skills installed without meaningful context-window penalties.[3]

> **Our convention:** TheFocus.AI pins the CLI in `mise.toml` (`"npm:skills" = "1.5.13"`) and invokes it as `skills ...` rather than `npx skills ...`. This avoids npx version drift. All commands below are shown as `skills ...`; substitute `npx skills ...` if running outside a mise-managed shell.

## Philosophy & Mental Model

### Core Concepts

The mental model maps cleanly to familiar package managers:[4]

| Concept | npm | skills CLI |
|---------|-----|------------|
| Package entry point | `index.js` / `package.json` | `SKILL.md` |
| **Lock file (project)** | `package-lock.json` | **`skills-lock.json`** (committed; restored by `experimental_install`) |
| **Lock file (global)** | n/a | **`.skill-lock.json`** (in `~/.agents/` or `$XDG_STATE_HOME/skills/`) |
| Install directory | `node_modules/` | `.agents/skills/` (+ `.claude/skills/`, `.pi/skills/`, etc.) |
| Registry | npmjs.com | GitHub (any public repo) |
| Install command | `npm install` | `skills add` |
| CI restore | `npm ci` | `skills experimental_install` |
| Discover packages | npmjs.com search | `skills find` / [skills.sh](https://skills.sh) |

> **Correction from the v1.5.6 report:** There is **no `.skills.json` manifest file**. The earlier report claimed `SKILL.md = index.js`, `.skills.json = package.json`. This was inaccurate. The `skills` CLI v1.5.13 has exactly two lock files, both verified in source (`dist/cli.mjs`): `LOCAL_LOCK_FILE = "skills-lock.json"` (project scope, written by `writeLocalLock`) and `LOCK_FILE = ".skill-lock.json"` (global scope, written by `writeSkillLock` into `~/.agents/` or `$XDG_STATE_HOME/skills/`). There is no package.json-equivalent manifest; `skills-lock.json` is the single source of truth for project skills.

### Key Abstractions

**Skill Repository:** Any GitHub (or GitLab, or local) directory structure containing a `SKILL.md` file. Repositories can contain multiple skills—the CLI discovers them in standard locations like `skills/`, `.agents/skills/`, and agent-specific directories. A root-level `SKILL.md` makes the repository itself a single-skill package.[2]

**SKILL.md:** The unit of distribution. A markdown file with YAML frontmatter (required: `name`, `description`; optional: `license`, `compatibility`, `metadata`, `allowed-tools`, `disable-model-invocation`). The body provides instructions the agent follows when the skill is activated. The `description` field is the most critical piece—it determines when the agent triggers the skill.[3]

**Lock file entry shape (v1.5.13):** Each skill in `skills-lock.json` has:

```json
{
  "source": "owner/repo",
  "sourceType": "github",
  "skillPath": "skills/<folder>/SKILL.md",
  "computedHash": "<sha256 of the skill folder contents>"
}
```

The `computedHash` field (verified in our committed `skills-lock.json` and in `dist/cli.mjs` `addSkillToLocalLock`) is the pinning mechanism. On `experimental_install`, the CLI reads `skills-lock.json`, groups skills by source, and re-runs `add` for each group.[5]

**Installation Scope:** Skills install at two levels:
- *Project scope* (default): Installed to `./.agents/skills/` in the current project. Recorded in `skills-lock.json`, committed to version control, shared with the team.
- *Global scope* (`-g` flag): Installed to `~/.agents/skills/`. Recorded in `~/.agents/.skill-lock.json` (or `$XDG_STATE_HOME/skills/.skill-lock.json`). Available across all projects the user works on.

**Installation Method:** By default, the CLI symlinks skills from a canonical copy to each agent directory. The `--copy` flag creates independent copies instead—useful when symlinks aren't supported (e.g., certain CI environments or Windows configurations).[2]

### Progressive Disclosure Architecture

Skills employ a three-level loading model that is fundamental to understanding their efficiency:[3]

1. **Level 1 — Metadata (always loaded):** At startup, only `name` and `description` (~100 tokens each) enter the system prompt. This means 50+ skills can be installed with negligible context cost.

2. **Level 2 — Instructions (loaded on trigger):** When a user task matches a skill's description, the agent reads `SKILL.md` from the filesystem. Only then does the full instruction set consume context tokens.

3. **Level 3 — Resources (loaded as needed):** Bundled scripts execute without loading their code into context. Reference files are read only when referenced. This enables skills to ship comprehensive documentation, large datasets, and complex scripts without a token penalty unless actually used.

## Setup

### Prerequisites

- Node.js **>=18** (verified from `package.json` `engines` field at v1.5.13)
- Git (for cloning skill repositories)
- One or more supported AI coding agents installed

### Our convention (recommended): pin via mise

```toml
# mise.toml
[tools]
"npm:skills" = "1.5.13"   # pin the version; avoids npx drift
```

Then `mise install` makes `skills` available on PATH and `[tasks.install]` can call it directly:

```toml
[tasks.install]
run = "skills experimental_install"
```

### Basic Installation

```bash
# Install a skill repository (interactive—select agents and skills)
skills add vercel-labs/agent-skills

# Non-interactive: install a specific skill to detected agents
skills add vercel-labs/agent-skills -y

# List available skills in a repo before installing
skills add vercel-labs/agent-skills --list

# Install specific skills to specific agents
skills add vercel-labs/agent-skills --skill find-skills -a claude-code -a pi

# Install all skills to all agents (CI/CD friendly)
skills add vercel-labs/agent-skills --all
```

### CI/CD Integration

```bash
# In CI pipeline, restore skills from lock file (equivalent to npm ci)
skills experimental_install
```

### Local Skill Installation

```bash
# Install from a local directory (useful during development)
skills add ./my-local-skills

# Initialize a new skill
skills init my-custom-skill
```

## Core Usage Patterns

### Pattern 1: Adding Skills (The Primary Workflow)

Use `add` to fetch skills from any git source. This is the central command and covers the 80% case.[1]

```bash
# GitHub shorthand (most common)
skills add vercel-labs/agent-skills

# Full GitHub URL
skills add https://github.com/vercel-labs/agent-skills

# Direct path to a specific skill in a multi-skill repo
skills add https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines

# GitLab URL
skills add https://gitlab.com/org/repo

# Any git URL (including private repos with SSH)
skills add git@github.com:vercel-labs/agent-skills.git
```

**When to use:** Any time you need to install a new skill. Run it once per new skill repository, and commit the resulting `skills-lock.json` file. (No `.skills.json` is written—see the correction above.)

### Pattern 2: Listing and Discovering Skills

View installed skills and find new ones from the community ecosystem.[1][2]

```bash
# List project-installed skills
skills list

# List global skills
skills ls -g

# Filter by specific agent
skills ls -a claude-code

# JSON output (machine-readable, useful for scripts)
skills ls --json

# Interactive search (fzf-style browser)
skills find

# Search by keyword
skills find typescript

# Browse community registry at skills.sh
# (No CLI needed—visit https://skills.sh/ in browser)
```

**When to use:** `list` to audit what's installed; `find` to discover new skills for your workflow.

### Pattern 3: Updating Skills

Keep installed skills synchronized with their upstream repositories.[1]

```bash
# Update all installed skills (interactive: asks project or global)
skills update

# Update a single skill by name
skills update find-skills

# Update multiple specific skills
skills update firecrawl focus-ai-brand

# Update only project skills
skills update -p

# Update only global skills
skills update -g

# Non-interactive CI/CD update
skills update -y
```

**Under the hood:** The update mechanism fetches GitHub tree SHAs via the GitHub API and compares them against the stored hash in `skills-lock.json`. If the hash differs, the skill is reinstalled by invoking the current CLI entrypoint directly (not via `npx`, to avoid nesting issues).[5] Note: `skills update` uses the GitHub API and will hit rate limits when unauthenticated. The CLI falls back to `gh auth token` automatically; exporting `GH_TOKEN` (or `GITHUB_TOKEN`) makes this reliable in CI (verified in `getGitHubToken` in `dist/cli.mjs`). Without a token you may see "Failed to check for deleted skills from …" warnings even when the skill files update successfully.

**When to use:** Run `skills update -y` periodically (e.g., weekly) or as part of a CI check to ensure skills are current. Firebase's agent skills documentation specifically recommends this.[9]

### Pattern 4: Removing Skills

Remove unwanted skills from agent directories.[1]

```bash
# Remove interactively (select from installed list)
skills remove

# Remove by name
skills remove web-design-guidelines

# Remove multiple skills
skills remove frontend-design web-design-guidelines

# Remove from global scope
skills remove --global web-design-guidelines

# Remove from specific agents only
skills remove --agent claude-code cursor my-skill

# Remove all skills (dangerous—use with caution)
skills remove --all

# Alias
skills rm my-skill
```

### Pattern 5: Creating Custom Skills

Author your own skills for team or community distribution.[1]

```bash
# Create SKILL.md in current directory
skills init

# Create a structured skill in a subdirectory
skills init my-custom-skill
```

This scaffolds:

```
my-custom-skill/
└── SKILL.md    # Template with YAML frontmatter
```

The resulting `SKILL.md` template:
```markdown
---
name: my-custom-skill
description: What this skill does and when to use it
---

# My Custom Skill

Instructions for the agent to follow when this skill is activated.

## When to Use

Describe the scenarios where this skill should be used.

## Steps

1. First, do this
2. Then, do that
```

Push to GitHub and anyone can install it with `skills add yourusername/my-custom-skill`.

### Pattern 6: Team Workflow (Install → Commit → CI Restore)

The recommended team workflow mirrors npm dependency management:[4]

```bash
# Developer A: Install skills
skills add vercel-labs/agent-skills --skill find-skills

# Commit the lock file
git add skills-lock.json
git commit -m "feat: add find-skills agent skill"

# Developer B: Restore from lock (equivalent to npm ci)
git pull
skills experimental_install

# CI pipeline:
# steps:
#   - run: skills experimental_install
```

## Anti-Patterns & Pitfalls

### Don't: Assume `remove` Cleans the Lock File

```bash
# This removes skill files but leaves the entry in skills-lock.json
skills rm my-skill --all
```

**Why it's wrong:** The next person who runs `experimental_install` will get the skill reinstalled. The `remove` command only deletes files from agent directories—it does not update `skills-lock.json`.[4]

### Instead: Manual Lock File Cleanup After Remove

```bash
# 1. Remove the skill files
skills rm my-skill --all

# 2. Manually edit skills-lock.json to remove the skill entry

# 3. Regenerate a clean lock file (optional, if you deleted it)
skills update -y
```

### Don't: Use npx Without Pin in CI

```bash
# In CI—version may drift between runs
npx skills experimental_install
```

**Why it's wrong:** `npx` may run a cached older version or fetch a newer version with breaking changes. Between the v1.5.6 report and this update (May → June 2026), the CLI moved from 1.5.6 to 1.5.13.[4]

### Instead: Pin the Version (mise convention)

```toml
# mise.toml
[tools]
"npm:skills" = "1.5.13"
```

Then use directly (not via npx):

```bash
skills experimental_install
```

Or force latest explicitly outside mise:

```bash
npx skills@latest experimental_install
```

### Don't: Use `experimental_sync` Instead of `experimental_install`

```bash
# This crawls node_modules, not the lock file
skills experimental_sync
```

**Why it's wrong:** `experimental_sync` crawls `node_modules/` for skills (those shipped inside npm packages) rather than restoring from `skills-lock.json`. It serves a different purpose—synchronizing from npm-installed packages into agent directories, not from the skills ecosystem.[4]

### Instead: Use the Right Command for the Right Purpose

- `experimental_install` → Restore skills from `skills-lock.json` (CI, after git pull)
- `experimental_sync` → Sync skills from `node_modules` into agent directories

### Don't: Install All Skills Blindly Without Review

```bash
skills add unknown-repo/skills --all
```

**Why it's wrong:** Skills can instruct agents to run arbitrary commands, access files, or execute code. A malicious skill could direct an agent to perform harmful operations. Anthropic's documentation explicitly warns: "Treat like installing software. Only use Skills from trusted sources."[3]

### Instead: Review Before Installing

```bash
# 1. List available skills first
skills add unknown-repo/skills --list

# 2. Review SKILL.md content on GitHub before installing
# 3. Install individually and review
skills add unknown-repo/skills --skill specific-skill -y
```

## Why This Choice

### Decision Criteria

| Criterion | Weight | How the skills CLI Scored |
|-----------|--------|------------------------|
| Agent support breadth | High | 55+ agents supported including all major players (Claude Code, Codex, Cursor, Copilot, Pi, Windsurf) |
| Ecosystem maturity | High | ~14.2M weekly downloads (up from ~863K at v1.5.6), active development, MIT license, Vercel-backed |
| Progressive disclosure | High | Three-level loading model minimizes token consumption; 50+ skills possible without context penalty |
| Lock file / reproducibility | High | `skills-lock.json` enables CI/CD deterministic restores; mental model matches npm |
| Zero-install via mise | Medium | Pinned in `mise.toml` as `npm:skills`; no global `npm install -g` needed |
| Cross-agent portability | Medium | Based on the open [Agent Skills specification](https://agentskills.io); skills work across agents |
| Discoverability | Medium | `skills find`, `skills.sh` directory, and `--list` flag provide multiple discovery paths |
| Skill authoring tooling | Low | `skills init` scaffolds templates; full authoring best practices available from Anthropic docs |

### Key Factors

- **Intuitive mental model:** `SKILL.md` = `index.js`, `skills-lock.json` = `package-lock.json`, `experimental_install` = `npm ci`. Developers familiar with npm understand the `skills` CLI instantly. This reduces onboarding friction significantly compared to learning a novel paradigm.[4]

- **GitHub as the registry:** Unlike npm which requires a centralized registry, the `skills` CLI uses GitHub as its package registry. This means zero infrastructure to maintain for skill authors—push a `SKILL.md` to any public repo and it's instantly installable. This also means skills benefit from all of GitHub's ecosystem: stars, issues, pull requests, releases, and community discovery.[1]

- **Progressive disclosure is the killer feature:** The three-level loading architecture enables projects to maintain a comprehensive skill library without context-window bloat. An agent can have 30+ skills installed, but only pay the token cost for the ones actually relevant to the current task. This design decision makes the `skills` CLI vastly more practical than prompt-injection approaches.[3]

- **Team reproducibility with lock files:** `skills-lock.json` stores the `computedHash` of each skill folder, enabling deterministic restores across developer machines and CI. This is critical for teams where consistent agent behavior matters. The `experimental_install` command provides the `npm ci` equivalent for skills.[4]

## Alternatives Considered

### PromptScript `@use` Directives

- **What it is:** With PromptScript v1.8+, skills can be imported directly in `.prs` files using `@use` instead of the CLI.
- **Why not chosen for general use:** Tied to the PromptScript ecosystem. The `skills` CLI is agent-agnostic and works with all 55+ supported agents.
- **Choose this instead when:** You're using PromptScript as your agent orchestration layer and want tighter integration with your `.prs` configuration.[6]
- **Key tradeoff:** Better PromptScript integration, but loses cross-agent portability.

### OpenSkills CLI

- **What it is:** An alternative skill installer (`npx openskills install`) that also installs skills to agent directories.
- **Why not chosen:** Smaller ecosystem, less adoption, fewer supported agents compared to the `skills` CLI.[6]
- **Choose this instead when:** You specifically prefer OpenSkills' curated selection and its API differs from the `skills` CLI in ways that benefit your workflow.
- **Key tradeoff:** May have a more curated selection, but narrower agent support and smaller community.

### Manual SKILL.md Creation

- **What it is:** Manually creating `SKILL.md` files in agent-specific directories without a package manager.
- **Why not chosen:** No version tracking, no lock file for team consistency, no ecosystem for sharing or discovering skills, no update mechanism.
- **Choose this instead when:** You have exactly one custom skill, no team sharing needs, and no desire to use community skills. Also appropriate during initial skill prototyping before publishing.
- **Key tradeoff:** Total control with zero tooling overhead, but loses all version management, sharing, and discovery benefits.

### Claude Code Plugin Marketplace

- **What it is:** Claude Code's native plugin marketplace format (`.claude-plugin/marketplace.json`) for distributing skills.
- **Why not chosen:** Only works with Claude Code. The `skills` CLI is agent-agnostic and actually supports plugin manifest discovery, making them complementary.[2]
- **Choose this instead when:** You're exclusively targeting Claude Code users and want the native plugin marketplace experience.
- **Key tradeoff:** Deeper Claude Code integration, but locked to a single agent ecosystem.

## Caveats & Limitations

- **`experimental_` prefix is real:** `experimental_install` and `experimental_sync` are still genuinely experimental commands as of v1.5.13. Their behavior, flags, or names may change in future releases. The `sync` command in particular—there is no `skills sync`; you must use the full `experimental_sync` name. This naming inconsistency is a known rough edge that has persisted from v1.5.6 through v1.5.13.[4]

- **`remove` is a footgun with lock files:** Removing a skill (`skills rm`) deletes files from agent directories but leaves the skill entry in `skills-lock.json`. The next `experimental_install` re-installs the removed skill. The workaround is manual—edit `skills-lock.json` to drop the entry. This is the single biggest workflow pitfall and remains unfixed at v1.5.13.[4]

- **npx cache version drift:** Running `npx skills` may use a cached older version. For reproducible behavior across team members, pin the version via mise (`"npm:skills" = "1.5.13"` in `mise.toml [tools]`) and call `skills ...` directly. This is exactly why TheFocus.AI pins the CLI rather than using `npx`.[4]

- **No centralized registry infrastructure:** GitHub is the registry. This is elegant but means skill discovery depends on GitHub search, community curation at skills.sh, and the `skills find` interactive browser. There's no npmjs.com-style centralized search with metadata, download counts, or quality scores (skills.sh partially addresses this).[1][7]

- **GitHub API rate limits affect updates:** `skills update` and the deleted-skills check during `add`/`update` use the GitHub API. When unauthenticated you will see "Failed to check for deleted skills from …" warnings (skill files still update, but deletion-detection fails). The CLI auto-falls back to `gh auth token`; exporting `GH_TOKEN`/`GITHUB_TOKEN` makes it reliable in CI.

- **Security considerations are real:** Skills are executable instructions that run with the agent's full capabilities. A malicious skill can instruct the agent to run arbitrary commands, access sensitive files, or exfiltrate data. Anthropic and Vercel both strongly recommend auditing skills before installation. The `--all` flag is particularly dangerous when used with untrusted repositories.[3][2]

- **Agent feature compatibility varies:** While basic `SKILL.md` loading is universally supported, advanced features like `allowed-tools`, `context: fork`, and `hooks` have inconsistent support across the 55+ agents. Test skills with your specific agent before committing to them in team workflows.[2]

- **Cross-surface sync is manual:** Skills installed via the `skills` CLI for one agent don't automatically propagate to other agents or surfaces (web, API, different editors). Each surface requires independent installation.[3]

## Changes since the v1.5.6 report

- **Version:** 1.5.6 → 1.5.13 (latest release `v1.5.13`, published 2026-06-23; `snapshot` dist-tag at `1.5.12-snapshot.2`).
- **Weekly downloads:** ~863K → ~14.2M (16× growth), confirming ecosystem entrenchment.
- **Node engines:** still `>=18`.
- **Lock file correction:** the v1.5.6 report referenced a `.skills.json` manifest analogous to `package.json`. **This file does not exist** in v1.5.13 (verified in `dist/cli.mjs`: only `LOCAL_LOCK_FILE = "skills-lock.json"` and `LOCK_FILE = ".skill-lock.json"` exist). The earlier reference has been removed throughout.
- **Recommendation change:** our org convention is now to pin the CLI in `mise.toml` (`"npm:skills" = "1.5.13"`) and invoke `skills ...` rather than `npx skills ...`, eliminating version drift.
- **`experimental_` prefix:** still present at v1.5.13; not yet stabilized.
- **`remove` lock-file footgun:** still present at v1.5.13; workaround unchanged.

## References

[1] [vercel-labs/skills — GitHub Repository](https://github.com/vercel-labs/skills) — Primary source: official README, architecture, command reference, supported agents list (55+), and skill discovery locations. README and AGENTS.md were read in full via cloned repository.

[2] [skills CLI `--help` output](https://npmx.dev/package/skills) — CLI command reference: all commands (`add`, `list`, `find`, `update`, `remove`, `init`, `experimental_install`, `experimental_sync`), flags, options, and usage examples. Verified locally with `skills --help` (v1.5.13).

[3] [Claude API Docs — Agent Skills Overview & Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) and [Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — Authoritative documentation on progressive disclosure architecture, SKILL.md structure, YAML frontmatter requirements, naming conventions, authoring best practices, evaluation methodology, and security considerations. Anthropic/Claude.

[4] [Managing AI Agent Skills with npx skills: A Practical Guide](https://dev.to/toyama0919/managing-ai-agent-skills-with-npx-skills-a-practical-guide-2an8) — DEV Community article by Hiroshi Toyama. Documents the npm-to-skills mental model mapping, the `remove`/lock file footgun with workaround, `experimental_` prefix caveat, npx cache behavior, and CI/CD integration patterns.

[5] [vercel-labs/skills — AGENTS.md and source](https://github.com/vercel-labs/skills/blob/main/AGENTS.md) — Internal development documentation and verified `dist/cli.mjs` source. Documents the update checking system architecture: GitHub Trees API hash comparison, lock file format, `computedHash` field, `readLocalLock`/`writeLocalLock` (project, `skills-lock.json`) vs `readSkillLock`/`writeSkillLock` (global, `.skill-lock.json`), and direct CLI entrypoint invocation for reinstallation during updates.

[6] [Using npx skills with PromptScript](https://getpromptscript.dev/dev/guides/npx-skills/) — PromptScript documentation. Documents `@use` alternative, `--dir` flag for custom install paths, `.promptscript/skills/` directory convention, skill metadata override in `.prs` files, parameterized skills, and OpenSkills as an alternative installer.

[7] [skills.sh — The Agent Skills Directory](https://skills.sh/) — Community skill registry maintained by Vercel. Provides browsing by topic, agent, and trending. Documents install counts and popular repositories. The `find-skills` skill from `vercel-labs/skills` has 1.4M total installs.

[8] [Pi Skills Documentation](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md) — Pi coding agent's skill support documentation. Documents `/skill:name` command invocation, skill locations (`.pi/skills/`, `.agents/skills/`, `~/.pi/agent/skills/`), frontmatter validation rules, and the Agent Skills specification compliance.

[9] [Firebase Agent Skills Documentation](https://firebase.google.com/docs/ai-assistance/agent-skills) — Practical example of major platform adopting the `skills` CLI for distributing agent capabilities. Documents skill structure, update recommendations, and manual invocation patterns.

[10] [npmjs.com — skills package page](https://www.npmjs.com/package/skills) — Package metadata: MIT license, ESM module, published 2026-06-23 (v1.5.13), ~14.2M weekly downloads (verified via `api.npmjs.org/downloads`).
