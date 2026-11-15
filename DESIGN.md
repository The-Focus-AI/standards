---
name: "TheFocus.AI engineering handbook"
description: "Inkling monograph typography, spatially grounded reading-ruler navigation, and explicit proposal status."
colors:
  sheet: "#faf9f6"
  page: "#f3f0e8"
  ink: "#161616"
  muted: "#59554d"
  line: "rgba(22, 22, 22, 0.11)"
  line-strong: "rgba(22, 22, 22, 0.22)"
  action: "#0e3b46"
  action-text: "{colors.sheet}"
  action-soft: "rgba(14, 59, 70, 0.08)"
  attention: "#b33b15"
  attention-soft: "rgba(179, 59, 21, 0.08)"
  highlight: "rgba(247, 202, 104, 0.36)"
  focus-ring: "{colors.action}"
typography:
  display:
    fontFamily: '"Source Serif 4", "Iowan Old Style", Georgia, serif'
    fontWeight: 400
    letterSpacing: "-0.02em"
    lineHeight: 1.12
  body:
    fontFamily: '"Source Serif 4", "Iowan Old Style", Georgia, serif'
    lineHeight: 1.68
  sans:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  mono:
    fontFamily: '"Courier Prime", ui-monospace, SFMono-Regular, Menlo, monospace'
    letterSpacing: "0.12em"
rounded:
  sheet: "6px"
  control: "5px"
---

# Handbook design

Help a reader choose the next useful page, then read it like an editorial technical
monograph without navigating a bureaucratic document registry. Pair a spatially
grounded left reading ruler with warm serif prose, right-hand section marginalia,
and explicit authority status. Keep procedures and dated evidence one link behind
their owning topic.

## Layout and behavior

- Use the same top navigation, reading-ruler sidebar, and search on every page.
- Anchor the left reading ruler to the active document: unfold only the current
  page's `H2` sub-ticks on the rail, frame that active document span with the
  petrol bracket, and move the vermilion bead 1:1 across the current page's own
  sections as the reader scrolls.
- Put the copyable update prompt near the top of the homepage; keep its text
  in the update-project source page, not a second string in the renderer.
- Make inline repository document references (`handbook/*.md`, `recipes/*.md`,
  `evidence/*.md`, and `CHANGELOG.md`) directly clickable alongside Markdown links.
- Group skills by source, with selection and source filters. Show canonical
  paths and revisions so pstack is findable without knowing its repository name.
- Collapse the reading ruler cleanly on narrow screens. Keep wide tables and code
  scrollable inside the reading column rather than widening the page.
- Use native links, buttons, labels, details, and keyboard focus (`⌘K` or `/` for
  quick search). Announce copy results and filter counts. If clipboard access fails,
  expose selectable text.
- Keep pages useful without JavaScript; search, command palette, scroll-spy, and
  interactive corpus artwork are progressive enhancements, and animations honor
  `prefers-reduced-motion: reduce`.
- Keep print output focused on the content, not the navigation.

## Visual rules

Use warm paper `sheet` for the primary reading canvas and linen `page` for code
blocks, notices, prompt cards, caliper readouts, and table headers. Use `ink` for
prose and headings, `muted` for secondary metadata and marginalia, petrol `action`
(with `action-soft` hover/active tints and `action-text` on filled controls) for
links, the active reading-ruler span, and primary buttons, and vermilion `attention`
(with `attention-soft` wash) for proposal/status pills, inline code tokens, and the
scroll-spy ruler bead. Use `highlight` sparingly for key thesis callouts on the
overview. Pair every status with words. Use hairline `line` and `line-strong` for
separation rather than heavy shadows, and keep `focus-ring` visible on keyboard focus.

Set display titles, `H2` section headings, and long-form prose in Source Serif 4
(400 regular, 400 italic, 500 medium, and 600 semibold) in sentence case with
generous leading and bounded measure (`65ch`). Use the system UI sans stack for
navigation chrome, marginalia sidenotes, tables, and form controls, and Courier Prime
(400 and 700) for eyebrows, caliper coordinates, timestamps, code blocks, and paths.
Commands, paths, source names, and input values keep their natural case and normal
tracking.

Self-host the unmodified Latin WOFF2 files from
[`@fontsource/source-serif-4` 5.3.1](https://registry.npmjs.org/@fontsource/source-serif-4/5.3.1)
and [`@fontsource/courier-prime` 5.3.0](https://registry.npmjs.org/@fontsource/courier-prime/5.3.0),
together with their combined SIL Open Font License (`OFL.txt`). The build copies the
fonts and license from `scripts/assets/fonts/` without a network request or package
installation. Use `font-display: swap` and the declared fallback stacks if a font
cannot load or lacks a glyph. Do not load fonts from a third-party service.

## Measured contrast

Validated by `mise run design:validate` against these exact tokens.

| Pair | On sheet | On page |
| --- | --- | --- |
| `ink` | 17.19 | 15.89 |
| `muted` | 7.04 | 6.51 |
| `action` | 11.51 | 10.64 |
| `attention` | 5.61 | 5.19 |
| `action-text` on `action` | 11.51 | — |

## Writing

Lead with the action or fact. State who owns a transition, what permits it,
and what happens on failure. Keep actual observations distinct from desired
behavior. No numbered clause registry, bureaucratic header block, or repeated
authority disclaimer before every paragraph. A page's visible status and short
notice carry that information once.
