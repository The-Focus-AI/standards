// The stylesheet for every page the renderer emits — standard, guide, register
// and bundle. One copy, because three near-identical copies had already started
// to drift and a fourth for guides would have made the drift permanent.
//
// Every value comes from DESIGN.md via tokensToCss(); nothing here invents a
// colour or a size. Page-specific rules go in the `extra` argument, which is
// appended, so a page can add but never silently redefine the system.

export function pageCss(cssVars, extra = "") {
  return `${cssVars}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--color-page); color: var(--color-ink);
  font-family: var(--font-body); line-height: var(--lh-body);
  padding: 1.5rem 1rem 3rem;
}
*:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }

/* --- the sheet --- */
.sheet {
  background: var(--color-sheet); max-width: 58rem; margin: 0 auto;
  border: 1px solid var(--color-line-strong); border-radius: var(--radius-sheet);
  padding: 2.25rem 2.5rem 3rem;
}

/* --- header block --- */
.rfc-head {
  font-family: var(--font-mono); font-size: var(--size-mono-block); line-height: 1.75;
  display: grid; grid-template-columns: 1fr auto; gap: 0 1.5rem;
  border-bottom: 2px solid var(--color-ink); padding-bottom: .9rem;
}
.rfc-head .right { text-align: right; }
/* A guide is not normative, and the sheet says so before the reader reaches the
   first sentence: the closing rule turns agent teal and carries a stamp. The
   class sits on the header itself rather than on the sheet, so the rule
   survives the bundle lifting the body out of its document shell. */
.rfc-head.guide-head { border-bottom-color: var(--color-agent); }
.stamp {
  display: inline-block; font-family: var(--font-display); font-weight: var(--fw-display);
  letter-spacing: .1em; text-transform: uppercase; font-size: .8rem; line-height: 1;
  background: var(--color-agent); color: var(--color-sheet); padding: .35rem .6rem;
  margin-bottom: .5rem;
}

/* --- prose --- */
h1 {
  font-family: var(--font-display); font-weight: var(--fw-display);
  letter-spacing: var(--ls-display); text-transform: uppercase; line-height: var(--lh-display);
  font-size: var(--size-title); text-align: center; margin: 2rem 0 1.75rem; text-wrap: balance;
}
h2 {
  font-family: var(--font-display); font-weight: var(--fw-display);
  letter-spacing: var(--ls-display); text-transform: uppercase; line-height: var(--lh-display);
  font-size: var(--size-section); margin: 2.25rem 0 .75rem;
}
h3 { font-family: var(--font-body); font-size: var(--size-subsection); font-weight: 700; margin: 1.4rem 0 .5rem; }
h4, h5, h6 { font-family: var(--font-body); font-size: var(--size-body); font-weight: 700; margin: 1.2rem 0 .4rem; }
p { margin: 0 0 .85rem; font-size: var(--size-body); max-width: 68ch; }
ul, ol { max-width: 68ch; font-size: var(--size-body); }
li { margin-bottom: .3rem; }
a { color: var(--color-action); }
blockquote {
  margin: 1.1rem 0; padding: .9rem 1.05rem;
  background: rgba(20,26,23,.03); border: 1px solid var(--color-line);
}
blockquote p:last-child { margin-bottom: 0; }
hr { border: none; border-top: 1px solid var(--color-line); margin: 2rem 0; }
code { font-family: var(--font-mono); font-size: .88em; }
pre.code {
  font-family: var(--font-mono); font-size: var(--size-mono-block); line-height: 1.7;
  background: rgba(20,26,23,.05); border: 1px solid var(--color-line);
  padding: .6rem .75rem; overflow-x: auto;
}
/* Mermaid renders to an SVG where a renderer is present and stays readable as
   source where it is not, so centre the figure without centring the text. */
pre.mermaid {
  font-family: var(--font-mono); font-size: var(--size-mono-block); line-height: 1.7;
  background: var(--color-sheet); border: 1px solid var(--color-line-strong);
  padding: 1rem; overflow-x: auto;
}
pre.mermaid svg { display: block; margin: 0 auto; height: auto; max-width: 100%; }

/* --- tables --- */
.table-scroll { overflow-x: auto; }
table { width: 100%; min-width: 30rem; border-collapse: collapse; font-size: .8125rem; margin-bottom: 1.1rem; }
th {
  text-align: left; font-family: var(--font-mono); font-size: var(--size-micro); font-weight: 700;
  letter-spacing: var(--ls-mono); text-transform: uppercase; color: var(--color-muted);
  padding: .4rem .5rem; border-bottom: 1px solid var(--color-line-strong);
}
td { padding: .5rem; border-bottom: 1px solid var(--color-line); vertical-align: top; }
/* Register tables only — a reference in the first column is an identifier and
   sets in mono. Prose tables inside a document keep the body face. */
table.reg { min-width: 38rem; }
table.reg td:first-child { font-family: var(--font-mono); white-space: nowrap; }
td.num { font-family: var(--font-mono); text-align: right; font-variant-numeric: tabular-nums; }

/* --- clause: the level band --- */
.clause { margin: 1.5rem 0; border: 1px solid var(--color-line); }
.band {
  display: flex; flex-wrap: wrap; align-items: stretch;
  border-bottom: 1px solid var(--color-line); background: rgba(20,26,23,.035);
}
.band .tab {
  font-family: var(--font-display); font-weight: var(--fw-display); font-size: .95rem;
  letter-spacing: .1em; text-transform: uppercase; line-height: 1;
  padding: .55rem .8rem; color: var(--color-sheet); display: flex; align-items: center;
}
.band .tab.must { background: var(--color-ink); }
.band .tab.should { background: var(--color-action); }
.band .tab.may { background: transparent; color: var(--color-ink); border-right: 1px solid var(--color-line); }
.band .tab.dep { background: var(--color-attention); }
.band .ref {
  font-family: var(--font-mono); font-size: .68rem; padding: .55rem .8rem;
  color: var(--color-muted); display: flex; align-items: center;
}
.clause-body { padding: .95rem 1rem 1.05rem; }
.clause-body > *:last-child { margin-bottom: 0; }
.norm { font-size: var(--size-clause); font-weight: 600; line-height: 1.45; }
.norm b { font-weight: 700; }
.clause-body p:not(.norm) { font-size: var(--size-small); color: var(--color-muted); }

/* --- agent material --- */
.agent-head {
  font-family: var(--font-mono); font-size: var(--size-micro); font-weight: 700;
  letter-spacing: var(--ls-mono); text-transform: uppercase;
  color: var(--color-agent); margin: .8rem 0 .3rem;
}
pre.cmd {
  font-family: var(--font-mono); font-size: .8rem; line-height: 1.7; margin: 0;
  background: rgba(44,85,96,.07); border-left: 3px solid var(--color-agent);
  padding: .6rem .75rem; overflow-x: auto;
}

/* --- memos and labels --- */
.status-memo { border: 1px solid var(--color-line); background: rgba(20,26,23,.03); padding: .9rem 1.05rem; margin-bottom: 1.5rem; }
.status-memo p:last-child { margin-bottom: 0; }
.lbl {
  font-family: var(--font-mono); font-size: var(--size-micro); font-weight: 700;
  letter-spacing: var(--ls-mono); text-transform: uppercase; color: var(--color-muted);
  display: block; margin-bottom: .45rem;
}

/* --- cross-references between a standard and its guides --- */
.related { margin-top: 2.5rem; border-top: 1px solid var(--color-line); padding-top: 1rem; }
.related ul { list-style: none; padding: 0; margin: 0; }
.related li { font-size: var(--size-small); margin-bottom: .35rem; }
.related .kindmark {
  font-family: var(--font-mono); font-size: var(--size-micro); letter-spacing: var(--ls-mono);
  text-transform: uppercase; color: var(--color-muted); margin-right: .5rem;
}

.pip { display: inline-flex; align-items: center; gap: .4em; white-space: nowrap; }
.pip::before { content: ""; width: .55em; height: .55em; background: currentColor; flex: none; }
.is-force { color: var(--color-in-force); }
.is-attn { color: var(--color-attention); }
.is-muted { color: var(--color-muted); }
.is-agent { color: var(--color-agent); }

@media (max-width: 700px) {
  .rfc-head { grid-template-columns: 1fr; }
  .rfc-head .right { text-align: left; }
  .sheet { padding: 1.4rem 1.15rem 2rem; }
}

@media print {
  body { background: #fff; color: #000; padding: 0; }
  .sheet { border: none; max-width: none; padding: 0; background: #fff; }
  .band { background: transparent; }
  .band .tab { color: #000 !important; background: transparent !important; border: 1.5px solid #000; margin: .3rem; padding: .3rem .55rem; }
  .stamp { color: #000 !important; background: transparent !important; border: 1.5px solid #000; }
  pre.cmd { background: transparent; border: 1px solid #bbb; border-left: 3px solid #000; white-space: pre-wrap; }
  .clause, h2, h3 { break-inside: avoid; }
  h1, h2, h3 { break-after: avoid; }
  a::after { content: " <" attr(href) ">"; font-size: .72em; word-break: break-all; }
  a[href^="#"]::after { content: ""; }
  @page { margin: 18mm 16mm; }
}
${extra}`;
}
