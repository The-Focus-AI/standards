# PPTX Decks — PptxGenJS masters, components, and QA

The mechanics of generating a `.pptx` from markdown. Follow `SKILL.md`'s
project-local dependency preflight first. This reference supplies no brand
palette: read `DESIGN.md` or the selected brand's tokens. `focus-ai-brand` is an
optional source for Focus work, not a prerequisite for using these mechanics.

## Token mapping

Create `deck-tokens.json` beside the generated script, mapping the project's
actual tokens to these roles. Record the source file/revision in `source`.
This is a generated-deck input, not a file shipped by this skill.

| Group | Required roles | Meaning |
| --- | --- | --- |
| `colors` | `dark`, `onDark`, `paper`, `ink` | Title/content backgrounds and readable text |
| `colors` | `accent`, `primary`, `surface`, `border`, `muted` | Labels, stats, cards, rules, captions |
| `fonts` | `display`, `body`, `mono` | Titles/stats, prose, metadata |
| Top level | `source`, `author`, `brandMark` | Token provenance and real deck attribution |

Resolve aliases and CSS variables first. Colors become six-character hex
without `#`. Do not supply default literals when a role is missing: ask for
the mapping. Choose fonts available both to the renderer and recipient. If a
brand font needs a fallback, obtain agreement and record it. Georgia/Calibri/
Consolas are possible fallbacks, not universal brand rules.

## Structure and dimensions

Use a 10 × 5.625 inch 16:9 canvas for the coordinates below. Keep at least 0.5
inch margins; content spans x=0.75 to x=9.25. A wider built-in layout needs
recomputed positions, not the same absolute coordinates.

| Slide | Recommended treatment, subject to the brand |
| --- | --- |
| Title / conclusion | Dark background, on-dark text, small accent label |
| Section divider | Dark or paper background, one strong heading |
| Content | Paper background, ink text, restrained cards or two columns |
| Stats | Paper background, large primary numbers, accent labels |

Typical type sizes: title 36–44pt, section 24–28pt, body 14–16pt, labels
10–12pt, stats 48–60pt. Use the project's scale where it differs. Split crowded
slides rather than shrinking body text to fit.

## Masters and title slide

Save as a CommonJS `.cjs` script in the project. This example requires only
PptxGenJS and Node built-ins. Replace the sample content with the real outline.

```javascript
const pptxgen = require("pptxgenjs");
const tokens = require("./deck-tokens.json");
const C = tokens.colors;
const F = tokens.fonts;
for (const role of ["dark", "onDark", "paper", "ink", "accent", "primary", "surface", "border", "muted"]) {
  if (!/^[0-9a-f]{6}$/i.test(C?.[role] ?? "")) {
    throw new Error(`Resolve color token: ${role}`);
  }
}
for (const role of ["display", "body", "mono"]) {
  if (!F?.[role]) throw new Error(`Resolve font token: ${role}`);
}
if (!tokens.source || !tokens.author || !tokens.brandMark) {
  throw new Error("Record token source, actual author, and approved brand mark");
}

const pres = new pptxgen();
pres.defineLayout({ name: "DECK", width: 10, height: 5.625 });
pres.layout = "DECK";
pres.author = tokens.author;
pres.theme = { headFontFace: F.display, bodyFontFace: F.body, lang: "en-US" };

pres.defineSlideMaster({
  title: "TITLE_DARK",
  background: { color: C.dark },
  objects: [{ text: { text: tokens.brandMark, options: {
    x: 0.5, y: 4.875, w: 5, h: 0.25,
    fontSize: 9, fontFace: F.mono, color: C.onDark,
  } } }],
});
pres.defineSlideMaster({
  title: "CONTENT_LIGHT",
  background: { color: C.paper },
  objects: [{ text: { text: tokens.brandMark, options: {
    x: 0.5, y: 4.875, w: 5, h: 0.25,
    fontSize: 9, fontFace: F.mono, color: C.muted,
  } } }],
  slideNumber: {
    x: 9, y: 4.875, w: 0.5, h: 0.25,
    fontSize: 9, fontFace: F.mono, color: C.muted, align: "right",
  },
});

const title = pres.addSlide({ masterName: "TITLE_DARK" });
title.addText("PROJECT BRIEF", {
  x: 0.75, y: 1, w: 8.5, h: 0.4,
  fontFace: F.mono, fontSize: 11, charSpacing: 2, color: C.accent,
});
title.addText("The argument in one sentence", {
  x: 0.75, y: 1.7, w: 8.5, h: 2,
  fontFace: F.display, fontSize: 40, bold: true, color: C.onDark,
});
title.addText("Context and intended outcome", {
  x: 0.75, y: 4, w: 8.5, h: 0.5,
  fontFace: F.body, fontSize: 16, color: C.onDark,
});

// Add the component slides below before writing the file.
pres.writeFile({ fileName: "presentation.pptx" }).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
```

## Component patterns

Insert these before `writeFile`. Fresh options objects avoid mutation leaking
between calls. The sample numbers are placeholders, not evidence for a report.

### Three statistics

```javascript
const statsSlide = pres.addSlide({ masterName: "CONTENT_LIGHT" });
const stats = [
  { number: "10", label: "Items reviewed" },
  { number: "3", label: "Options tested" },
  { number: "1", label: "Recommendation" },
];
stats.forEach((stat, i) => {
  const x = 0.75 + i * 2.9;
  statsSlide.addText(stat.number, {
    x, y: 1.8, w: 2.7, h: 1.2, align: "center",
    fontFace: F.display, fontSize: 54, bold: true, color: C.primary,
  });
  statsSlide.addText(stat.label, {
    x, y: 3.1, w: 2.7, h: 0.5, align: "center",
    fontFace: F.mono, fontSize: 11, color: C.accent,
  });
});
```

### Two cards

```javascript
const cardsSlide = pres.addSlide({ masterName: "CONTENT_LIGHT" });
const cards = [
  { title: "What changes", items: ["First change", "Second change"] },
  { title: "What stays", items: ["First invariant", "Second invariant"] },
];
cards.forEach((card, i) => {
  const x = 0.75 + i * 4.4;
  cardsSlide.addShape(pres.ShapeType.rect, {
    x, y: 1.3, w: 4.1, h: 3.5,
    fill: { color: C.surface }, line: { color: C.border, width: 1 },
  });
  cardsSlide.addText(card.title, {
    x: x + 0.3, y: 1.6, w: 3.5, h: 0.5,
    fontFace: F.body, fontSize: 20, bold: true, color: C.ink,
  });
  cardsSlide.addText(card.items.map((text, index) => ({
    text, options: { bullet: true, breakLine: index < card.items.length - 1 },
  })), {
    x: x + 0.3, y: 2.3, w: 3.5, h: 2,
    fontFace: F.body, fontSize: 16, color: C.ink,
  });
});
```

### Process flow

Use a 3-column × 2-row grid for up to six steps: `col = i % 3`,
`row = Math.floor(i / 3)`, `x = 0.75 + col * 2.9`, `y = 1.1 + row * 1.8`.
Each cell is 2.7 inches wide. Place its number at `y`, title at `y + 0.35`,
description at `y + 0.85`. Use `F.mono`/`C.accent` for the step number and
`F.body`/`C.ink` for text. Keep descriptions to two short lines. For more than
six steps, split the sequence across slides.

## Generate and inspect

```sh
mise exec -- node deck.cjs
```

If approved renderers are already installed, inspect their help, then convert
the resulting deck to PDF/images (for example LibreOffice's headless conversion
followed by `pdftoppm`). Do not add a renderer silently. Open every slide image
and fix text overflow, collisions, off-grid content, missing fonts, and poor
contrast. File creation alone is not visual QA.

## Presentation checklist

- [ ] Actual author, token source, and content sources recorded
- [ ] All roles mapped to current project tokens; no hidden Focus palette
- [ ] Approved font fallbacks present in the rendering environment
- [ ] Masters and slide numbers render correctly
- [ ] At least 0.5 inch margins, readable body type, no text overflow
- [ ] Varied layouts; no more than six bullets per slide
- [ ] Native bullets, fresh options objects, six-character colors without `#`
- [ ] No unsupported gradient fills (use an approved image if needed)
- [ ] Every rendered slide inspected; outstanding QA limitations disclosed

`/deck file:./content.md output:./presentation.pptx` is a request shorthand,
not an executable included with this skill. Read source → plan structure →
map brand → generate → inspect → fix → deliver.
