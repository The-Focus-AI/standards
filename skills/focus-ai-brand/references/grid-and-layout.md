# Focus.AI Design System — Grid & Layout

## Two Layout Modes

Focus.AI uses two complementary grid systems depending on context:

1. **12-Column Grid** — General-purpose, Tailwind-native, great for dashboards, multi-card layouts, marketing pages
2. **Asymmetric Editorial** — Signature Focus.AI layout for long-form content, reports, case studies

---

## 12-Column Grid

Standard Swiss-style grid with 8px-multiple gaps.

```html
<div class="max-w-6xl mx-auto px-4 md:px-8">
  <div class="grid grid-cols-12 gap-4 md:gap-8">
    <!-- Full width -->
    <div class="col-span-12">...</div>

    <!-- Two-thirds + one-third -->
    <div class="col-span-12 md:col-span-8">...</div>
    <div class="col-span-12 md:col-span-4">...</div>

    <!-- Half + half -->
    <div class="col-span-12 md:col-span-6">...</div>
    <div class="col-span-12 md:col-span-6">...</div>

    <!-- Thirds -->
    <div class="col-span-12 md:col-span-4">...</div>
    <div class="col-span-12 md:col-span-4">...</div>
    <div class="col-span-12 md:col-span-4">...</div>
  </div>
</div>
```

### Grid Rules

- Always `col-span-12` as mobile fallback
- Use `gap-4 md:gap-8` (16px → 32px)
- Max content width: `max-w-6xl` (1152px) or `max-w-7xl` (1280px)
- No fractional splits (avoid 5/7). Use: 4/8, 6/6, 4/4/4, 3/9, 8/4
- Container padding: `px-4 md:px-8` (16px → 32px)

---

## Asymmetric Editorial Layout

The signature Focus.AI Client layout — inspired by magazine editorial design. Three columns with a label gutter, content main, and marginalia.

```
┌─────────────────────────────────────────────────────────────┐
│  140px       │  1fr (max 740px)           │  200px          │
│  Label       │  Content                   │  Marginalia     │
│  Gutter      │  Main                      │  Gutter         │
└─────────────────────────────────────────────────────────────┘
      Gap: 32px (gap-8)         Max-width: 1408px
```

### CSS Implementation

```css
.asymmetric-container {
  display: grid;
  grid-template-columns: 140px 1fr 200px;
  gap: 2rem; /* 32px — on the 8px grid */
  max-width: 1408px; /* 176 × 8 */
  margin: 0 auto;
  padding: 0 2rem; /* 32px */
  align-items: start;
}

.content-main {
  max-width: 740px;
}

/* Mobile: collapses to single column */
@media (max-width: 1024px) {
  .asymmetric-container {
    grid-template-columns: 1fr;
    gap: 1rem; /* 16px */
    padding: 0 1rem; /* 16px */
  }
}
```

### Tailwind Implementation

```html
<section class="py-12 md:py-24 lg:py-32 px-4 md:px-8">
  <div
    class="max-w-[1408px] mx-auto grid grid-cols-1 lg:grid-cols-[144px_1fr_192px] gap-4 lg:gap-8 items-start"
  >
    <!-- Label gutter -->
    <div class="pt-1">
      <span
        class="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#161616]"
      >
        Section
      </span>
    </div>

    <!-- Content main -->
    <div class="max-w-[740px]">
      <h2
        class="text-3xl md:text-4xl font-bold tracking-tight text-[#161616] leading-snug mb-4"
      >
        Section Title
      </h2>
      <p
        class="text-base font-medium leading-relaxed text-[#161616]/70 max-w-[60ch]"
      >
        Body text goes here.
      </p>
    </div>

    <!-- Marginalia gutter -->
    <div class="pt-1">
      <p class="text-sm font-medium text-[#4a4a4a]">Metadata or notes</p>
    </div>
  </div>
</section>
```

### When to Use Each

| Layout               | Use for                                                    |
| -------------------- | ---------------------------------------------------------- |
| 12-column grid       | Card grids, dashboards, landing pages with varied sections |
| Asymmetric editorial | Long-form content, proposals, case studies, articles       |

---

## Section Spacing

Generous whitespace between sections is fundamental. Swiss principle: space is structure, not waste.

```html
<!-- Standard section -->
<section class="py-12 md:py-16 lg:py-24">
  <div class="max-w-6xl mx-auto px-4 md:px-8">...</div>
</section>

<!-- Editorial section (generous) -->
<section class="py-16 md:py-24 lg:py-32">
  <div class="max-w-6xl mx-auto px-4 md:px-8">...</div>
</section>

<!-- Section with top border divider -->
<section class="py-12 md:py-24 border-t border-[#d4d3cf]">
  <div class="max-w-6xl mx-auto px-4 md:px-8">...</div>
</section>
```

### Spacing Scale for Sections

| Context                    | Mobile         | Tablet         | Desktop         |
| -------------------------- | -------------- | -------------- | --------------- |
| Section padding (vertical) | `py-12` (48px) | `py-16` (64px) | `py-24` (96px)  |
| Editorial padding          | `py-16` (64px) | `py-24` (96px) | `py-32` (128px) |
| Container padding (horiz)  | `px-4` (16px)  | `px-8` (32px)  | `px-8` (32px)   |
| Between cards/elements     | `gap-4` (16px) | `gap-8` (32px) | `gap-8` (32px)  |
| Between heading and body   | `mb-4` (16px)  | `mb-6` (24px)  | `mb-6` (24px)   |
| Between major blocks       | `mt-8` (32px)  | `mt-12` (48px) | `mt-12` (48px)  |

---

## Geometric Decoration

Simple geometric forms as structural accents — not ornamentation.

### Accent Rules

```html
<!-- Petrol rule above heading (Client) -->
<div class="w-12 h-0.5 bg-[#0e3b46] mb-6"></div>

<!-- Vermilion decorative rule (Client) -->
<div class="w-[60px] h-[3px] bg-[#c3471d] mb-8"></div>

<!-- Void rule (Labs) -->
<div class="w-[60px] h-[3px] bg-[#1a1a1a] mb-8"></div>

<!-- Full-width section divider -->
<hr class="border-none h-px bg-[#d4d3cf] my-12 md:my-16" />
```

### Large Background Numerals

Swiss-style oversized numbers as structural anchors:

```html
<div
  class="absolute top-0 right-0 text-[clamp(12rem,30vw,28rem)] font-light leading-none text-[#161616]/5 select-none pointer-events-none pr-8 pt-4"
>
  01
</div>
```

### Labs: Binding Strip

Blue vertical strip evoking a bound research report:

```html
<div
  class="w-full md:w-20 bg-[#0055aa] flex md:flex-col justify-between items-center py-4 md:py-8 shrink-0 border-r border-[#1a1a1a]"
>
  <div
    class="text-white font-mono text-xs -rotate-0 md:-rotate-90 whitespace-nowrap tracking-[0.3em] uppercase"
  >
    Section Label
  </div>
</div>
```

### Labs: Offset Shadow

The signature "floating document" effect:

```html
<div
  class="max-w-7xl mx-auto bg-[#f3f2ea] border border-[#1a1a1a] shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)]"
>
  <!-- Content -->
</div>
```

---

## Dividers

```html
<!-- Quiet rule (Client) -->
<hr class="border-none h-px bg-[rgba(212,211,207,0.5)] my-12 md:my-16" />

<!-- Petrol accent rule (Client) -->
<div class="h-px bg-[rgba(14,59,70,0.3)] my-12"></div>

<!-- Strong divider (Labs) -->
<div class="border-b-2 border-[#1a1a1a] pb-6 mb-12"></div>

<!-- Dashed divider (Labs) -->
<div class="border-b border-dashed border-gray-400 pb-2 mb-8"></div>

<!-- Divider with label -->
<div class="flex items-center gap-4 my-12">
  <div class="flex-1 h-px bg-[#d4d3cf]"></div>
  <span class="font-mono text-xs uppercase tracking-widest text-[#161616]/30"
    >or</span
  >
  <div class="flex-1 h-px bg-[#d4d3cf]"></div>
</div>
```

---

## Content Width Constraints

| Content type               | Max width | Tailwind         |
| -------------------------- | --------- | ---------------- |
| Body text / paragraphs     | 60ch      | `max-w-[60ch]`   |
| Lead paragraph             | 52ch      | `max-w-[52ch]`   |
| Content main column        | 740px     | `max-w-[740px]`  |
| Card grid container        | 1152px    | `max-w-6xl`      |
| Editorial container        | 1408px    | `max-w-[1408px]` |
| Full page container (Labs) | 1280px    | `max-w-7xl`      |

**Never let body text exceed 60ch.** Wider columns destroy legibility.
