---
name: focus-ai-brand
description: Apply Focus.AI brand guidelines to documents, presentations, websites, and other materials. Supports two sub-brands - Focus.AI Client (services, proposals, client work) and Focus.AI Labs (research, experiments, public content). Use when creating branded materials, applying visual identity, or generating content that needs to follow Focus.AI style. Trigger on "focus.ai style", "focus brand", "labs style", or requests for branded Focus.AI materials.
---

# Focus.AI Design System

A design system that combines Swiss International Style structural rigor with Focus.AI's brand identity. Warm paper backgrounds, editorial typography, rigorous grid, generous whitespace, opacity-based hierarchy, and restrained accent color.

## Six Principles

1. **Grid first.** Every layout lives on a 12-column grid (editorial pages use a 3-column asymmetric variant). 8px base unit for spacing.
2. **Mobile first, always.** Design for 320px, then expand. Use `sm:`, `md:`, `lg:` prefixes systematically.
3. **Whitespace is structure.** Generous padding and margins are the design, not waste.
4. **Opacity creates hierarchy.** Never introduce a second text color to indicate weight. Use opacity on the primary text color.
5. **Two accents maximum, used sparingly.** Primary accent for CTAs and navigation. Secondary accent for decorative highlights only.
6. **Clarity over decoration.** Every element earns its place. If it doesn't help the reader focus on what matters, remove it.

---

## Brand Architecture

```
The Focus.AI
├── Focus.AI (Client)     → Services, products, client-facing work
│   Aesthetic: Editorial magazine, polished, confident
│   Palette: Paper, Ink, Petrol, Vermilion
│
└── Focus.AI Labs         → Research, experiments, public content
    Aesthetic: Bell Labs research report, curious, generous
    Palette: Paper, Void, Rand-Blue, Alert-Red
```

**Rule of thumb**: Client work or selling services → Client brand. Sharing learnings or exploring → Labs brand.

---

## Quick Reference

### Typography

| Family      | Font           | Usage                                                       |
| ----------- | -------------- | ----------------------------------------------------------- |
| **Display** | Source Serif 4 | Cover titles, H1 (paged reports), pull quotes, stat numbers |
| **Sans**    | Inter          | Section headings (h2–h4), body text, UI, navigation         |
| **Mono**    | Courier Prime  | Labels, metadata, code, page numbers                        |

**Weight rules:**

- Headings: `font-black` (900) or `font-bold` (700) with negative letter-spacing
- Body: `font-normal` (400) or `font-medium` (500), line-height 1.6
- Labels: `font-mono`, uppercase, wide letter-spacing

### Colors at a Glance

| Role             | Client              | Labs                 |
| ---------------- | ------------------- | -------------------- |
| Background       | Paper `#faf9f6`     | Paper `#f3f2ea`      |
| Primary text     | Ink `#161616`       | Void `#1a1a1a`       |
| Secondary text   | `ink/70` opacity    | `void/70` opacity    |
| Tertiary text    | `ink/40` opacity    | `void/40` opacity    |
| Primary accent   | Petrol `#0e3b46`    | Rand-Blue `#0055aa`  |
| Secondary accent | Vermilion `#c3471d` | Alert-Red `#d93025`  |
| Border           | `#d4d3cf`           | `rgba(26,26,26,0.2)` |

**Never use pure `#ffffff` or `#000000` for backgrounds.**

### Opacity Hierarchy (Core Rule)

Reduce opacity to de-emphasize — never change the hue:

```
Full:     text-[ink]           → primary content
Softer:   text-[ink]/70        → secondary labels, supporting text
Quiet:    text-[ink]/40        → captions, metadata
Ghosted:  text-[ink]/20        → disabled, placeholder
```

### Spacing

Base unit: **8px**. Every spacing value is a multiple of 8.

| Context | Value    | Usage                           |
| ------- | -------- | ------------------------------- |
| Tight   | 8px      | Inline gaps, icon spacing       |
| Default | 16px     | Component internal spacing      |
| Between | 32px     | Between components              |
| Section | 48–64px  | Section padding (mobile/tablet) |
| Section | 96–128px | Section padding (desktop)       |

### Layout

Two layout modes:

1. **12-column grid** — General purpose, Tailwind `grid grid-cols-12 gap-8`
2. **Asymmetric editorial** — `[144px label] [1fr content, max 740px] [192px marginalia]`

Body text max width: `60ch`. Never wider.

---

## Brand Selection Guide

| Context                                       | Brand      |
| --------------------------------------------- | ---------- |
| Client proposals, case studies, service pages | **Client** |
| Product marketing, landing pages              | **Client** |
| Conference analysis, research reports         | **Labs**   |
| Experiments, technical blog posts             | **Labs**   |
| Open source projects                          | **Labs**   |

---

## Rendering to Documents and Decks

This skill defines the brand. It does **not** define how documents get rendered — that
lives in two separate, brand-agnostic skills:

| Output | Skill | What this skill supplies |
| --- | --- | --- |
| PDF / printable report / magazine spread | `paged-reports` | Paged type scale, palette, cover treatment |
| PowerPoint `.pptx` | `pptx-decks` | Slide palettes, font mapping |

Both read their brand values from `references/design-system.md` → "Output-Format
Tokens". When rendering Focus.AI material, use those skills and pass `client` or `labs`
as the style; when the brand changes, only this skill changes.

---

## When to Read Reference Files

| Task                                                            | File                            |
| --------------------------------------------------------------- | ------------------------------- |
| Full color tokens, type scale, CSS properties, dark mode        | `references/design-system.md`   |
| 12-col grid, asymmetric layout, section spacing, decoration     | `references/grid-and-layout.md` |
| Mobile-first breakpoints, fluid type, responsive checklist      | `references/responsive.md`      |
| Tailwind component patterns: buttons, cards, nav, forms         | `references/components.md`      |
| Paste-ready Tailwind v3/v4 config, Google Fonts link tags       | `references/tailwind-config.md` |
| Paged-report type scale and slide palettes                      | `references/design-system.md`   |
| AI image generation styles (Renaissance, Bell Labs)             | `references/imagery.md`         |
| Voice & tone guidelines, anti-patterns, example transformations | `references/voice.md`           |
| Pre-ship audit checklist                                        | `references/checklist.md`       |

---

## Gotchas

- **Never pure white or pure black** — Use paper tones and ink/void.
- **Never `font-bold` alone on headings** — Use `font-black` (900) with tight negative tracking.
- **Body text max 60ch** — Wider columns hurt legibility.
- **Generous section padding** — Minimum `py-12` (48px), standard `py-16`–`py-24` (64–96px).
- **Labels are always mono** — `Courier Prime`, uppercase, wide letter-spacing.
- **Border-radius is subtle** — 4–8px for cards/buttons. Never fully rounded on large containers.
- **Opacity, not gray shades** — `text-ink/70` not `text-gray-500`.
- **Warm backgrounds** — Even dark mode uses warm charcoal, not cold black.
- **Source Serif 4 is display only** — Never for body text or h2–h4. Only cover titles, h1 in paged reports, pull quotes, stat numbers.
- **Two accents max** — Primary for actions/links, secondary used sparingly for decorative highlights.
- **Every layout works on mobile** — Default classes are mobile. Always add `md:` / `lg:` variants.
