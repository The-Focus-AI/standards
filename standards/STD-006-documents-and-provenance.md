---
standard: "006"
title: Documents and provenance
category: Process
status: Draft
issued: "2026-07-25"
revision: R1
applies-to: Research notes and decision records in every repository
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

`kind` is `note` or `decision`. `issued` and `author` are what let a reader
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

A research note filename MUST begin with its issue date in `YYYY-MM-DD` form.

`2026-06-25-skills-cli-technical-guide.md`. The directory then sorts into a
timeline, and staleness is visible from `ls` without opening anything. Two of the
five notes in this repository already do this; the convention is being recorded,
not invented.

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

## 4. Document classes

| Kind | Lives in | Filename | Status values |
| --- | --- | --- | --- |
| `note` | `reports/` | `YYYY-MM-DD-slug.md` | `Current`, `Superseded` |
| `decision` | `architecture/` | `slug.md` | `Proposed`, `Accepted`, `Superseded` |
| standard | `standards/` | `STD-nnn-slug.md` | see `STD-001 §3.3` |

A decision record is not date-prefixed because it is cited by name and its date
is in its frontmatter; a note is, because notes are read as a timeline and
decisions are not.

## 5. References

[1] Bradner, S., *Key words for use in RFCs to Indicate Requirement Levels*,
BCP 14, RFC 2119, March 1997.

[2] The Focus AI, `STD-001` — How a standard is written. In force.
