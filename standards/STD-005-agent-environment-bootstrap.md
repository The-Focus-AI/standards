---
standard: "005"
title: Agent environment bootstrap
category: Practice
status: Draft
issued: "2026-07-25"
revision: R1
applies-to: Every repository worked by a cloud agent
author: W. Schenk
---

## 1. Introduction

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

`mise install` is the one command, on every platform. A bootstrap that installs
packages itself is a second, invisible copy of the repository's setup that
nobody edits when the real one changes — and the first symptom is an agent that
cannot run the tests it was asked to fix.

```sh
mise trust && mise install
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

An agent environment MUST NOT hold production credentials.

Give it preview-scoped or read-only credentials, resolved through fnox from a
non-production vault. Platforms differ in how well they protect these — at least
one keeps environment variables visible to anyone who can edit the environment,
with no dedicated secrets store — so the safe assumption is that anything given
to an agent environment is disclosed.

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

## 4. Platform mapping

Current as of this revision. The platforms own these names and will change them,
which is why no clause above depends on this table.

| Platform | In-repo configuration | Held outside the repository |
| --- | --- | --- |
| Cursor cloud agents | `.cursor/environment.json` — `install`, `start`, `terminals`, `snapshot`, `build.dockerfile` | Secrets, in the dashboard, exposed as environment variables |
| GitHub Copilot coding agent | `.github/workflows/copilot-setup-steps.yml` — job **must** be named `copilot-setup-steps` | Agent variables and secrets |
| Claude Code on the web | `CLAUDE.md`, `.claude/settings.json` hooks and plugins, `.mcp.json`, `.claude/rules/`, `.claude/skills/` | Network policy, environment variables, **and the setup script** |

Claude Code on the web is the case clause 3.2 exists for: its setup script lives
in environment settings rather than in the tree, and it has no dedicated secrets
store — environment variables are visible to anyone who can edit the
environment.

Each of the three reduces to the same line:

```sh
mise trust && mise install
```

## 5. References

[1] Bradner, S., *Key words for use in RFCs to Indicate Requirement Levels*,
BCP 14, RFC 2119, March 1997.

[2] The Focus AI, `STD-004` — Repository tooling and tasks. Draft.

[3] Cursor, *Cloud Environment Setup*, <https://cursor.com/docs/cloud-agent/setup>.

[4] GitHub, *Customizing the development environment for Copilot coding agent*,
<https://docs.github.com/en/copilot/customizing-copilot/customizing-the-development-environment-for-copilot-coding-agent>.

[5] Anthropic, *Use Claude Code on the web*,
<https://code.claude.com/docs/en/claude-code-on-the-web>.
