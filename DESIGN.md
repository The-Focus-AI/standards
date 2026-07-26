---
title: "The Focus AI Standards design system"
kind: design
issued: "2026-07-25"
author: W. Schenk
status: Current
name: "The Focus AI Standards"
description: >-
  The register of standards for a fleet of agents, set as an early RFC.
  Cool near-white stock, level bands that classify every clause, a mono
  header block that makes provenance unavoidable, and four accents with
  non-transferable jobs. Humble in the frame, absolute in the clause.
colors:
  page: "#e4e7e4"
  sheet: "#f1f3f0"
  ink: "#141a17"
  muted: "#5c6560"
  line: "rgba(20, 26, 23, 0.16)"
  line-strong: "rgba(20, 26, 23, 0.42)"
  action: "#1f5fa8"
  action-text: "{colors.sheet}"
  in-force: "#1f6b44"
  attention: "#a8451c"
  agent: "#2c5560"
  focus-ring: "{colors.action}"
typography:
  display:
    fontFamily: '"Barlow Condensed", "Arial Narrow", "Liberation Sans Narrow", system-ui, sans-serif'
    fontWeight: 600
    letterSpacing: "0.03em"
    textTransform: uppercase
    lineHeight: 0.95
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontWeight: 400
    lineHeight: 1.55
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontWeight: 700
    letterSpacing: "0.1em"
    textTransform: uppercase
  sizes:
    title: "clamp(1.6rem, 4.2vw, 2.3rem)"
    section: "1.15rem"
    subsection: "0.95rem"
    clause: "1.05rem"
    body: "0.9375rem"
    small: "0.875rem"
    mono-block: "0.72rem"
    micro: "0.625rem"
rounded:
  sheet: "0px"
  control: "3px"
spacing:
  base: "4px"
  scale: [4, 8, 12, 16, 24, 32, 48]
components:
  sheet:
    backgroundColor: "{colors.sheet}"
    borderColor: "{colors.line-strong}"
    borderRadius: "{rounded.sheet}"
    maxWidth: "58rem"
  rfc-head:
    typography: "{typography.mono}"
    fontSize: "{typography.sizes.mono-block}"
    textTransform: none
    letterSpacing: "0"
    borderBottom: "2px solid {colors.ink}"
    columns: "identity | attribution"
    fields: "standard, obsoletes, category, status, applies-to | author, org, issued, revision"
  rfc-title:
    typography: "{typography.display}"
    fontSize: "{typography.sizes.title}"
    textAlign: center
  status-memo:
    backgroundColor: "rgba(20, 26, 23, 0.03)"
    borderColor: "{colors.line}"
  section-head:
    typography: "{typography.display}"
    fontSize: "{typography.sizes.section}"
  section-number:
    typography: "{typography.mono}"
    color: "{colors.muted}"
  clause:
    borderColor: "{colors.line}"
    borderRadius: "{rounded.sheet}"
  level-band:
    backgroundColor: "rgba(20, 26, 23, 0.035)"
    borderBottom: "1px solid {colors.line}"
  level-tab-must:
    backgroundColor: "{colors.ink}"
    color: "{colors.sheet}"
    typography: "{typography.display}"
  level-tab-should:
    backgroundColor: "{colors.action}"
    color: "{colors.sheet}"
    typography: "{typography.display}"
  level-tab-may:
    backgroundColor: transparent
    color: "{colors.ink}"
    borderRight: "1px solid {colors.line}"
    typography: "{typography.display}"
  level-tab-deprecated:
    backgroundColor: "{colors.attention}"
    color: "{colors.sheet}"
    typography: "{typography.display}"
  clause-ref:
    typography: "{typography.mono}"
    textTransform: none
    color: "{colors.muted}"
  clause-norm:
    fontSize: "{typography.sizes.clause}"
    fontWeight: 600
    lineHeight: 1.45
  clause-note:
    fontSize: "{typography.sizes.small}"
    color: "{colors.muted}"
  agent-head:
    typography: "{typography.mono}"
    fontSize: "{typography.sizes.micro}"
    color: "{colors.agent}"
  command:
    typography: "{typography.mono}"
    backgroundColor: "rgba(44, 85, 96, 0.07)"
    borderLeft: "3px solid {colors.agent}"
    textTransform: none
    letterSpacing: "0"
  demonstration:
    borderColor: "{colors.line-strong}"
    captionTypography: "{typography.mono}"
    fallbackRequired: true
  subordinate-stamp:
    backgroundColor: "{colors.agent}"
    color: "{colors.sheet}"
    typography: "{typography.display}"
  subordinate-head:
    borderBottom: "2px solid {colors.agent}"
    fields: "class-and-number, status, relates-to | author, org, issued, verified"
  related-kindmark:
    typography: "{typography.mono}"
    color: "{colors.muted}"
  state-pip:
    inForce: "{colors.in-force}"
    draft: "{colors.muted}"
    retired: "{colors.attention}"
    subordinate: "{colors.agent}"
  register-table:
    headTypography: "{typography.mono}"
    rowBorder: "1px solid {colors.line}"
  empty-state:
    border: "1px dashed {colors.line-strong}"
  button-primary:
    backgroundColor: "{colors.action}"
    color: "{colors.action-text}"
    borderRadius: "{rounded.control}"
    typography: "{typography.display}"
    minHeight: "44px"
  button-primary-hover:
    filter: "brightness(1.08)"
  button-secondary:
    backgroundColor: transparent
    color: "{colors.ink}"
    borderColor: "{colors.line-strong}"
    borderRadius: "{rounded.control}"
    typography: "{typography.display}"
    minHeight: "44px"
  button-quiet:
    backgroundColor: transparent
    color: "{colors.action}"
  button-disabled:
    opacity: 0.5
  control:
    backgroundColor: "rgba(0, 0, 0, 0.03)"
    borderColor: "{colors.line}"
    borderRadius: "{rounded.control}"
    minHeight: "44px"
  focus:
    outline: "2px solid {colors.focus-ring}"
    outlineOffset: "2px"
  print:
    levelTab: "outlined, not filled"
    linkHref: "expanded after link text"
    breakInside: "avoid on clause and demonstration"
---

# The Focus AI Standards

## Overview

standards.thefocus.ai is the **issuing authority for a fleet**. It publishes what The Focus AI
currently believes about building agents, and those standards are distributed to every repository
that runs one. The website is not the artifact — the source document is. Agents consume it while
planning and writing tickets; the site is its citable rendering.

The primary reader is a machine. The human reads the same document.

In the first five seconds this should feel **settled and citable** — a published specification, not
a wiki page someone may have edited badly at 2am. The thing it must never evoke is **the rule with
no author and no date**: cargo cult, inherited convention, "we've always done it this way." Every
clause carries who issued it, when, what it obsoletes, and what it binds — or it does not render.

The visual language is the **early RFC**. A header block names the standard and its provenance
before the title. A *Status of This Standard* memo states plainly that the document reflects current
understanding and expects revision. Then RFC 2119 requirement levels govern every clause. This is
what lets the document be **humble in the frame and absolute in the clause**: the memo requests
comment, the clause does not negotiate. A standard can be "our current understanding" and still say
MUST, and the RFC form is the only one that holds both without flinching.

Four traits govern every choice, and each forbids something:

- **Authoritative** — states what is in force. Forbids hedging: no "consider", no "you might want
  to", no "best practice suggests".
- **Traceable** — every clause shows its provenance. Forbids the undated, unattributed rule.
- **Actionable** — every clause ships the command that satisfies it. Forbids the principle with no
  procedure.
- **Dry** — the wit lives in the fixtures, never the copy. Forbids jokes, emoji, and enthusiasm.

### Lineage

This system descends from the `DESIGN.md` of `The-Focus-AI/walking-thoughts` — the Quadrangle
survey-sheet language. What carried over is the **grammar**: strict non-transferable colour roles,
honest instruments (a field with no data is omitted, never placeholdered), depth from rules rather
than shadows, and every status colour shipping with its text label.

What did not carry over is Forest Night. That dark ground existed because Walking Thoughts is read
on a phone at dawn on a trail. Standards are read at a desk and printed, and every reference
artifact — Federal Register, RFC, lab report, field guide — is ink on paper.

Two things from the seed **retire** here, and the reasoning matters more than the fact:

- The `record` accent, because nothing on a standards site is ever recording.
- The reserved Georgia italic, because this surface has **no privileged speaker**. On the trail,
  italic serif means "the walker said this." A standard is issued by an institution, not said by a
  person. An accent or a voice with no job does not survive a transposition, and keeping one would
  be decoration — which the seed forbids.

Settled across three prototype rounds in `prototypes/standards-site-directions`: the Bulletin
direction (technical bulletin / flight rules) beat a Federal Register docket, a stamped decree, and
a green-bar field manual; the agent accent beat a hatched fill, a restored clause italic, and a
command rail; and the RFC header block replaced the instrument strip outright. Rules below that came
from a losing variant say so.

## Colors

The palette is a technical bulletin printed on cool stock: a near-white sheet on a slightly darker
page, near-black ink, and four accents with **strict, non-transferable jobs**. Colour roles are the
grammar of this system — an agent who knows nothing else about a surface should still colour it
correctly from this table.

| Token | Value | Role — and nothing else |
| --- | --- | --- |
| `page` | `#e4e7e4` | The desk. The ground the sheet sits on. |
| `sheet` | `#f1f3f0` | The document itself. Every reading surface. |
| `ink` | `#141a17` | Primary text, and the fill of a MUST tab. Never pure black. |
| `muted` | `#5c6560` | Commentary, clause notes, metadata, section numbers. |
| `line` | `rgba(20,26,23,0.16)` | Hairline rules, clause borders, table rows. |
| `line-strong` | `rgba(20,26,23,0.42)` | Sheet border, major rules, secondary-button borders. |
| `action` | `#1f5fa8` | The one primary act on the surface, links, the focus ring, and the SHOULD tab. |
| `in-force` | `#1f6b44` | A standard that binds right now; the active nav item. |
| `attention` | `#a8451c` | An obsoleted clause, or practice that has diverged. Warm, factual, not an alarm. |
| `agent` | `#2c5560` | Machine-facing material: commands, MDX source, the demonstration fallback. |

Conventions:

- **One accent, one job.** If a new job appears, extend this table deliberately — do not borrow.
- Tints are made with transparency of the accent itself (3–8% for fills, 35–50% for borders), never
  with new hex values.
- Colour is never the only signal. Every status ships its label: `In force`, `Obsoleted by STD-014`,
  `MUST`, `DEPRECATED`.
- Off-limits: pure `#000`/`#fff` on screen, cool greys, signal orange, and **purple in any role**.
  Purple for machine-facing material is the "AI glow" cliché the seed bans; `agent` is petrol for
  exactly this reason.

Measured contrast (WCAG 2.1), every pair on both grounds:

| Pair | On sheet | On page |
| --- | --- | --- |
| `ink` | 15.82 | 14.16 |
| `muted` | 5.40 | 4.83 |
| `action` | 5.77 | 5.17 |
| `in-force` | 5.80 | 5.19 |
| `attention` | 5.33 | 4.77 |
| `agent` | 7.31 | 6.54 |
| `action-text` on `action` | 5.77 | — |

Keep any new pair at ≥ 4.5:1; prefer ≥ 7:1. `mise run design:validate` re-checks every pair and
every `{token}` reference in this file.

## Typography

**Three voices, each with one job**, inherited unchanged from the seed. The mix is the brand;
swapping a voice into another's job breaks the document.

- **Display — Barlow Condensed 600, uppercase, +0.03em, line-height 0.95.** The title, section
  heads, level tabs, and button labels. Self-host latin `woff2` subsets in the app; never load from
  a CDN. `"Arial Narrow", "Liberation Sans Narrow", system-ui` is the fallback stack. **A device with
  no condensed face renders a materially different design** — where fidelity matters, check what
  actually resolved rather than trusting the stack.
- **Body — system sans, 400/700.** Introductions, clause text, commentary, references. Everything
  the document says in prose, upright.
- **Mono — ui-monospace 700.** Every measured fact and every machine-facing string: the header
  block, section numbers, clause refs, status labels, commands, captions. Uppercase with +0.1em at
  micro sizes; **natural case with no tracking** in the header block and in commands, where the
  string is a value rather than a label. Tabular numerals wherever digits align.

The fourth seed voice, **Georgia italic, is retired** — see Lineage. Do not reintroduce it to mark
emphasis, quotations, or normative text. If a genuine single speaker ever appears on this surface,
that is a deliberate extension to this file, not a local choice.

RFC 2119 keywords (`MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`) set in body weight 700 inside
clause text. They carry **no other decoration** — the capitals are the signal, and an underline
reads as a link.

Clause prose reads at line-height 1.45; body prose at 1.55; the reading measure is 68ch and never
wider.

## Layout

- **The sheet is the surface.** One document per page: header block, title, status memo, numbered
  sections, references. The sheet is `58rem` at most and sits on the darker `page`.
- **The header block comes before the title**, as in an RFC — a two-column mono grid, identity left
  (organisation, standard number, obsoletes, category, applies-to) and attribution right (author,
  organisation, date, revision). This is the traceability trait made structural: provenance is not
  a footer, it is the first thing on the page. It collapses to one column below 700px.
- **Sections are numbered** — `1.`, `2.`, `3.1` — and the number is mono, muted, and set beside the
  head rather than inside it, so it stays citable and never becomes decoration.
- **Density follows the job.** The register is a dense scannable table. A clause is airy: one
  requirement in focus, room to read it closely.
- Spacing snaps to the 4px scale.

The instrument strip from the seed **does not exist here**. It was carried through two prototype
rounds and then removed: the RFC header block states the same facts with more authority, and two
components reporting one truth is exactly the duplication this system is supposed to prevent.

## Elevation & Depth

Flat, ruled, and printed. Depth comes from rules, never shadows.

- Level 0 — the `page` ground.
- Level 1 — the sheet: `sheet` fill inside a `line-strong` border. Sections separate with rules.
- Level 2 — bordered blocks inside the sheet (clause, demonstration, status memo, empty state):
  a `line` border and at most a 3.5% ink tint. No shadow, ever.

There is no floating chrome and no modal layer in this system. If one becomes necessary, it is an
extension to this file.

## Shapes

- **The sheet and everything printed on it is square** — radius 0. Clauses, bands, demonstrations,
  tables, the status memo.
- Controls soften to 3px so tap targets do not read as paper cuts. Nothing rounds further; there are
  no pills and no chips.
- Hairline rules everywhere. A 2px ink rule closes the header block; 1px `line` separates rows.
- Dashed borders are reserved for **empty states** — a section with nothing in it.

## Components

- **Header block** — mono, natural case, two columns, closed by a 2px `ink` rule. Left: organisation
  name in bold, `Standard:`, `Obsoletes:`, `Category:`, `Status:`, `Applies to:`. Right: author,
  organisation, date, revision. A field with no value is **omitted**, not shown empty.
  **`Category` and `Status` are separate axes** and must never be collapsed into one line: category
  is the standard's class (Practice or Process), status is whether it is Draft, In force, or
  Obsoleted. A Process can be in force; a Practice can be a draft. The first cut of this file
  conflated them; `STD-001 §3.3` is the authority. Guide is **not** a category — a guide is a
  different kind of document (`STD-001 §3.17`) and carries the guide header below.
- **Title** — display, centred, `text-wrap: balance`, below the header block. One per document.
- **Status memo** — a bordered block on a 3% ink tint, headed `STATUS OF THIS STANDARD` in mono
  micro. States what the document specifies, that it requests comment, that it expects revision, and
  what it obsoletes. This block is **required on every standard** — it is what makes the absolute
  clause honest.
- **Requirements language section** — every standard defines its RFC 2119 keywords and cites the
  reference. Boilerplate, and non-negotiable.
- **Clause** — a bordered block opening with the **level band**: a reversed tab carrying `MUST`,
  `SHOULD`, `MAY`, or `DEPRECATED` in display caps, then the section ref in mono. Tab fills:
  MUST is `ink`, SHOULD is `action`, MAY is outlined in `line` on transparent, DEPRECATED is
  `attention`. Body: the normative sentence at clause size and weight 600, then the note in `muted`,
  then the command.
- **Agent block** — machine-facing material gets a mono `AGENT · …` header in `agent` and a 3px
  `agent` left rule over a 7% tint. This is the seed's annotation treatment, transposed: on the
  trail it marked the machine speaking to the walker; here it marks the document speaking to the
  machine.
- **Demonstration** — a bordered figure for MDX-embedded examples. Mono caption naming the section
  it demonstrates, the live component, and — **mandatory** — a `<details>` carrying the text an
  agent receives from raw source. A demonstration that only works rendered is invisible to the
  primary reader and is a defect.
- **Subordinate header** — the header block every non-standard document gets. A stamp in reversed
  `agent` sits above it — `GUIDE · NOT NORMATIVE`, `NOTE · A CAPTURE IN TIME`, `DECISION · NOT A
  RULE`, `PROMPT · EXECUTED, NOT READ`, `SKILL · LOADED ON DEMAND` — and the 2px rule that closes
  it is `agent` rather than `ink`. Left: organisation, the class and its number, `Status:`,
  `Relates to:`. Right: author, organisation, date, `Verified`. **Ink is authority; teal is
  everything else.** A reader who has seen one standard knows at a glance that this document is
  not one, before reading a word of it.
- **Subordinate memo** — headed `STATUS OF THIS <CLASS>`, in the status memo's shell. Generated,
  not written: every document of a class gets the same sentence about what that class is and what
  it does not do, then the standards it sits under, then the document's own provenance note lifted
  out of the body. A document under no standard says so, which is how an undecided area stays
  visible rather than quiet.
- **Related block** — the cross-reference between a standard and the documents beneath it, set
  below a hairline as chrome rather than as a numbered section, because it is generated. Mono micro
  label, mono kindmark in `muted` (`GUIDE`, `RESEARCH NOTE`, `PRACTICE`, `PROCESS`), then the link.
  A document that names more than three standards is surveying the corpus rather than sitting under
  any one of them, and is left out — a row that appears on every page says nothing.
- **Register table** — mono uppercase heads, hairline rows, ref column mono and non-wrapping,
  state column carrying a labelled pip. Obsoleted rows drop to `muted`. Wraps in an
  `overflow-x: auto` container; the page body never scrolls sideways. One table per class,
  standards first, everything else beneath in the order it binds nothing: guides, notes, decision
  records, prompts, skills.
- **State pip** — `in-force` green for a standard in force, `muted` for a draft or a proposal,
  `attention` for anything obsoleted or superseded, `agent` for the current state of a document
  that binds nothing. Green is reserved for the one thing that is actually in force.
- **Empty state** — dashed border, states plainly what is absent and why, and offers the act that
  would fix it. Never a placeholder, never an apology, never a spinner.
- **References** — numbered mono markers with the citation in body. Standards cite other standards
  by ref, not by link text alone.
- **Primary button** — `action` fill, `sheet` ink, display caps, 44px, radius 3px. **One per
  viewport.** Hover brightens 8%; disabled drops to 50% opacity and keeps its label.
- **Secondary button** — transparent with a `line-strong` border, display caps. Hover strengthens
  the border to `ink`.
- **Quiet button/link** — `action` text, no chrome, underline on hover.
- **Controls** — 3% black inset fill, `line` border, radius 3px, placeholder in `muted`. Focus:
  2px `action` outline at 2px offset, on every interactive element, no exceptions.

## Print

Standards are published as reports, so print is a first-class surface, not an afterthought.

- Level tabs become **outlined, not filled** — a reversed tab prints as a black slab and wastes
  toner. Border 1.5px `#000`, label in black.
- The sheet loses its border and background; ink goes to `#000`, muted to `#333`.
- **Link URLs expand** after their text as `<https://…>`. Internal anchors do not.
- `break-inside: avoid` on clauses and demonstrations; `break-after: avoid` on headings. A clause
  split across a page boundary is a clause someone will misread.
- Interactive chrome (search, controls) is hidden; anything it enabled is restated as plain text.
- Page margin 18mm/16mm.

## Source and rendering

The source document is the artifact and the site is its rendering, so the source has design rules of
its own.

- Standards are authored in **MDX**, which is what makes the demonstration component possible.
- The raw source must read as a complete standard with no rendering at all. Heading structure
  carries the section numbers, the header block is frontmatter, and requirement levels are literal
  uppercase keywords in the sentence — never conveyed by styling.
- Every visual affordance needs a source equivalent: a level band is a keyword in the clause text, an
  agent block is a fenced code block, a demonstration is its fallback text.
- `View MDX source` is a standing act on every standard. An agent that cannot reach the source is
  reading a picture of a standard.

## Do's and Don'ts

- **Don't** render a field with no data. **Do** omit the header-block line, the section, or the
  cell entirely. The fleet-state counts shown in prototype rounds one and two were removed for
  exactly this reason: the data does not exist yet, so the design must not assume it.
- **Don't** reintroduce the reserved italic to mark emphasis or normative text. **Do** let the level
  band and the RFC keyword carry force. A losing round-two variant set clauses in Georgia italic and
  read *soft* precisely where the document needed to read *issued*.
- **Don't** let two accents share a job, or one accent hold two. **Do** check the role table before
  introducing any coloured element.
- **Don't** use purple for machine-facing material — that is the "AI glow" cliché. **Do** use
  `agent` petrol, which is why it exists.
- **Don't** decorate an RFC 2119 keyword with underlines, colour, or a chip. **Do** set it in body
  weight 700 and let the capitals work.
- **Don't** hedge in a clause. **Do** pick a level: MUST, SHOULD, MAY, or do not write the clause.
- **Don't** publish a standard without a Status memo and a requirements-language section. **Do**
  treat that boilerplate as the thing that earns the right to say MUST.
- **Don't** ship a demonstration that only works rendered. **Do** write the agent fallback first.
- **Don't** put marketing furniture on this site — no hero, no calling card, no testimonials. **Do**
  remember there is no marketing shell: every page is the rendering of a document agents also parse.
- **Don't** add a dark mode. **Do** keep one ground; the light direction was chosen deliberately and
  a standard is ink on paper.
- **Don't** load fonts or any asset from a CDN. **Do** self-host the Barlow Condensed subsets.
- **Don't** use filled level tabs in print. **Do** outline them.

## Voice & Tone

The voice is the **early RFC**: plain, exact, and quietly self-aware about its own provisionality. It
is fixed. Tone flexes by surface — terse in the register and the header block, expansive in an
introduction or a commentary section.

The four traits, restated as what they forbid: **authoritative** forbids hedging; **traceable**
forbids the undated rule; **actionable** forbids the principle with no procedure; **dry** forbids
jokes, emoji, and enthusiasm.

### Rules

1. State what is in force. A clause says MUST, SHOULD, or MAY — never "consider", "you might want
   to", or "it's recommended that".
2. Put the humility in the frame, never in the clause. The Status memo admits the document will be
   revised; the clause underneath it does not equivocate.
3. Every clause carries its date, revision, and what it obsoletes. An undated rule is not a
   standard, it is folklore.
4. Ship the command. A clause the reader cannot act on in one step is unfinished.
5. Cut the qualifier: very, really, just, simply, basically, obviously.
6. Say what changed, not that something changed. "R3 moves preview secrets to the preview vault" —
   never "this standard has been updated."
7. State divergence as fact plus next step. No apology, no reassurance, no blaming the repository.
8. Keep the wit in the fixtures. *Category: In Force*, *Distribution is unlimited within the fleet*,
   *Obsoletes: STD-009* — dry in form, warm in effect. A joke inside a clause is a defect.
9. Say what the standard does **not** cover. Early RFCs scope themselves out loud, and an unstated
   boundary becomes someone's wrong assumption.
10. Break any of these rules sooner than write anything barbarous.

### Banned words

| Banned | Use instead |
| --- | --- |
| leverage, utilize | use |
| best practice | standard — or say what it actually is |
| seamless, effortless, robust, powerful | cut, or name the property |
| we recommend | MUST, SHOULD, or MAY |
| going forward | cut — a standard is always going forward |
| deprecated soon | give the date and the revision |
| simply, just, obviously | cut |
| please | cut |
| Note that, It should be noted that | cut and state the thing |

### Before and after

| Off-brand | On-brand |
| --- | --- |
| "It's recommended that you should probably set up preview deploys where possible." | "Every pull request MUST open a preview deployment reachable from the PR check list." |
| "Oops! 3 repos aren't compliant 😬" | "Three repositories have diverged from STD-014. Each is listed with the clause it fails." |
| "We've updated this standard with some improvements!" | "R3 — preview secrets move to the preview vault. R2 allowed production; that is now a MUST NOT." |
| "Nothing here yet! Check back soon." | "No standard issued. Three repositories have diverged practice; nothing has been reviewed." |
| "Click here to push this out to all your repos" | "Distribute revision" |
| "This is the definitive guide to previews." | "This document specifies a practice for repositories operated by The Focus AI, and requests discussion and suggestions for improvement." |

### Tone by surface

| Surface | Tone |
| --- | --- |
| Header block | Values only. No sentences. |
| Status memo | Formal, provisional, first-person-plural allowed. The one place humility is explicit. |
| Introduction | Complete sentences, room to explain why the standard exists and what it excludes. |
| Clause | One sentence, one requirement, one level keyword. No subordinate clauses. |
| Clause note | Explains the reasoning. May be wry. May not be funny. |
| Register | Terse and tabular. Fragments. |
| Empty state | Factual, directive, unapologetic. |
| Divergence | Fact plus next step. Never blame. |

## Agent Prompt Guide

**New surface:**

> Build this page for standards.thefocus.ai using DESIGN.md. Compose it as an early RFC on the cool
> near-white sheet (`#f1f3f0`) over `#e4e7e4`: mono header block first carrying standard number,
> obsoletes, category and applies-to with attribution right-aligned, closed by a 2px ink rule; then
> the centred display title; then the Status of This Standard memo; then numbered sections. Three
> type voices with fixed jobs — Barlow Condensed 600 caps for display, system sans upright for all
> prose, mono for every measured fact and machine-facing string. There is no reserved italic on this
> surface. Four accents with non-transferable jobs: `action` the one primary act plus links and
> focus, `in-force` a standard that binds now, `attention` obsoleted or diverged, `agent`
> machine-facing material. Square, flat, depth from rules only — no shadows. Every status colour
> ships its text label. Omit any field with no data rather than placeholdering it. 44px targets, 2px
> action focus ring, contrast ≥ 4.5:1.

**Clauses:**

> Render each requirement as a bordered clause opening with a level band: a reversed display-caps tab
> carrying MUST (ink), SHOULD (action), MAY (outlined) or DEPRECATED (attention), then the section
> ref in mono. Body is the normative sentence at 1.05rem weight 600 with the RFC 2119 keyword in
> body weight 700 and no other decoration, then the note in muted at 0.875rem explaining the
> reasoning, then the command that satisfies the clause under a mono `AGENT · SATISFY WITH` header
> in petrol with a 3px petrol left rule. A clause with no command shows no command block. Precede
> the clauses with a requirements-language section citing RFC 2119.

**Copy pass:**

> Rewrite this copy in The Focus AI Standards voice: early RFC — plain, exact, humble in the frame
> and absolute in the clause. Clauses take MUST / SHOULD / MAY and never "consider" or "we
> recommend". Put provisionality in the Status memo, never in the requirement. State what the
> standard does not cover. Say what changed, not that something changed. No exclamation points, no
> emoji, no apology, no enthusiasm; dry survey-fixture wit is welcome ("Distribution is unlimited
> within the fleet") but never a joke inside a clause. Cut leverage, utilize, seamless, robust,
> simply, just, please, and "note that". Never invent a value to fill a field.
