---
title: Start a project
summary: Adapt a working baseline to the product, without inventing an application or passing tests.
status: Draft
---

Start in a reproducible cloud workspace. Read the project brief and existing
instructions before choosing tools or copying files. The baseline is input to
an agent, not a completed project and not an excuse to overwrite existing work.

## Choose what the project needs

Record the product, client boundary, runtime, package manager, deployment target,
required secrets, and checks. Use TypeScript and pnpm for new application work,
Clerk for sign-in, and Postgres for relational data unless an existing stack or
product requirement gives a reason to choose otherwise. Neon is the usual
Postgres host for Vercel apps. These are Focus defaults, not A2A protocol requirements.

Do not add a frontend framework, database, or Node application manifest to a
project that does not need one. Record consequential exceptions in its agent guide.

## Give an agent the brief

From this repository, emit a self-contained handoff:

```sh
scripts/setup-default-project.sh ../my-project --brief /path/to/brief.md --emit-prompt
```

This prints the brief, `setup-project` instructions, maintained baseline, and
skill restore helper. It creates no target files, installs nothing, and invokes
no agent. Keep secret values out of the brief. Use the output in the agent
session already doing the work.

To copy the baseline first:

```sh
scripts/setup-default-project.sh ../my-project --no-install
```

Existing files stay unchanged unless an operator explicitly requests `--force`.
The source is [templates/default-project](../templates/default-project/).
Generate the project-specific configuration from that baseline rather than
maintaining another template in prose.

## Adapt, then verify

1. Configure the [development tasks](development.md) for the actual stack.
2. Record [secret boundaries](secrets.md) before supplying credentials.
3. Restore the reviewed [skills](skills.md), preserving deliberate source choices.
4. Configure real CI and a [release record](release.md). Leave maturity unassessed
   until the project owner approves it.
5. Run install, lint, tests, and the production build/start path where applicable.
   Inspect the app in the cloud workspace, not through a service on somebody's laptop.

The copied lint, test, and deploy tasks deliberately fail until adapted.
Report missing application tests as a gap. Do not add unconditional-success
commands or fake tests to make the baseline green. Tool installation is not
proof of application behavior, external branch protection, or deployment.

For an existing repository, use [Update a project](update-project.md) instead.
