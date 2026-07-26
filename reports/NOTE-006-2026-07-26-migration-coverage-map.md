---
number: "006"
title: "Migration coverage map: every source rule to its clause"
kind: note
issued: "2026-07-26"
author: W. Schenk
status: Current
verified: "2026-07-26"
---

# Migration coverage map

Every normative unit in the pre-migration `best-practices/` files, mapped to the
clause that now carries it. Produced because the previous commit claimed "29
anti-patterns extracted" without checking, and the claim was wrong.

Written per `STD-006`, and per `§3.8` this classification was made by an agent
reading both sides.

## Correction to the record

The migration commit said all 29 anti-patterns became clauses. On audit, 18 had,
3 were partial, and 8 were not covered at all. The gaps were closed by adding
`STD-007 §3.10`–`§3.13` and `STD-008 §3.10`–`§3.14`. The table below is the
state after those additions.

Two units are deliberately **not** promoted: they are facts about a tool rather
than rules, and they stay in the guide where the walkthrough needs them.

## Clerk — 8 anti-patterns + 2 rule sections → STD-009

| Source | Clause |
| --- | --- |
| Dev instance (`pk_test`) serving a production site | `STD-009 §3.3` |
| Shared app + satellite domains to "separate" clients | `§3.2` |
| Instance domain set to the bare root | `§3.4` |
| Cloudflare-proxied Clerk CNAMEs | `§3.5` |
| Social login in prod with no custom OAuth credentials | `§3.6` |
| Microsoft app registered single-tenant | `§3.7` |
| Microsoft client secret expiring with no rotation reminder | `§3.9` → `STD-007 §3.9` |
| Google OAuth app left in "Testing" | `§3.8` |
| "One Clerk application per client" | `§3.1` |
| "Always run a production instance in production" | `§3.3` |

Complete. The publishable-key decode check moved into `§3.3` as its command.

## GCP — 7 anti-patterns + required tasks → STD-008, STD-007

| Source | Clause |
| --- | --- |
| Deploying without verifying project | `STD-008 §3.1` |
| Homebrew / global gcloud | `§3.3` |
| Shared `default` gcloud config across client repos | `§3.2` |
| Long-lived service account key files | `STD-007 §3.10` **(added on audit)** |
| Secret values in `--set-env-vars` | `STD-007 §3.6` |
| Hardcoding another client's project ID | `STD-008 §3.1`, `§3.2` |
| Required tasks: `auth`, `auth-status`, `deploy`, `watch-logs` | `STD-008 §3.14` **(added on audit)** |
| ADC vs `gcloud auth login` are different credentials | **stays in the guide** — a fact about the tool, not a rule |

## Vercel — 7 anti-patterns + required tasks + env matrix → STD-007, STD-008

| Source | Clause |
| --- | --- |
| Dashboard-only secrets with no fnox source of truth | `STD-007 §3.6` |
| Dev Clerk keys in Production; live keys committed | `STD-009 §3.3`, `STD-004 §3.8` |
| One Neon database shared by Preview and Production | `STD-007 §3.5` |
| Syncing a whole vault into a project needing a subset | `STD-007 §3.12` **(added on audit)** |
| Changing `NEXT_PUBLIC_*` without redeploying | `STD-008 §3.5` |
| Supabase-as-default for new projects | `best-practices/GDE-009-technology-defaults.md` — a preference, not a rule |
| Required tasks: `vercel:sync`, `vercel:deploy`, `secrets:*` | `STD-008 §3.14` **(added on audit)** |
| Environment matrix (local / preview / production) | `STD-008 §3.4` requires the mapping; the table itself stays in the guide |
| `fnox exec` as the Vercel build command | **stays in the guide** — platform mechanism |

## GCE Gaia — 7 anti-patterns + 5 hard rules → STD-008, STD-007

The weakest area before the audit: only 2 of 7 were covered.

| Source | Clause |
| --- | --- |
| Prod self-hosted runner on `pull_request` | `STD-008 §3.6` |
| Expecting branch previews where none exist | `§3.8` |
| Building images on a laptop and pushing to prod | `§3.10` **(added on audit)** |
| Exposing Gaia's raw port publicly | `§3.11` **(added on audit)** |
| Mixing loops — changing one env, assuming others rebuilt | `§3.12` **(added on audit)** |
| Wiping habitat volumes holding rotated tokens | `STD-007 §3.13` **(added on audit)** |
| Master API key placed in the SaaS client | `STD-007 §3.11` **(added on audit)** |
| Hard rule: push to default branch only | `STD-008 §3.6` |
| Hard rule: require approval for fork workflows | `§3.6` |
| Hard rule: path-filter the workflow | `§3.13` **(added on audit)** |
| Hard rule: `concurrency` with `cancel-in-progress: false` | `§3.7` |
| Hard rule: treat runner registration as a production credential | `STD-007 §3.8` |

## a2a-agent §4 — the seven required patterns → STD-010

| Source | Clause |
| --- | --- |
| 4.1 Two-tier tool contract | `STD-010 §3.1` |
| 4.2 One `ToolSpec` → AI SDK + MCP | `§3.2` |
| 4.3 Typed, advertised refusals | `§3.3` |
| 4.4 Citations on quantitative claims | `§3.4` |
| 4.5 System prompt as `.md` + lockstep mirror | `§3.5` |
| 4.6 Postgres session persistence | `§3.6` |
| 4.7 One `runAgent`, two surfaces | `§3.7` |

Complete, one to one. Everything else in the 694-line document — stack,
directory layout, AgentCard, auth, MCP route, env vars, local dev, deployment,
testing — stays in the guide.

## GDE-008-skills.md → STD-011

| Source | Clause |
| --- | --- |
| Install with `skills add`, never hand-copy | `STD-011 §3.1` |
| Pin in `skills-lock.json`; commit it | `§3.2` |
| `mise install` restores by hash | `§3.3` |
| Lock names kebab-case, matching the folder | `§3.4` |
| `skills rm` leaves the entry — edit the lock | `§3.5` |
| Review `skills update` as a diff | `§3.6` |
| Do not install a whole upstream collection | `§3.7` |
| The standard skill set tables | Stay in the guide — data, not rules |

## best-practices/GDE-009-technology-defaults.md → STD-004, STD-011

| Source | Clause |
| --- | --- |
| All tools through mise | `STD-004 §3.1` |
| Never `npm install -g` / `pip` / `brew` / `npx -y … init` | `§3.2` |
| Adapt instructions that say otherwise | `§3.2` note |
| Required tasks: install, dev, lint, test, deploy | `§3.3`, `§3.4` |
| `mise install` calls pnpm install and skills install | `§3.5` |
| Use fnox for security | `§3.7`, `§3.8` |
| Use `skills add` | `STD-011 §3.1` |
| TypeScript, pnpm, no build step, Neon, Clerk | Kept in the rewritten guide as defaults |

## security.md → STD-007

| Source | Clause |
| --- | --- |
| Own 1Password vault per project | `STD-007 §3.1` |
| fnox + mise activation on `cd` | `STD-004 §3.7` |
| Must work in bash and zsh | `best-practices/GDE-006-local-environment.md` |
| Defers to the fnox playbook | `STD-007` reference [3] |

## deployment.md → GDE-006-local-environment.md

Audited separately and **failed**: 15 of 15 procedural details were lost when it
was replaced with a hand-written summary, and were restored from the original.
That failure produced `STD-006 §3.9`, which now requires that migrated content
be carried over rather than summarised.

## Coverage after audit

| Source | Units | Covered | Deliberately left in a guide |
| --- | --- | --- | --- |
| clerk | 10 | 10 | 0 |
| gcp | 8 | 7 | 1 |
| vercel | 9 | 8 | 1 |
| gce-gaia | 12 | 12 | 0 |
| a2a §4 | 7 | 7 | 0 |
| skills | 8 | 7 | 1 (the inventory) |
| GDE-009-technology-defaults.md | 8 | 8 | 0 |
| security | 4 | 4 | 0 |

Nothing normative remains unclaimed. The three left in guides are a tool fact,
a platform build-command mechanism, and a data table — none of them rules.
