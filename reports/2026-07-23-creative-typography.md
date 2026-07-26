---
title: "Creative typography: research notes for DESIGN.md work"
kind: note
issued: "2026-07-23"
author: W. Schenk
status: Current
verified: "2026-07-23"
---

# Creative Typography — research notes for DESIGN.md work

Companion to the `develop-design-md` skill (Phase 2, typography-as-
composition). The goal: stop shipping type that reads as "default with a
costume on." A typeface only becomes a direction when the composition
around it changes; this note covers both halves — which faces have a point
of view, and which compositional moves give them one.

## Why the usual answers are boring

Inter, Roboto, Helvetica, Space Grotesk, and the OS system stacks are
*chrome* — they are what type looks like when nobody made a decision. The
same is now true of the AI-default pairings (serif display + cream +
terracotta; Space Grotesk on near-black). A DESIGN.md whose typography
section names one of these as the display face has not made a typographic
decision; it has declined to.

Rule of thumb: **system stacks are for tooling UI; the product's display
face must be one you had to go get.**

## Where type personality actually comes from

Not from the family name — from contrast. The axes that register:

- **Scale violence** — 4–10× jumps between display and body, not the
  polite 2× of a default type scale. A 9rem numeral next to 0.75rem labels
  is a design; a 2.4rem heading is a document.
- **Width and weight in collision** — ultra-condensed against wide, hairline
  against black, in the *same* lockup.
- **Case and spacing extremes** — tracked-out uppercase micro-labels
  (0.15em+) against tight lowercase display (-0.03em); small caps used as a
  real system, not a CSS accident.
- **Mixed families mid-headline** — an italic serif word inside a grotesk
  sentence (the editorial move); a mono fragment inside display type (the
  technical move).
- **Letterforms as image** — a masthead cropped by the viewport, vertical
  or rotated type as structure, text on a path, a drop cap that takes six
  lines. Type occupying space that "should" belong to imagery.
- **Variable axes as behavior** — weight that responds to hover, width that
  compresses as the viewport narrows, optical size doing its actual job.
  In 2025-26 this moved from stunt to standard ([Figma trends](https://www.figma.com/resource-library/web-design-trends/),
  [typographic trends 2025](https://medium.com/@gombau/typographic-trends-2025-the-thousand-forms-of-the-contradictory-208c8e61cd5b)).
- **Deliberate wrongness** — anti-design: uneven spacing, clashing faces,
  baseline shifts, "ugly" on purpose. High risk, high signature; needs a
  rulebook more than any other move, or it's just mess.

**The one-weird-font rule:** all of the personality budget goes to the
display face and its composition; the body face stays a quiet workhorse.
Two expressive faces in one system cancel each other out.

## Faces with a point of view (all free / open licenses)

Grouped by personality, not classification. Sources: [Velvetyne](https://velvetyne.fr/)
(open source, France), [Collletttivo](https://www.collletttivo.it/) (open
source, Milan), [Fontshare](https://www.fontshare.com/) (Indian Type
Foundry, free license), [OSP](http://osp.kitchen/foundry/) (open source,
Brussels), plus one-offs. Foundry surveys: [Creative Boom](https://www.creativeboom.com/resources/20-most-popular-independent-foundries-with-designers/),
[A Type of Amigo](https://atypeofamigo.com/quality-fonts-for-everyone-type-foundries-that-all-designers-should-know/).

### Editorial drama (serifs with fashion-magazine contrast)
- **Zodiak** (Fontshare) — big-contrast display serif, sharp and glossy.
- **Boska** (Fontshare) — expressive serif with claws; fashion energy.
- **Sentient** (Fontshare) — calmer, literary, beautiful true italic.
- **Giallo** (Collletttivo) — elegant curves, dramatic contrast, named for
  Italian pulp cinema.
- **Instrument Serif** (Google Fonts) — sharp small display serif; the
  least-default face still on Google Fonts.

### Characterful grotesks (sans with an accent, not an absence)
- **Clash Display / Clash Grotesk** (Fontshare) — angular, techy, built for
  large sizes ([overview](https://freebiesbug.com/free-fonts/clash-display/)).
- **Cabinet Grotesk** (Fontshare) — neo-grotesque with expressive display
  cuts ([vs Clash](https://fontalternatives.com/compare/cabinet-grotesk-vs-clash-display/)).
- **Apfel Grotezk** (Collletttivo) — round, Germanic, slightly naive; the
  brezel alternate glyphs are a signature move waiting to happen.
- **Karrik** (Velvetyne) — a grotesk with printing flaws left in;
  vernacular warmth.
- **General Sans / Switzer** (Fontshare) — the disciplined end; use for
  body under a wilder display.

### Genuinely weird (display-only, one per system, handle with rules)
- **Le Murmure** (Velvetyne) — condensed, ink-trapped, award-winning;
  library-meets-nightclub.
- **Pilowlava** (Velvetyne) — inflated blobby display; joyful and loud.
- **Trickster** (Velvetyne) — spiky occult-manuscript energy.
- **Avara** (Velvetyne) — brutal low-resolution curves, medieval-digital.
- **Basteleur** (Velvetyne) — tarot-card warmth, swashy and strange.
- **Outward** (Velvetyne) — heavy block display, three contrasting cuts.
- **VG5000** (Velvetyne) — French home-computer pixel heritage with
  modern curves.
- **Typefesse** (Velvetyne) — letters drawn as bodies; illustration-as-type.

### Monospace with character (beyond "code font")
- **Departure Mono** — pixel/terminal nostalgia at text sizes.
- **Monaspace** (GitHub) — five superfamily voices with *texture healing*;
  the "argon/krypton" cuts have real personality.
- **Steps Mono** (Velvetyne) — architectural stencil mono.
- **Courier Prime** — typewriter done properly (screenplay heritage).

### Concept-locked faces (when the direction demands it)
- **Redaction** (free, MoMA "Reconstruction" project by Titus Kaphar &
  Reginald Dwayne Betts) — degraded-photocopy serif in staged decay levels;
  made for archive/dossier directions.
- **Format 1452, Résistance, Ouvrières** (Velvetyne) — protest and print
  heritage, each with a story that can *be* the brand story.

## Pairing recipes that aren't "serif + sans"

1. **Weird display + invisible body** — Le Murmure headlines, Switzer body,
   mono micro-labels. Personality lives in one place.
2. **Editorial collision** — Zodiak display with *one word per headline*
   swapped to its italic; Cabinet Grotesk body. The swap word is the brand.
3. **Technical romance** — Sentient (literary serif) for prose, Departure
   Mono for every number and label. Instrument-panel poetry.
4. **All-mono, two voices** — Monaspace Krypton display + Monaspace Neon
   body. Monospace stops being a code affectation when it's the whole
   system.
5. **Stencil authority** — Steps Mono tracked-out uppercase labels over
   Outward display; body in General Sans. Signage, not screens.

## Checkable anti-boring rules (drop into a DESIGN.md)

1. The display face shall not appear in any OS default stack, and shall
   not be Inter, Roboto, Arial, Space Grotesk, or Space Mono.
2. Display-to-body size ratio shall be ≥ 4:1 somewhere on every major
   surface.
3. If display and body share a family, they must differ on ≥ 3 axes
   (size, weight, width, case, slant).
4. The system has exactly one expressive face; every other face is a
   workhorse.
5. Name one **signature move** (the swap-word italic, the six-line drop
   cap, the masthead crop) — a treatment recognizable from a cropped
   corner of a screenshot. If the file has no signature move, the
   typography section is not done.
6. Every face named must ship with its license noted (OFL, ITF FFL, etc.)
   and a self-hosting plan.

## Mocking a face without the file (approximation recipes)

Specimens and quick mockups don't need font binaries — and font files never
get committed to the standards repo. What an agent needs is a description
sharp enough to fake the *silhouette* from system stacks and CSS, plus a
label admitting the approximation. Recipes for the faces above:

| Face | What it actually looks like | Mock recipe (system stacks + CSS) |
| --- | --- | --- |
| Le Murmure | Ultra-condensed grotesque, tall x-height, deep ink traps at every junction; library-meets-nightclub | `"Arial Narrow", Haettenschweiler` 700, uppercase, `letter-spacing: 0.02em`, `line-height: 0.95`, skew −6° for the manifesto cut |
| Zodiak | High-contrast display serif: hairline horizontals, blade-like wedge serifs, glossy fashion energy | Georgia/`"Didot"` 700 at display sizes, `letter-spacing: -0.01em`, tight leading; italic for the drama cut |
| Boska | Serif with claws — spiky terminals, more aggressive than Zodiak | Same base as Zodiak but add `font-stretch: condensed` where honored and tighter tracking |
| Clash Display | Angular techy grotesk: flat-sided rounds, abrupt terminals, built for large sizes | `"Helvetica Neue"` 700, `letter-spacing: -0.03em`, sizes ≥ 40px only |
| Cabinet Grotesk | Neo-grotesque with quirky display cuts, generous x-height | System sans 800, `letter-spacing: -0.02em`, slightly loose leading |
| Apfel Grotezk | Round, Germanic, a little naive; circles barely modulated | `Verdana`/`"Trebuchet MS"` 700 with `letter-spacing: 0.01em` — the extra width reads as the roundness |
| Pilowlava | Inflated blob display — letters look pumped full of air | `"Arial Rounded MT Bold", "Verdana"` 900, `letter-spacing: 0.04em`; use sparingly, one word at most |
| Special Elite / Redaction | Typewriter with ribbon bleed / photocopy decay; institutional, worn | `"Courier New"` 700, uppercase for display; add `text-shadow: 0 0 0.5px currentColor` for ink spread |
| Departure Mono | Pixel-grid terminal mono, charming at small sizes | `ui-monospace` at 11–12px, `letter-spacing: 0.08em`, lowercase labels |
| Monaspace (Argon/Krypton) | Humanist/mechanical mono superfamily, texture-healed | `ui-monospace` with normal tracking; vary weight, not family |
| Instrument Serif | Sharp small display serif, almost engraved | Georgia 400 at large sizes with `letter-spacing: 0.01em` — the lightness is the point |

Two rules when mocking:

1. **Label it.** The specimen's own chrome says "rendered in fallback;
   spec face is Le Murmure." A silent approximation is a wrong answer the
   user can't see they're approving.
2. **Mock the composition, not just the family.** The recipes above only
   read as their faces when the size, case, tracking, and leading come with
   them — Arial Narrow at 16px lowercase is not a Le Murmure mock, it's
   Arial Narrow.

When a round graduates to high fidelity (final direction bake-off, client
presentation), *then* pull the real woff2 from the foundry and embed it as
a data URI in the published specimen — sizes and licenses are in the
delivery notes below. The binary lives in the published artifact or the
project's own repo, never in standards.

## Delivery notes (agents, mind the sandbox)

- **Apps**: self-host woff2 (Fontshare and Velvetyne provide files;
  licenses permit it). Subset with `pyftsubset` — a Latin-basic subset of
  a display face is typically 15–40 KB.
- **Artifacts / CSP-locked previews**: no font CDNs. Embed the subset as a
  `@font-face` data URI, or accept the system-stack approximation and say
  so in the specimen ("rendered in fallback; real face is Le Murmure").
  Never let a silent fallback pass as the real design.
- **Variable fonts**: prefer the variable file when animating axes;
  static cuts when not — cheaper and more predictable.

## How this feeds the process

In Phase 2 type rounds, anchor each of the 3–4 variants in a *different
personality group* from the list above (one editorial-drama, one weird
display, one mono-led, …), each with its own layout signature per the
composition rules. That guarantees the round tests directions, not font
swaps — the failure mode the retrospective flagged.
