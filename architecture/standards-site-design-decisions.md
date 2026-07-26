---
title: "standards.thefocus.ai design decision log"
kind: decision
issued: "2026-07-25"
author: W. Schenk
status: Accepted
---

# standards.thefocus.ai — design decision log

Companion to `DESIGN.md`. Records what was settled, who settled it, and what was
assumed — so the next agent knows what is decided versus what is merely current.

Process: `prompts/develop-design-md.md`. Prototypes:
`prototypes/standards-site-directions/` (throwaway; delete once the site is
built).

Provenance column: **user** = answered directly in the grill · **evidenced** =
taken from the repo or the seed without asking · **agent** = my recommendation,
accepted by silence rather than by statement. Anything marked *agent* is the
first thing to re-open if the design feels wrong.

## Phase 1 — the grill

| # | Branch | Verdict | Provenance |
| --- | --- | --- | --- |
| 1 | Positioning | Issuing authority for a fleet. Standards are written here, distributed to every agent repo, and consumed during planning and ticket-writing. The source document is the artifact; the site is its citable rendering. Primary reader is an agent. | user |
| 2 | Never evoke | The rule with no author and no date — cargo cult, inherited convention. Not "bureaucracy": *functional* bureaucracy is the goal. | user (reframed my proposal) |
| 3 | Personality | Authoritative · Traceable · Actionable · Dry, with understated wit endorsed explicitly. | user |
| 4 | Atmosphere | Light, no dark mode. Square. Flat and ruled. Utilitarian. Density follows the job. | user |
| 5 | Stock | Cool near-white `#f1f3f0` on `#e4e7e4` — the Bulletin direction. | user (round 1) |
| 6 | Voice | Early RFC. Humble in the frame, absolute in the clause. | user |
| 7 | Print | Required. Standards publish as reports. | user |
| 8 | Source format | Markdown, authored as MDX so clauses can carry live demonstrations. | user |
| 9 | Fleet state | Out of scope for this repo. | user |
| 10 | Accessibility floor | WCAG AA, aiming 7:1. | evidenced (seed) |
| 11 | No CDN assets | Self-hosted fonts only. | evidenced (seed) |
| 12 | House lettering | Barlow Condensed inherited, so this site and Walking Thoughts share a display face. | agent — flagged twice, never objected to. Re-open if the two properties should not look related. |
| 13 | Voice rulebook detail | Ten numbered rules, banned-word list, before/after pairs, tone-by-surface table. | agent, built on the user's "early RFC" answer |

## Phase 2 — the prototype rounds

### Round 1 — which document is a standard?

Four directions, each with its own stock, grid and signature move.

| Variant | Verdict |
| --- | --- |
| **Bulletin** — Bell Labs / NASA flight rules | **Won.** Cool stock, level bands, clinical composition. |
| Register — Federal Register docket | Lost. Buff/manila and a marginal docket numeral; densest of the four. |
| Decree — stamped issued order | Lost. The rotated stamp risked reading as costume rather than authority. |
| Field Guide — Haynes green-bar manual | Lost. The command rail was its best idea and was re-tested in round 2. |

**Correction made mid-round.** The first cut of round 1 replaced the seed's
typography, anchoring each variant in a different display face (Steps Mono,
Clash Display, Zodiak, Le Murmure) per the Phase 2 "different personality group"
rule. That rule governs a *fresh* brand where type is an open branch. Here it
was evidenced — the seed already specifies four voices with fixed jobs and says
the mix is the brand. The round was rebuilt on the seed's voices, and the
typographic variable became *what earns the reserved italic* instead.

### Round 2 — what does Bulletin graft?

Bulletin's look held constant; one substantive change per remix.

| Variant | Verdict |
| --- | --- |
| **+ Agent accent** — petrol rule and mono AGENT header replacing the hatch | **Won.** Three accents became four. |
| Control | — |
| + Clause voice — reserved italic on the normative clause | Lost. Italic read *soft* where the document needed to read *issued*. This is what retired the fourth voice. |
| + Command rail — command in a fixed right rail | Lost, but the trait it served is preserved: every clause still ships its command, inline. |

**Rejected during round 2:** violet for the `agent` role. It was the open hue,
but the seed bans purple "AI glow" and using it for the machine voice would land
on exactly that cliché. Petrol `#2c5560` instead.

### Round 3 — converging

Not a comparison. The RFC voice decision was applied, and two things fell out of
it that were not separately decided:

- **The instrument strip was deleted.** Carried through rounds 1 and 2, then
  removed: the RFC header block states the same facts with more authority, and
  two components reporting one truth is the duplication this system exists to
  prevent.
- **`MAY` joined the level vocabulary.** RFC 2119 has it, and a genuinely
  optional clause was needed to prove the band handles a non-binding level
  without looking like a weak MUST.

Also added: the `DEMONSTRATION` block with a mandatory agent-readable fallback,
and the print treatment (outlined tabs, expanded URLs, break-inside avoidance),
verified by rendering to PDF rather than by reading the CSS.

## Phase 4 — validation

`scripts/validate-design.mjs`, wired into `mise run lint` and available as
`mise run design:validate`. It checks that every `{token}` reference resolves,
that no colour token is orphaned, that every ink/ground pair clears AA, and —
the important one — that the measured-contrast table in the prose matches the
computed values. A design file asserting ratios it has not measured is the same
defect as an undated rule.

The validator has been negative-tested: it fails and exits non-zero on both a
real contrast regression and a drifted prose claim.

## Known gaps

- **The fresh-agent test has not been run.** Phase 4 asks for a new session
  given only `DESIGN.md` and told to build a surface the prototypes never
  showed, including a data-absent trap. Until that runs, the file is validated
  but not proven.
- **Barlow Condensed is not embedded anywhere yet.** The subsets have to ship
  with whatever renders the site.
- Decision 12 (shared house lettering) was never explicitly confirmed.

## Tickets discovered

Capabilities the prototypes implied that no repository currently has. These
belong in the tracker, not in `DESIGN.md`.

1. **Fleet distribution state.** Rounds 1 and 2 both showed adopted / drifted /
   pending counts per standard. The site would need to know what every
   repository is running. Deliberately cut from the design; the layout must not
   assume it exists.
2. **MDX authoring pipeline**, including a demonstration component that emits an
   agent-readable text rendering alongside the live one.
3. **Revision addressing.** The Status memo asserts "earlier revisions remain
   readable at their own addresses" — that needs a URL scheme and retention
   rule.
4. **Distribution mechanism.** "Distribute revision" is the primary act on the
   page and has no implementation behind it.
5. **Standard numbering and the register itself** — who allocates `STD-nnn`,
   and where the index lives.
