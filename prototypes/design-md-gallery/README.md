# Prototype: DESIGN.md Direction Gallery (THROWAWAY)

Throwaway prototype built with the `prototype` skill (UI branch) to answer:
**"Which visual direction should a project's DESIGN.md take?"**

One specimen page (a fictional product, Fieldnote) rendered under six
contrasting design directions drawn from the style families in
[VoltAgent/awesome-claude-design](https://github.com/VoltAgent/awesome-claude-design):

| Variant | Family |
| --- | --- |
| `editorial` | Claude / Anthropic warm-serif |
| `minimal` | Linear / Vercel near-black SaaS |
| `terminal` | Warp / Ollama monospace |
| `playful` | Figma / Zapier rounded multicolor |
| `swiss` | WIRED / Nike brutalist grotesque |
| `trust` | Stripe / Wise fintech navy |

Each variant shows the same content — hero, type scale, color roles,
components with states, voice line — plus its would-be DESIGN.md YAML tokens
and a copyable **starter prompt** that kicks off the grill-me → prototype →
DESIGN.md flow in `prompts/develop-design-md.md`.

## Run

Open `index.html` in a browser, or:

```bash
python3 -m http.server -d prototypes/design-md-gallery 8899
# http://localhost:8899/?variant=editorial|minimal|terminal|playful|swiss|trust
```

Left/right arrow keys cycle variants.

## Status

Throwaway per the prototype skill — do not productionize. When a direction is
chosen and its DESIGN.md is written, delete this directory.
