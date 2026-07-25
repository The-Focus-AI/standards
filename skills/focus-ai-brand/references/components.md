# Focus.AI Design System — Component Patterns

All components use Inter (sans), Courier Prime (mono), and the brand palette. Examples show Client colors — swap to Labs equivalents where noted.

---

## Typography

```html
<!-- Hero (Client) -->
<h1
  class="text-[clamp(32px,8vw,88px)] font-bold tracking-[-0.045em] leading-[0.95] text-[#161616]"
>
  Agentic software for mission-critical operations
</h1>

<!-- Hero (Labs) -->
<h1
  class="text-6xl md:text-8xl font-black text-[#1a1a1a] leading-[0.85] tracking-tight"
>
  HEADLINE<br />
  <span class="text-[#0055aa]">ACCENT</span>
</h1>

<!-- H2 (Client) -->
<h2
  class="text-[clamp(24px,5vw,48px)] font-bold tracking-[-0.03em] leading-tight text-[#161616]"
>
  Section Title
</h2>

<!-- H2 (Labs — uppercase, auto-numbered) -->
<h2
  class="text-2xl md:text-3xl font-black uppercase tracking-[0.05em] text-[#1a1a1a] border-b border-[#1a1a1a] pb-2"
>
  <span class="font-mono text-sm font-normal text-[#d93025] mr-2">01</span>
  Section Title
</h2>

<!-- H3 -->
<h3 class="text-xl font-bold tracking-[-0.02em] leading-snug text-[#161616]">
  Subsection
</h3>

<!-- Body -->
<p class="text-[17px] font-medium leading-relaxed text-[#4a4a4a] max-w-[60ch]">
  Body text with comfortable line-height and constrained width.
</p>

<!-- Lead paragraph -->
<p class="text-xl font-medium leading-[1.5] text-[#4a4a4a] max-w-[52ch]">
  Larger introductory text.
</p>

<!-- Lead with left border (Labs) -->
<p
  class="text-lg font-medium max-w-2xl leading-snug border-l-4 border-[#d93025] pl-6 py-2"
>
  Lead paragraph with alert-red border.
</p>

<!-- Label / Kicker -->
<span
  class="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#0e3b46]"
>
  Category Label
</span>

<!-- Caption -->
<span class="font-mono text-xs uppercase tracking-widest text-[#161616]/40">
  Figure 01 — Description
</span>

<!-- Mono metadata -->
<code
  class="font-mono text-sm text-[#161616] bg-[#0e3b46]/5 px-1.5 py-0.5 rounded"
>
  technical-value
</code>
```

---

## Buttons

### Client Buttons

```html
<!-- Primary CTA (ghost with border) — signature Focus.AI style -->
<a
  href="#"
  class="inline-flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.15em] px-6 py-3.5 border border-[#0e3b46] text-[#0e3b46] rounded-md hover:bg-[#0e3b46]/5 hover:-translate-y-px hover:shadow-md transition-all duration-200"
>
  Start a Conversation
  <span class="transition-transform duration-300 group-hover:translate-x-1"
    >→</span
  >
</a>

<!-- Secondary (filled) -->
<button
  class="px-6 py-3 bg-[#0e3b46] text-white font-mono text-xs font-medium uppercase tracking-[0.12em] rounded-md hover:bg-[#0e3b46]/90 active:scale-[0.98] transition-all duration-200"
>
  Download
</button>

<!-- Tertiary (text only) -->
<a
  href="#"
  class="text-sm font-medium text-[#0e3b46] relative after:absolute after:bottom-[-2px] after:left-1/2 after:w-0 after:h-px after:bg-[#0e3b46] after:transition-all hover:after:w-full hover:after:left-0"
>
  Learn more
</a>
```

### Labs Buttons

```html
<!-- Primary (filled blue) -->
<a
  href="#"
  class="bg-[#0055aa] text-white px-4 py-2 hover:bg-[#0055aa]/90 transition-colors font-mono text-xs font-bold uppercase tracking-wider"
>
  Action
</a>

<!-- Link with arrow -->
<a
  href="#"
  class="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#0055aa] hover:underline decoration-2 underline-offset-4"
>
  Link Text
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M17 8l4 4m0 0l-4 4m4-4H3"
    />
  </svg>
</a>
```

---

## Cards

### Client Cards

```html
<!-- Standard card -->
<div
  class="bg-[#faf9f6] border border-[#d4d3cf] rounded-lg p-8 transition-all duration-300 hover:translate-x-1 hover:shadow-[0_8px_24px_rgba(22,22,22,0.08)]"
>
  <span
    class="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#0e3b46] block mb-4"
  >
    Category
  </span>
  <h3 class="text-2xl font-bold tracking-[-0.02em] text-[#161616] mb-3">
    Card Title
  </h3>
  <p class="text-[17px] font-medium leading-relaxed text-[#4a4a4a] mb-4">
    Supporting description text.
  </p>
  <span class="text-sm font-medium text-[#4a4a4a]">2024 • 6 months</span>
</div>

<!-- Elevated card -->
<div
  class="bg-[#faf9f6] border border-[#d4d3cf] rounded-lg p-8 shadow-[0_2px_8px_rgba(22,22,22,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(22,22,22,0.08)]"
>
  ...
</div>
```

### Labs Cards

```html
<!-- Standard card (void border, no radius) -->
<div
  class="bg-white p-8 hover:bg-[#f8f8f6] transition-colors border border-[#1a1a1a]"
>
  <span class="text-[#d93025] font-mono text-[10px] font-bold">01</span>
  <h3 class="text-xl font-bold text-[#1a1a1a] mt-2 mb-2">Card Title</h3>
  <p class="text-base text-[#1a1a1a]/70 leading-relaxed">Description.</p>
</div>

<!-- Card grid with void gutters (signature Labs pattern) -->
<div
  class="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1a1a1a] border border-[#1a1a1a]"
>
  <div class="bg-white p-8">Card 1</div>
  <div class="bg-white p-8">Card 2</div>
  <div class="bg-white p-8">Card 3</div>
  <div class="bg-white p-8">Card 4</div>
</div>
```

---

## Navigation

### Client Nav

```html
<nav class="border-b border-[#d4d3cf] bg-[#faf9f6]">
  <div
    class="max-w-[1408px] mx-auto px-4 md:px-8 flex items-center justify-between h-16"
  >
    <a
      href="/"
      class="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#161616]"
    >
      Focus.AI
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a
        href="#"
        class="text-sm font-medium text-[#161616]/60 hover:text-[#161616] transition-colors"
        >Work</a
      >
      <a
        href="#"
        class="text-sm font-medium text-[#161616]/60 hover:text-[#161616] transition-colors"
        >About</a
      >
      <a href="#" class="text-sm font-medium text-[#0e3b46]">Contact</a>
    </div>
  </div>
</nav>
```

### Labs Nav (Tabs)

```html
<div class="flex border-b-2 border-[#1a1a1a]">
  <!-- Active tab -->
  <a
    href="#"
    class="px-4 md:px-6 py-2 border-t border-x border-[#1a1a1a] bg-[#f3f2ea] text-[#1a1a1a] relative top-[2px] border-b-[#f3f2ea] z-10 font-mono text-[10px] md:text-xs font-bold uppercase tracking-wider"
  >
    Active
  </a>
  <!-- Inactive tab -->
  <a
    href="#"
    class="px-4 md:px-6 py-2 border-t border-x border-[#1a1a1a] bg-[#d6d4ce] text-gray-600 hover:bg-white font-mono text-[10px] md:text-xs font-bold uppercase tracking-wider"
  >
    Inactive
  </a>
</div>
```

---

## Badges & Labels

```html
<!-- Client: Petrol badge -->
<span
  class="inline-block px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] bg-[#0e3b46]/10 text-[#0e3b46] rounded"
>
  Featured
</span>

<!-- Client: Neutral badge -->
<span
  class="inline-block px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] bg-[#161616]/5 text-[#161616]/70 rounded"
>
  Draft
</span>

<!-- Labs: Numbered label -->
<span class="text-[#d93025] font-mono text-[10px] font-bold">01</span>

<!-- Labs: Metadata block -->
<div class="font-mono text-xs space-y-1">
  <p class="font-bold">PROJECT: AI Engineering Summit</p>
  <p>DOC. NO: RM-2025-AE</p>
  <p>DATE: November 2025</p>
</div>
```

---

## Forms

```html
<!-- Input -->
<div class="flex flex-col gap-2">
  <label
    class="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#161616]/60"
  >
    Full name
  </label>
  <input
    type="text"
    class="border border-[#d4d3cf] bg-transparent text-[#161616] text-base font-medium px-4 py-3 rounded-md outline-none focus:border-[#0e3b46] focus:ring-2 focus:ring-[#0e3b46]/20 placeholder:text-[#161616]/30 transition-all"
    placeholder="Jane Smith"
  />
</div>

<!-- Textarea -->
<div class="flex flex-col gap-2">
  <label
    class="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#161616]/60"
  >
    Message
  </label>
  <textarea
    rows="4"
    class="border border-[#d4d3cf] bg-transparent text-[#161616] text-base font-medium px-4 py-3 rounded-md outline-none focus:border-[#0e3b46] focus:ring-2 focus:ring-[#0e3b46]/20 resize-none transition-all"
  ></textarea>
</div>
```

---

## Tables

```html
<div class="overflow-x-auto">
  <table class="w-full text-sm border-collapse">
    <thead>
      <tr class="bg-[#0e3b46]/5">
        <th
          class="text-left font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#0e3b46] py-3 px-4 border-b border-[#d4d3cf]"
        >
          Name
        </th>
        <th
          class="text-left font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#0e3b46] py-3 px-4 border-b border-[#d4d3cf]"
        >
          Year
        </th>
        <th
          class="text-left font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#0e3b46] py-3 px-4 border-b border-[#d4d3cf]"
        >
          Status
        </th>
      </tr>
    </thead>
    <tbody>
      <tr class="hover:bg-[#0e3b46]/[0.02] transition-colors">
        <td
          class="py-3 px-4 border-b border-[#d4d3cf] text-[#161616] font-medium"
        >
          Item
        </td>
        <td class="py-3 px-4 border-b border-[#d4d3cf] text-[#161616]/60">
          2024
        </td>
        <td class="py-3 px-4 border-b border-[#d4d3cf] text-[#161616]/60">
          Active
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Hero Sections

### Client Hero

```html
<section class="py-12 md:py-24 lg:py-32 px-4 md:px-8">
  <div
    class="max-w-[1408px] mx-auto grid grid-cols-1 lg:grid-cols-[144px_1fr_192px] gap-4 lg:gap-8 items-start"
  >
    <div class="pt-1">
      <span
        class="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#161616]"
        >Studio</span
      >
    </div>
    <div class="max-w-[740px]">
      <h1
        class="text-[clamp(32px,8vw,88px)] font-bold tracking-[-0.045em] leading-[0.95] text-[#161616] mb-6"
      >
        Agentic software for mission-critical operations
      </h1>
      <p
        class="text-xl font-medium leading-[1.5] text-[#4a4a4a] mb-8 max-w-[52ch]"
      >
        We build schema-first systems that maintain human control while enabling
        AI agents to handle complex workflows.
      </p>
      <a
        href="#"
        class="inline-flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.15em] px-6 py-3.5 border border-[#0e3b46] text-[#0e3b46] rounded-md hover:bg-[#0e3b46]/5 transition-all duration-200"
      >
        View our work <span>→</span>
      </a>
    </div>
    <div class="pt-1">
      <p class="text-sm font-medium text-[#4a4a4a]">Based in San Francisco</p>
    </div>
  </div>
</section>
```

### Labs Hero

```html
<section class="py-16 md:py-24 px-4 md:px-8 bg-[#e8e6df]">
  <div
    class="max-w-7xl mx-auto bg-[#f3f2ea] border border-[#1a1a1a] shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)] p-8 md:p-16"
  >
    <div class="font-mono text-xs space-y-1 mb-8 text-[#1a1a1a]/60">
      <p class="font-bold text-[#1a1a1a]">PROJECT: Conference Analysis</p>
      <p>DOC. NO: RM-2025-AE</p>
      <p>DATE: November 2025</p>
    </div>
    <h1
      class="text-5xl md:text-7xl lg:text-8xl font-black text-[#1a1a1a] leading-[0.85] tracking-tight mb-8"
    >
      AI ENGINEERING<br />
      <span class="text-[#0055aa]">SUMMIT 2025</span>
    </h1>
    <p
      class="text-lg font-medium max-w-2xl leading-snug border-l-4 border-[#d93025] pl-6 py-2 text-[#1a1a1a]/80"
    >
      Two days. 25 sessions. Here's what stuck.
    </p>
  </div>
</section>
```

---

## Code Blocks

```html
<!-- Inline code -->
<code
  class="font-mono text-sm bg-[#0e3b46]/5 text-[#0e3b46] px-1.5 py-0.5 rounded border border-[#0e3b46]/10"
>
  npm install
</code>

<!-- Code block (Client) -->
<pre class="bg-[#161616] text-[#faf9f6] p-6 rounded-md overflow-x-auto">
  <code class="font-mono text-sm leading-relaxed">
const result = await focus.analyze(data);
  </code>
</pre>

<!-- Code block (Labs — no radius, void border) -->
<pre
  class="bg-[#1a1a1a] text-[#f3f2ea] p-6 overflow-x-auto border border-[#1a1a1a]"
>
  <code class="font-mono text-sm leading-relaxed">
const result = await focus.analyze(data);
  </code>
</pre>
```

---

## Blockquotes

```html
<!-- Client -->
<blockquote
  class="border-l-[3px] border-[#0e3b46] bg-[#0e3b46]/[0.03] px-4 py-4 my-6 rounded-r-md"
>
  <p class="text-base italic text-[#4a4a4a] leading-relaxed">
    Quote text here.
  </p>
</blockquote>

<!-- Labs -->
<blockquote
  class="border border-[#1a1a1a] border-l-4 border-l-[#0055aa] bg-white px-4 py-4 my-6"
>
  <p class="text-base text-[#1a1a1a] leading-relaxed">Quote text here.</p>
</blockquote>
```

---

## Special Effects (Labs Only)

### Bell Labs Photo Filter

```html
<img
  src="..."
  alt="..."
  class="grayscale contrast-110 brightness-95 sepia-[0.1] hover:grayscale-0 hover:contrast-100 hover:brightness-100 hover:sepia-0 transition-all duration-300"
/>
```

### Offset Shadow Container

```html
<div
  class="bg-[#f3f2ea] border border-[#1a1a1a] shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)]"
>
  <!-- Content -->
</div>
```
