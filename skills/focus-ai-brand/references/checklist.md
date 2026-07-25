# Focus.AI Design System — Pre-Ship Checklist

Run through before shipping any Focus.AI branded material.

---

## Brand Identity

- [ ] Correct brand selected (Client for services/proposals, Labs for research/experiments)
- [ ] Color palette limited to brand colors (Paper, Ink/Void, Primary accent, Secondary accent, Border)
- [ ] Maximum 5 colors in composition (excluding opacity variants)
- [ ] Background is warm paper tone, never pure `#ffffff` or `#000000`
- [ ] Generated imagery uses correct style (Renaissance for Client, Bell Labs/Tufte for Labs)
- [ ] Voice matches brand (confident/professional for Client, curious/wry for Labs)
- [ ] No buzzwords, no hyperbole, no self-promotion

---

## Typography

- [ ] Google Fonts `<link>` tag present (Inter + Courier Prime, + Source Serif 4 if paged)
- [ ] Headings use `font-bold` (700) or `font-black` (900) with negative letter-spacing
- [ ] Body text uses `font-medium` (Client) or `font-normal` (Labs)
- [ ] Body text line-height is 1.6 (`leading-relaxed`)
- [ ] Body text max width is `60ch` or narrower
- [ ] Labels use Courier Prime, uppercase, wide letter-spacing (0.12em+)
- [ ] Source Serif 4 used only for: cover titles, h1 in paged reports, pull quotes, stat numbers
- [ ] No `font-bold` on body text. Use `font-medium` for emphasis.
- [ ] Curly quotes used (`"` `"` not `"` `"`)
- [ ] Ellipsis character used (`…` not `...`)
- [ ] Headings use `text-balance`
- [ ] Number columns use `tabular-nums`

---

## Color & Hierarchy

- [ ] Text hierarchy achieved via opacity, not different hues
- [ ] Primary text at full opacity
- [ ] Secondary text at /70 opacity
- [ ] Tertiary/captions at /40 opacity
- [ ] Disabled/placeholder at /20 opacity
- [ ] Primary accent used for: CTAs, links, active nav, key graphics
- [ ] Secondary accent used sparingly: decorative numbers, highlights, borders only
- [ ] Every color has a `dark:` variant (if dark mode supported)

---

## Layout & Grid

- [ ] Body text never exceeds `max-w-[60ch]`
- [ ] Content container uses `max-w-6xl` or `max-w-[1408px]` with `mx-auto`
- [ ] Grid uses standard splits: 4/8, 6/6, 4/4/4, 3/9, 8/4
- [ ] Mobile columns collapse to full width (`col-span-12` or `grid-cols-1`)
- [ ] Section padding is generous (minimum `py-12`, standard `py-16`–`py-24`)
- [ ] Container horizontal padding: `px-4 md:px-8`
- [ ] Asymmetric layout collapses below `lg:` breakpoint

---

## Responsive

- [ ] Tested at 375px (mobile) — no horizontal scroll, no broken layouts
- [ ] Tested at 768px (tablet) — two-column layouts appear correctly
- [ ] Tested at 1280px (desktop) — full grid, max-width container centered
- [ ] All grid columns have mobile fallback (`col-span-12` / `grid-cols-1`)
- [ ] Heading type scales down on mobile (`text-3xl md:text-5xl lg:text-7xl`)
- [ ] Section padding reduces on mobile (`py-12 md:py-16 lg:py-24`)
- [ ] All tables wrapped in `overflow-x-auto`
- [ ] All interactive elements at least 44×44px on mobile
- [ ] Desktop-only nav links hidden below `md:` breakpoint
- [ ] Card grids stack vertically on mobile

---

## Accessibility

- [ ] Body text contrast meets 4.5:1 minimum (WCAG AA)
- [ ] Large text (24px+) contrast meets 3:1 minimum
- [ ] Focus indicators visible on all interactive elements (2px+ ring)
- [ ] Never `outline-none` without a focus replacement
- [ ] Touch targets minimum 44×44px
- [ ] Heading hierarchy is logical (h1 → h2 → h3, no skips)
- [ ] `color-scheme: light dark` declared on `<html>`
- [ ] `prefers-reduced-motion` respected (gate animations)
- [ ] Images have `alt` text
- [ ] Links have descriptive text (not "click here")

---

## Spacing & Decoration

- [ ] Spacing uses 8px base unit multiples (8, 16, 24, 32, 48, 64, 96, 128)
- [ ] Border-radius is 4–8px (never fully rounded on large containers)
- [ ] No `rounded-full` on cards or main containers
- [ ] Geometric decoration (rules, numerals) used sparingly for structure
- [ ] Labs: offset shadow present on main containers
- [ ] Dividers use brand border color, not arbitrary grays

---

## Dark Mode (if applicable)

- [ ] Every `bg-*` has a `dark:bg-*` counterpart
- [ ] Every `text-*` has a `dark:text-*` counterpart
- [ ] Every `border-*` has a `dark:border-*` counterpart
- [ ] Dark backgrounds are warm charcoal, not cold black
- [ ] Accent colors adjusted for dark backgrounds (lighter variants)
- [ ] `<meta name="color-scheme" content="light dark">` present

---

## Print/Reports (if applicable)

- [ ] Paged.js initialized with font-safe deferred loading
- [ ] Cover page present with brand-mark, title, subtitle, metadata
- [ ] Running headers suppressed on cover/first page
- [ ] h2 sections start on new pages (`break-before: page`)
- [ ] First h2 has `.no-break-before` to prevent blank page after cover
- [ ] All headings have `break-after: avoid`
- [ ] Components have `break-inside: avoid`
- [ ] Paragraphs have `orphans: 3; widows: 3`
- [ ] Warm paper background preserved in PDF (`print-color-adjust: exact`)
- [ ] Source Serif 4 loaded for display typography

---

## Performance & Quality

- [ ] Fonts loaded with `display=swap` and `preconnect`
- [ ] Images use `loading="lazy"` where appropriate
- [ ] No `transition: all` — only `transform` and `opacity`
- [ ] Animations gated with `motion-safe:` / `motion-reduce:`
- [ ] HTML is semantic (proper heading levels, `<nav>`, `<main>`, `<article>`)
- [ ] No unused CSS frameworks or libraries loaded
