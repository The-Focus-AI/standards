---
standard: "004"
title: Repository tooling and tasks
category: Practice
status: Draft
issued: "2026-07-25"
revision: R1
applies-to: Every repository
author: W. Schenk
---

## 1. Introduction

An agent that has never seen a repository needs to be able to install it, check
it, and run it without reading the README and guessing. This standard fixes that
contract: every tool a repository needs is declared in one file, and every
repository answers the same four commands.

The contract matters more than the tool. `mise install`, `mise run lint`,
`mise run test` mean the same thing in every repository the fleet touches, which
is what lets an agent — or a CI runner, or an agent platform's bootstrap — work
somewhere it has no specific knowledge of.

**Out of scope.** Which linter or test runner a repository chooses. The secrets
policy itself — vault layout, rotation, provider configuration — is `STD-007`;
this standard specifies only how secrets reach the process. Agent platform
bootstrap is `STD-005`.

## 2. Requirements language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** and **MAY** in
this document are to be interpreted as in RFC 2119 [1]. A clause marked
**DEPRECATED** was normative in an earlier revision and is retained so that
repositories still running it can find out what replaced it.

## 3. Requirements

### 3.1

Every tool, CLI and runtime a repository needs MUST be declared in `mise.toml`.

Runtimes, npm-delivered CLIs, and system tools alike. A tool that is not
declared is a tool that works on the machine of whoever added it and nowhere
else, and the first agent to touch the repository discovers it by failing.

```sh
mise use npm:markdownlint-cli2
mise install
```

### 3.2

A repository MUST NOT require a globally installed tool.

No `npm install -g`, no `pip install`, no `brew install`, no
`npx -y <pkg>@<ver> init`. When a skill or an upstream document instructs
otherwise, adapt it: add the tool with `mise use`, run `mise install`, then use
it. Global installs are invisible to `mise.toml`, so they are invisible to
everyone who did not perform them.

### 3.3

Every repository MUST expose `install`, `dev`, `lint`, and `test` as mise tasks.

These four are the interface. An agent entering an unfamiliar repository runs
them without asking what they do, and a repository that renames or omits one has
opted out of being worked automatically.

### 3.4

A repository that deploys MUST expose a `deploy` task, and one that does not
MUST still define `deploy` and say so.

A missing task is ambiguous — nobody can tell whether deployment is unsupported
or merely undocumented. A defined task that prints why there is nothing to
deploy costs one line and removes the question permanently.

```toml
[tasks.deploy]
description = "Deploy standards"
run = 'echo "==> Deploy: Standards are reference-only, nothing to deploy."'
```

### 3.5

`mise install` MUST leave the repository ready to work with no further steps.

Dependencies, agent skills, and any generated files. If a contributor has to run
a second command before `lint` and `test` will pass, that command belongs inside
`install`. This is what an agent platform's bootstrap calls, and it gets one
call.

### 3.6

`lint` and `test` MUST exit non-zero when they find a problem.

A task that ends `|| true` reports success while the repository is broken, which
is worse than having no task at all — every gate downstream believes it. The
template task in this repository carried exactly that defect on its markdown
linter, and every project bootstrapped from it inherited a linter that could not
fail.

### 3.7

Environment variables MUST reach the process through mise, from fnox.

Declared in `mise.toml` as `[env] _.file = ".fnox/env"` with the rest resolved by
fnox, so entering the directory is what configures the shell. An agent should
never be told to export a variable by hand, because an agent has no hand.

### 3.8

A secret MUST NOT be committed, including in an example file.

Secrets resolve at runtime through fnox from the project's own 1Password vault.
An example file with a plausible-looking value is the most common way a real one
ends up in history, because it is the file people paste into.

```sh
mise run secrets:check
```

### 3.9

A tool whose version changes its output MUST be pinned in `mise.toml`.

Linters, formatters, and code generators. An unpinned linter turns an unrelated
upstream release into a red build on somebody else's pull request, and the agent
that inherits it wastes its round trying to fix code that did not change.

### 3.10

A generated file MUST declare its generator in its own header, and MUST NOT be
hand-edited.

An agent asked to change a generated file will edit it, and the next
regeneration discards the work silently — nobody finds out until the behaviour
reappears. The header is the only warning that arrives in time, because it is
in the file the agent already has open. Edit the generator and regenerate.

This repository's `Dockerfile` is produced by `prompts/generate-dockerfile.md`
and currently carries no such header.

```sh
# Generated by prompts/generate-dockerfile.md via `mise run generate:dockerfile`.
# Do not hand-edit: edit the prompt and regenerate.
```

## 4. The task contract

| Task | Must do | Must not |
| --- | --- | --- |
| `install` | Everything needed before `lint` and `test` can run | Require a follow-up command |
| `dev` | The loop a person or agent runs while working | Depend on state only present locally |
| `lint` | Every static check, exiting non-zero on any violation | Swallow failures with `\|\| true` |
| `test` | Every test and typecheck, exiting non-zero on failure | Require secrets that only exist on a laptop |
| `deploy` | Deploy, or state plainly that there is nothing to deploy | Be absent |

## 5. References

[1] Bradner, S., *Key words for use in RFCs to Indicate Requirement Levels*,
BCP 14, RFC 2119, March 1997.

[2] The Focus AI, `STD-001` — How a standard is written. In force.

[3] The Focus AI, `STD-005` — Agent environment bootstrap. Draft.

[4] The Focus AI, `STD-007` — Secrets and credentials. Draft.

[5] The Focus AI, `best-practices/fnox-secrets.md` — the fnox and 1Password playbook.
