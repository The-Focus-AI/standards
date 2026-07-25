# Prototype: standards.thefocus.ai Direction Round 1 (THROWAWAY)

Throwaway prototype built per `prompts/develop-design-md.md` Phase 2, to answer:
**"Which visual direction should standards.thefocus.ai take?"**

## Where this came from

The seed is the `DESIGN.md` from `The-Focus-AI/walking-thoughts` — the
Quadrangle survey-sheet language. What carries over is the *grammar*, not the
skin:

- strict, non-transferable colour roles (one accent, one job)
- one typographic voice reserved for a single speaker
- honest instruments — a field with no data is omitted, never placeholdered
- depth from rules and neatlines, never shadows
- every status colour ships with its text label

What does **not** carry over is Forest Night. The dark ground existed because
Walking Thoughts is read on a phone at dawn on a trail; standards are read at a
desk, and every artifact in the reference set (Federal Register, RFC, lab
report, field guide) is ink on paper.

The transposition that makes the seed work here: on the trail the reserved
italic-serif voice is *the walker*. On a standards site the equivalent reserved
voice is **the normative rule itself** — the MUST/SHOULD clause — with
everything else annotating it.

## Settled before prototyping (Phase 1 grill)

| Branch | Verdict |
| --- | --- |
| Positioning | Issuing authority for a fleet. The markdown is the artifact; the site is its citable rendering. Primary reader is an agent; the human reads the same document. No marketing shell. |
| Never evoke | The rule with no author and no date — cargo cult, inherited convention. Every rule shows who issued it, when, what it supersedes, and which repos it binds, or it does not render. |
| Personality | **Authoritative** (no hedging) · **Traceable** (no undated rule) · **Actionable** (every clause ships its command) · **Dry** (wit in the fixtures, never the copy) |
| Atmosphere | Light, no dark mode. Square. Flat and ruled. Utilitarian. Density follows the job — dense register, airy clause. |
| Open | Stock and accent — **this round decides it.** |

## The four directions

Each answers "what kind of bureaucratic document is a standard?" differently,
and each has its own stock, grid, display personality group, and signature move —
not four fonts on one layout.

| Variant | World | Display group | Signature move | Accents |
| --- | --- | --- | --- | --- |
| `register` | Federal Register · the daily docket | mono-led / stencil | The marginal docket numeral | 4 |
| `bulletin` | Bell Labs / NASA flight rules | characterful grotesk | The level band (MUST/SHOULD tab) | 3 |
| `decree` | The issued order, stamped | editorial drama | The stamp + countersignature block | 2 |
| `fieldguide` | Haynes manual · green-bar bench copy | weird display | The command rail | 4 |

`bulletin` deliberately runs one accent short — agent material is signalled with
a hatched fill instead of a fourth hue, to test whether the role table needs
colour at all. `decree` runs near-monochrome on the theory that authority needs
no colour, so only the stamp is chromatic.

Quadrangle's fifth accent (`record`) retires in all four: nothing on a standards
site is ever recording, and an accent with no job does not survive the
transposition.

## Faces

Named but **not embedded** — font binaries stay out of the standards repo. Each
variant's meta strip states its spec face and the fallback actually rendering,
per the anti-silent-fallback rule and the mock recipes in
`reports/2026-07-23-creative-typography.md`.

| Variant | Spec face | License | Rendered as |
| --- | --- | --- | --- |
| `register` | Steps Mono (Velvetyne) | OFL | `ui-monospace` 700, tracked .14em |
| `bulletin` | Clash Display (Fontshare) | ITF FFL | Helvetica Neue 700, −.03em, ≥40px |
| `decree` | Zodiak (Fontshare) | ITF FFL | Didot / Bodoni MT 700, tight leading |
| `fieldguide` | Le Murmure (Velvetyne) | OFL | Arial Narrow 700 caps, .02em, lh .88 |

## Content

All four render the same real standard — **STD-014, Preview Deployments on Pull
Requests** — so directions are comparable: masthead, nav, status strip, five
numbered clauses at three levels with commands, fleet counts, the register
table, search, buttons in all states, type scale, colour-role table, would-be
YAML tokens, and a copyable starter prompt.

Two **data-absent traps** are built in, because happy-path renders hide the gaps
that matter:

1. The status strip has no `LAST AUDIT` cell — nothing has audited STD-014, so
   the cell does not render rather than showing "—".
2. The Observability category has no standard issued, and says so plainly
   instead of showing an empty box.

Colour values are measured, not asserted: every ink/ground pair in all four
palettes clears WCAG AA on both the sheet and the page ground (worst pair
4.69:1; most are ≥ 5.5:1).

## Run

```bash
mise run prototype:standards-site
# http://localhost:8899/?variant=register|bulletin|decree|fieldguide
```

Or open `index.html` directly. Left/right arrow keys cycle variants.

## Status

Throwaway per the prototype skill — do not productionize. When a direction wins
and its `DESIGN.md` is written, delete this directory.

Round 1 open questions for the next grill: which stock, whether the stamp in
`decree` reads as authority or as costume, and whether the command rail in
`fieldguide` survives clauses that have no command.
