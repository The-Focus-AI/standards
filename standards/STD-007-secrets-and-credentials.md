---
standard: "007"
kind: standard
title: Secrets and credentials
category: Practice
status: Draft
issued: "2026-07-25"
revision: R1
applies-to: Every repository
author: W. Schenk
---

## 1. Introduction

`STD-004` says secrets reach a process through mise, from fnox, and are never
committed. This standard says where they live before that: one vault per
project, scoped service accounts, and a hard separation between what production
holds and what anything else can read.

The rules below are mostly recovered from anti-pattern lists in four separate
deployment documents. Each was learned once, expensively, and then filed
somewhere nobody looks before making the same mistake.

**Out of scope.** How environment variables reach the process, which is
`STD-004 §3.7`. Platform deployment mechanics, which are `STD-008`. What an
agent environment may hold, which is `STD-005 §3.5`.

## 2. Requirements language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** and **MAY** in
this document are to be interpreted as in RFC 2119 [1]. A clause marked
**DEPRECATED** was normative in an earlier revision and is retained so that
repositories still running it can find out what replaced it.

## 3. Requirements

### 3.1

Every project MUST have its own 1Password vault.

The vault is the blast radius. A shared vault means every project that can read
a secret can read all of them, and the first compromised laptop decides how bad
the day is. One vault per project also makes revocation a single action.

### 3.2

A project's service account MUST be scoped to that project's vault alone.

A token that can read one vault is a contained incident. A token that can read
the account is not. Scope at creation — retrofitting scope after a token is in
circulation means rotating everything it ever touched.

### 3.3

The bootstrap token MUST live in a gitignored `.fnox/env` and MUST be recoverable
from 1Password.

`.fnox/env` holds the one credential that cannot come from fnox, because it is
what authenticates to fnox. It is gitignored, `chmod 600`, and backed up in the
vault it unlocks so that losing a laptop is an inconvenience rather than an
outage.

```sh
mise run setup        # writes .fnox/env from 1Password
mise run secrets:check
```

### 3.4

Preview and production secrets MUST NOT come from the same vault.

Separate vaults, or fnox profiles pointing at separate vaults. A preview
environment is a public URL with a guessable name and looser access; if it can
read production credentials, then so can everything that can reach it.

### 3.5

A production database MUST NOT be writable by a preview environment.

Separate branches or separate databases. Sharing one database between preview
and production means an agent testing a migration on a pull request can destroy
production data, and nothing in the review process would catch it.

### 3.6

A secret value MUST NOT be passed as a deployment flag.

Not `--set-env-vars`, not a dashboard field typed by hand, not a CI variable
with no upstream. Values go into the platform's secret store from fnox, so that
one place remains authoritative and rotation is one action rather than a search.

### 3.7

A declared but unprovisioned secret MUST be marked so that `fnox check` stays
meaningful.

`if_missing="ignore"` on anything not yet issued. A check that is permanently
red is a check everybody learns to skip, which is worse than not having one —
the first genuinely missing secret then looks exactly like the noise.

### 3.8

A leaked credential MUST be rotated, and the rotation MUST be recorded.

Recorded means a decision record per `STD-006`: what leaked, what was rotated,
what was checked afterwards. Treat runner registration tokens and service
account keys as production credentials, because they are.

### 3.9

A credential with an expiry MUST have a recorded owner and renewal date.

Client secrets on OAuth applications expire silently, and the failure is a login
outage discovered by a customer. Whoever creates one records when it dies and
who renews it.

### 3.10

A long-lived service account key file MUST NOT be used where impersonation or
workload identity is available.

A key file on a laptop or in a repository is a credential with no expiry and no
audit trail, and it survives the departure of whoever created it. Impersonation
and workload identity federation issue short-lived credentials tied to an
identity that can be revoked in one place.

### 3.11

A control-plane credential MUST NOT be distributed to a client of that control
plane.

A master API key handed to the application it administers turns any compromise
of that application into compromise of the fleet it manages. Issue the client a
credential scoped to what the client actually does.

### 3.12

A secret store MUST receive only the secrets its target needs.

Syncing an entire vault into a project that needs three values gives that
project — and anyone who can read its environment — everything else in the
vault. Review what landed after any sync.

```sh
vercel env ls
```

### 3.13

A store holding live credentials MUST be identified as such before it is
destroyed.

Rotated OAuth tokens and session state accumulate in volumes and data
directories that look disposable. Deleting one to reclaim space is how a fleet
loses credentials it cannot re-issue without the customer's involvement.

## 4. References

[1] Bradner, S., *Key words for use in RFCs to Indicate Requirement Levels*,
BCP 14, RFC 2119, March 1997.

[2] The Focus AI, `STD-004` — Repository tooling and tasks. Draft.

[3] The Focus AI, `best-practices/GDE-003-fnox-secrets.md` — the fnox and 1Password playbook.
