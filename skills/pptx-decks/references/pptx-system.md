# PPTX Decks — PptxGenJS masters, components, and QA

The mechanics of generating a `.pptx` from markdown. Palettes and type mappings are
**not** defined here. They come from the project's `DESIGN.md` or brand skill; for
Focus.AI work that is `focus-ai-brand`, under "Output-Format Tokens → Slide palettes"
in its design-system reference. The `CLIENT` / `LABS` constants used in the
examples below are those palettes, declared once at the top of the generated script.

## Overview

Generate branded PowerPoint presentations using PptxGenJS. Sub-brands have distinct slide aesthetics
that match their print and web identities.

**Dependencies:**

```bash
npm install -g pptxgenjs react react-dom react-icons sharp
```

---

## Slide Structure

### Client Presentation Structure

| Slide           | Background             | Style                                             |
| --------------- | ---------------------- | ------------------------------------------------- |
| Title           | Petrol `0E3B46` (dark) | White text, Source Serif 4 feel, vermilion accent |
| Section divider | Petrol `0E3B46` (dark) | White heading, mono label                         |
| Content         | Paper `FAF9F6` (light) | Ink text, petrol accents                          |
| Stats/Data      | Paper `FAF9F6`         | Large petrol numbers, vermilion labels            |
| Conclusion      | Petrol `0E3B46` (dark) | White text, CTA                                   |

### Labs Presentation Structure

| Slide           | Background             | Style                                             |
| --------------- | ---------------------- | ------------------------------------------------- |
| Title           | Void `1A1A1A` (dark)   | Paper text, rand-blue accent, bold black headings |
| Section divider | Void `1A1A1A` (dark)   | Paper text, alert-red numbering                   |
| Content         | Paper `F3F2EA` (light) | Void text, void borders, offset shadow cards      |
| Stats/Data      | Paper `F3F2EA`         | Large void numbers, alert-red labels              |
| Conclusion      | Void `1A1A1A` (dark)   | Paper text                                        |

---

## Typography in Slides

### Font Mapping

PptxGenJS requires system/PowerPoint-available fonts. Use these mappings:

| Design System Font | PowerPoint Font | Fallback    |
| ------------------ | --------------- | ----------- |
| Inter              | **Calibri**     | Arial       |
| Source Serif 4     | **Georgia**     | Cambria     |
| Courier Prime      | **Consolas**    | Courier New |

### Type Scale

| Element        | Font     | Size    | Weight                  | Notes                                     |
| -------------- | -------- | ------- | ----------------------- | ----------------------------------------- |
| Slide title    | Georgia  | 36–44pt | Bold                    | Negative tracking via `charSpacing: -1`   |
| Section header | Calibri  | 24–28pt | Bold                    | Client: sentence-case. Labs: UPPERCASE    |
| Body text      | Calibri  | 14–16pt | Normal (Client: medium) | Left-aligned, max ~50 chars/line          |
| Bullet items   | Calibri  | 14–16pt | Normal                  | Use `bullet: true`                        |
| Labels/kickers | Consolas | 10–12pt | Bold                    | UPPERCASE, wide spacing: `charSpacing: 3` |
| Stat numbers   | Georgia  | 48–60pt | Bold                    | Petrol (Client) or Void (Labs)            |
| Stat labels    | Consolas | 11pt    | Bold                    | Vermilion (Client) or Alert-Red (Labs)    |
| Captions       | Calibri  | 10–12pt | Normal                  | Graphite/muted opacity                    |

---

## Slide Masters

### Client Masters

```javascript
const pptxgen = require("pptxgenjs");
let pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Focus.AI";

// Dark title master
pres.defineSlideMaster({
  title: "TITLE_DARK",
  background: { color: "0E3B46" },
  objects: [
    // Vermilion accent bar at top
    { rect: { x: 0, y: 0, w: 10, h: 0.04, fill: { color: "C3471D" } } },
    // Brand mark bottom-left
    {
      text: {
        text: "THEFOCUS.AI",
        options: {
          x: 0.5,
          y: 5.1,
          w: 3,
          h: 0.4,
          fontSize: 9,
          fontFace: "Consolas",
          color: "FFFFFF",
          bold: true,
          charSpacing: 2,
        },
      },
    },
  ],
});

// Light content master
pres.defineSlideMaster({
  title: "CONTENT_LIGHT",
  background: { color: "FAF9F6" },
  objects: [
    // Subtle top border
    { rect: { x: 0, y: 0, w: 10, h: 0.02, fill: { color: "D4D3CF" } } },
    // Page number bottom-right
    {
      text: {
        text: "{{slideNumber}}",
        options: {
          x: 9,
          y: 5.2,
          w: 0.5,
          h: 0.3,
          fontSize: 9,
          fontFace: "Consolas",
          color: "4A4A4A",
          align: "right",
        },
      },
    },
  ],
});
```

### Labs Masters

```javascript
// Dark title master
pres.defineSlideMaster({
  title: "TITLE_DARK",
  background: { color: "1A1A1A" },
  objects: [
    // Alert-red accent bar at left
    { rect: { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: "D93025" } } },
    // Brand mark bottom-left
    {
      text: {
        text: "THEFOCUS.AI LABS",
        options: {
          x: 0.5,
          y: 5.1,
          w: 3,
          h: 0.4,
          fontSize: 9,
          fontFace: "Consolas",
          color: "D93025",
          bold: true,
          charSpacing: 2,
        },
      },
    },
  ],
});

// Light content master
pres.defineSlideMaster({
  title: "CONTENT_LIGHT",
  background: { color: "F3F2EA" },
  objects: [
    // Void border at top
    { rect: { x: 0, y: 0, w: 10, h: 0.03, fill: { color: "1A1A1A" } } },
    // Page number bottom-right
    {
      text: {
        text: "{{slideNumber}}",
        options: {
          x: 9,
          y: 5.2,
          w: 0.5,
          h: 0.3,
          fontSize: 9,
          fontFace: "Consolas",
          color: "1A1A1A",
          align: "right",
        },
      },
    },
  ],
});
```

---

## Component Patterns

### Title Slide (Client)

```javascript
let slide = pres.addSlide({ masterName: "TITLE_DARK" });

// Label/kicker
slide.addText("DESIGN SYSTEM", {
  x: 0.75,
  y: 1.2,
  w: 8,
  h: 0.4,
  fontSize: 11,
  fontFace: "Consolas",
  color: "C3471D",
  bold: true,
  charSpacing: 3,
});

// Main title
slide.addText("The Focus.AI\nDesign System", {
  x: 0.75,
  y: 1.7,
  w: 8,
  h: 2.5,
  fontSize: 44,
  fontFace: "Georgia",
  color: "FFFFFF",
  bold: true,
  charSpacing: -1,
  lineSpacingMultiple: 0.9,
});

// Subtitle
slide.addText("Swiss grid rigor meets Focus.AI brand identity", {
  x: 0.75,
  y: 4.0,
  w: 6,
  h: 0.5,
  fontSize: 16,
  fontFace: "Calibri",
  color: "FFFFFF",
  transparency: 30,
});
```

### Title Slide (Labs)

```javascript
let slide = pres.addSlide({ masterName: "TITLE_DARK" });

// Metadata block
slide.addText(
  [
    {
      text: "PROJECT: DESIGN SYSTEM MERGE",
      options: { bold: true, breakLine: true },
    },
    { text: "DOC. NO: DS-2026-01", options: { breakLine: true } },
    { text: "DATE: MAY 2026", options: {} },
  ],
  {
    x: 0.75,
    y: 0.75,
    w: 5,
    h: 1,
    fontSize: 10,
    fontFace: "Consolas",
    color: "F3F2EA",
    transparency: 40,
  },
);

// Main title (UPPERCASE, black weight feel)
slide.addText("THE FOCUS.AI\nDESIGN SYSTEM", {
  x: 0.75,
  y: 2.0,
  w: 8.5,
  h: 2.5,
  fontSize: 48,
  fontFace: "Calibri",
  color: "F3F2EA",
  bold: true,
  charSpacing: -1,
});

// Accent word in blue
slide.addText("UNIFIED", {
  x: 0.75,
  y: 4.2,
  w: 4,
  h: 0.6,
  fontSize: 28,
  fontFace: "Calibri",
  color: "0055AA",
  bold: true,
  charSpacing: 2,
});
```

### Stat Slide (Client)

```javascript
let slide = pres.addSlide({ masterName: "CONTENT_LIGHT" });

// Section label
slide.addText("AT A GLANCE", {
  x: 0.75,
  y: 0.5,
  w: 4,
  h: 0.4,
  fontSize: 10,
  fontFace: "Consolas",
  color: "0E3B46",
  bold: true,
  charSpacing: 3,
});

// Stat grid (3 across)
const stats = [
  { number: "10", label: "Reference Files" },
  { number: "83KB", label: "Documentation" },
  { number: "2", label: "Sub-Brands" },
];

stats.forEach((stat, i) => {
  const x = 0.75 + i * 3.1;
  // Number
  slide.addText(stat.number, {
    x,
    y: 1.8,
    w: 2.8,
    h: 1.2,
    fontSize: 54,
    fontFace: "Georgia",
    color: "0E3B46",
    bold: true,
    align: "center",
    valign: "bottom",
  });
  // Label
  slide.addText(stat.label.toUpperCase(), {
    x,
    y: 3.0,
    w: 2.8,
    h: 0.5,
    fontSize: 10,
    fontFace: "Consolas",
    color: "C3471D",
    bold: true,
    align: "center",
    charSpacing: 2,
  });
});
```

### Content Slide with Cards (Client)

```javascript
let slide = pres.addSlide({ masterName: "CONTENT_LIGHT" });

// Heading
slide.addText("What Was Built", {
  x: 0.75,
  y: 0.5,
  w: 8,
  h: 0.6,
  fontSize: 24,
  fontFace: "Calibri",
  color: "161616",
  bold: true,
  margin: 0,
});

// Petrol underline
slide.addShape(pres.shapes.RECTANGLE, {
  x: 0.75,
  y: 1.1,
  w: 2,
  h: 0.03,
  fill: { color: "0E3B46" },
});

// Two cards side by side
const makeCard = (x, y, w, h, accentColor, title, items) => {
  // Card background
  slide.addShape(pres.shapes.RECTANGLE, {
    x,
    y,
    w,
    h,
    fill: { color: "FFFFFF" },
    line: { color: "D4D3CF", width: 1 },
  });
  // Left accent border
  slide.addShape(pres.shapes.RECTANGLE, {
    x,
    y,
    w: 0.05,
    h,
    fill: { color: accentColor },
  });
  // Title
  slide.addText(title, {
    x: x + 0.3,
    y: y + 0.2,
    w: w - 0.5,
    h: 0.4,
    fontSize: 13,
    fontFace: "Calibri",
    color: "161616",
    bold: true,
  });
  // Bullet items
  const bullets = items.map((item, i) => ({
    text: item,
    options: { bullet: true, breakLine: i < items.length - 1 },
  }));
  slide.addText(bullets, {
    x: x + 0.3,
    y: y + 0.6,
    w: w - 0.5,
    h: h - 0.8,
    fontSize: 12,
    fontFace: "Calibri",
    color: "4A4A4A",
  });
};

makeCard(0.75, 1.5, 4.1, 3.5, "0E3B46", "From Swiss Design", [
  "12-column grid (8px base)",
  "Opacity-based text hierarchy",
  "Mobile-first breakpoints",
  "60ch body text constraint",
  "Dark mode system",
]);

makeCard(5.15, 1.5, 4.1, 3.5, "C3471D", "From Focus.AI Brand", [
  "Inter + Source Serif 4 + Courier Prime",
  "Client/Labs dual palettes",
  "Asymmetric editorial layout",
  "Paged.js PDF generation",
  "Renaissance + Bell Labs imagery",
]);
```

### Process Flow Slide (Labs)

```javascript
let slide = pres.addSlide({ masterName: "CONTENT_LIGHT" });

slide.addText("DESIGN PRINCIPLES", {
  x: 0.75,
  y: 0.5,
  w: 8,
  h: 0.5,
  fontSize: 20,
  fontFace: "Calibri",
  color: "1A1A1A",
  bold: true,
  charSpacing: 1,
});

const steps = [
  { num: "01", title: "Grid First", desc: "12-col or asymmetric editorial" },
  { num: "02", title: "Mobile First", desc: "320px up with breakpoints" },
  { num: "03", title: "Whitespace", desc: "Space is structure, not waste" },
  { num: "04", title: "Opacity", desc: "Hierarchy without hue changes" },
  { num: "05", title: "Two Accents", desc: "Primary + secondary only" },
  { num: "06", title: "Clarity", desc: "Every element earns its place" },
];

steps.forEach((step, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const x = 0.75 + col * 3.1;
  const y = 1.3 + row * 2.0;

  // Number
  slide.addText(step.num, {
    x,
    y,
    w: 0.6,
    h: 0.4,
    fontSize: 11,
    fontFace: "Consolas",
    color: "D93025",
    bold: true,
  });
  // Title
  slide.addText(step.title, {
    x,
    y: y + 0.4,
    w: 2.8,
    h: 0.4,
    fontSize: 15,
    fontFace: "Calibri",
    color: "1A1A1A",
    bold: true,
  });
  // Description
  slide.addText(step.desc, {
    x,
    y: y + 0.8,
    w: 2.8,
    h: 0.6,
    fontSize: 12,
    fontFace: "Calibri",
    color: "1A1A1A",
    transparency: 40,
  });
});
```

---

## Design Rules for Slides

### Do

- Use dark backgrounds for title + conclusion slides (sandwich structure)
- Use the brand paper tone for content slides (never pure white)
- Keep text left-aligned (center only for titles and stat numbers)
- Use Consolas for all labels, metadata, and kickers
- Use Georgia for display moments (large stat numbers, pull quotes)
- Leave 0.5" minimum margins on all sides
- Use accent colors (Vermilion/Alert-Red) only for small elements: labels, step numbers, accent bars
- Vary layouts across slides: stats, cards, process flows, two-column

### Don't

- Never use pure white (`FFFFFF`) as slide background — use Paper tones
- Never use accent lines under titles (AI-slide hallmark)
- Never use more than 5 colors per slide
- Never center body text or bullet lists
- Never use unicode bullet characters (`•`) — use `bullet: true`
- Never reuse option objects across `addShape`/`addText` calls
- Never use gradient fills (not supported) — use gradient images instead
- Never put too much text on one slide — if >6 bullets, split into two slides

---

## Presentation Checklist

- [ ] Brand mark on every slide (master template)
- [ ] Correct palette (Client: Petrol/Vermilion, Labs: Void/Rand-Blue/Alert-Red)
- [ ] Dark slides for title + conclusion, light for content
- [ ] Paper-tone backgrounds, never pure white
- [ ] Georgia for display, Calibri for body, Consolas for labels
- [ ] Labels are uppercase with wide `charSpacing`
- [ ] Stat numbers are 48pt+ Georgia
- [ ] 0.5" minimum margins
- [ ] No text-only slides — every slide has a visual element
- [ ] Varied layouts across slides
- [ ] Maximum 6 bullets per slide
- [ ] All colors are 6-char hex without `#` prefix
- [ ] Visual QA completed (convert to images, inspect)

---

## Command: `/deck`

Generate a branded presentation from content.

```text
/deck file:./content.md style:client output:./presentation.pptx
/deck file:./research.md style:labs output:./research-deck.pptx
```

**Workflow:**

1. Read source markdown
2. Determine brand (client/labs)
3. Plan slide structure (title, sections, content, conclusion)
4. Generate PptxGenJS script
5. Execute to produce .pptx
6. Convert to images for QA
7. Fix issues and re-verify
