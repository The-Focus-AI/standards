---
title: Changelog
summary: Notable additions and revisions to the Focus engineering handbook, recipes, and skills.
---

Substantive updates to handbook guidance, platform recipes, and shared agent skills.
Subscribe via [the RSS feed](https://standards.thefocus.ai/feed.xml) to consume new
entries in Focus.AI Labs or any feed reader. Formatting, typo, and lint-only commits
are omitted.

## 2026-11-15 — Unified update prompt, raw Markdown endpoints, and company 1Password vault enforcement

Unified the copyable update-project prompt card and JavaScript copy buttons across
`index.html`, `handbook/update-project.html`, and `README.md`, published raw `.md`
endpoints (`handbook/*.md`, `recipes/*.md`, `evidence/*.md`, `CHANGELOG.md`, `DESIGN.md`)
on `standards.thefocus.ai`, and pinned secret guidance and `mise run setup` to
TheFocus.AI's company 1Password Business account (`thefocusai.1password.com`) while
rejecting personal `my.1password.*` accounts and built-in `Private`/`Personal`/`default` vaults.

- [Update a project](handbook/update-project.md)
- [Handle secrets](handbook/secrets.md)
- [Give and remove access](handbook/access.md)
- [Configure fnox and secret delivery](recipes/fnox.md)

## 2026-11-15 — Inkling monograph typography, reading-ruler navigation, and status ledger

Migrated the engineering handbook renderer and `DESIGN.md` tokens to the Inkling
monograph palette (`sheet`, `page`, petrol `action`, and vermilion `attention`),
self-hosted `Source Serif 4` and `Courier Prime` WOFF2 fonts, clickable inline document
path badges, a `⌘K` spotlight palette, per-page authority status badges (`Draft`,
`In force`, `Reference`, `Evidence`), an overview document-authority and project-maturity
ledger, and a spatially grounded reading-ruler sidebar whose active bracket and
scroll-spy bead track the current page's own sections 1:1.

- [Handbook design](DESIGN.md)
- [Maintain the handbook](handbook/maintaining.md)
- [Verify and release](handbook/release.md)

## 2026-11-14 — Curated changelog and RSS 2.0 feed

Added a root `CHANGELOG.md` rendered to `changelog.html` and a deterministic RSS 2.0
feed (`feed.xml`) with `<link rel="alternate" type="application/rss+xml">`
autodiscovery across every page so TheFocus.AI Labs and feed readers can consume
handbook, recipe, and skill updates.

- [Maintain the handbook](handbook/maintaining.md)
- [Changelog](CHANGELOG.md)

## 2026-11-14 — Single-file macOS menu bar app build and release recipe

Added a reference procedure for native Swift menu bar utilities that run in both
`./app.swift` script mode and TCC-safe `.app` bundle mode, with headless CLI
inspection, `sed`-isolated unit testing, deterministic CoreGraphics `.icns`
generation, and universal `arm64` + `x86_64` GitHub Releases.

- [Build and release single-file macOS menu bar apps](recipes/macos-menubar-app.md)
- [Develop in a cloud workspace](handbook/development.md)
- [Verify and release](handbook/release.md)

## 2026-11-14 — Organization access map and self-repairing secret setup

Added draft guidance for giving and removing access across 1Password, GitHub, cloud
platforms, and client groups from a single project access map. Updated the default
project template's `mise run setup` task to verify vault reads and repair missing or
expired local service-account tokens into `.fnox/env`.

- [Give and remove access](handbook/access.md)
- [Keep secrets out of code and chat](handbook/secrets.md)
- [1Password and fnox](recipes/fnox.md)
- [Example access map](templates/access-map.example.md)

## 2026-11-09 — Integration state machines, cutover recovery, and self-hosted display typography

Clarified request, conversation, MCP App view, and cutover/rollback state machines
across the agent integration and release pages, and self-hosted the Barlow Condensed
WOFF2 display font with offline build verification.

- [Expose an agent service](handbook/agent-services.md)
- [Carry conversations across turns](handbook/conversations.md)
- [Embed interactive MCP App views](handbook/mcp-apps.md)
- [Verify and release](handbook/release.md)
- [Handbook design](DESIGN.md)

## 2026-11-08 — Task-oriented engineering handbook and generated skills catalog

Replaced the numbered document registry with a task-navigated handbook featuring
full-text search, a copyable repository-update prompt, an agent-readable
`handbook.md` bundle, and a skills catalog derived from `skills-lock.json` and owned
`skills/` directories while preserving Draft status.

- [Start a new project](handbook/project-setup.md)
- [Update an existing project](handbook/update-project.md)
- [Install and maintain skills](handbook/skills.md)
- [Maintain the handbook](handbook/maintaining.md)

## 2026-10-28 — Testing and release record, project audit prompt, and pstack skills

Added draft verification and release gates alongside the five-section
`docs/testing.md` operational record, expanded project audit and standardization
guidance, and pinned `pstack` skills from `cursor/plugins` in the shared skills lock.

- [Verify and release](handbook/release.md)
- [Update an existing project](handbook/update-project.md)
- [Install and maintain skills](handbook/skills.md)
- [GitHub Actions CI](recipes/ci.md)
- [Skills lock](skills-lock.json)

## 2026-10-12 — Course authoring skill in the standards catalog

Added the optional `build-focus-course` skill with lesson-pattern and platform
references for structuring Focus courses.

- [build-focus-course skill](skills/build-focus-course/SKILL.md)
- [Install and maintain skills](handbook/skills.md)
