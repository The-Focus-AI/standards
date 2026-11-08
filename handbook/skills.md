---
title: Install and maintain skills
summary: A generated catalog, immutable source pins, and explicit choices for same-name capabilities.
status: Draft
---

The site catalog is generated from [skills-lock.json](../skills-lock.json) and
the owned `skills/` directories. It distinguishes installed defaults from
optional capabilities, groups external sources, and exposes the actual paths
and revisions. Do not maintain another inventory in prose.

The smaller default keeps the external selection plus `setup-project` and
`work-next-issue`. Presentation, brand, and research capabilities remain optional.
`pptx-decks` owns deck mechanics; `focus-ai-brand` supplies optional brand tokens.
Neither requires installing the other for an unrelated project.

## Restore the reviewed selection

Use the mise-pinned skills CLI, not an unpinned `npx` command or manually copied
skill folders. The root and default-project locks stay identical.

```sh
mise run install
node scripts/restore-skills.mjs --check
node scripts/restore-skills.mjs --validate-lock
```

The restore helper installs in a temporary directory, verifies canonical paths,
full commit refs, inventory, and installed-byte hashes, then replaces the managed
directory. It never rewrites the project lock. It refuses unknown existing skills
instead of deleting them and rejects concurrent wrapper runs. Inspect an abandoned
guard before removal. This is not a sandbox for untrusted code or a power-loss-safe
transaction, and it does not lock out someone running the raw CLI concurrently.

The pinned skills 1.7.4 behavior was checked on 2026-10-30:

- `experimental_install` is the raw restore command; `install` aliases `add`.
- Raw restore does not enforce `computedHash`; unknown frozen flags do not help.
  Exit zero can still leave an incomplete restore. Use the helper.
- `skills check` dispatches to a mutating update. It is not a read-only audit.
- `skills update --project -y` checks recorded refs, so immutable pins do not
  advance to latest. Unscoped named updates can also touch global skills.
- `skills remove NAME -y` removes the project files and lock entry. Agent-specific
  removal retains shared content while another agent uses it.

## Update deliberately

1. Read upstream changes and select a reviewed published full commit SHA.
2. Run `skills add` from that immutable source with explicit skill names and agent.
3. Review source, `skillPath`, ref, and hash changes; run the restore checks.
4. Update the consuming lock only after the source is published. Local edits to
   an owned skill do not change the installed version pinned to an earlier commit.

Never run bare `skills add cursor/plugins -y` or `skills add mattpocock/skills -y`.
They include capabilities outside the selected set. For pstack, use its canonical
`pstack/skills/` tree, not same-name harness adapters.

## Resolve same-name skills explicitly

The lock stores one entry per name. `tdd` and `teach` default to Matt Pocock's
feature-testing and teaching-workspace implementations. Pstack's alternatives
provide focused regression testing and how/why explanations. Choose one installed
source; do not invent alias keys that upstream restoration cannot resolve.

To read the alternative without changing the lock:

```bash
set -euo pipefail
PSTACK_REF=$(jq -er '.skills["poteto-mode"].ref' skills-lock.json)
[[ "$PSTACK_REF" =~ ^[0-9a-f]{40}$ ]]
skills use "https://github.com/cursor/plugins/tree/$PSTACK_REF/pstack/skills" --skill tdd
```

`skills use` emits the prompt, not supporting resources or plugins. Read resources
at the same revision. Cursor-specific plugins, agents, and Bugbot/Automations
remain separate dependencies; skip unsupported steps explicitly in other hosts.

## Maintain an owned skill

Keep `skills/<name>/SKILL.md` with matching kebab-case name and a description that
says what it does and when to use it. Preserve bundled resources and attribution
in [VENDORED.md](../skills/VENDORED.md). Names are the installable identities;
there is no second numbering scheme.

Run `mise run skills:check`. Read command/server declarations before adopting an
external skill, and verify behavior rather than treating installation as proof.

CLI source: [skills 1.7.4](https://github.com/vercel-labs/skills/tree/a80e4c9d12d607631249d4d7d059f835d4b2f13a).
The [restore helper](../scripts/restore-skills.mjs) and its tests encode the
additional checks this inventory relies on.
