# Prototype: standards.thefocus.ai Direction Rounds (THROWAWAY)

Throwaway prototype built per `prompts/develop-design-md.md` Phase 2.

| File | Round | Question |
| --- | --- | --- |
| `index.html` | **2 — current** | Bulletin won on looks. Which grafts does it take? |
| `round-1.html` | 1 — archived | Which visual direction should the site take? |

## Round 2 — Bulletin remixes

**Bulletin's visual language is fixed**: cool near-white `#f1f3f0` on `#e4e7e4`,
level bands with reversed tabs, tight masthead, square rules, no shadows. Each
remix changes **exactly one substantive thing**, so the comparison resolves one
decision at a time. Every panel states its own change and the question it asks.

| Variant | Change from control | Asks |
| --- | --- | --- |
| `base` | none — Bulletin as it won | the control |
| `clause` | reserved Georgia italic returns on the normative clause; clause number promoted into the band | Does the seed's deepest rule survive Bulletin's shell, or does italic read soft where the band reads issued? |
| `rail` | the satisfying command moves from prose into a fixed right rail | Does the rail earn its width, and what does an empty rail look like on a retired clause? |
| `plate` | hatch replaced by the seed's annotation treatment — solid petrol rule + mono AGENT header; 3 accents become 4 | Does machine-facing material need its own colour, or was the hatch already saying it? |

Round 2 palette, all measured on both grounds: `action #1f5fa8` (5.77 / 5.17),
`in-force #1f6b44` (5.80 / 5.19), `attention #a8451c` (5.33 / 4.77), and in
`plate` only, `agent #2c5560` (7.31 / 6.54). All AA or better.

## Round 1 — the original question

Round 1 asked which visual direction standards.thefocus.ai should take.

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

## Type is inherited, not re-opened

**All four directions run the same four voices, straight from the seed's
DESIGN.md.** An earlier cut of this round anchored each variant in a different
display face (Steps Mono / Clash Display / Zodiak / Le Murmure) per the Phase 2
"different personality group" rule — that was wrong. That rule governs a *fresh*
brand where typography is an open branch. Here it is **evidenced**: the seed
already specifies four voices with fixed jobs and says the mix *is* the brand.

| Voice | Spec | Job |
| --- | --- | --- |
| display | Barlow Condensed 600 · caps · +.03em · lh .95 | Mastheads, section heads, clause numerals, button labels, instrument values |
| reserved | Georgia italic | One speaker per system. Nothing else may borrow it. |
| body | system sans 400/700 | UI prose, commentary — everything upright |
| mono | ui-monospace 700 · caps · +.08–.1em | Every measured fact, tabular numerals |

Barlow Condensed is **not embedded** — font binaries stay out of the standards
repo — so display renders through the DESIGN.md's own fallback stack
(`"Arial Narrow", system-ui`) with the spec recipe applied. The specimen probes
the device at load and prints which face actually resolved; on a machine with no
condensed face at all it says so in the meta strip, because the un-condensed
silhouette is a materially different design.

## The typographic question this round asks

On the trail, Georgia italic means **"the walker said this."** A standards site
has no walker. So what earns the reserved voice? Each direction commits to a
different answer, and that is the sharpest thing to judge them on:

| Variant | Reserved italic is… | Argument |
| --- | --- | --- |
| `register` | the normative clause | The rule is what speaks; everything else annotates it upright |
| `bulletin` | nothing — retired | A standard is issued by an institution, not said by a person |
| `decree` | the rationale | Inverts Register: the clause is stamped and impersonal, the reasoning is human |
| `fieldguide` | superseded practice | Italic marks what is quoted from the past — a tense, not a speaker |

If `bulletin` wins, the transposition was mostly about colour and the seed's
deepest rule does not survive contact with this subject. That is a real possible
outcome and the round is built to surface it.

## The four directions

Each answers "what kind of bureaucratic document is a standard?" through
composition — grid, stock, density, and one signature move.

| Variant | World | Signature move | Accents |
| --- | --- | --- | --- |
| `register` | Federal Register · the daily docket | The marginal docket numeral (4.2rem condensed, tabular) | 4 |
| `bulletin` | Bell Labs / NASA flight rules | The level band (MUST / SHOULD tab, reversed) | 3 |
| `decree` | The issued order, stamped | The stamp + countersignature rule | 2 |
| `fieldguide` | Haynes manual · green-bar bench copy | The command rail + cropped masthead | 4 |

`bulletin` deliberately runs one accent short — agent material is signalled with
a hatched fill instead of a fourth hue, to test whether the role table needs
colour at all. `decree` runs near-monochrome on the theory that authority needs
no colour, so only the stamp is chromatic.

Quadrangle's fifth accent (`record`) retires in all four: nothing on a standards
site is ever recording, and an accent with no job does not survive the
transposition.

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
# round 2: http://localhost:8899/?variant=base|clause|rail|plate
# round 1: http://localhost:8899/round-1.html?variant=register|bulletin|decree|fieldguide
```

Or open `index.html` directly. Left/right arrow keys cycle variants.

## Status

Throwaway per the prototype skill — do not productionize. When a direction wins
and its `DESIGN.md` is written, delete this directory.

**Round 1 verdict:** `bulletin` wins on looks — cool near-white stock, level
bands, clinical composition. Stock settled. Round 2 resolves what it grafts.

Still open after round 2 lands: the Phase 1 **voice rulebook** branch (banned
words, how errors speak, where the dry wit is allowed) and **non-negotiables**
(accessibility floor, whether standards must print to PDF cleanly, whether the
markdown source is a first-class output surface).

Judge the display voice on a machine that has Arial Narrow. Where no condensed
face is installed the proportions are wrong and the specimen says so.
