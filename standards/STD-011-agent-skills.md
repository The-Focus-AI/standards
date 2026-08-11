---
standard: "011"
kind: standard
title: Agent skills
category: Practice
status: Draft
issued: "2026-07-25"
revision: R2
applies-to: Every repository worked by an agent
author: W. Schenk
---

## 1. Introduction

Skills are the capabilities an agent brings to a repository, and they are
installed rather than written into it. That makes them a dependency like any
other: pinned, reproducible, and restored by `mise install` rather than by
someone remembering which ones a project needs.

This standard covers how skills are installed and kept current. Which skills
belong to the standard set is an inventory that changes on its own schedule and
lives in `best-practices/GDE-008-skills.md`, not here — a list of names is data, and
putting data in a standard means revising the standard whenever the data moves.

R2 rewrites §3.3 and adds §3.8. R1 §3.3 named `skills experimental_install` as the
way to restore the lock, which turned out to install nothing an agent can read: the
command writes only to `.agents/skills/`, and Claude Code loads project skills from
`.claude/skills/`. A clause that mandates a command with no effect is worse than no
clause, because it certifies the broken thing.

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

```sh
skills add The-Focus-AI/standards --skill focus-ai-brand --agent claude-code -y
```

### 3.2

Every installed skill MUST be recorded in `skills-lock.json`, and the lock file
MUST be committed.

The lock is what makes an install reproducible: it pins each skill by hash, and
it is the reason a fresh clone and a six-month-old checkout resolve to the same
capabilities. It is `package-lock.json` for agent behaviour.

### 3.3

`mise run install` MUST restore every skill in the lock, into the directory the
agent reads.

Restoring the lock is what makes `STD-004 §3.5` true for skills as well as
packages: an agent environment that has to be told to install skills separately
will be the one that was not. Restoring it somewhere the agent does not look is
the same outcome with a success message on top.

R1 named `skills experimental_install` as the way to satisfy this clause. It does
not satisfy it. As of `skills@1.5.13` that command hardcodes its targets to the
agents whose skills directory is `.agents/skills`, ignores `--agent`, and so never
writes the `.claude/skills/` that Claude Code reads. `GDE-008` carries the
replacement recipe — one `skills add … --agent <agent> -y` per source in the lock.
The clause is revised in place rather than deprecated and renumbered because this
standard is a `Draft` and nothing has cited it (`STD-001 §3.11`).

### 3.4

A lock entry name MUST be kebab-case and match its skill folder.

Title-case duplicates alongside kebab-case names produce two entries that
install the same skill twice and disagree about which is current.

### 3.5

Removing a skill MUST remove its lock entry.

`skills rm` deletes the files and leaves the entry, so the next
`experimental_install` puts it back. A skill that reappears after being removed
looks like a tooling fault and gets worked around rather than fixed.

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

An install MUST be checked against the lock, and a shortfall MUST be resolved
rather than tolerated.

The CLI drops a skill that has disappeared from its upstream repository without
saying so, and still exits 0. A lock with forty-six entries that installs
forty-five skills looks exactly like one that installs forty-six. Count them: a
shortfall is an upstream rename or deletion, and it is fixed by finding the new
name or removing the entry (§3.5), never by leaving the lock pointing at
something that is not there.

## 4. References

[1] Bradner, S., *Key words for use in RFCs to Indicate Requirement Levels*,
BCP 14, RFC 2119, March 1997.

[2] The Focus AI, `STD-004` — Repository tooling and tasks. Draft.

[3] The Focus AI, `best-practices/GDE-008-skills.md` — the standard skill set inventory.
