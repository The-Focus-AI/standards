# Prompt: Develop a DESIGN.md (Brand + Design System) for a Project

Use this prompt to take a project from "we have no visual identity" (or "our
identity lives in someone's head") to a committed `DESIGN.md` that any coding
agent can read and apply consistently. The process combines the `grill-me`
skill (to extract brand decisions from the user) with the `prototype` skill
(to make those decisions concrete and comparable before writing anything
down).

## What a DESIGN.md is

A `DESIGN.md` is a single markdown file describing a project's visual language
in a form AI coding agents can act on. It sits between a Figma export (too
specific) and a traditional brand book (too loose). The reference
specification is [google-labs-code/design.md](https://github.com/google-labs-code/design.md):

- **YAML frontmatter** — machine-readable, normative design tokens:
  `name`, `description`, `colors`, `typography`, `rounded`, `spacing`, and
  `components`. Tokens may reference other tokens with `{path.to.token}`
  syntax (e.g. `backgroundColor: "{colors.primary}"`).
- **Markdown body** — human-readable rationale in `##` sections, in this
  order: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes,
  Components, Do's and Don'ts. Prose explains *why* tokens exist and gives
  agents semantic anchors ("graphite ground", "signal red reserved for
  irreversible actions") for decisions the tokens don't cover.
- We extend the spec with two Focus sections after Do's and Don'ts:
  **Voice & Tone** (a concrete writing rulebook — numbered rules, banned
  words, before/after rewrites — see Phase 3) and **Agent Prompt Guide**
  (reusable snippets for prompting future UI work).

A good DESIGN.md is specific enough that two different agents produce visually
consistent UI, and flexible enough to cover situations it never mentions.
See `The-Focus-AI/focus-ai-brand` for a house example of the genre.

## Inputs to gather first (research, don't ask)

Before interviewing the user, discover what already exists. Facts are your
job; only decisions belong to the user.

1. Existing materials: current site/app screenshots, logos, prior decks,
   CSS/Tailwind config, any `focus-ai-brand` or other brand skill installed
   in the repo.
2. The audience and product surface: what does this project ship (marketing
   site, dashboard, CLI docs, PDF reports)? Which surfaces will consume the
   DESIGN.md?
3. Competitor/aspiration references if the user has named any.

Then sort every Phase 1 decision branch into one of two bins — this
determines how it gets asked:

- **Evidenced** — the repo already embodies the decision (a palette shipped
  in `globals.css`, a prior design verdict in an ADR). Present these as
  one-line confirmations with the evidence attached ("the palette in
  `globals.css` is warm-grey + orange — keep it?"). These resolve in four
  words.
- **Open** — nothing in the repo has a point of view (typically typography
  and positioning nuance). Never ask these as abstract adjective questions;
  route them to Phase 2 where the user reacts to rendered artifacts. Taste
  questions need something to look at.

## Phase 1 — Grill the brand (grill-me)

**Unattended-session rule.** The interview is the point of this phase —
never silently substitute repo evidence for it. If the user may not be
present, ask the first grill question and stop. If the task explicitly
requires delivering autonomously, label every choice a veto-able
recommendation and lead the final report with the decision log (what was
assumed and why), not the deliverable. Evidence tells you what exists; only
the user can tell you what it should feel like.

Run the `grill-me` skill. Interview one question at a time, always with your
recommended answer, until shared understanding is reached. Plain-prose
questions and screenshot reactions beat structured option dialogs; accept
short answers ("keep it", "V1 but denser") as confirmations. Walk these
branches in order — later branches depend on earlier answers:

1. **Positioning** — What is this product, for whom, and what should someone
   feel in the first five seconds? What one word must the UI never evoke?
2. **Personality** — Pick 3–5 personality traits (e.g. precise, warm,
   playful, authoritative). For each, ask for a brand the user thinks
   embodies it. Voice stays fixed; tone adapts per surface.
3. **Atmosphere** — Light or dark default? Dense or airy? Editorial or
   utilitarian? Rounded or sharp? Flat or elevated?
4. **Color feelings** — Not hex values yet: warm vs cool, muted vs vivid,
   one accent or several, any colors that are off-limits (cliché, competitor,
   accessibility). (Typography is deliberately *not* asked here — it is an
   open-bin taste decision that resolves in Phase 2 against rendered
   compositions, not adjectives.)
5. **Voice rulebook** — Beyond traits: which writing creed governs the copy
   (Orwell's six rules, Strunk & White's "omit needless words", or the
   user's own)? Which words are banned outright (e.g. leverage, seamless,
   supercharge, excited to announce)? How do errors speak — apologetic,
   factual, or instructive? Are contractions, jokes, and exclamation marks
   allowed, and where?
6. **Non-negotiables** — Accessibility floor (WCAG AA minimum), existing
   logo/colors that must be honored, print/PDF needs, dark-mode requirement.
   Ask density per surface explicitly — mobile and desktop may want
   opposite answers (kneeboard-dense phone, spacious desktop is a real
   pattern).

Confirm branch-by-branch as you go; a final all-at-once summary gate is
optional and usually redundant. Do not start Phase 2 with any branch
unresolved unless it is explicitly parked as "decide against artifacts."

## Phase 2 — Prototype contrasting directions (prototype)

Run the `prototype` skill, UI branch. This is throwaway code that answers one
question: **"Which visual direction is right?"**

Pick the venue by what the round is testing:

- **Visual-language rounds** (which direction, which type treatment):
  build a self-contained static HTML specimen and publish it where the user
  can click through on any device (an artifact, a static host). No dev
  server, instant republish, fastest possible react-and-revise loop.
- **Integration rounds** (does the chosen direction survive contact with
  real chrome and real data): an in-repo route behind the project's dev
  server, judged against actual app conventions.

Rules for the variants:

- Build a single-route specimen page with 3–4 **contrasting** design
  directions, switchable via URL parameter (`?variant=a|b|c|d`). Contrasting
  means genuinely different interpretations of the Phase 1 answers, not one
  design with different accent colors.
- **Typography is decided here, as a composition question.** Type variants
  must differ in layout signature, grid, spacing rhythm, and detailing —
  four font families swapped onto an identical layout is the same design
  four times, and the user will (rightly) reject the whole round. A
  typeface only reads as a direction when the composition around it
  changes too.
- Draw faces and moves from `reports/2026-07-23-creative-typography.md`:
  anchor each variant in a different personality group (editorial drama,
  characterful grotesk, weird display, mono-led), never a system-stack or
  AI-default face as display, and give every variant a named signature
  move. The note's "checkable anti-boring rules" belong in the final
  DESIGN.md's typography section.
- **Specimens mock faces from descriptions, and say so.** Early rounds
  don't need font files: use the approximation recipes in the typography
  note (each face described sharply enough to fake its silhouette — family
  stack, weight, case, tracking, leading together, not just a family
  swap), and print the approximation in the specimen's own chrome
  ("rendered in fallback; spec face is Le Murmure"). A silent fallback is
  a wrong answer the user can't see they're approving. Only a
  high-fidelity final round embeds the real woff2 — into the published
  specimen or the project's repo, never into standards. The DESIGN.md
  itself always names the real face, its license, and its mock recipe, so
  any agent can approximate it without the file.
- **Never propose the AI-default looks** unless the user explicitly asks for
  one: warm cream ground + serif display + terracotta/clay accent (the
  ubiquitous "Claude look"), near-black with a lone acid-green pop, or a
  purple-to-blue gradient hero on white. If a variant drifts toward one of
  these, replace it before showing the user.
- Each variant must render the same realistic content so directions are
  comparable: full type scale specimen, color roles in use, buttons in all
  states, a form, a card, a nav, and one representative product screen with
  real-feeling copy (no lorem ipsum).
- Display the variant's would-be tokens (colors, fonts, radii, spacing scale)
  visibly on the page — the prototype should expose its own state.
- One command to run via the project's task runner. In-memory only, no
  persistence, no tests, no polish.
- Commit the prototype to a throwaway branch with a note linking back to
  this effort.

Then grill again, briefly: which variant wins, what to steal from the losers,
what still feels wrong. Iterate the variants until the user says "that's it."
Two or three rounds is normal; more means Phase 1 missed a decision — go back
and grill that branch.

## Phase 3 — Distill into DESIGN.md

Write `DESIGN.md` at the project root from the winning prototype:

1. Extract the exact values from the winning variant into YAML frontmatter
   tokens. Name tokens by purpose (`button-primary-hover`), not by abstract
   level (`blue-500`).
2. Write the prose sections in spec order. Every rule in the prose should
   trace to either a Phase 1 decision or something observed in the prototype
   ("the dense table variant lost — default to airy spacing").
3. Do's and Don'ts: capture what the losing variants got wrong as explicit
   don'ts, with the on-brand alternative beside each.
4. Voice & Tone — write it as a **rulebook, not a mood board**, in the
   tradition of Orwell's six rules and Strunk & White. It must contain:
   - The 3–5 personality traits, each with one sentence on what it forbids
     (a trait that forbids nothing is decoration).
   - **5–8 numbered writing rules**, imperative and checkable, e.g. "Never
     use a long word where a short one will do", "Cut every qualifier:
     very, really, just, simply", "Verbs first: say what happened, not how
     you feel about it", "Errors state what failed and the next step — no
     apologies, no mascots". End with an escape hatch in Orwell's spirit:
     "Break any of these rules sooner than write anything barbarous."
   - A **banned-word list** with replacements (leverage → use,
     utilize → use, seamless → cut it, prior to → before,
     excited to announce → cut it and state the thing).
   - **At least five before/after rewrite pairs**, one per surface:
     marketing headline, empty state, error message, release note, and
     button label. The "before" should be a plausible off-brand sentence,
     not a strawman.
   - A per-surface tone table: how the fixed voice flexes across marketing,
     product UI, docs, and errors (e.g. jokes allowed in empty states,
     never in errors).
5. Agent Prompt Guide: 2–3 reusable prompt snippets for generating new UI
   under this system.

## Phase 4 — Validate

- Check every `{token}` reference resolves and no token is orphaned; check
  text/background pairs meet WCAG AA contrast. Write these checks as small
  scripts and keep them as **standing artifacts** next to the DESIGN.md —
  they re-run on every future edit, not just at birth.
- The real test: open a fresh agent session, give it only `DESIGN.md`, and
  ask it to build a small page that the prototype never showed. The test
  **must include a data-absent trap** — an empty state, a missing feed, a
  zero-count list. Happy-path renders hide exactly the gaps that matter;
  what the fresh agent invents when the data is gone tells you which rules
  the file is missing. If the result would pass the user's squint test next
  to the winning variant, ship it; if not, add the missing rule and retest.
- Commit `DESIGN.md`; delete or archive the prototype branch. Main keeps
  only the validated decision.

## Outputs — more than the file

Prototyping a design surfaces product decisions, not just visual ones: a
specimen cell will invent a capability the product doesn't have yet (a
cached forecast, an offline pack, a share flow). Don't let those evaporate.
End the process with three deliverables:

1. `DESIGN.md` — validated, committed.
2. A **decision log** — each branch's verdict and who made it (user answer
   vs evidenced-from-repo vs autonomous recommendation), so the next agent
   knows what is settled versus assumed.
3. A **tickets-discovered list** — every product capability the prototypes
   implied but the codebase lacks, ready for `to-tickets` or the issue
   tracker.
