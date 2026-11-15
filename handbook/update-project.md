---
title: Update a project
summary: Audit against a fetched revision, preserve deliberate exceptions, and apply the smallest safe fixes.
status: Draft
---

## Copy this prompt

```text
Update this repository using TheFocus.AI engineering handbook at https://standards.thefocus.ai (Markdown guide: https://standards.thefocus.ai/handbook/update-project.md; full Markdown bundle: https://standards.thefocus.ai/handbook.md; source repository: https://github.com/The-Focus-AI/standards).

Read https://standards.thefocus.ai/handbook/update-project.md and https://standards.thefocus.ai/handbook.md, and fetch https://github.com/The-Focus-AI/standards main safely to record the revision and compare templates/default-project/ and skills-lock.json. Inspect this repo's instructions, tooling, skills, secrets, auth, CI, and deployment against the relevant handbook Markdown pages (https://standards.thefocus.ai/handbook/<topic>.md). Ensure 1Password secrets use TheFocus.AI's company account (thefocusai.1password.com) and a dedicated project vault (<Client> - <Project> or <Client>), never a personal 1Password account (my.1password.com) or a Private/Personal/default vault. Treat Draft pages as recommendations unless this project adopted them. Preserve product behavior and documented exceptions.

Report concrete gaps, then implement the smallest safe fixes authorized by this request. Work in a reproducible cloud workspace. Run lint, tests, and relevant preview checks; report evidence and remaining decisions. Ask before changing credentials, production infrastructure, public contracts, or release policy. Do not ratify policy, merge, or deploy. Push or open PRs only when authorized.
```

## Audit before changing

1. Read the target's agent instructions, manifests, locks, tasks, and deployment
   configuration. Preserve existing work while fetching the handbook separately.
2. Read the published Markdown (`https://standards.thefocus.ai/handbook.md` or individual
   `.md` pages) alongside a fetched `main` revision from `The-Focus-AI/standards`, and
   record that commit SHA plus any explicitly included proposals. Do not treat an old
   local checkout or stale cache as the latest source.
3. Compare applicable topics: [development](development.md), [work](work.md),
   [secrets](secrets.md), [access](access.md), [sign-in](sign-in.md),
   [agent services](agent-services.md), [release](release.md), and [skills](skills.md).
4. Cite the file, command, or observation for each finding. Distinguish conforms,
   documented exception, adopted-policy gap, proposed improvement, and not applicable.
   An unknown is a verification gap, not success.

Do not replace a newer skill pin with an older default, discard project-specific
tasks, or require both same-name skill variants. Compare source, path, ref, and
content hash; the name alone does not identify the implementation.

## Fix and report

Group changes by independent risk. Keep credential provisioning, destructive
migrations, public-contract changes, and policy adoption behind their approval
boundaries. Use the maintained [baseline](../templates/default-project/) when
adding missing configuration, but adapt it to the actual application.

Record findings before editing; do not require a report-only PR unless the
project's workflow needs one. Follow [work and review](work.md) when delivering
issue-based work. Report commands/results, unknowns, and exact delivery state.
A local passing build is not a push, merge, deployment, or ratification.
