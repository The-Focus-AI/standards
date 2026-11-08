---
name: "Focus engineering handbook"
description: "Task-first navigation, readable instructions, and explicit proposal status."
colors:
  page: "#e4e7e4"
  sheet: "#f1f3f0"
  ink: "#141a17"
  muted: "#5c6560"
  line: "rgba(20, 26, 23, 0.16)"
  line-strong: "rgba(20, 26, 23, 0.42)"
  action: "#1f5fa8"
  action-text: "{colors.sheet}"
  attention: "#a8451c"
  focus-ring: "{colors.action}"
typography:
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    lineHeight: 1.6
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    letterSpacing: "0"
rounded:
  sheet: "0"
  control: "0"
---

# Handbook design

Help a reader choose the next useful page, then read it without navigating a
document taxonomy. Use a task sidebar, a short page introduction, and readable
content. Keep procedures and evidence one link behind their owning topic.

## Layout and behavior

- Use the same navigation and search on every page. Show the current topic.
- Put the copyable update prompt near the top of the homepage; keep its text
  in the update-project source page, not a second string in the renderer.
- Group skills by source, with selection and source filters. Show canonical
  paths and revisions so pstack is findable without knowing its repository name.
- Collapse navigation on narrow screens. Keep wide tables and code scrollable
  inside the reading column rather than widening the page.
- Use native links, buttons, labels, details, and keyboard focus. Announce copy
  results and filter counts. If clipboard access fails, expose selectable text.
- Keep pages useful without JavaScript; search and filters are enhancements.
- Keep print output focused on the content, not the navigation.

## Visual rules

Use `sheet` for the reading area and `page` for navigation and code. Use `ink`
for text, `muted` for secondary text, `action` for links and the copy button,
and `attention` for proposal/limit notices. Pair every status with words.
Use `line` and `line-strong` for separation, not decoration. `focus-ring` is
visible on keyboard focus; `action-text` is button text.

Use system fonts without downloads. Body text stays in sentence case, with
generous line spacing and bounded line length. Large titles establish hierarchy;
small mono labels provide context. Use square controls, flat backgrounds, and
rules instead of shadows. Do not render every requirement as a separate card.

## Measured contrast

Validated by `mise run design:validate` against these exact tokens.

| Pair | On sheet | On page |
| --- | --- | --- |
| `ink` | 15.82 | 14.16 |
| `muted` | 5.40 | 4.83 |
| `action` | 5.77 | 5.17 |
| `attention` | 5.33 | 4.77 |
| `action-text` on `action` | 5.77 | — |

## Writing

Lead with the action or fact. State who owns a transition, what permits it,
and what happens on failure. Keep actual observations distinct from desired
behavior. No numbered clause registry, bureaucratic header block, or repeated
authority disclaimer before every paragraph. A page's visible status and short
notice carry that information once.
