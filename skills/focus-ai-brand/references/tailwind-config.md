# Focus.AI Design System — Tailwind Configuration

## Google Fonts `<link>` Tags

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Inter:wght@400;500;600;700;900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,700;0,8..60,900;1,8..60,400&display=swap"
  rel="stylesheet"
/>
```

For standard (non-paged) templates that don't need Source Serif 4:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Inter:wght@400;500;600;700;900&display=swap"
  rel="stylesheet"
/>
```

---

## Tailwind v3 — Client Brand (`tailwind.config.js`)

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx,astro}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        paper: "#faf9f6",
        ink: "#161616",
        graphite: "#4a4a4a",
        petrol: "#0e3b46",
        vermilion: "#c3471d",
        border: "#d4d3cf",
        "tint-cool": "#edf6f8",
        "tint-sage": "#eef6ee",
        "tint-warm": "#f7f0e6",
        "tint-lavender": "#f2eef6",
        "tint-aqua": "#edf6f6",
      },
      fontFamily: {
        display: ["Source Serif 4", "Georgia", "Times New Roman", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Courier Prime", "monospace"],
      },
      maxWidth: {
        prose: "60ch",
        content: "740px",
        editorial: "1400px",
      },
      letterSpacing: {
        display: "-0.045em",
        heading: "-0.03em",
        label: "0.12em",
      },
      lineHeight: {
        hero: "0.95",
        display: "1.05",
      },
      borderRadius: {
        card: "8px",
        button: "6px",
      },
    },
  },
  plugins: [],
};
```

---

## Tailwind v3 — Labs Brand (`tailwind.config.js`)

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx,astro}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        paper: "#f3f2ea",
        void: "#1a1a1a",
        "rand-blue": "#0055aa",
        "alert-red": "#d93025",
        surface: "#e6e4dc",
        "page-bg": "#e8e6df",
        "terminal-green": "#00ff41",
        "inactive-tab": "#d6d4ce",
      },
      fontFamily: {
        display: ["Source Serif 4", "Georgia", "Times New Roman", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Courier Prime", "monospace"],
      },
      maxWidth: {
        prose: "60ch",
        content: "740px",
      },
      letterSpacing: {
        display: "-0.02em",
        heading: "0.05em",
        label: "0.15em",
        wide: "0.3em",
      },
      lineHeight: {
        hero: "0.85",
      },
      boxShadow: {
        offset: "10px 10px 0px 0px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
```

---

## Tailwind v4 CSS Config (`@theme` block)

### Client

```css
@import "tailwindcss";

@theme {
  --font-display: "Source Serif 4", Georgia, "Times New Roman", serif;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "Courier Prime", monospace;

  --color-paper: #faf9f6;
  --color-ink: #161616;
  --color-graphite: #4a4a4a;
  --color-petrol: #0e3b46;
  --color-vermilion: #c3471d;
  --color-border: #d4d3cf;

  --max-width-prose: 60ch;
  --max-width-content: 740px;
  --max-width-editorial: 1400px;

  --letter-spacing-display: -0.045em;
  --letter-spacing-heading: -0.03em;
  --letter-spacing-label: 0.12em;

  --line-height-hero: 0.95;
  --line-height-display: 1.05;
}
```

### Labs

```css
@import "tailwindcss";

@theme {
  --font-display: "Source Serif 4", Georgia, "Times New Roman", serif;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "Courier Prime", monospace;

  --color-paper: #f3f2ea;
  --color-void: #1a1a1a;
  --color-rand-blue: #0055aa;
  --color-alert-red: #d93025;
  --color-surface: #e6e4dc;
  --color-page-bg: #e8e6df;

  --max-width-prose: 60ch;
  --max-width-content: 740px;

  --letter-spacing-display: -0.02em;
  --letter-spacing-heading: 0.05em;
  --letter-spacing-label: 0.15em;

  --line-height-hero: 0.85;

  --shadow-offset: 10px 10px 0px 0px rgba(0, 0, 0, 0.1);
}
```

---

## CDN Prototype (No Build Step)

For quick prototypes:

```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    darkMode: "media",
    theme: {
      extend: {
        fontFamily: {
          display: ["Source Serif 4", "Georgia", "serif"],
          sans: ["Inter", "system-ui", "sans-serif"],
          mono: ["Courier Prime", "monospace"],
        },
        colors: {
          paper: "#faf9f6",
          ink: "#161616",
          graphite: "#4a4a4a",
          petrol: "#0e3b46",
          vermilion: "#c3471d",
        },
      },
    },
  };
</script>
```

---

## Global CSS Base

Paste after Tailwind imports for any Focus.AI project:

```css
/* Focus.AI Design System — global base */
html {
  color-scheme: light dark;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: "Inter", system-ui, sans-serif;
  background-color: var(--color-paper, #faf9f6);
  color: var(--color-ink, #161616);
}

/* Typographic niceties */
h1,
h2,
h3,
h4 {
  text-wrap: balance;
}

p {
  text-wrap: pretty;
}

/* Tabular numbers in data contexts */
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
```

---

## Astro Integration

Focus.AI uses Astro as primary framework. Base layout pattern:

```astro
---
// src/layouts/Base.astro
interface Props {
  title: string;
  brand?: 'client' | 'labs';
}

const { title, brand = 'client' } = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>{title} — Focus.AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
</head>
<body class:list={[
  brand === 'labs' ? 'bg-[#f3f2ea] text-[#1a1a1a]' : 'bg-[#faf9f6] text-[#161616]',
  'font-sans text-base font-medium leading-relaxed'
]}>
  <slot />
</body>
</html>
```
