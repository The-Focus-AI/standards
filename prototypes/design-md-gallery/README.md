# Prototype: DESIGN.md Direction Gallery (THROWAWAY)

Throwaway prototype built with the `prototype` skill (UI branch) to answer:
**"Which visual direction should a project's DESIGN.md take?"**

One specimen page (a fictional product, Fieldnote) rendered under eight
concept-driven design directions — worlds borrowed from print, industry, and
history rather than from other tech companies:

| Variant | World |
| --- | --- |
| `dossier` | 1950s bureau case file: manila, typewriter, stamped red |
| `jis` | Japanese technical specification: hairline grids, hanko vermilion |
| `flatpack` | Flat-pack assembly manual: pictograms, step numerals, blue + yellow |
| `futurismo` | Italo-Futurist manifesto poster: cream, black, vermilion, slanted caps |
| `apollo` | 1969 NASA flight manual: checklist furniture, NOTE/CAUTION/WARNING |
| `paperback` | Marber-grid 1960s paperback: cream stock, one series color, bands |
| `naturalist` | Victorian field notebook: sepia, specimen labels, moss green |
| `hardware` | Industrial hardware panel: aluminum, engraved labels, safety orange |

Four variants embed their real display faces as woff2 data URIs (Special
Elite for the dossier, Le Murmure for futurismo, Zodiak + true italic for
the naturalist, Departure Mono for hardware labels); the rest state their
fallback in the meta strip per the anti-silent-fallback rule in
`reports/2026-07-23-creative-typography.md`.

Each variant shows the same content — hero, type scale, color roles,
components with states, and a voice rulebook (numbered Orwell-style rules in
character, a before/after rewrite, banned words) — plus its would-be
DESIGN.md YAML tokens and a copyable **starter prompt** that kicks off the
grill-me → prototype → DESIGN.md flow in `prompts/develop-design-md.md`.

## Run

Open `index.html` in a browser, or:

```bash
python3 -m http.server -d prototypes/design-md-gallery 8899
# http://localhost:8899/?variant=dossier|jis|flatpack|futurismo|apollo|paperback|naturalist|hardware
```

Left/right arrow keys cycle variants.

## Status

Throwaway per the prototype skill — do not productionize. When a direction is
chosen and its DESIGN.md is written, delete this directory.
