// Generates out/standards/llms.txt — the machine-readable entry point to the
// corpus, published at https://standards.thefocus.ai/llms.txt.
//
// It is generated rather than authored for one reason: the skill inventory has
// to be complete. A hand-kept list of skills is a list that goes stale the first
// time somebody adds one, and a partial inventory is worse than none — an agent
// reading it concludes the missing skills do not exist. Everything below comes
// from the same sources the site does: the corpus itself, `skills/VENDORED.md`
// for the SKL register, and `skills-lock.json` for the skills we install but do
// not maintain.
//
// The prose that is authored here is the operating procedure: how to install
// every locked skill, how to update them all, and how to add one. That belongs
// next to the inventory, because the question "what skills are there" and the
// question "how do I get them" are always asked together.

const SITE = "https://standards.thefocus.ai";

/** First sentence of a skill description — the whole thing is a trigger blurb for the CLI. */
function firstSentence(text) {
  if (!text) return "";
  const flat = String(text).replace(/\s+/g, " ").trim();
  const stop = flat.search(/\.(\s|$)/);
  return (stop === -1 ? flat : flat.slice(0, stop)).trim();
}

/**
 * @param {object} args
 * @param {Array} args.standards rendered standards, in number order
 * @param {Array} args.docs      rendered guides/notes/decisions/prompts
 * @param {Array} args.skills    rendered skills, carrying their SKL entry
 * @param {object} args.lock     parsed skills-lock.json
 */
export function renderLlmsTxt({ standards, docs, skills, lock }) {
  const out = [];
  const w = (...lines) => out.push(...lines);

  w(
    "# The Focus AI Standards",
    "",
    "> What The Focus AI currently believes about building software, written so that a person",
    "> and a parser get the same answer from it, and distributed to every repository that runs",
    "> an agent. Cite by number — `STD-008`, `GDE-010`, `STD-006 §3.10` — because a number",
    "> survives a retitling and a slug does not.",
    "",
    "The markdown in `The-Focus-AI/standards` is the artifact; this site is its citable",
    "rendering. Standards are the only documents that bind anything, and a standard marked",
    "Draft binds nothing until a person ratifies it (`STD-001 §3.14`). Guides, notes, decision",
    "records and prompts explain and record; they never impose a rule.",
    "",
    `Every document below is also bundled as one self-contained file at ${SITE}/standards.html.`,
    "",
  );

  w("## Standards");
  w("");
  for (const s of standards) {
    w(`- [${s.id} — ${s.title}](${SITE}/${s.file}): ${s.status}. Applies to ${s.applies}.`);
  }
  w("");

  const byPrefix = new Map();
  for (const d of docs) {
    if (!byPrefix.has(d.cls.plural)) byPrefix.set(d.cls.plural, []);
    byPrefix.get(d.cls.plural).push(d);
  }
  for (const [plural, entries] of byPrefix) {
    w(`## ${plural}`);
    w("");
    for (const d of entries) w(`- [${d.id} — ${d.title}](${SITE}/${d.file}): ${d.status}.`);
    w("");
  }

  /* ---- the skill inventory ---- */
  // Two lists, because they are governed differently: the ones we maintain carry
  // an SKL number and are changed here, and the ones we install from upstream are
  // pinned by hash and changed by their authors. Both are installed the same way.

  const ours = new Set(skills.map((k) => k.name));
  const locked = Object.entries(lock.skills ?? {}).sort(([a], [b]) => a.localeCompare(b));
  const thirdParty = locked.filter(([name]) => !ours.has(name));

  const bySource = new Map();
  for (const [name, entry] of thirdParty) {
    if (!bySource.has(entry.source)) bySource.set(entry.source, []);
    bySource.get(entry.source).push({ name, ...entry });
  }

  w(
    "## Skills",
    "",
    `${skills.length + thirdParty.length} skills in total: ${skills.length} maintained in this ` +
      `repository, ${thirdParty.length} installed from upstream.`,
    "This is the complete list. A skill that is not here is not part of the standard set.",
    "",
    "### Maintained here",
    "",
    "Installable from `The-Focus-AI/standards`, which is public — no authentication needed.",
    "Numbered by the register in `skills/VENDORED.md`.",
    "",
  );
  for (const k of skills) {
    const blurb = firstSentence(k.parsed?.meta?.description);
    w(`- \`${k.name}\` (${k.id}) — ${blurb}. [${k.id}](${SITE}/${k.file})`);
  }
  w("");

  w(
    "### Installed from upstream",
    "",
    "Not ours. They stay where they are, pinned by hash in `skills-lock.json`, so",
    "`skills update` keeps giving us their authors' fixes for free.",
    "",
  );
  for (const [source, entries] of [...bySource].sort(([a], [b]) => a.localeCompare(b))) {
    w(`From \`${source}\`:`);
    w("");
    for (const e of entries) w(`- \`${e.name}\` — \`${e.skillPath}\``);
    w("");
  }

  /* ---- the procedure ---- */
  w(
    "## Installing and updating skills",
    "",
    "`STD-011` binds this. The rules that matter: install with the CLI and never by copying",
    "a directory (§3.1); commit `skills-lock.json` (§3.2); review a skill update as a diff",
    "before committing it (§3.6); never install a whole upstream collection wholesale (§3.7);",
    "check what actually landed against the lock (§3.8).",
    "",
    "### Where skills have to land",
    "",
    "Claude Code loads project skills from `.claude/skills/` only. It does not read",
    "`.agents/skills/`, which is where `skills experimental_install` puts everything — that",
    "command hardcodes its targets to the agents that share `.agents/skills/`, and ignores",
    "`--agent`. An install that reports success and leaves the agent with no skills is the",
    "failure this section exists to prevent, so every command below passes `--agent claude-code`.",
    "",
    "### Install every locked skill",
    "",
    "On a fresh clone, a new machine, or in CI. This is what `mise run install` runs:",
    "",
    "```sh",
    "node -e '",
    '  const { execFileSync } = require("node:child_process");',
    '  const l = require("./skills-lock.json").skills, by = {};',
    "  for (const [name, e] of Object.entries(l)) (by[e.source] ??= []).push(name);",
    "  for (const [source, names] of Object.entries(by))",
    '    execFileSync("skills", ["add", source, ...names.flatMap((n) => ["--skill", n]), "--agent", "claude-code", "-y"],',
    '      { stdio: ["ignore", "inherit", "inherit"] });',
    "'",
    "```",
    "",
    "Do not rewrite that as a pipe into `sh`. `skills add` reads stdin, so it consumes the",
    "rest of the command list off the pipe: only the first source installs, and the command",
    "still exits 0. Each child needs its stdin on /dev/null, which is what `stdio: ignore` does.",
    "",
    "### Update every skill",
    "",
    "When you are asked to update all the skills, this is the whole procedure. Do not stop",
    "after step 1 — `skills update` rewrites the lock but installs nothing.",
    "",
    "```sh",
    "skills update -y            # fetch latest, rewrite every hash in skills-lock.json",
    "git diff skills-lock.json   # review it — STD-011 §3.6 forbids committing this unread",
    "```",
    "",
    "Then re-run the install block above, so the refreshed skills reach `.claude/skills/`,",
    "and commit `skills-lock.json`. Update a subset with `skills update <name> <name> -y`.",
    "",
    "Finally, check what landed:",
    "",
    "```sh",
    "mise run skills:check -- --installed",
    "```",
    "",
    "A skill that vanishes from its upstream repository is dropped silently and the command",
    "still exits 0, so the count is the only thing that catches it. A shortfall means an",
    "upstream rename — find the new name, or remove the entry (§3.5).",
    "",
    "### Add or remove one skill",
    "",
    "```sh",
    "skills add <owner>/<repo> --skill <folder> --agent claude-code -y",
    "skills add The-Focus-AI/standards --skill <name> --agent claude-code -y",
    "```",
    "",
    "Removing a skill means deleting its `skills-lock.json` entry as well as its files;",
    "`skills rm` leaves the entry behind and the next install puts the skill back (§3.5).",
    "",
    "## Getting a project onto these standards",
    "",
    "```sh",
    "# a new project: empty directory to `mise dev`     — see GDE-011",
    "skills add The-Focus-AI/standards --skill setup-project --agent claude-code -y",
    "",
    "# an existing project: where does it stand?        — see GDE-012",
    "skills add The-Focus-AI/standards --skill standards-map --agent claude-code -y",
    "",
    "# …then close the gaps",
    "skills add The-Focus-AI/standards --skill standardize-project --agent claude-code -y",
    "```",
    "",
    "`standards-map` is read-only and produces a dated report; `standardize-project` changes",
    "files, after a plan you approve. Run the map first.",
    "",
  );

  return `${out.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}
