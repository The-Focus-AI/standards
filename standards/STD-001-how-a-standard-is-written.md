---
standard: "001"
title: How a standard is written
category: Process
status: In force
issued: "2026-07-25"
revision: R1
applies-to: Every document in standards/
author: W. Schenk
---

## 1. Introduction

The Focus AI publishes what it currently believes about building software, and
distributes those documents to every repository that runs an agent. Agents read
them while planning and writing tickets. This standard specifies how such a
document is written, so that a person and a parser get the same answer from it.

It follows the practice of RFC 2223 [1]: the document describing the format is
itself a document in the series, and conforms to its own rules. If this file
stops rendering, the format has drifted.

**Out of scope.** This standard does not say what the documents look like —
`DESIGN.md` covers colour, type, layout, and voice. It does not cover where
standards are published or how they are distributed to the fleet.

## 2. Requirements language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** and **MAY** in
this document are to be interpreted as in RFC 2119 [2]. A clause marked
**DEPRECATED** was normative in an earlier revision and is retained so that
repositories still running it can find out what replaced it.

## 3. Requirements

### 3.1

Every standard MUST open with YAML frontmatter carrying `standard`, `title`,
`category`, `status`, `issued`, `revision`, `applies-to` and `author`.

`obsoletes` is optional and is present only when this document replaces another.
A field with no value is omitted rather than left empty — an empty field renders
as a fact nobody asserted.

```yaml
---
standard: "014"
title: Preview deployments on pull requests
category: Practice
status: In force
issued: "2026-07-14"
revision: R3
obsoletes: STD-009
applies-to: Web repositories
author: W. Schenk
---
```

### 3.2

The `category` field MUST be one of `Practice`, `Process` or `Guide`.

A **Practice** binds repositories and is written as clauses. A **Process**
describes how the organisation works and is also written as clauses — this
document is one. A **Guide** is long-form explanation with no binding clauses:
a reference implementation walkthrough is a Guide, and forcing it into
requirement levels would damage it.

Routing and index documents are not standards and do not live in `standards/`.

### 3.3

The `status` field MUST be one of `Draft`, `In force` or `Obsoleted`.

Category and status are separate axes. A Guide can be in force; a Practice can
be a draft. Collapsing them into one field was a defect in the first cut of
`DESIGN.md` and is corrected here.

### 3.4

A standard whose category is `Practice` or `Process` MUST contain at least one
clause, and every clause MUST carry a requirement level.

The level is not written twice. It is read from the first RFC 2119 keyword in
the clause's opening sentence, which keeps one source of truth and makes a
level-less clause a rendering failure rather than a silent omission. A clause
that cannot be given a level is not a clause — it is commentary, and belongs in
a note or an introduction.

### 3.5

A clause MUST be introduced by a level-three heading containing only its number,
optionally followed by `DEPRECATED`.

The number is `<section>.<index>` and is the citable address of the requirement:
`STD-014 §3.2`. Numbers are never reused, and a deleted clause is marked
DEPRECATED rather than removed, so that a citation written last year still
resolves.

````markdown
### 3.2

The preview URL MUST be published as a check, not a comment.

Comments scroll away under review threads; checks stay pinned to the head
commit.

```sh
gh api repos/:owner/:repo/statuses/$SHA -f state=success -f context=preview
```
````

### 3.6

The first paragraph after a clause heading MUST be the normative sentence, and
it MUST state one requirement.

Everything after it is a note: reasoning, exceptions, and consequences. The
split is structural, not stylistic — the renderer sets the normative sentence
apart, and an agent extracting requirements reads first paragraphs only. Two
requirements in one clause means one of them cannot be cited.

### 3.7

A shell code block inside a clause MUST be the command that satisfies it.

This is the Actionable trait made structural: `sh`, `bash`, `zsh`, `shell` and
`console` blocks render as the runnable command, and a block in any other
language renders as an illustration rather than something the reader can run.
The distinction was found by rendering this document, which labelled its own
frontmatter example as a command — the first draft of this clause said "a fenced
code block" and was wrong. A clause with no command is permitted; a clause whose
command does not satisfy it is a defect.

### 3.8

Every standard MUST contain a section stating the requirements language and
citing RFC 2119.

This is boilerplate, and it is what earns the document the right to say MUST.
The frame is where provisionality lives; the clause does not equivocate.

### 3.9

Every standard MUST state what it does not cover.

An unstated boundary becomes someone else's wrong assumption, and an agent
planning work needs to know where a standard stops. The scope exclusion sits at
the end of the introduction, in bold.

### 3.10

A standard SHOULD cite other standards by reference, not by file path.

`STD-007 §2.1` survives a file being renamed; `@security.md` does not. The
`@file.md` form currently used across `best-practices/` is an agent-tool
convention and SHOULD be replaced during migration.

### 3.11

A revision MUST NOT change what an existing clause number means.

A revision may freely change wording, add clauses, or deprecate clauses — what it
may not do is renumber, because that breaks every citation written against the
old revision. A requirement whose meaning changes gets a new number, and the old
one is marked DEPRECATED with a pointer to its replacement.

### 3.12

A demonstration MUST carry the text an agent receives from raw source.

Standards are authored as markdown and may be rendered as MDX with live
components. A demonstration that only works rendered is invisible to the primary
reader, which is the agent.

## 4. File layout

Standards live in `standards/`, one file per document, named
`STD-<number>-<slug>.md`. Guides that are not standards remain in
`best-practices/`.

Render and check conformance with:

```sh
mise run standard:render
```

The renderer refuses to emit a page for a document that does not satisfy this
standard. Conformance is not a separate audit — if it renders, it conforms.

## 5. References

[1] Postel, J. and Reynolds, J., *Instructions to RFC Authors*, RFC 2223,
October 1997.

[2] Bradner, S., *Key words for use in RFCs to Indicate Requirement Levels*,
BCP 14, RFC 2119, March 1997.

[3] The Focus AI, `DESIGN.md` — visual language and voice for the standards
corpus. In force.
