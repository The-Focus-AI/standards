---
name: paged-reports
description: >
  Turns a markdown document into a styled, print-ready HTML report — running headers,
  page numbers, smart page breaks, cover page — and renders it to PDF via headless
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
4. **Render.** Write the HTML to a temp path, then use the preflight below for
   a browser preview or direct PDF. Ask before adding dependencies or fetching
   third-party scripts/fonts; the templates' paged.js and font URLs need network access.
5. **Look at the output.** Open the PDF, or convert its pages to images and inspect
   them. Page breaks fail in ways that are invisible in the HTML — an orphaned heading
   at a page bottom, a table split across a spread, a blank page after the cover.
   Shipping an unopened PDF is how those reach the client.

## PDF generation

Use an available `agent-browser`; the `browser-automation` skill explains its
session and authorization workflow. Check the installed version and help first:

```sh
command -v agent-browser
agent-browser --version
agent-browser skills get core --full
agent-browser pdf --help
```

If unavailable, stop and ask before adding project-pinned tooling through mise
or downloading a browser. Do not silently install a CLI, browser, or renderer.
Use command-specific help if this build has no `skills get` command.

Set `HTML_PATH` and `PDF_PATH` to the actual absolute paths (not a fresh
timestamp unrelated to the file written). For the paged templates:

```sh
SESSION=paged-report
trap 'agent-browser --session "$SESSION" close' EXIT
agent-browser --session "$SESSION" open "file://$HTML_PATH"
agent-browser --session "$SESSION" set viewport 1280 720 2
agent-browser --session "$SESSION" wait --fn 'window.__reportReady === true'
agent-browser --session "$SESSION" pdf "$PDF_PATH"
test -s "$PDF_PATH"
agent-browser --session "$SESSION" close
trap - EXIT
```

The templates set `__reportReady` only after fonts, images, and pagination
complete. A timeout is a failure to investigate, not permission to print an
unfinished page. For a standard template, await fonts/images instead; it has no
paged.js ready signal. Inspect every resulting PDF page, including dimensions,
backgrounds, header/footer placement, and blank pages. `pdf` options vary by
build; do not invent paper-size flags or promise CSS page sizing without checking.

A user may print a browser preview manually if direct PDF output is unavailable.
Deliver it explicitly as **HTML awaiting printing**, never as a completed PDF.

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
