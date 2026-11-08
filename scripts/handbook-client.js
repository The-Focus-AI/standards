for (const element of document.querySelectorAll("[data-enhancement]")) element.hidden = false;
const wide = matchMedia("(min-width: 901px)");
const setNavigation = () => { document.querySelector(".nav-menu").open = wide.matches; };
setNavigation();
wide.addEventListener("change", setNavigation);

const search = document.querySelector("#search");
const records = JSON.parse(document.querySelector("#search-data").textContent);
search.addEventListener("input", () => {
  const terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  document.querySelector("#search-results").hidden = !terms.length;
  document.querySelector("#page-content").hidden = !!terms.length;
  const list = document.querySelector("#search-list");
  list.replaceChildren();
  const matches = records.filter(r => terms.every(term => r.text.includes(term)));
  document.querySelector("#search-count").textContent = `${matches.length} topics found`;
  for (const record of matches) {
    const article = document.createElement("article");
    const link = document.createElement("a");
    link.href = document.body.dataset.prefix + record.path;
    link.textContent = record.title;
    const summary = document.createElement("p");
    summary.textContent = record.summary;
    article.append(link, summary);
    list.append(article);
  }
});
search.addEventListener("keydown", event => {
  if (event.key === "Escape") { search.value = ""; search.dispatchEvent(new Event("input")); }
});

for (const button of document.querySelectorAll("[data-copy]")) {
  button.addEventListener("click", async () => {
    const text = document.getElementById(button.dataset.copy).textContent;
    const status = button.closest(".prompt-box").querySelector(".copy-status");
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied";
      status.textContent = "Prompt copied to clipboard.";
    } catch {
      button.closest(".prompt-box").querySelector("details").open = true;
      const range = document.createRange();
      range.selectNodeContents(document.getElementById(button.dataset.copy));
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
      (!!selection && selection !== row.dataset.selection) || (!!source && source !== row.dataset.source);
    if (!row.hidden) count++;
  }
  for (const group of document.querySelectorAll(".skill-group")) {
    group.hidden = !group.querySelector("[data-skill]:not([hidden])");
  }
  document.querySelector("#skill-count").textContent = count ? `${count} skills` : "No skills match. Clear a filter to try again.";
}
for (const control of document.querySelectorAll(".skill-controls input, .skill-controls select")) {
  control.addEventListener(control.tagName === "SELECT" ? "change" : "input", filterSkills);
}
