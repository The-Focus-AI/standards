---
name: pptx-decks
description: >
  Generates a branded PowerPoint (.pptx) from markdown or an outline using PptxGenJS —
  slide masters, stat slides, card grids, process flows — then checks it by rendering the
  slides to images and inspecting them. Brand-agnostic: reads palettes and type from
  the project's DESIGN.md or brand skill.
  Use when asked for a deck, slides, a presentation, a pitch, or a .pptx file.
  Triggers on: "deck", "slides", "presentation", "pptx", "powerpoint", "pitch deck",
  "keynote", "/deck".
---

# PPTX Decks

Outline in, `.pptx` out, generated with PptxGenJS and checked visually before delivery.

**This skill owns the mechanics only** — masters, layout math, the PptxGenJS API and its
sharp edges. Palettes, fonts, and voice come from the project's brand.

## Where the tokens come from

1. The project's `DESIGN.md` frontmatter.
2. An already selected brand skill. For Focus.AI work that may be `focus-ai-brand`, whose design-system
   reference carries the slide palettes under "Output-Format Tokens".
3. Ask rather than guess.

Map those tokens to the semantic color/font roles in the reference and record
their source. The Focus brand is optional, never an implicit dependency. Do not
copy an old palette into a new project or invent fallback brand values.

## Tooling preflight

Read the project's `mise.toml`, package manifest, and lockfile. Use its
mise-managed Node/package manager and an existing project-local PptxGenJS:

```sh
mise exec -- node -e 'console.log(require.resolve("pptxgenjs"))'
```

If missing, ask before adding it. After approval, select a reviewed exact
version and add it as a development dependency with the project's package
manager, updating its manifest/lockfile. For an npm project, with
`PPTXGENJS_VERSION` set to that approved version:

```sh
mise exec -- npm install --save-dev --save-exact "pptxgenjs@$PPTXGENJS_VERSION"
```

Do not install globally. React, react-dom, react-icons, and sharp are not
required for the basic deck; add optional icon/image tooling only when needed
and approved. Before promising visual QA, check for an existing slide renderer
(for example LibreOffice) and a PDF viewer/rasterizer. Ask before installing
missing tooling; report a blocked QA step rather than calling an unseen deck done.

## Process

1. **Read the source** and plan the structure before writing any code — title, sections,
   content slides, conclusion. A deck is an argument with a shape, not a pile of slides.
2. **Choose a master per slide.** Dark for title and conclusion, light paper for content
   — the sandwich. `references/pptx-system.md` has the masters and their layout math.
3. **Vary the layouts.** Stats, cards, two-column, process flow. Six identical bullet
   slides in a row is the tell of a generated deck.
4. **Generate and run the PptxGenJS script.**
5. **QA visually.** Convert the slides to images and look at every one. Text overflow,
   collisions, and off-grid elements do not show up in the script — only in the render.
   The checklist at the end of the reference is the pre-ship gate.

## Reference

| Topic | Where |
| --- | --- |
| Slide masters and their layout math | `references/pptx-system.md` |
| Component patterns: title, stat, cards, process flow | `references/pptx-system.md` |
| Type scale and font mapping | `references/pptx-system.md` |
| Do / Don't rules and the pre-ship checklist | `references/pptx-system.md` |

## Pitfalls

- **Colors are 6-char hex with no `#`.** PptxGenJS silently misrenders otherwise.
- **Never reuse an options object** across `addShape` / `addText` calls — PptxGenJS
  mutates it, and the second call inherits the first one's state.
- **No gradient fills** — the library doesn't support them. Use a gradient image.
- **No unicode bullet characters.** Use `bullet: true` and let the renderer do it.
- **Never pure white backgrounds** if the brand specifies a paper tone.
- **More than six bullets means two slides.** Splitting is always better than shrinking
  the type.
- **A deck you have not looked at is not finished.** Render to images and inspect.
