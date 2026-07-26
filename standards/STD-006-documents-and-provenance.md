---
standard: "006"
kind: standard
title: Documents and provenance
category: Process
status: Draft
issued: "2026-07-25"
revision: R2
applies-to: Every document in this repository
author: W. Schenk
---

## 1. Introduction

A standard is not the only durable document the fleet produces. Agents write
research notes when they investigate something, and people and agents both write
decision records when they settle a question. Both are read months later by
somebody deciding whether the ground has moved — usually another agent, usually
with no access to whoever wrote them.

They therefore need what a standard needs: a date, an author, a status, and an
honest account of what they are based on. This standard gives them the same
provenance contract without pretending they are standards. A note has no
clauses; a decision binds nothing. What they share is that an undated,
unattributed one is worse than none, because it will be believed.

The existing corpus shows the cost of not having this. Of five documents in
`reports/`, two carry frontmatter with a title, date, and topic, one has a dated
filename and nothing else, and two have neither. Nothing distinguishes a note
verified last week from one written against a tool that has since changed twice.

Guides belong here for the same reason: they are read long after they were
written, by someone deciding whether they are still true.

**Out of scope.** Standards themselves are `STD-001`. This standard does not say
what research is worth doing or how a decision is reached, only what the
resulting document must declare about itself.

## 2. Requirements language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** and **MAY** in
this document are to be interpreted as in RFC 2119 [1]. A clause marked
**DEPRECATED** was normative in an earlier revision and is retained so that
repositories still running it can find out what replaced it.

## 3. Requirements

### 3.1

Every durable document MUST open with frontmatter declaring `title`, `kind`,
`issued`, `author` and `status`.

`kind` is `standard`, `guide`, `note`, `decision`, `prompt` or `design`. `issued` and `author` are what let a reader
weigh the document; `status` is what stops them acting on something already
overtaken. The field names match `STD-001` deliberately, so one parser reads the
whole corpus.

```yaml
---
title: "skills CLI: technical implementation guide"
kind: note
issued: "2026-06-25"
author: W. Schenk
status: Current
verified: "2026-06-25"
---
```

### 3.2

A research note MUST cite its sources.

A note whose claims cannot be traced is an opinion with a date on it. Cite the
primary source — the vendor's documentation, the source file, the API response —
not a summary of it, and link it so the next reader can check whether it still
says that.

### 3.3

A research note MUST record when its claims were last checked against reality,
in a `verified` field.

`issued` says when it was written; `verified` says when someone last confirmed it
was still true. For anything documenting a third-party tool these diverge fast,
and a reader deciding whether to trust a note needs the second date far more than
the first.

### 3.4

A research note filename MUST carry its issue date in `YYYY-MM-DD` form after its
number.

`NOTE-002-2026-06-25-skills-cli-technical-guide.md`. A note is a capture of a
moment: what was true, when it was checked. The date belongs in the name because
staleness is the first thing a reader needs and `ls` should show it without
opening anything. A guide or a decision record carries no date in its name — it
is a topic that gets revised in place, and a date on it would only record when
somebody last thought about it.

### 3.5

A decision record MUST state the decision, the alternatives that were considered,
and what would change the answer.

The alternatives are the expensive part to reconstruct and the part that stops
the same argument being had twice. "What would change the answer" is what makes
the record useful when circumstances move — without it, a reader can only guess
whether the decision still applies.

### 3.6

A decision record MUST NOT be edited to reverse its decision.

Supersede it with a new record that references it, exactly as a standard is
obsoleted rather than rewritten. Editing history so that a decision was always
what we now think destroys the only evidence of how the thinking changed, which
is usually the most valuable thing in the file.

### 3.7

A superseded document MUST carry `status: Superseded` and name what replaced it.

The replacement is what a reader landed on the old document actually needs. A
document marked superseded with no forward pointer sends them to search, and
they will find the old one again.

### 3.8

A document that records a decision an agent made autonomously MUST say so.

Provenance includes who decided. A choice an agent made under stated assumptions
and a choice a person made are different kinds of fact, and the first is the one
worth revisiting first when something turns out wrong.

### 3.9

Content moved between documents MUST be carried over, not summarised from
memory.

Migration copies; it does not paraphrase. When rules are lifted out of a guide
into a standard, the guide keeps its walkthrough intact — the commands, the
flags, the reasons a setting exists. This clause was written immediately after
its own violation: `deployment.md` was replaced by a hand-written summary and
lost all fifteen of its procedural details, including a shell activation line
whose absence would silently break secret resolution. Diff the old file against
the new one before deleting anything.

```sh
git show HEAD:path/to/old.md > /tmp/old.md && diff /tmp/old.md path/to/new.md
```

### 3.10

Every durable document MUST carry a `number` field and MUST lead its filename
with its class prefix and that number.

`GDE-002`, `NOTE-005`, `ADR-001`, `PRM-001` — the prefixes are fixed by section
4. A number is an address that survives a retitling, which a slug does not: a
guide renamed from `deployment` to `local-environment` is the same document, and
a citation written against it should not die of that. The prefix is part of the
address because `GDE-002` and `STD-002` are different documents, and a bare `002`
in a sentence tells a reader nothing. A standard carries its number in the
`standard` field instead, per `STD-001 §3.18` — the same fact under the name it
was given first.

The design document is the one exception: it is a singleton at a fixed path,
cited everywhere as `DESIGN.md`, and a number on a class with one member
addresses nothing that the path does not already address.

### 3.11

A number MUST NOT be reassigned once issued.

Numbers are identity, not order. A retired document keeps its number and its
status says it is retired; the next document takes the next free number. Reusing
one makes every citation written before the reuse resolve to the wrong document,
silently, which is worse than a citation that resolves to nothing.

### 3.12

Every skill under `skills/` MUST be registered in `skills/VENDORED.md` with a
unique `SKL` number.

The number cannot live in `SKILL.md`: the skills CLI owns that frontmatter, and a
second schema in it would break installation. So the register is a separate file,
and a register nothing checks is a register that drifts — `mise run skills:check`
fails when a skill on disk is unregistered, registered twice, or shares a number.
A skill is still installed and cited by name; the number is what the published
site addresses it by.

```sh
mise run skills:check
```

## 4. Document classes

| Kind | Lives in | Filename | Status values |
| --- | --- | --- | --- |
| `standard` | `standards/` | `STD-nnn-slug.md` | `Draft`, `In force`, `Obsoleted` |
| `guide` | `best-practices/` | `GDE-nnn-slug.md` | `Current`, `Superseded` |
| `note` | `reports/` | `NOTE-nnn-YYYY-MM-DD-slug.md` | `Current`, `Superseded` |
| `decision` | `architecture/` | `ADR-nnn-slug.md` | `Proposed`, `Accepted`, `Superseded` |
| `prompt` | `prompts/` | `PRM-nnn-slug.md` | `Current`, `Superseded` |
| `skill` | `skills/<name>/` | `SKILL.md`, numbered `SKL-nnn` in the register | — |
| `design` | repository root | `DESIGN.md` | `Current`, `Superseded` |

A standard carries four more fields on top of these — `standard`, `category`,
`revision`, `applies-to` — specified by `STD-001 §3.18`. Everything else in the
table needs only the five plus `number`.

**Skills are numbered but not on the frontmatter axis.** `skills/<name>/SKILL.md`
carries the frontmatter the skills CLI requires (`name`, `description`), and
imposing a second schema on it would break installation. Their numbers and
provenance therefore live in `skills/VENDORED.md`, which is the skill register
(3.12). The directory name stays the skill's installable identity — `skills add`
takes a name, not a number.

**Outside this axis entirely.** `AGENTS.md` and `README.md` are navigation read
by external tooling, and `skills/VENDORED.md` is the register rather than a
document in the corpus. Neither is a defect — they are formats this repository
does not own, and an index of a class cannot be a member of it.

A **guide** is long-form explanation with no binding clauses: a walkthrough, a
reference implementation, an inventory. `STD-001 §3.2` originally listed Guide
as a category of standard; that was obsoleted in R2, because a guide is a
different kind of document rather than a weaker standard. A guide that contains
rules has a standard trapped inside it.

A decision record carries no date in its filename because it is cited by number
and its date is in its frontmatter; a note does, because notes are read as a
timeline and decisions are not.

## 5. References

[1] Bradner, S., *Key words for use in RFCs to Indicate Requirement Levels*,
BCP 14, RFC 2119, March 1997.

[2] The Focus AI, `STD-001` — How a standard is written. In force.
