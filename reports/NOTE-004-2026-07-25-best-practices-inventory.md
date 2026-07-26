---
number: "004"
title: "best-practices/ inventory: what migrates, what stays, what is missing"
kind: note
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-07-26"
---

# best-practices/ inventory

A file-by-file audit of `best-practices/` against the standards corpus
(`STD-001` … `STD-011` as they now stand), to settle what becomes a numbered standard, what stays
a guide, and what is already absorbed.

Written per `STD-006`. Classifications below were decided by an agent reading
the files, and flagged as such per `STD-006 §3.8`.

## Summary

Eleven files, 79 KB. Three findings matter more than the file-by-file table.

**The anti-patterns are already clauses.** Four files carry an `Anti-patterns`
section, 29 bullets between them, and nearly every one is a `MUST NOT` with the
reasoning stripped out. "Dev instance (`pk_test`) serving a production site"
is `A production site MUST NOT use a development Clerk instance`. This is the
highest-value content in the directory — hard-won failure knowledge — and it is
currently stored in the form least likely to be enforced.

**The deployment documents share a skeleton nobody declared.** `vercel-`,
`gcp-`, `gce-gaia-` and `clerk` all run: defaults → required mise tasks →
secrets/environment matrix → anti-patterns → checklist. That is a genre that
emerged on its own, which usually means it is right. It suggests one deployment
Practice carrying the rules common to all of them, with three platform Guides
underneath — rather than three standards that repeat each other.

**Two files are normative documents wearing guide clothing.** `AGENTS.md` —
since renumbered to `best-practices/GDE-009-technology-defaults.md` — is
pure rules with no explanation, and `best-practices/GDE-001-a2a-agent.md` contains a section literally
titled "The seven required patterns" buried at line 100 of 694.

## File by file

| File | Size | Verdict |
| --- | --- | --- |
| `best-practices/GDE-009-technology-defaults.md` | 1.2 KB | **Mostly absorbed.** Tooling, tasks, no-global-installs and fnox are now `STD-004`; skills defer to `best-practices/GDE-008-skills.md`. Residue is the Technologies block — TypeScript, pnpm, Neon, "avoid a build step where possible" — which is four lines of undecided policy, not a standard. |
| `security.md` | 292 B | **Author as a Practice.** The subject with the worst failure mode has the smallest file. `STD-004 §3.7–3.8` already specify how secrets reach a process; vault layout, scoping and rotation are still undecided. Deferred to the fnox playbook, since moved to `best-practices/GDE-003-fnox-secrets.md`. |
| `organization.md` | **0 B** | **Delete or write.** An empty file that root `AGENTS.md` directs readers to. Currently the corpus's clearest instance of the failure it exists to prevent. |
| `best-practices/GDE-007-pi-extensions.md` | 260 B | **Fold into `STD-005`.** It is agent-environment configuration, and it does not even list the five packages actually pinned in `.pi/settings.json`. |
| `best-practices/GDE-008-skills.md` | 7.2 KB | **Split.** The rules — install via `skills add`, pin in `skills-lock.json`, never hand-copy, kebab-case names — are a Practice. The standard skill set is an inventory that changes independently and should be data, not prose. "Adding a new skill" and "Keeping skills current" are Process. |
| `best-practices/GDE-002-clerk.md` | 7.6 KB | **Practice + Guide.** One app per client, production instance in production, and eight anti-patterns are clauses. The per-provider OAuth walkthroughs are a Guide. |
| `best-practices/GDE-010-vercel-deployment.md` | 11 KB | **Guide, with clauses extracted.** Required tasks, the environment matrix, and seven anti-patterns are normative; the rest is a walkthrough of one reference implementation. |
| `best-practices/GDE-005-gcp-deployment.md` | 10 KB | **Guide, with clauses extracted.** Same shape: required tasks, seven anti-patterns, a new-project checklist. |
| `best-practices/GDE-004-gce-gaia-runtime.md` | 8.6 KB | **Guide, with clauses extracted.** Contains "Hard rules for the self-hosted runner" and a section headed "Planned next (not standard yet)" — the author was already distinguishing standard from draft without a mechanism for it. |
| `best-practices/GDE-001-a2a-agent.md` | 30 KB | **Guide, with a Practice inside it.** §4, "The seven required patterns", is normative and unreachable at line 100 of 694. Extract those seven; leave the reference walkthrough as a Guide. |
| `deployment.md` | 3.1 KB | **Dissolve.** Despite the name it is not about deployment: it is local shell setup (mise + fnox activation for bash and zsh), remote server setup, pi installation, and tmux. The mise/fnox half is `STD-004`, the pi half is `STD-005`, and what remains is a routing index that root `AGENTS.md` already duplicates. |

## What this implies for numbering

A plausible shape, not a decision:

| Standard | Drawn from |
| --- | --- |
| Secrets and credentials | `security.md`, `reports/fnox-secrets.md`, the secret-handling anti-patterns across all four deployment files |
| Deployment | The rules common to `vercel-`, `gcp-`, `gce-gaia-`: named configuration, required per-platform tasks, environment scoping, the 21 shared anti-patterns |
| Authentication | `best-practices/GDE-002-clerk.md` rules and its eight anti-patterns |
| Agent services | `best-practices/GDE-001-a2a-agent.md` §4, the seven required patterns |
| Skills | `best-practices/GDE-008-skills.md` rules, with the skill set moved to data |

The platform walkthroughs, checklists and reference implementations stay where
they are as Guides, gaining only the frontmatter `STD-006` requires.

## What is missing entirely

Not in `best-practices/` and not anywhere else. Recorded so the absence is
deliberate — see `reports/NOTE-005-2026-07-25-standards-gap-register.md` for the fuller
treatment.

- Testing: what a suite must cover, where tests live, what `mise test` must run.
- Code review: what a reviewer checks, which `STD-003` now depends on.
- Repository layout: the empty `organization.md`.
- TypeScript and pnpm conventions beyond two lines.
- Database conventions beyond "use Neon".

## Executed

The migration below was carried out on the day this note was issued.

- `STD-007` … `STD-011` extracted from the anti-pattern lists and the normative
  sections of `security.md`, `best-practices/GDE-002-clerk.md`, the three deployment guides,
  `best-practices/GDE-001-a2a-agent.md` §4, and `best-practices/GDE-008-skills.md`.
- `best-practices/organization.md` deleted — it was zero bytes.
- `best-practices/security.md` deleted; fully absorbed by `STD-007`.
- `best-practices/deployment.md` replaced by `best-practices/GDE-006-local-environment.md`,
  which is what it actually contained.
- `best-practices/GDE-009-technology-defaults.md` reduced to the technology defaults that remain
  undecided; its rules are now `STD-004` and `STD-011`.
- Every remaining guide carries `kind: guide` frontmatter per `STD-006`.
- `STD-001` revised to R2: `§3.2` deprecated and replaced by `§3.17`, because
  listing Guide as a category of standard contradicted section 4.

## Recommended order

1. **Extract the 29 anti-patterns into clauses.** Highest value, lowest
   judgement required — the decisions were already made, painfully, and only the
   form is wrong.
2. **Secrets**, because four separate files already lean on rules it does not
   state.
3. **Dissolve `deployment.md`** and delete or write `organization.md`. Both are
   currently misdirection.
4. **Extract `best-practices/GDE-001-a2a-agent.md` §4**, which is normative content nobody can find.
5. Leave the walkthroughs as Guides.
