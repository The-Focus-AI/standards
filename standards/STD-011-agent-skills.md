---
standard: "011"
kind: standard
title: Agent skills
category: Practice
status: Draft
issued: "2026-10-23"
revision: R4
applies-to: Every repository worked by an agent
author: W. Schenk
---

## 1. Introduction

Skills are the capabilities an agent brings to a repository, and they are
installed rather than written into it. That makes their sources and revisions
part of repository setup, through `mise run install` rather than somebody's
memory. The current CLI needs a verification wrapper for immutable restoration;
the default project supplies one rather than trusting an exit code alone.

This standard covers how skills are installed and kept current. Which skills
belong to the standard set is an inventory that changes on its own schedule and
lives in `best-practices/GDE-008-skills.md`, not here — a list of names is data, and
putting data in a standard means revising the standard whenever the data moves.

**Out of scope.** The standard skill set itself. How to write a skill. What each
skill does.

## 2. Requirements language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** and **MAY** in
this document are to be interpreted as in RFC 2119 [1]. A clause marked
**DEPRECATED** was normative in an earlier revision and is retained so that
repositories still running it can find out what replaced it.

## 3. Requirements

### 3.1

A skill MUST be installed with the `skills` CLI.

Never by copying a directory. A hand-copied skill has no lock entry, no hash,
and no way to be restored on another machine — it works for whoever copied it
and silently does not exist for anyone else.

Use the pinned-source procedure in `GDE-008`; it records the immutable revision
required by §3.2 rather than installing the source's moving default branch.

### 3.2

Every installed skill MUST be recorded at an immutable source revision in the
committed `skills-lock.json`.

The lock records selected sources and a content hash. Do not equate that record
with enforcement: the pinned `skills@1.7.4` installer does not validate fetched
content against the recorded `computedHash` [4]. A moving branch can produce
different content and rewrite the lock during installation; there is no frozen
restore mode in the CLI. The default inventory uses full Git commit SHAs and
verifies installed bytes against the recorded hashes.

### 3.3

`mise run install` MUST verify restored skill content and completeness against
the lock without updating it.

`skills experimental_install` in v1.7.4 honors `skillPath` and `ref` for this
inventory's GitHub shorthand sources [4]. This fixes the canonical-path defect
in v1.5.13, not the missing hash enforcement. A zero exit can also leave selected
skills uninstalled. The default `scripts/restore-skills.mjs` stages installation,
checks immutable refs, canonical paths, expected names, lock drift and installed
file hashes, then publishes the verified directory. `GDE-008` owns usage and limits.

```sh
mise run install
node scripts/restore-skills.mjs --check
```

### 3.4

A lock entry name MUST be kebab-case and match its skill folder.

Title-case duplicates alongside kebab-case names produce two entries that
install the same skill twice and disagree about which is current.

### 3.5

Removing a skill MUST remove its lock entry.

In v1.7.4, `skills remove <name> -y` (alias `skills rm`) removes project files
and the project lock entry [5]. Agent-specific removal deliberately retains the
shared entry while another agent still uses it. Check the lock diff rather than
hand-editing hashes or assuming that removing one agent's link removes the skill.

### 3.6

A skill update MUST be reviewed as a diff before it is committed.

`skills update` rewrites hashes across the lock. Committing that unread accepts
a behaviour change to every agent that touches the repository, sight unseen —
the closest thing this fleet has to a supply-chain event.

### 3.7

A repository MUST NOT install a skill set wholesale from a source that carries
unrelated skills.

Adding a whole upstream collection pulls in whatever else lives there. Install
the named skills the standard set calls for, and nothing else.

### 3.8

When an upstream repository contains multiple copies or harness adaptations of a
skill, `skills add` MUST be invoked with the subpath URL of the canonical source
directory, and `skillPath` in `skills-lock.json` MUST point to that directory.

A repository that ships both a canonical skill tree and a generated adapter tree
(for example `pstack/skills/` alongside `harness/pstack/claude-code/skills/` in
`cursor/plugins`) resolves to whichever manifest the CLI reads first when cloned
from the root. Passing the subpath tree URL pins `skillPath` to the canonical
source and is checkable with `jq` against `skills-lock.json`.

### 3.9

When two upstream sources define skills with the same `SKILL.md` frontmatter
`name`, the inventory guide MUST state which source owns the lock entry, when an
agent should use each one, and the exact commands to invoke or switch to the
other.

`skills-lock.json` (version 1) is a flat map keyed by `SKILL.md` frontmatter
`name`, and `.agents/skills/<name>/` has one directory per name. Two upstream
skills with the same `name` cannot both hold lock entries at once without one
overwriting the other. Recording both in `best-practices/GDE-008-skills.md` with
the locked default, the one-shot `skills use <source> --skill <name>` command,
and the `skills add <source> -s <name>` switch command lets an agent choose
deterministically instead of guessing what is on disk.

## 4. References

[1] Bradner, S., *Key words for use in RFCs to Indicate Requirement Levels*,
BCP 14, RFC 2119, March 1997.

[2] The Focus AI, `STD-004` — Repository tooling and tasks. Draft.

[3] The Focus AI, `best-practices/GDE-008-skills.md` — the standard skill set inventory.

[4] Vercel Labs, `skills` v1.7.4,
[restore](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/src/install.ts)
and [source construction](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/src/update-source.ts).
Source and isolated CLI fixtures checked 2026-10-30. A complete 90-entry restore
from GitHub also passed the wrapper's content, completeness and unchanged-lock
checks; `GDE-008` records the scope and remaining limits.

[5] Vercel Labs, `skills` v1.7.4,
[removal](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/src/remove.ts).
