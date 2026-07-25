# Focus.AI Design System — Responsive Design

## Mobile-First Philosophy

Every layout decision starts at the smallest viewport and adds complexity as space allows. Default (unprefixed) Tailwind classes are mobile. Use `sm:`, `md:`, `lg:` to enhance.

---

## Breakpoint Strategy

| Prefix | Width   | Layout behavior                                                |
| ------ | ------- | -------------------------------------------------------------- |
| (none) | 0px+    | Single column, full width, compact spacing                     |
| `sm:`  | 640px+  | Slightly wider cards, 2-up small grids                         |
| `md:`  | 768px+  | Two-column layouts emerge, larger type, expanded padding       |
| `lg:`  | 1024px+ | Full 12-col grid or asymmetric editorial, max-width containers |

---

## Mobile Layout Rules

- All grid columns collapse to `col-span-12`
- Asymmetric editorial becomes single column (`grid-cols-1`)
- Section padding reduces: `py-12 md:py-16 lg:py-24`
- Horizontal padding tightens: `px-4 md:px-8`
- Display type scales down: `text-3xl md:text-5xl lg:text-7xl`
- Multi-column nav collapses to simplified header
- Tables get `overflow-x-auto` wrapper
- Side-by-side cards stack: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Label gutters and marginalia hide or stack above content

---

## Fluid Type

Use responsive type classes or `clamp()` for smooth scaling:

### Responsive Classes (Preferred)

```html
<!-- Hero heading -->
<h1
  class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95]"
>
  Headline Text
</h1>

<!-- Section heading -->
<h2
  class="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-snug"
>
  Section Title
</h2>

<!-- Body text (stays consistent, just adjusts line-height) -->
<p class="text-base md:text-[17px] font-medium leading-relaxed max-w-[60ch]">
  Body content.
</p>
```

### clamp() (Truly Fluid)

```html
<!-- Focus.AI Client hero (matches their clamp usage) -->
<h1
  class="text-[clamp(32px,8vw,88px)] font-bold tracking-[-0.045em] leading-[0.95]"
>
  Headline
</h1>

<!-- Section heading -->
<h2
  class="text-[clamp(24px,5vw,48px)] font-bold tracking-[-0.03em] leading-tight"
>
  Section
</h2>
```

---

## Responsive Section Pattern

```html
<section
  class="py-12 md:py-16 lg:py-24 border-t border-[#d4d3cf] dark:border-[#3d3a36]"
>
  <div class="max-w-6xl mx-auto px-4 md:px-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
      <!-- Cards -->
    </div>
  </div>
</section>
```

---

## Touch Targets

All interactive elements must be at least **44×44px** on mobile.

```html
<!-- Button with minimum touch target -->
<button class="min-h-[44px] min-w-[44px] px-6 py-3 text-sm font-medium ...">
  Action
</button>

<!-- Nav link with adequate tap area -->
<a href="#" class="block py-3 px-4 text-sm ..."> Navigation Item </a>
```

### Rules

- Buttons: minimum `min-h-[44px]` plus `px-6 py-3`
- Nav links: minimum `py-3` for vertical tap area
- Icon buttons: `w-11 h-11` (44px)
- Never rely on hover-only states for mobile users
- Add `:active` states for touch feedback

---

## Navigation on Mobile

Collapse to a minimal top bar. Hide secondary links below `md:`. The Focus.AI style favors flat, clear navigation — no deeply nested hamburger menus.

```html
<nav class="border-b border-[#d4d3cf]">
  <div
    class="max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between h-14 md:h-16"
  >
    <!-- Brand mark (always visible) -->
    <a
      href="/"
      class="font-mono text-xs font-medium uppercase tracking-[0.12em]"
    >
      Focus.AI
    </a>

    <!-- Desktop nav (hidden on mobile) -->
    <div class="hidden md:flex items-center gap-8">
      <a
        href="#"
        class="text-sm text-[#161616]/60 hover:text-[#161616] transition-colors"
        >Work</a
      >
      <a
        href="#"
        class="text-sm text-[#161616]/60 hover:text-[#161616] transition-colors"
        >About</a
      >
      <a href="#" class="text-sm text-[#0e3b46]">Contact</a>
    </div>
  </div>
</nav>
```

---

## Tables on Mobile

Always wrap tables in a horizontal scroll container:

```html
<div class="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
  <table class="w-full min-w-[640px] text-sm">
    ...
  </table>
</div>
```

---

## Images & Media

```html
<!-- Responsive image with aspect ratio -->
<figure class="w-full">
  <img src="..." alt="..." class="w-full h-auto rounded-md" loading="lazy" />
  <figcaption
    class="mt-2 font-mono text-xs text-[#161616]/40 uppercase tracking-wide"
  >
    Figure 01 — Description
  </figcaption>
</figure>

<!-- Constrained image in content -->
<img src="..." alt="..." class="max-w-full md:max-w-[80%] h-auto" />
```

---

## Animation Safety

Gate all animations with `prefers-reduced-motion`:

```html
<!-- Tailwind approach -->
<div
  class="motion-safe:transition motion-safe:duration-200 motion-reduce:transition-none"
>
  ...
</div>
```

Only animate `transform` and `opacity`. Never `transition: all`.

### Focus.AI Animation Timing

| Duration  | Usage                                             |
| --------- | ------------------------------------------------- |
| 150ms     | Quick interactions (underlines, small transforms) |
| 200ms     | Standard transitions (buttons, colors)            |
| 300ms     | Hover effects on cards                            |
| 600–800ms | Section reveals, fade-ins                         |

Easing: `cubic-bezier(0.4, 0, 0.2, 1)` for standard, `ease` for smooth.

---

## Responsive Checklist

Before shipping, verify at 375px (mobile), 768px (tablet), and 1280px (desktop):

- [ ] No horizontal scroll at any viewport
- [ ] All grid columns have `col-span-12` or `grid-cols-1` mobile fallback
- [ ] Heading type scales down (`text-3xl md:text-5xl lg:text-7xl`)
- [ ] Section padding reduces (`py-12 md:py-16 lg:py-24`)
- [ ] Horizontal padding reduces (`px-4 md:px-8`)
- [ ] All tables wrapped in `overflow-x-auto`
- [ ] All interactive elements at least 44×44px on mobile
- [ ] Desktop-only nav links hidden below `md:`
- [ ] Asymmetric layout collapses to single column below `lg:`
- [ ] Body text stays at `max-w-[60ch]` (never wider)
- [ ] Images never overflow container
- [ ] Card grids stack: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- [ ] Touch feedback (`:active` states) on mobile buttons
- [ ] `prefers-reduced-motion` respected
