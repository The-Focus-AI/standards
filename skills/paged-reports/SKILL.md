---
name: paged-reports
description: >
  Turn a markdown document into a styled, print-ready HTML report — running headers,
  page numbers, smart page breaks, cover page — and render it to PDF via headless
  Chrome. Also produces horizontal-scroll magazine spreads for shareable URLs.
  Brand-agnostic: reads its tokens from the project's DESIGN.md or brand skill.
  Use when asked for a PDF, a printable report, a client-ready document, a one-pager,
  or a shareable read-through of a markdown file.
  Triggers on: "make a PDF", "print this", "report", "one-pager", "deliverable",
  "paged", "page breaks", "cover page", "magazine spread", "/report".
---

# Paged Reports

Markdown in, print-ready document out. The pipeline is: markdown → HTML template with
brand tokens → paged.js pagination → PDF (or a browser preview, or a magazine-mode URL).

**This skill owns the mechanics only.** Which font, which color, which size — that is
the project's brand, not this skill's business. Read the tokens first, then render.

## Where the tokens come from

Look in this order and stop at the first hit:

1. The project's `DESIGN.md` — frontmatter tokens are normative.
2. A brand skill in the project. For Focus.AI work that is `focus-ai-brand`, whose
   design-system reference carries the paged type scale under "Output-Format Tokens".
3. Ask. Do not invent a palette — a report in the wrong colors is worse than one that
   waited a minute for an answer.

## Process

1. **Read the source markdown** and decide the mode — standard (browser preview),
   paged (PDF deliverable), or magazine (shareable scroll URL). The table in
   `references/paged-system.md` maps intent to mode.
2. **Pick a template** from `templates/`. Focus.AI ships four: client and labs, each in
   standard and paged form. A project with its own brand copies one and swaps the token
   block at the top — the paged.js scaffolding underneath is identical.
3. **Structure the content** to the page-break conventions: `.section` wrappers,
   `.no-break-before` on the first section after the cover, `break-inside: avoid` on
   anything that must stay whole. This is the part that separates a professional PDF
   from a wall of text — read the "Smart Page Break System" section before writing HTML.
4. **Render.** Write the HTML to a temp path, then either open it for a Cmd+P preview or
   drive headless Chrome for a direct PDF.
5. **Look at the output.** Open the PDF, or convert its pages to images and inspect
   them. Page breaks fail in ways that are invisible in the HTML — an orphaned heading
   at a page bottom, a table split across a spread, a blank page after the cover.
   Shipping an unopened PDF is how those reach the client.

## PDF generation

The `browser-automation` skill (chrome-driver) provides the `pdf` binary:

```bash
PDF_BIN=$(ls -d ~/.claude/plugins/cache/focus-marketplace/chrome-driver/*/bin/pdf | sort -V | tail -1)
$PDF_BIN "file:///tmp/report-$(date +%s).html" ./output.pdf
```

If chrome-driver is not installed, fall back to the browser print path rather than
silently producing HTML and calling it a PDF.

## Reference

| Topic | Where |
| --- | --- |
| Modes, `/report` arguments, template selection | `references/paged-system.md` |
| Smart page breaks, `.section`, widows/orphans | `references/paged-system.md` |
| Running headers, page numbers, `@page` rules | `references/paged-system.md` |
| Cover pages, cards, stats, callouts, pull quotes | `references/paged-system.md` |
| Magazine mode: spreads, keyboard nav, print fallback | `references/paged-system.md` |
| paged.js init, print color preservation | `references/paged-system.md` |
| Focus.AI report templates (client/labs × standard/paged) | `templates/` |

## Pitfalls

- **Fonts must load before pagination.** paged.js chunks content on the fonts it has at
  init. Initialize with `PagedConfig = { auto: false }` and call `preview()` inside
  `document.fonts.ready` — otherwise the layout shifts after the page boundaries are set.
- **`print-color-adjust: exact` or the background disappears.** Browsers strip
  backgrounds in print by default. A warm paper ground is a brand decision; losing it in
  the PDF is a rendering bug, not a preference.
- **Never pure white, never pure black** — if the brand says paper and ink, that applies
  to print output too.
- **A blank page after the cover** means the first section inherited `break-before: page`.
  That is what `.no-break-before` is for.
- **Magazine mode is screen-first.** It has a print fallback, but if the deliverable is a
  PDF, generate paged mode directly rather than printing the magazine.
