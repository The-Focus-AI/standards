# Focus.AI Design System — Full Token Reference

## CSS Custom Properties

### Client Brand

```css
:root {
  /* Typography */
  --font-display: "Source Serif 4", Georgia, "Times New Roman", serif;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "Courier Prime", monospace;

  /* Client palette */
  --color-paper: #faf9f6;
  --color-ink: #161616;
  --color-graphite: #4a4a4a;
  --color-petrol: #0e3b46;
  --color-vermilion: #c3471d;
  --color-border: #d4d3cf;

  /* Tinted section backgrounds */
  --tint-cool: #edf6f8;
  --tint-sage: #eef6ee;
  --tint-warm: #f7f0e6;
  --tint-lavender: #f2eef6;
  --tint-aqua: #edf6f6;

  /* Semantic */
  --color-bg: var(--color-paper);
  --color-text: var(--color-ink);
  --color-text-secondary: rgba(22, 22, 22, 0.7);
  --color-text-tertiary: rgba(22, 22, 22, 0.4);
  --color-text-disabled: rgba(22, 22, 22, 0.2);
  --color-primary: var(--color-petrol);
  --color-accent: var(--color-vermilion);
}
```

### Labs Brand

```css
:root {
  /* Typography (same families) */
  --font-display: "Source Serif 4", Georgia, "Times New Roman", serif;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "Courier Prime", monospace;

  /* Labs palette */
  --color-paper: #f3f2ea;
  --color-void: #1a1a1a;
  --color-rand-blue: #0055aa;
  --color-alert-red: #d93025;
  --color-surface: #e6e4dc;
  --color-border: rgba(26, 26, 26, 0.2);
  --color-page-bg: #e8e6df;
  --color-terminal-green: #00ff41; /* CRT effects only — very sparingly */

  /* Semantic */
  --color-bg: var(--color-paper);
  --color-text: var(--color-void);
  --color-text-secondary: rgba(26, 26, 26, 0.7);
  --color-text-tertiary: rgba(26, 26, 26, 0.4);
  --color-text-disabled: rgba(26, 26, 26, 0.2);
  --color-primary: var(--color-rand-blue);
  --color-accent: var(--color-alert-red);
}
```

### Dark Mode

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Client dark (warm charcoal, not cold black) */
    --color-paper: #1a1816;
    --color-ink: #f5f4f1;
    --color-graphite: #a8a5a0;
    --color-border: #3d3a36;

    --color-bg: var(--color-paper);
    --color-text: var(--color-ink);
    --color-text-secondary: rgba(245, 244, 241, 0.7);
    --color-text-tertiary: rgba(245, 244, 241, 0.4);
    --color-text-disabled: rgba(245, 244, 241, 0.2);

    /* Accents stay the same but can be lightened */
    --color-petrol: #1a8fa8; /* lighter for dark bg */
    --color-vermilion: #e06040; /* lighter for dark bg */

    /* Tinted backgrounds become dark variants */
    --tint-cool: #1a2226;
    --tint-sage: #1a221a;
    --tint-warm: #221e1a;
  }
}
```

---

## Color System Detail

### Client Palette

| Color     | Hex       | Usage                        | Contrast on Paper |
| --------- | --------- | ---------------------------- | ----------------- |
| Paper     | `#faf9f6` | Primary background           | —                 |
| Ink       | `#161616` | Primary text, headings       | 14.5:1 AAA        |
| Graphite  | `#4a4a4a` | Secondary text, muted        | 6.5:1 AA          |
| Petrol    | `#0e3b46` | Primary accent, CTAs, links  | 10.2:1 AAA        |
| Vermilion | `#c3471d` | Secondary accent (sparingly) | 5.8:1 AA          |

### Labs Palette

| Color          | Hex       | Usage                        | Contrast on Paper |
| -------------- | --------- | ---------------------------- | ----------------- |
| Paper          | `#f3f2ea` | Primary background           | —                 |
| Void           | `#1a1a1a` | Primary text, borders        | 13.8:1 AAA        |
| Rand-Blue      | `#0055aa` | Links, CTAs, brand accent    | 5.9:1 AA          |
| Alert-Red      | `#d93025` | Decorative numbers, callouts | 5.2:1 AA          |
| Surface        | `#e6e4dc` | Secondary backgrounds, cards | —                 |
| Terminal-Green | `#00ff41` | CRT effects only             | —                 |

### Color Rules

1. **Maximum 5 colors per composition** (excluding opacity variants)
2. **Warm paper tones only** — never pure `#ffffff` for backgrounds
3. **High contrast text** — minimum 4.5:1 for body (WCAG AA)
4. **Primary accent for actions** — links, CTAs, active states
5. **Secondary accent decorative only** — numbers, highlights, borders. Never for body text.
6. **No gradients** — use solid colors

---

## Opacity Hierarchy

The core mechanism for text hierarchy. Replace what other systems do with gray shades.

### Light Mode

```
Primary:      color: var(--color-ink);                    /* full text */
Secondary:    color: rgba(22, 22, 22, 0.70);             /* labels, supporting */
Tertiary:     color: rgba(22, 22, 22, 0.40);             /* captions, metadata */
Disabled:     color: rgba(22, 22, 22, 0.20);             /* placeholder, ghosted */
```

### Dark Mode

```
Primary:      color: var(--color-ink);                    /* #f5f4f1 */
Secondary:    color: rgba(245, 244, 241, 0.70);
Tertiary:     color: rgba(245, 244, 241, 0.40);
Disabled:     color: rgba(245, 244, 241, 0.20);
```

### Tailwind Classes

```html
<!-- Client (use arbitrary values for brand colors) -->
<p class="text-[#161616]">Primary</p>
<p class="text-[#161616]/70">Secondary</p>
<p class="text-[#161616]/40">Tertiary</p>
<p class="text-[#161616]/20">Disabled</p>

<!-- With dark mode -->
<p class="text-[#161616] dark:text-[#f5f4f1]">Primary</p>
<p class="text-[#161616]/70 dark:text-[#f5f4f1]/70">Secondary</p>
```

### Accent at Opacity

Use accent colors at reduced opacity for backgrounds and subtle treatments:

```
Full:    bg-[#0e3b46]         → buttons, active states
Muted:   bg-[#0e3b46]/60     → hover states
Subtle:  bg-[#0e3b46]/20     → tag backgrounds, tints
Ghost:   bg-[#0e3b46]/10     → very subtle hover backgrounds
```

---

## Typography — Full Specification

### Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Inter:wght@400;500;600;700;900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,700;0,8..60,900;1,8..60,400&display=swap"
  rel="stylesheet"
/>
```

### Type Scale — Client

| Element     | Font                                      | Size    | Weight     | Tracking            | Line-height |
| ----------- | ----------------------------------------- | ------- | ---------- | ------------------- | ----------- |
| Hero        | Inter                                     | 60–96px | 700        | -0.045em            | 0.95        |
| H1          | Inter (standard) / Source Serif 4 (paged) | 36–48px | 700–900    | -0.02em to -0.045em | 1.1         |
| H2          | Inter                                     | 22–30px | 700        | -0.03em             | 1.2         |
| H3          | Inter                                     | 17–20px | 700        | -0.02em             | 1.3         |
| H4          | Inter                                     | 15–20px | 700        | -0.01em             | 1.3         |
| Body        | Inter                                     | 15–17px | 500        | normal              | 1.6         |
| Large body  | Inter                                     | 20px    | 500        | normal              | 1.5         |
| Small       | Inter                                     | 14px    | 500        | normal              | 1.5         |
| Label       | Courier Prime                             | 10–12px | 500        | 0.12em              | —           |
| Pull quote  | Source Serif 4                            | 24px    | 400 italic | normal              | 1.35        |
| Stat number | Source Serif 4                            | 48px    | 900        | normal              | 1           |

### Type Scale — Labs

| Element  | Font                                      | Size    | Weight      | Tracking | Line-height |
| -------- | ----------------------------------------- | ------- | ----------- | -------- | ----------- |
| Hero     | Inter                                     | 60–96px | 900 (Black) | tight    | 0.85        |
| H1       | Inter (standard) / Source Serif 4 (paged) | 36–48px | 900         | -0.02em  | 1.0         |
| H2       | Inter                                     | 20–30px | 900         | 0.05em   | 1.2         |
| H3       | Inter                                     | 20px    | 700         | normal   | 1.3         |
| Body     | Inter                                     | 16px    | 400         | normal   | 1.6         |
| Small    | Inter                                     | 14px    | 400         | normal   | 1.5         |
| Metadata | Courier Prime                             | 12px    | 400–700     | 0.15em   | —           |
| Micro    | Courier Prime                             | 10px    | 700         | 0.3em    | —           |

### Key Differences

- **Client**: H2 is sentence-case with `font-bold` (700). Body is `font-medium` (500).
- **Labs**: H2 is UPPERCASE with `font-black` (900). Body is `font-normal` (400). H2 has auto-numbering in Alert-Red.

### Typography Rules

1. **Headings**: Negative letter-spacing at all sizes. `font-black` (Labs) or `font-bold` (Client).
2. **Body**: `font-medium` (Client) or `font-normal` (Labs). Line-height 1.6. Max width `60ch`.
3. **Labels**: Always `Courier Prime`, uppercase, wide tracking (0.12em+).
4. **Display font (Source Serif 4)**: ONLY for cover titles, h1 in paged reports, pull quotes, stat numbers. Never body or h2–h4.
5. **Never mix** sans and mono in the same text block (except inline `<code>`).

### Typographic Details

- Use curly quotes `"` `"` and `'` `'`, never straight quotes.
- Use ellipsis character `…`, never three periods.
- Number columns use `tabular-nums` for vertical alignment.
- Headings use `text-balance` to prevent widows.
- Non-breaking spaces between value and unit: `10&nbsp;MB`.

---

## Spacing System

Base unit: **8px**. Every spacing value is a multiple of 8. This creates a consistent vertical rhythm across all elements — the same discipline as the Swiss grid, applied to Focus.AI's editorial layouts.

| Token | Value | Tailwind | Usage                      |
| ----- | ----- | -------- | -------------------------- |
| 1     | 8px   | `gap-2`  | Tight inline gaps          |
| 2     | 16px  | `gap-4`  | Component internal spacing |
| 3     | 24px  | `gap-6`  | Between related elements   |
| 4     | 32px  | `gap-8`  | Between components         |
| 6     | 48px  | `py-12`  | Section padding (mobile)   |
| 8     | 64px  | `py-16`  | Section padding (tablet)   |
| 12    | 96px  | `py-24`  | Section padding (desktop)  |
| 16    | 128px | `py-32`  | Generous section padding   |

The scale doubles cleanly: 8 → 16 → 32 → 64 → 128. Intermediate steps (24, 48, 96) fill in at 1.5× intervals. No odd values.

### Section Spacing

| Context                      | Desktop         | Mobile         |
| ---------------------------- | --------------- | -------------- |
| Between sections             | 96px (`py-24`)  | 48px (`py-12`) |
| Container horizontal padding | 32px (`px-8`)   | 16px (`px-4`)  |
| Between major elements       | 32px (`gap-8`)  | 16px (`gap-4`) |
| Editorial section padding    | 128px (`py-32`) | 64px (`py-16`) |

---

## Borders & Radius

### Borders

- **1px** — Default for cards, dividers, inputs
- **2px** — Emphasis (active states, section dividers, focus rings)
- **3–4px** — Left accent borders on blockquotes, callouts

### Border Radius

| Context           | Value                              | Notes                  |
| ----------------- | ---------------------------------- | ---------------------- |
| Buttons, inputs   | 4–6px                              | Softened, not round    |
| Cards, containers | 6–8px                              | Default content blocks |
| Code blocks       | 4px                                | Subtle softening       |
| Never             | `rounded-full` on large containers | Too playful            |

**Labs exception**: Labs can use `border-radius: 0` for a sharper, more institutional look. Cards use void borders with no radius.

---

## Shadows

### Client

```css
.card {
  box-shadow: 0 2px 8px rgba(22, 22, 22, 0.04);
}
.card:hover {
  box-shadow: 0 8px 24px rgba(22, 22, 22, 0.08);
}
```

### Labs (Offset Shadow — Signature)

```css
.container {
  box-shadow: 10px 10px 0px 0px rgba(0, 0, 0, 0.1);
}
```

The Labs offset shadow creates a "floating document" effect — very distinctive.

---

## Accessibility Requirements

| Requirement        | Standard                           |
| ------------------ | ---------------------------------- |
| Body text contrast | 4.5:1 minimum (WCAG AA)            |
| Large text (24px+) | 3:1 minimum                        |
| Focus indicators   | Visible, 2px+ ring                 |
| Touch targets      | 44px minimum                       |
| Heading hierarchy  | Logical sequence                   |
| `color-scheme`     | Declare `light dark` on `<html>`   |
| Motion             | Gate with `prefers-reduced-motion` |

### Focus States

```html
<button
  class="focus-visible:ring-2 focus-visible:ring-[#0e3b46] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf9f6]"
>
  Button
</button>
```

Never use `outline-none` without a replacement focus indicator.

---

## Output-Format Tokens

Brand values for the two rendering pipelines. The mechanics of those pipelines live
in the `paged-reports` and `pptx-decks` skills; only the brand values belong here.

### Paged report typography

### Client Paged

| Element   | Font           | Size | Weight | Notes                          |
| --------- | -------------- | ---- | ------ | ------------------------------ |
| Cover h1  | Source Serif 4 | 48px | 900    | With petrol underline          |
| H1 (body) | Source Serif 4 | 36px | 900    | 2px petrol bottom border       |
| H2        | Inter          | 22px | 700    | Auto page-break, bottom border |
| H3        | Inter          | 17px | 700    | break-after: avoid             |
| Body      | Inter          | 15px | 500    | line-height 1.6                |
| Label     | Courier Prime  | 10px | 500    | uppercase, 0.12em tracking     |

### Labs Paged

| Element   | Font           | Size | Weight | Notes                                 |
| --------- | -------------- | ---- | ------ | ------------------------------------- |
| Cover h1  | Source Serif 4 | 48px | 900    | Leading 0.95                          |
| H1 (body) | Source Serif 4 | 36px | 900    | 2px void bottom border                |
| H2        | Inter          | 20px | 900    | UPPERCASE, auto-numbered in Alert-Red |
| H3        | Inter          | 17px | 700    | break-after: avoid                    |
| Body      | Inter          | 15px | 400    | line-height 1.6                       |
| Metadata  | Courier Prime  | 11px | 700    | uppercase, wide tracking              |

### Slide palettes

### Client Palette

```javascript
const CLIENT = {
  paper: "F9F8F5", // near-white warm for slides (lighter than web #FAF9F6)
  ink: "161616",
  graphite: "4A4A4A",
  petrol: "0E3B46",
  vermilion: "C3471D",
  border: "D4D3CF",
  tintCool: "EDF6F8",
  tintWarm: "F7F0E6",
};
```

### Labs Palette

```javascript
const LABS = {
  paper: "F9F8F5", // near-white warm (lighter than web/print paper for screen projection)
  void: "1A1A1A",
  randBlue: "0055AA",
  alertRed: "D93025",
  surface: "E6E4DC",
  pageBg: "E8E6DF",
};
```
