---
name: pptx-decks
description: >
  Generate a branded PowerPoint (.pptx) from markdown or an outline using PptxGenJS —
  slide masters, stat slides, card grids, process flows — then QA it by rendering the
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
2. A brand skill. For Focus.AI work that is `focus-ai-brand`, whose design-system
   reference carries the slide palettes under "Output-Format Tokens".
3. Ask rather than guess.

Declare the palette once as a constant at the top of the generated script (the reference
examples assume `CLIENT` / `LABS` in scope) and reference it everywhere. Never inline a
hex code twice.

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

```bash
npm install -g pptxgenjs react react-dom react-icons sharp
```

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
