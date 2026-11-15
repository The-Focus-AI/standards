for (const element of document.querySelectorAll("[data-enhancement]")) element.hidden = false;

const prefix = document.body.dataset.prefix || "";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const wide = matchMedia("(min-width: 901px)");
const navMenu = document.querySelector(".nav-menu");

/* ==========================================================================
   SPATIALLY GROUNDED READING RULER (SCROLL-SPY & CALIPER)
   ========================================================================== */
function syncRulerBead() {
  const inner = document.getElementById("ruler-inner");
  const bead = document.getElementById("ruler-bead");
  const span = document.getElementById("ruler-span");
  const pctEl = document.getElementById("ruler-pct");
  const readoutEl = document.getElementById("ruler-readout");
  if (!inner || !bead || !span || (navMenu && !navMenu.open)) return;

  const innerRect = inner.getBoundingClientRect();
  if (!innerRect.height) return;

  const centerY = el => {
    const r = el.getBoundingClientRect();
    return (r.top - innerRect.top) + r.height / 2 - 4;
  };

  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const scrollPct = Math.min(100, Math.max(0, Math.round((window.scrollY / maxScroll) * 100)));
  if (pctEl) pctEl.textContent = window.scrollY < 10 ? "TOP" : `${scrollPct}%`;

  if (document.body.dataset.pageKind === "overview") {
    const ovRow = document.getElementById("ruler-row-overview");
    if (!ovRow) return;
    const anchors = [{ docY: 0, tickEl: ovRow, sec: "00", label: "§ 00 · OVERVIEW" }];
    for (const lblEl of inner.querySelectorAll("[data-ov-label]")) {
      const num = lblEl.dataset.ovLabel;
      if (num === "00") continue;
      const secEl = document.getElementById(`ov-${num}`);
      if (secEl) {
        anchors.push({
          docY: Math.max(1, window.scrollY + secEl.getBoundingClientRect().top - 150),
          tickEl: lblEl,
          sec: num,
          label: `§ ${lblEl.textContent.trim().toUpperCase()}`,
        });
      }
    }
    let k = 0;
    for (let i = 0; i < anchors.length; i++) {
      if (window.scrollY >= anchors[i].docY - 4) k = i;
    }
    let y = centerY(anchors[k].tickEl);
    if (k < anchors.length - 1) {
      const a = anchors[k];
      const b = anchors[k + 1];
      const t = Math.min(1, Math.max(0, (window.scrollY - a.docY) / Math.max(1, b.docY - a.docY)));
      y = centerY(a.tickEl) + (centerY(b.tickEl) - centerY(a.tickEl)) * t;
    }
    const activeGroup = document.getElementById(`ruler-group-${anchors[k].sec}`);
    if (activeGroup) {
      const gr = activeGroup.getBoundingClientRect();
      span.style.transform = `translateY(${(gr.top - innerRect.top).toFixed(1)}px)`;
      span.style.height = `${gr.height.toFixed(1)}px`;
    }
    for (const el of inner.querySelectorAll("[data-ov-label]")) {
      el.classList.toggle("is-in-view", el.dataset.ovLabel === anchors[k].sec);
    }
    bead.style.transform = `translateY(${y.toFixed(1)}px)`;
    if (readoutEl) readoutEl.textContent = anchors[k].label;
    return;
  }

  const block = inner.querySelector("[data-ruler-active-block]");
  const pageRow = inner.querySelector("[data-ruler-active-row]");
  if (!block || !pageRow) return;

  const br = block.getBoundingClientRect();
  span.style.transform = `translateY(${(br.top - innerRect.top).toFixed(1)}px)`;
  span.style.height = `${br.height.toFixed(1)}px`;

  const subtickEls = [...block.querySelectorAll("[data-subtick]")];
  const anchors = [{ docY: 0, tickEl: pageRow, subIdx: -1 }];
  subtickEls.forEach((stEl, i) => {
    const hEl = document.getElementById(stEl.dataset.hid);
    if (hEl && !hEl.closest("[hidden]")) {
      anchors.push({
        docY: Math.max(1, window.scrollY + hEl.getBoundingClientRect().top - 140),
        tickEl: stEl,
        subIdx: i,
      });
    }
  });

  let k = 0;
  for (let i = 0; i < anchors.length; i++) {
    if (window.scrollY >= anchors[i].docY - 4) k = i;
  }
  let y = centerY(anchors[k].tickEl);
  if (k < anchors.length - 1) {
    const a = anchors[k];
    const b = anchors[k + 1];
    const t = Math.min(1, Math.max(0, (window.scrollY - a.docY) / Math.max(1, b.docY - a.docY)));
    y = centerY(a.tickEl) + (centerY(b.tickEl) - centerY(a.tickEl)) * t;
  } else if (anchors.length > 1 && window.scrollY > anchors[k].docY) {
    y = centerY(anchors[anchors.length - 1].tickEl);
  }

  const activeSub = k === 0 ? 0 : anchors[k].subIdx;
  subtickEls.forEach((el, i) => el.classList.toggle("is-current", i === activeSub));
  document.querySelectorAll("[data-toc-link]").forEach(el => {
    el.classList.toggle("is-lit", Number(el.dataset.tocLink) === activeSub);
  });

  bead.style.transform = `translateY(${y.toFixed(1)}px)`;
}

const setNavigation = () => {
  if (navMenu) navMenu.open = wide.matches;
  requestAnimationFrame(syncRulerBead);
};
setNavigation();
wide.addEventListener("change", setNavigation);
navMenu?.addEventListener("toggle", () => requestAnimationFrame(syncRulerBead));
window.addEventListener("scroll", syncRulerBead, { passive: true });
window.addEventListener("resize", syncRulerBead, { passive: true });

requestAnimationFrame(() => {
  const rulerScroll = document.getElementById("ruler-scroll");
  const activeBlock = document.querySelector("[data-ruler-active-block]");
  if (rulerScroll && activeBlock && wide.matches) {
    const sr = rulerScroll.getBoundingClientRect();
    const br = activeBlock.getBoundingClientRect();
    if (br.bottom > sr.bottom - 16 || br.top < sr.top + 16) {
      rulerScroll.scrollTop += (br.top - sr.top) - Math.max(24, (sr.height - br.height) * 0.3);
    }
  }
  syncRulerBead();
});

/* ==========================================================================
   INLINE SIDEBAR SEARCH & ⌘K SPOTLIGHT PALETTE
   ========================================================================== */
const search = document.querySelector("#search");
const records = JSON.parse(document.querySelector("#search-data").textContent);

if (search) {
  search.addEventListener("input", () => {
    const terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    document.querySelector("#search-results").hidden = !terms.length;
    document.querySelector("#page-content").hidden = !!terms.length;
    const list = document.querySelector("#search-list");
    list.replaceChildren();
    const matches = records.filter(r => terms.every(term => r.text.includes(term)));
    document.querySelector("#search-count").textContent = `${matches.length} ${matches.length === 1 ? "topic" : "topics"} found`;
    for (const record of matches) {
      const article = document.createElement("article");
      const link = document.createElement("a");
      link.href = prefix + record.path;
      link.textContent = record.title;
      const summary = document.createElement("p");
      summary.textContent = record.summary;
      article.append(link, summary);
      list.append(article);
    }
    requestAnimationFrame(syncRulerBead);
  });
  search.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      search.value = "";
      search.dispatchEvent(new Event("input"));
      search.blur();
    }
  });
}

const cmdModal = document.getElementById("cmd-modal");
const cmdInput = document.getElementById("cmd-input");
const cmdList = document.getElementById("cmd-list");
const openCmdBtn = document.getElementById("open-cmd");
const closeCmdBtn = document.getElementById("close-cmd");

const paletteItems = [
  { title: "Start with the work (Overview)", path: "index.html", meta: "§ 00 · Home", text: "overview home start with the work prompt" },
  ...records.map(r => ({ title: r.title, path: r.path, meta: r.path.replace(/\.html$/, ".md"), text: r.text })),
  { title: "Find the right skill (Catalog)", path: "skills.html", meta: "Capabilities", text: "skills catalog pstack lock capabilities" },
  { title: "Changelog & RSS 2.0 feed", path: "changelog.html", meta: "Updates · RSS", text: "changelog rss feed updates releases" },
];
let cmdActiveIdx = 0;
let cmdFiltered = paletteItems;

function renderCmdList(query) {
  if (!cmdList) return;
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  cmdFiltered = paletteItems.filter(it => !terms.length || terms.every(t => `${it.title} ${it.meta} ${it.text}`.toLowerCase().includes(t)));
  cmdActiveIdx = 0;
  cmdList.replaceChildren();
  if (!cmdFiltered.length) {
    const empty = document.createElement("p");
    empty.className = "cmd-empty";
    empty.textContent = `No handbook pages match "${query}".`;
    cmdList.append(empty);
    return;
  }
  cmdFiltered.forEach((it, idx) => {
    const a = document.createElement("a");
    a.className = "cmd-option";
    a.role = "option";
    a.href = prefix + it.path;
    a.setAttribute("aria-selected", String(idx === cmdActiveIdx));
    const span = document.createElement("span");
    span.textContent = it.title;
    const small = document.createElement("small");
    small.textContent = it.meta;
    a.append(span, small);
    a.addEventListener("pointerenter", () => setCmdSelection(idx));
    cmdList.append(a);
  });
}

function setCmdSelection(idx) {
  if (!cmdList || !cmdFiltered.length) return;
  cmdActiveIdx = ((idx % cmdFiltered.length) + cmdFiltered.length) % cmdFiltered.length;
  const opts = cmdList.querySelectorAll(".cmd-option");
  opts.forEach((opt, i) => opt.setAttribute("aria-selected", String(i === cmdActiveIdx)));
  opts[cmdActiveIdx]?.scrollIntoView({ block: "nearest" });
}

function openCmd() {
  if (!cmdModal || !cmdInput) return;
  cmdModal.hidden = false;
  cmdInput.value = "";
  renderCmdList("");
  requestAnimationFrame(() => cmdInput.focus());
}

function closeCmd() {
  if (!cmdModal || cmdModal.hidden) return;
  cmdModal.hidden = true;
  openCmdBtn?.focus();
}

openCmdBtn?.addEventListener("click", openCmd);
closeCmdBtn?.addEventListener("click", closeCmd);
cmdModal?.addEventListener("click", e => { if (e.target === cmdModal) closeCmd(); });
cmdInput?.addEventListener("input", () => renderCmdList(cmdInput.value));
cmdInput?.addEventListener("keydown", e => {
  if (e.key === "ArrowDown") { e.preventDefault(); setCmdSelection(cmdActiveIdx + 1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); setCmdSelection(cmdActiveIdx - 1); }
  else if (e.key === "Enter" && cmdFiltered[cmdActiveIdx]) {
    e.preventDefault();
    window.location.href = prefix + cmdFiltered[cmdActiveIdx].path;
  }
});

window.addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    cmdModal && !cmdModal.hidden ? closeCmd() : openCmd();
    return;
  }
  if (e.key === "Escape" && cmdModal && !cmdModal.hidden) {
    e.preventDefault();
    closeCmd();
    return;
  }
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
  if (e.key === "/") {
    e.preventDefault();
    if (search && search.offsetParent !== null) search.focus();
    else openCmd();
  }
});

/* ==========================================================================
   COPY PROMPT & SKILLS CATALOG FILTERS
   ========================================================================== */
for (const button of document.querySelectorAll("[data-copy]")) {
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.dataset.copy);
    const box = button.closest(".prompt-box");
    const status = box.querySelector(".copy-status");
    try {
      await navigator.clipboard.writeText(target.textContent);
      button.textContent = "Copied ✓";
      status.textContent = "Prompt copied to clipboard.";
      setTimeout(() => { button.textContent = "Copy prompt"; }, 1800);
    } catch {
      const details = box.querySelector("details");
      if (details) details.open = true;
      const range = document.createRange();
      range.selectNodeContents(target);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      status.textContent = "Clipboard unavailable. Select and copy the prompt below.";
    }
  });
}

function filterSkills() {
  const terms = document.querySelector("#skill-search").value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const selection = document.querySelector("#skill-selection").value;
  const source = document.querySelector("#skill-source").value;
  let count = 0;
  for (const row of document.querySelectorAll("[data-skill]")) {
    row.hidden = !terms.every(t => row.dataset.skill.includes(t)) ||
      (!!selection && selection !== row.dataset.selection) ||
      (!!source && source !== row.dataset.source);
    if (!row.hidden) count++;
  }
  for (const group of document.querySelectorAll(".skill-group")) {
    group.hidden = !group.querySelector("[data-skill]:not([hidden])");
  }
  document.querySelector("#skill-count").textContent = count
    ? `${count} ${count === 1 ? "skill" : "skills"}`
    : "No skills match. Clear a filter to try again.";
  requestAnimationFrame(syncRulerBead);
}

for (const control of document.querySelectorAll(".skill-controls input, .skill-controls select")) {
  control.addEventListener(control.tagName === "SELECT" ? "change" : "input", filterSkills);
}

/* ==========================================================================
   INTERACTIVE CORPUS DOT-LATTICE (PROGRESSIVE ENHANCEMENT)
   ========================================================================== */
const lattice = document.getElementById("ink-lattice");
if (lattice && !reducedMotion.matches) {
  const circles = [...lattice.querySelectorAll("circle")];
  const dots = circles.map(c => {
    const bx = Number(c.dataset.bx);
    const by = Number(c.dataset.by);
    return { c, bx, by, x: bx, y: by, vx: 0, vy: 0 };
  });
  let mx = -999, my = -999, tick = 0, raf = 0, visible = true;

  lattice.addEventListener("pointermove", e => {
    const rect = lattice.getBoundingClientRect();
    mx = ((e.clientX - rect.left) / rect.width) * 620;
    my = ((e.clientY - rect.top) / rect.height) * 120;
  });
  lattice.addEventListener("pointerleave", () => { mx = -999; my = -999; });

  function animateLattice() {
    if (!visible || reducedMotion.matches) { raf = 0; return; }
    tick += 0.024;
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      let tx = d.bx;
      let ty = d.by + Math.sin(tick + d.bx * 0.024) * 1.5;
      const dx = d.x - mx;
      const dy = d.y - my;
      const dist = Math.hypot(dx, dy);
      if (dist < 76 && dist > 0.1) {
        const force = (1 - dist / 76) * 12;
        tx += (dx / dist) * force;
        ty += (dy / dist) * force;
      }
      d.vx = (d.vx + (tx - d.x) * 0.14) * 0.76;
      d.vy = (d.vy + (ty - d.y) * 0.14) * 0.76;
      d.x += d.vx;
      d.y += d.vy;
      d.c.setAttribute("cx", d.x.toFixed(2));
      d.c.setAttribute("cy", d.y.toFixed(2));
    }
    raf = requestAnimationFrame(animateLattice);
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible && !raf) raf = requestAnimationFrame(animateLattice);
    }).observe(lattice);
  } else {
    raf = requestAnimationFrame(animateLattice);
  }
}
