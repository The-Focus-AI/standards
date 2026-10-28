---
standard: "008"
kind: standard
title: Deployment
category: Practice
status: Draft
issued: "2026-07-25"
revision: R1
applies-to: Every repository that deploys
author: W. Schenk
---

## 1. Introduction

The Focus AI deploys to Vercel, to Cloud Run and App Engine, and to a
self-hosted GCE runtime. Three platforms, three guides, and — it turns out —
one set of rules underneath them: name the target explicitly, keep configuration
per-project, pin the tooling, map the environment scopes deliberately, and never
let a preview reach production data.

This standard carries the rules common to all three. The platform guides keep
the walkthroughs, the reference implementations, and the checklists.

**Out of scope.** Vault layout and credential handling, which is `STD-007`. What
the four required tasks do, which is `STD-004`. Platform-specific mechanics,
which stay in `best-practices/GDE-010-vercel-deployment.md`,
`best-practices/GDE-005-gcp-deployment.md`, and `best-practices/GDE-004-gce-gaia-runtime.md`.
What must pass before and after a deployment — CI, preview verification,
release gates, and failure notification — is `STD-012`.

## 2. Requirements language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** and **MAY** in
this document are to be interpreted as in RFC 2119 [1]. A clause marked
**DEPRECATED** was normative in an earlier revision and is retained so that
repositories still running it can find out what replaced it.

## 3. Requirements

### 3.1

A deployment MUST name its target explicitly.

`--project`, `--region`, the scope flag — whatever the platform calls it. A
deploy that relies on ambient default configuration deploys wherever the last
command left the machine pointing, and on a laptop that works on several clients
that is a matter of time rather than probability.

### 3.2

A repository MUST use its own named cloud configuration.

Not the shared `default`. A named configuration per repository means switching
projects is `cd`, and a mistake is visible in `auth-status` rather than
discovered in production.

```sh
mise run auth-status
```

### 3.3

Deployment tooling MUST be installed through mise.

The platform CLI is a tool like any other and `STD-004 §3.1` already covers it —
restated here because every one of the three platform guides independently
records a global install as an anti-pattern, which is what a rule looks like
before it is written down.

### 3.4

A repository MUST record how its environment scopes map to secrets, databases,
and domains.

Local, preview, production. Which vault each reads, which database branch, which
auth instance, which public URL. This mapping is the thing everyone reconstructs
from memory and gets wrong, and it fits in one table in the repository's guide.

### 3.5

A build-time variable MUST be redeployed to take effect.

Variables baked at build time — `NEXT_PUBLIC_*` and equivalents — do not change
in a running deployment when the value changes upstream. Change the value, then
redeploy, then verify. Anyone who skips the redeploy is debugging the old value.

### 3.6

A production deployment MUST NOT be triggered by a pull request from a fork.

A self-hosted runner with production access attached to `pull_request` or
`pull_request_target` lets anyone who can open a pull request run code as the
runner. On a public repository this is remote code execution with a friendly
interface.

### 3.7

A deploy workflow MUST use a concurrency group that does not cancel a running
deploy.

`cancel-in-progress: false`. A half-finished redeploy interrupted by the next
one leaves a host in a state neither deploy intended, and the second deploy's
success masks it.

### 3.8

A platform that does not provide previews MUST say so where its deployment is
described.

At least one runtime here has no preview surface at all — every merge to the
default branch reaches production. That is a legitimate constraint and a
dangerous assumption, and the only safe version is the one written down next to
the deploy instructions.

### 3.9

A repository MUST state which deployment pattern it follows.

One line in `AGENTS.md` naming the platform and the guide. An agent asked to
deploy should not have to infer the platform from which config files happen to
exist.

### 3.10

An artefact deployed to production MUST be built by CI.

Not built on a workstation and pushed. A locally built image embeds whatever was
on that machine — uncommitted changes, a different toolchain version, a stale
dependency — and nothing records what actually went out.

### 3.11

A service that controls deployment or agent execution MUST NOT be reachable
without authentication.

Put it behind a proxy with a key. A control plane exposed on a raw port is
administrative access to the fleet, offered to whoever finds the port.

### 3.12

Each deploy loop MUST be documented separately, and a change to one MUST NOT be
assumed to reach another.

A repository with more than one deployment path — a SaaS surface, an agent
fleet, a scheduled job — has that many loops. Changing an environment variable
in one and assuming the others rebuilt is the most common way a deploy appears
to have worked.

### 3.13

A deploy workflow MUST be path-filtered.

Without a filter, a documentation change cycles the fleet. On a self-hosted
runner that is ten minutes of production churn for a typo fix, and it trains
everyone to ignore deploy notifications.

### 3.14

A repository MUST expose the platform tasks its deployment requires as mise
tasks.

`STD-004 §3.3` fixes the universal four; a platform adds its own. Whatever the
platform needs — authenticating, checking which target is active, syncing
secrets, tailing logs — is a named task rather than a command someone remembers.

```sh
mise run auth-status     # which project am I pointed at
mise run vercel:sync -- --env preview
```

## 4. References

[1] Bradner, S., *Key words for use in RFCs to Indicate Requirement Levels*,
BCP 14, RFC 2119, March 1997.

[2] The Focus AI, `STD-004` — Repository tooling and tasks. Draft.

[3] The Focus AI, `STD-007` — Secrets and credentials. Draft.

[4] The Focus AI, `STD-012` — Testing and deployment. Draft.
