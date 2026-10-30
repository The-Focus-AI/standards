---
standard: "005"
kind: standard
title: Cloud development and agent bootstrap
category: Practice
status: Draft
issued: "2026-07-25"
revision: R3
applies-to: Every repository worked by a cloud agent
author: W. Schenk
---

## 1. Introduction

Development happens in a cloud workspace by default: an Amp orb, a Cursor cloud
environment, or an equivalent reproducible environment. The laptop is a client
for review, browser access, and a person's authentication, not an undocumented
build server or a dependency of the development workflow.

Cloud coding agents run in an environment somebody has to configure: a container
that clones the repository, installs its dependencies, and then hands the agent a
shell. Each platform configures that differently, and each keeps some of the
configuration somewhere other than the repository.

That split is the whole problem. A setup script held in a vendor dashboard drifts
from the repository it sets up, silently, until an agent lands in a container
where the tests cannot run. This standard keeps the split thin: whatever the
platform, its bootstrap does nothing but call the tasks `STD-004` already
requires, and the repository stays the only place that knows how to install
itself.

**Out of scope.** What the tasks themselves do — that is `STD-004`. Model
selection, agent skills, and prompt content. The platforms own their file names
and schemas; section 4 records the current mapping and will go stale, which is
why no clause depends on it.

## 2. Requirements language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** and **MAY** in
this document are to be interpreted as in RFC 2119 [1]. A clause marked
**DEPRECATED** was normative in an earlier revision and is retained so that
repositories still running it can find out what replaced it.

## 3. Requirements

### 3.1

An agent environment's install step MUST be a call to the repository's `install`
task and nothing else.

After trusting the repository and installing its declared tools, call
`mise run install`. `mise install` alone does not run `[tasks.install]`.
A bootstrap that installs project packages itself duplicates the repository's
setup and drifts when that setup changes.

```sh
mise trust && mise install && mise run install
```

### 3.2

Bootstrap configuration held outside the repository MUST contain no logic beyond
that call.

Some platforms keep the setup script in a dashboard rather than in the tree.
Anything written there is invisible to review, to `git log`, and to every agent
reading the repository. Keep it to the install line so that the part which can
drift is the part that never changes.

### 3.3

A repository MUST record which agent platforms it supports in `AGENTS.md`.

An agent arriving through a platform nobody configured will improvise a setup,
succeed unevenly, and leave no trace of what it did. Naming the supported
platforms makes an unsupported one an explicit gap rather than a silent one.

### 3.4

`AGENTS.md` MUST be the single agent entry point, and a platform-specific
instruction file MUST point at it rather than restating its content.

`CLAUDE.md`, `.cursor/rules`, and their equivalents are per-vendor filenames for
one idea. Copying guidance into each produces three documents that disagree
within a month. A one-line pointer cannot disagree with anything.

```markdown
# CLAUDE.md
See AGENTS.md. It is the entry point for every agent in this repository.
```

### 3.5

An agent environment MUST receive only the project-scoped credentials needed
for its authorized work.

A person retrieves the project's bootstrap token using their own 1Password
account and supplies it through the cloud environment's secret settings
(`STD-007 §3.3`). The agent receives the scoped token, not the person's password,
Secret Key, or interactive login session. Treat any credential exposed to the
agent process as accessible to that process and its tools.

Production-equivalent runtime access follows `STD-007 §3.4`; it is not permission
to administer production, run destructive migrations, or bypass `STD-007 §3.5`'s
database protection. Grant privileged operational access separately for authorized
work, not as a default development prerequisite. Never bake tokens or login caches
into reusable images or workspace snapshots.

### 3.6

Bootstrap MUST be idempotent.

Platforms cache the result: a snapshot, a cached filesystem, a warm image.
A bootstrap that only works on a clean container, or that appends to a file each
time it runs, produces environments that differ from each other in ways nobody
can reproduce.

### 3.7

Bootstrap MUST succeed under the platform's default network policy, or the hosts
it needs MUST be recorded in `AGENTS.md`.

Cloud agents run behind restricted egress. A bootstrap that quietly needs a
private registry fails as a timeout several minutes in, which reads as a broken
platform rather than a missing allowlist entry.

### 3.8

A supported platform's bootstrap MUST be verified by running it before the
platform is listed.

Configuration that has never been executed is a guess. Start one session on the
platform, run `mise run lint` and `mise run test` inside it, and only then add it
to the list.

### 3.9

A platform whose bootstrap has stopped working MUST be removed from the
supported list.

Removing it is honest and takes a line; leaving it listed sends the next agent
into a container that cannot build, and it will spend its round diagnosing the
environment rather than the ticket.

### 3.10

Development and verification MUST default to a reproducible cloud workspace,
with any laptop-only work recorded as an explicit exception in `AGENTS.md`.

Edit, install, build, run tests, and serve development previews in that workspace.
Commit the bootstrap and service configuration so the next workspace can repeat
them. A browser or portal is how a person reviews the result; asking them to run
a local server or fix laptop dependencies is not the normal verification path.

An exception names the constraint, owner, and verification path — for example,
native device hardware or an unavailable network connection. Personal 1Password
authentication and entering a token into platform secret settings do not require
moving the development workload onto the laptop. CI still owns deployment builds
under `STD-008 §3.10`.

## 4. Platform mapping

This table describes platform mechanisms, not a claim that this repository has
verified every platform. Amp and Cursor entries were checked against vendor docs
on 2026-10-28; other entries retain their original source dates.

| Platform | In-repo configuration | Held outside the repository |
| --- | --- | --- |
| Amp orbs | `.agents/setup` for dependencies; `.agents/resume` for activation-time authentication; `.amp/services.yaml` for services | Project-scoped secrets and environment variables; optional thin pre-setup entry point |
| Cursor cloud agents | `.cursor/environment.json` — `install`, `start`, `terminals`, `snapshot`, `build.dockerfile` | Secrets, in the dashboard, exposed as environment variables |
| GitHub Copilot coding agent | `.github/workflows/copilot-setup-steps.yml` — job **must** be named `copilot-setup-steps` | Agent variables and secrets |
| Claude Code on the web | `CLAUDE.md`, `.claude/settings.json` hooks and plugins, `.mcp.json`, `.claude/rules/`, `.claude/skills/` | Network policy, environment variables, **and the setup script** |

Claude Code on the web is the case clause 3.2 exists for: its setup script lives
in environment settings rather than in the tree, and it has no dedicated secrets
store — environment variables are visible to anyone who can edit the
environment.

The dependency-install entry point reduces to the same line:

```sh
mise trust && mise install && mise run install
```

Amp setup may be snapshotted and reused by another project member. Keep personal
authentication out of it; current runtime identity is available at resume.
Use managed services and portals rather than a laptop server or a background
process left by the setup script. In Cursor, check that the saved environment
actually points at the repository's environment file; saved configuration can
take precedence over it. Secret provisioning is covered in `GDE-003`.

## 5. References

[1] Bradner, S., *Key words for use in RFCs to Indicate Requirement Levels*,
BCP 14, RFC 2119, March 1997.

[2] The Focus AI, `STD-004` — Repository tooling and tasks. Draft.

[3] Cursor, *Cloud Environment Setup*, <https://cursor.com/docs/cloud-agent/setup>.

[4] GitHub, *Customizing the development environment for Copilot coding agent*,
<https://docs.github.com/en/copilot/customizing-copilot/customizing-the-development-environment-for-copilot-coding-agent>.

[5] Anthropic, *Use Claude Code on the web*,
<https://code.claude.com/docs/en/claude-code-on-the-web>.

[6] Amp, *Customizing Orbs* and *Handling Secrets*, checked 2026-10-28,
<https://ampcode.com/docs/orbs/customizing>,
<https://ampcode.com/docs/orbs/handling-secrets>.
