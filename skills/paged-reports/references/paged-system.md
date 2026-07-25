# Paged Reports — paged.js, page breaks, and PDF output

The mechanics of turning markdown into a print-ready document. Brand values — fonts,
sizes, colors for each element — are **not** defined here. They come from the project's
`DESIGN.md` or brand skill; for Focus.AI work that is `focus-ai-brand`, under
"Output-Format Tokens → Paged report typography" in its design-system reference.

## Overview

The `/report` command converts markdown to styled HTML reports. Three modes, picked by intended consumption:

1. **Standard** — Simple HTML opened in browser for Cmd+P printing
2. **Paged** — Full paged.js rendering with running headers, page numbers, smart page breaks, and a component library
3. **Magazine** — Horizontal-scroll, full-viewport spreads with arrow-key navigation. For shareable URLs (artifacts, link drops) where the reader scrolls through the report on screen instead of printing it.

**Picking a mode:**

| When                                                        | Mode         |
| ----------------------------------------------------------- | ------------ |
| Internal draft, quick read in the browser                   | **Standard** |
| Emailing a PDF, client deliverable, archival print          | **Paged**    |
| Shareable URL (artifact, Slack link), screen-only reading   | **Magazine** |
| You want both a PDF and a scrollable URL                    | Generate **Magazine** — its `@media print` fallback emits paged spreads |

---

## Usage

```
# Standard: open in browser for manual print
/report file:./my-document.md style:labs

# Paged: generate PDF directly
/report file:./proposal.md style:client output:./proposal.pdf

# Force paged template in browser preview
/report file:./analysis.md style:client paged:true

# Magazine: horizontal-scroll spreads with arrow-key nav
/report file:./architecture.md style:client mode:magazine
```

**Arguments:**

| Arg      | Required | Default | Description                                                                 |
| -------- | -------- | ------- | --------------------------------------------------------------------------- |
| `file`   | Yes      | —       | Path to the markdown file                                                   |
| `style`  | No       | `labs`  | Brand: `client` or `labs`                                                   |
| `output` | No       | —       | PDF output path. When set, uses chrome-driver                               |
| `paged`  | No       | `auto`  | `auto` / `true` / `false`. Auto uses paged when `output` is specified       |
| `mode`   | No       | `paged` | `standard` / `paged` / `magazine`. `magazine` overrides the `paged` arg.    |

---

## Magazine Mode

Horizontal scroll-snap track of full-viewport spreads. `←` / `→` arrow keys page between spreads, `↑` / `↓` scroll within the current spread. Designed for shareable URLs where the reader consumes the report on screen.

### When to use it

- Output is a URL you'll share (artifacts.thefocus.ai, Slack link, email link), not a file you'll attach.
- Reader is on a desktop or laptop with arrow keys.
- The report has 3–12 logical sections that each fit one viewport-width. (More than ~12 and the horizontal track gets tedious.)
- You also want a paged PDF as a side-effect — magazine mode's `@media print` fallback emits one page per spread automatically.

**Don't use it for:** long-form articles, single-section status updates, anything reading on a phone (the layout falls back to vertical stacking on narrow viewports, but the magazine premise is desktop-first).

### Required scaffolding

Magazine reports lock body scroll and give the horizontal track ownership:

```css
html, body {
  height: 100%;
  overflow: hidden;          /* track owns scrolling */
  overscroll-behavior: contain;
}

.track {
  display: flex; flex-direction: row;
  overflow-x: auto; overflow-y: hidden;
  scroll-snap-type: x mandatory;
  height: 100vh;
}

.spread {
  flex: 0 0 100vw;
  height: 100vh;
  scroll-snap-align: start;
  overflow-y: auto;          /* tall spreads scroll within themselves */
  overflow-x: hidden;
  overscroll-behavior-y: contain;
}
.spread + .spread { border-left: 1px solid var(--border); }
```

The two key invariants:

1. **`overflow: hidden` on `body`** — without it, the page itself becomes scrollable on top of the track, and you get double-scroll weirdness.
2. **`overflow-y: auto` on each `.spread`** — so a spread taller than the viewport scrolls vertically without affecting the horizontal track.

### Required keyboard handler

```js
const track = document.getElementById("track");
const spreads = Array.from(track.querySelectorAll(".spread"));
const total = spreads.length;

function currentIndex() {
  return Math.round(track.scrollLeft / window.innerWidth);
}
let targetIndex = currentIndex();
function goTo(index, smooth = true) {
  targetIndex = Math.max(0, Math.min(total - 1, index));
  track.scrollTo({ left: targetIndex * window.innerWidth, behavior: smooth ? "smooth" : "auto" });
}

// Resync targetIndex if the user trackpad-scrolls horizontally.
let scrollSyncTimer = null;
track.addEventListener("scroll", () => {
  clearTimeout(scrollSyncTimer);
  scrollSyncTimer = setTimeout(() => {
    const idx = currentIndex();
    if (Math.abs(track.scrollLeft - idx * window.innerWidth) < 4) targetIndex = idx;
  }, 120);
});

function currentSpread() { return spreads[currentIndex()] ?? spreads[0]; }

window.addEventListener("keydown", (e) => {
  if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); goTo(targetIndex + 1); }
  else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); goTo(targetIndex - 1); }
  else if (e.key === "ArrowDown") { e.preventDefault(); currentSpread().scrollBy({ top: 120, behavior: "smooth" }); }
  else if (e.key === "ArrowUp")   { e.preventDefault(); currentSpread().scrollBy({ top: -120, behavior: "smooth" }); }
  else if (e.key === "Home") { e.preventDefault(); goTo(0); }
  else if (e.key === "End")  { e.preventDefault(); goTo(total - 1); }
});
window.addEventListener("resize", () => { targetIndex = currentIndex(); });
```

`PageDown` / `PageUp` / `Space` are aliased to ←/→ so presentation-style remotes work. Why `targetIndex` (not just reading `scrollLeft`): rapid key presses fire faster than smooth-scroll completes, so we track the intended target and let `scrollTo` chase it.

### Required fixed chrome

Three persistent overlays, fixed-positioned with `pointer-events: none` so they never intercept scroll:

```html
<div class="nav">
  <div><span class="nav-brand">focus.ai</span> · {Project} · {Topic}</div>
  <div>{Date}</div>
</div>

<div class="scroll-hint">
  Use <span style="color:var(--ink)">←</span> <span style="color:var(--ink)">→</span> to navigate
  <span class="arrow">→</span>
</div>
```

Where `.arrow` has a 1.6s `translateX` keyframe animation in Vermilion so first-time readers see they should press a key. The hint is non-blocking and not interactive — purely affordance signaling.

### Spread structure

Each `.spread` uses a 3-column asymmetric grid: 144px label column / flexible content (max 60ch) / 192px marginalia. For spreads without marginalia, use `.spread-inner.no-marginalia` (drops the third column).

```html
<section class="spread" style="background:var(--tint-cool)">
  <div class="spread-inner no-marginalia">
    <div>
      <div class="label">02 / 06</div>
      <div class="label-quiet" style="margin-top:8px;">Topology</div>
    </div>
    <div>
      <div class="rule"></div>
      <h2 class="section-title">High-level shape</h2>
      <p class="lede">…</p>
      <!-- body content -->
    </div>
  </div>
  <div class="running-foot">
    <span>Topology</span>
    <span class="folio">02</span>
  </div>
</section>
```

**The cover spread** is special — uses `.spread-inner.full` (single column), `.cover-title` (72px Source Serif 4 Black), and a `.meta-grid` for Project / Repo / Stack / Prepared-by labels.

**The closing spread** typically inverts: `background: var(--ink)` with `color: var(--paper)` and translucent borders on cards. Lets a confident takeaway land as the final view.

### Background variation

Vary the `background` of consecutive spreads to give the reader spatial awareness as they paginate:

| Token         | Hex       | Use                              |
| ------------- | --------- | -------------------------------- |
| `--paper`     | `#faf9f6` | Default                          |
| `--tint-cool` | `#edf6f8` | Topology / diagram-heavy spreads |
| `--tint-warm` | `#f7f0e6` | Code-heavy spreads               |
| `--tint-sage` | `#eef6ee` | UI / rendering spreads           |
| `--ink`       | `#161616` | Closing spread (inverted)        |

Don't alternate every spread — group by semantic affinity. The Versant architecture report uses paper → cool → paper → paper → warm → paper → sage → paper → ink, where each tint marks a thematic shift.

### Print fallback (paged PDF as side-effect)

Magazine mode includes a `@media print` block that converts horizontal spreads into landscape pages. So you can `Cmd+P → Save as PDF` and get an emailable artifact for free:

```css
@media print {
  @page { size: 11in 8.5in; margin: 0; }
  html, body { height: auto !important; overflow: visible !important; background: var(--paper); }
  .nav, .scroll-hint { display: none !important; }
  .track {
    display: block !important;
    overflow: visible !important;
    height: auto !important;
    scroll-snap-type: none !important;
  }
  .spread {
    flex: none !important;
    width: 11in !important;
    height: 8.5in !important;
    page-break-after: always;
    break-after: page;
    border-left: none !important;
    overflow: hidden !important;
  }
  .spread:last-of-type { page-break-after: auto; break-after: auto; }
  .spread-inner { padding: 36px 56px 56px !important; gap: 32px !important; }
  h2.cover-title, h2.section-title { font-size: 40px !important; line-height: 1.05 !important; }
  .running-foot { bottom: 24px !important; left: 56px !important; right: 56px !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
```

This is why magazine mode is the right pick when "we email PDFs sometimes and share URLs sometimes" — one HTML file ships both.

### Reference implementation

The Versant architecture report ships the canonical example: nine spreads, paper + four background tints + closing on `--ink`, full keyboard wiring, print fallback. Read `docs/status/architecture-report.html` in the versant repo for a complete starting point.

### Gotchas

- **Avoid `wheel`/`deltaX` hijacking.** Trackpad horizontal swipe + `scroll-snap-type: x mandatory` is already the correct experience. Adding a wheel handler to "page" on horizontal scroll fights the OS gesture and feels broken. Trust scroll-snap.
- **Section count vs viewport count.** Don't 1-to-1 map markdown sections to spreads. Consolidate. A report with 12 markdown h2s probably wants 6 spreads; group adjacent sections.
- **Tall content in a single spread.** If a spread's content overflows the viewport, that's fine — the spread itself becomes vertically scrollable. The arrow-key handler routes `↑`/`↓` into the active spread. Don't try to fit everything horizontally.
- **Don't add a per-spread nav.** Spread index in `.running-foot` (e.g. `02`) is enough. Sidebar nav fights the magazine premise.
- **Mobile fallback.** Below ~768px, the magazine premise dies. Either add a vertical-stack media query (each `.spread` becomes `width: 100vw; height: auto;` and the track flips to `flex-direction: column; scroll-snap-type: y mandatory;`), or accept that magazine mode is desktop-only and add a noscript / narrow-viewport notice. The reference implementation chooses the latter.

---

## Smart Page Break System

The paged templates implement a comprehensive page-break strategy. **No manual intervention needed for most documents** — the CSS handles it automatically.

### How It Works

| Rule                     | CSS                                                                                                                    | Effect                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Cover page isolated      | `.cover { break-after: page }`                                                                                         | Content always starts on a fresh page                      |
| Each h2 = new page       | `h2 { break-before: page }`                                                                                            | Every major section starts at page top                     |
| First h2 exception       | `.no-break-before { break-before: auto }`                                                                              | Prevents blank page between cover and first section        |
| Headings never orphaned  | `h2, h3, h4 { break-after: avoid }`                                                                                    | A heading always has content following it on the same page |
| Components never split   | `break-inside: avoid` on cards, callouts, tables, pre, blockquotes, stat-grid, process-flow, pull-quote, images, lists | Components stay whole                                      |
| Section wrapper          | `.section { break-inside: avoid }`                                                                                     | Keeps h3 + its following content together                  |
| Paragraph widows/orphans | `p { orphans: 3; widows: 3 }`                                                                                          | No lonely lines stranded at page boundaries                |
| Manual overrides         | `.page-break`, `.keep-together`                                                                                        | Author control when needed                                 |

### Document Structure Convention

For optimal pagination, structure content as:

```
cover → optional stat-grid → first h2 (.no-break-before) → content →
h2 → content → h2 → content → footer
```

Each `h2` section becomes its own "chapter" starting at the top of a page.

### The `.section` Wrapper Pattern

When you have an h3 followed by related content (paragraphs, lists, cards) that should stay together, wrap them:

```html
<div class="section">
  <h3>Subsection Title</h3>
  <p>This paragraph stays with its heading.</p>
  <p>So does this one.</p>
</div>
```

Without the wrapper, `break-after: avoid` only prevents a break _immediately_ after the heading — the content could still break away. The `.section` wrapper keeps the entire block together.

### When to Add `.no-break-before`

Apply to the **first h2 after the cover** (or after a stat-grid that follows the cover):

```html
<section class="cover">...</section>
<h2 class="no-break-before">Executive Summary</h2>
```

This prevents a blank page between the cover and the opening section.

---

## Running Headers & Page Numbers

Paged templates automatically add:

- **Top-left**: Brand mark ("THEFOCUS.AI" or "THEFOCUS.AI LABS") in accent color
- **Top-right**: Page number (01, 02, …) in Courier Prime

These are suppressed on the cover page and first page via named page rules.

### How the @page rules work

```css
@page {
  size: letter;
  margin: 0.75in 0.75in 1in 0.75in;
  background: var(--color-paper); /* Warm paper preserved in PDF */

  @top-left {
    content: "THEFOCUS.AI";
    font-family: "Inter", sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 2px;
    color: var(--color-accent); /* Vermilion or Alert-Red */
  }

  @top-right {
    content: counter(page, decimal-leading-zero);
    font-family: "Courier Prime", monospace;
    font-size: 10px;
  }
}

@page cover {
  @top-left {
    content: none;
  }
  @top-right {
    content: none;
  }
}
@page :first {
  @top-left {
    content: none;
  }
  @top-right {
    content: none;
  }
}
```

---

## Cover Page

Every paged report starts with a cover:

```html
<section class="cover">
  <div class="brand-mark">THEFOCUS.AI</div>
  <h1>Report Title Here</h1>
  <div class="subtitle">A brief description of the report's purpose</div>
  <div class="cover-rule"></div>
  <div class="cover-meta">
    <strong>Prepared for:</strong> Client Name<br />
    <strong>Date:</strong> April 2026<br />
    <strong>Author:</strong> Will Schenk
  </div>
</section>
```

The cover uses `page: cover` (suppresses headers) and `break-after: page` (forces content to next page).

---

## Component Library (Paged Templates)

These classes are available inside paged report templates:

### Layout Components

```html
<!-- Equal two-column -->
<div class="two-col">
  <div>Left column content</div>
  <div>Right column content</div>
</div>

<!-- Wide left (3fr / 2fr) -->
<div class="two-col-wide-left">
  <div>Wider left column</div>
  <div>Narrower right</div>
</div>

<!-- Wide right (2fr / 3fr) -->
<div class="two-col-wide-right">
  <div>Narrower left</div>
  <div>Wider right column</div>
</div>
```

All layout components have `break-inside: avoid`.

### Cards

```html
<!-- Dark card (petrol/void background, white text) -->
<div class="card-dark">
  <h4>Key Insight</h4>
  <p>Important content on dark background.</p>
</div>

<!-- Light card (white bg, primary accent left border) -->
<div class="card-light">
  <h4>Supporting Detail</h4>
  <p>Content with petrol/rand-blue left border.</p>
</div>

<!-- Accent card (white bg, secondary accent left border) -->
<div class="card-accent">
  <h4>Highlight</h4>
  <p>Content with vermilion/alert-red left border.</p>
</div>
```

### Statistics

```html
<div class="stat-grid">
  <div>
    <div class="stat-number">42%</div>
    <div class="stat-label">Improvement</div>
  </div>
  <div>
    <div class="stat-number">3.2x</div>
    <div class="stat-label">Faster</div>
  </div>
  <div>
    <div class="stat-number">$1.2M</div>
    <div class="stat-label">Saved</div>
  </div>
</div>
```

- `.stat-number` — 48px Source Serif 4, weight 900, primary accent color
- `.stat-label` — 11px Courier Prime, uppercase, secondary accent color
- `.stat-grid` — 3-column centered layout with `break-inside: avoid`

### Callouts

```html
<!-- Light callout (subtle background + border) -->
<div class="callout">
  <p><strong>Note:</strong> Additional context or clarification.</p>
</div>

<!-- Key callout (dark background, white text) -->
<div class="callout-key">
  <p>
    <strong>Key Takeaway:</strong> The most important point from this section.
  </p>
</div>
```

### Process Flow

```html
<div class="process-flow">
  <div class="step">
    <div class="step-number">Step 01</div>
    <div class="step-title">Discover</div>
    <div class="step-desc">Identify data sources and systems</div>
  </div>
  <div class="step">
    <div class="step-number">Step 02</div>
    <div class="step-title">Connect</div>
    <div class="step-desc">Build integrations and pipelines</div>
  </div>
  <div class="step">
    <div class="step-number">Step 03</div>
    <div class="step-title">Deliver</div>
    <div class="step-desc">Deploy curated interfaces</div>
  </div>
</div>
```

Renders as horizontal steps with arrow separators. Uses `break-inside: avoid`.

### Pull Quotes

```html
<div class="pull-quote">
  The best interface is one that makes the complex feel simple.
  <cite>— Attribution Name</cite>
</div>
```

Source Serif 4 italic, 24px, with accent-colored left border and mono cite.

### Page Control

```html
<!-- Force page break before this element -->
<div class="page-break"></div>

<!-- Keep this content together (don't split across pages) -->
<div class="keep-together">
  <h4>Title</h4>
  <p>These stay together on one page.</p>
</div>
```

---

## Multi-Column Article Layout

For magazine-style flowing text across columns within paged reports:

```css
/* Two-column article body */
.article-cols-2 {
  column-count: 2;
  column-gap: 2rem;
  column-rule: 1px solid var(--color-border);
}

/* Three-column for dense reference content */
.article-cols-3 {
  column-count: 3;
  column-gap: 1.5rem;
  column-rule: 1px solid var(--color-border);
}

/* Elements that span full width across columns */
.article-cols-2 h2,
.article-cols-3 h2,
.col-span-all {
  column-span: all;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

/* Prevent awkward breaks inside columns */
.article-cols-2 p,
.article-cols-3 p {
  break-inside: avoid-column;
}

.article-cols-2 figure,
.article-cols-3 figure,
.article-cols-2 blockquote,
.article-cols-3 blockquote {
  break-inside: avoid;
}

/* Headings never orphaned at column bottom */
.article-cols-2 h3,
.article-cols-2 h4,
.article-cols-3 h3,
.article-cols-3 h4 {
  break-after: avoid-column;
}
```

### Usage

```html
<h2 class="no-break-before">Analysis</h2>
<div class="article-cols-2">
  <p>First paragraph flows across two columns naturally...</p>
  <p>Content continues into the second column when the first fills up...</p>

  <!-- Full-width element breaking across both columns -->
  <div class="col-span-all">
    <div class="callout">
      <p>This callout spans both columns.</p>
    </div>
  </div>

  <p>Text continues in two columns after the callout...</p>
</div>
```

---

## PDF Generation Workflow

### With chrome-driver (direct PDF)

```bash
# Find the chrome-driver pdf binary
PDF_BIN=$(ls -d ~/.claude/plugins/cache/focus-marketplace/chrome-driver/*/bin/pdf | sort -V | tail -1)

# Generate PDF from HTML
$PDF_BIN file:///tmp/focus-report-{timestamp}.html ./output.pdf
```

### Browser Print (Cmd+P)

1. Generate HTML → write to `/tmp/focus-report-{timestamp}.html`
2. Open in browser: `open /tmp/focus-report-{timestamp}.html`
3. User prints via Cmd+P (standard template) or the paged.js preview renders automatically

---

## Template Selection

| Style  | Standard (browser)   | Paged (PDF)                |
| ------ | -------------------- | -------------------------- |
| Client | `client-report.html` | `client-report-paged.html` |
| Labs   | `labs-report.html`   | `labs-report-paged.html`   |

**Auto selection**: When `output` is specified → paged template. Otherwise → standard.

---

## Paged.js Initialization

Templates use deferred initialization to ensure fonts load before pagination:

```html
<script>
  window.PagedConfig = { auto: false };
</script>
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
<script>
  document.fonts.ready.then(() => window.PagedPolyfill.preview());
</script>
```

This prevents layout shifts from fonts loading after pagination has already chunked the content.

---

## Print Color Preservation

Both templates preserve the warm paper background in print:

```css
body {
  background: var(--color-paper);
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
```

The cream background is part of the brand identity and must be preserved in PDF output.

---

## Quick Reference: Page Break Decisions

| Scenario                                 | What happens             | CSS responsible                          |
| ---------------------------------------- | ------------------------ | ---------------------------------------- |
| New major section (h2)                   | Starts on fresh page     | `h2 { break-before: page }`              |
| First section after cover                | No extra blank page      | `.no-break-before`                       |
| Heading at page bottom                   | Moves to next page       | `h2/h3/h4 { break-after: avoid }`        |
| Card/table/code block would split        | Stays whole on next page | `break-inside: avoid`                    |
| h3 + its content group                   | Stays together           | `.section { break-inside: avoid }`       |
| Last lines of paragraph alone at top     | At least 3 lines         | `p { widows: 3 }`                        |
| First lines of paragraph alone at bottom | At least 3 lines         | `p { orphans: 3 }`                       |
| Author needs manual control              | Forced break             | `.page-break { break-before: page }`     |
| Author needs content together            | No split                 | `.keep-together { break-inside: avoid }` |
