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

## Phase 1 — Grill the brand (grill-me)

Run the `grill-me` skill. Interview one question at a time, always with your
recommended answer, until shared understanding is reached. Walk these
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
   accessibility).
5. **Typography vibes** — Serif/sans/mono roles, geometric vs humanist,
   how loud headlines should be.
6. **Voice rulebook** — Beyond traits: which writing creed governs the copy
   (Orwell's six rules, Strunk & White's "omit needless words", or the
   user's own)? Which words are banned outright (e.g. leverage, seamless,
   supercharge, excited to announce)? How do errors speak — apologetic,
   factual, or instructive? Are contractions, jokes, and exclamation marks
   allowed, and where?
7. **Non-negotiables** — Accessibility floor (WCAG AA minimum), existing
   logo/colors that must be honored, print/PDF needs, dark-mode requirement.

Do not proceed until the user confirms the summary of these decisions.

## Phase 2 — Prototype contrasting directions (prototype)

Run the `prototype` skill, UI branch. This is throwaway code that answers one
question: **"Which visual direction is right?"**

- Build a single-route specimen page with 3–4 **contrasting** design
  directions, switchable via URL parameter (`?variant=a|b|c|d`). Contrasting
  means genuinely different interpretations of the Phase 1 answers, not one
  design with different accent colors.
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

- Check every `{token}` reference resolves and no token is orphaned.
- Check text/background pairs meet WCAG AA contrast.
- The real test: open a fresh agent session, give it only `DESIGN.md`, and
  ask it to build a small page that the prototype never showed. If the result
  would pass the user's squint test next to the winning variant, ship it.
  If not, the file is missing a rule — add it and retest.
- Commit `DESIGN.md`; delete or archive the prototype branch. Main keeps
  only the validated decision.
