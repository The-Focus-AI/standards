---
name: build-focus-course
description: Design, author, test, and deliver hands-on courses for courses.thefocus.ai. Use when asked to create a new course, turn a tutorial into a course, or extend an existing course on this site. Covers repository discovery, existing course conventions, gated lessons, runnable labs, and verified publication when requested.
---

# Build a Focus Course

Build a course that fits the existing platform and teaches through observable results. A successful website build is
only one part of validation: the learner's commands and exercises must also work.

## 1. Confirm the repository before writing

- Locate the repository and verify its remote against `The-Focus-AI/courses.thefocus.ai`. Discover the checkout from the
  current workspace or project list; do not assume a particular local path.
- Inspect the branch, working-tree changes, and current remote state. Preserve unrelated edits. Use an isolated branch
  or checkout when appropriate.
- Read applicable `AGENTS.md` files and their required documentation. Inspect the current content schema, routes,
  package scripts, deployment configuration, and tutor contract.
- Study at least two existing course overviews and representative early, middle, and final lessons. Include the nearest
  subject or teaching format. Inspect both their source and a rendered course page.
- Report the confirmed repository, how courses are authored, and the conventions you will follow. Do not claim to have
  checked out or reviewed anything you have not inspected.

Read [the platform reference](references/thefocus-platform.md) ([view on
GitHub](https://github.com/The-Focus-AI/standards/blob/main/skills/build-focus-course/references/thefocus-platform.md))
for file locations and known behavior. Recheck that reference against the repository; it records observations, not a
permanent API.

## 2. Design backward from a demonstrable outcome

Extract topic, audience, prerequisites, learning goals, platform constraints, and intended publication scope from the
request and supplied material. Ask only for missing choices that materially change the course; otherwise state
reasonable assumptions and proceed.

Define:

- **Final artifact:** what the learner will have built, operated, or demonstrated.
- **Evidence:** how someone can determine that the artifact works and the learner understands it.
- **Progression:** parts and lessons that each add one meaningful capability to a cumulative project.
- **Entry requirements:** skills, operating systems, hardware, accounts, access, and likely time or cost.
- **Alternatives:** useful local or low-cost paths when an optional external service is unavailable, clearly
  distinguishing incomplete gates.

For each lesson, write a one-sentence outcome, incoming state, outgoing artifact, concept check, exercise, and pass
condition. Remove lessons that merely repeat documentation without contributing to an outcome. Choose the number of
lessons from the learning progression; do not copy another course's length mechanically.

Use Proof for a separate collaborative plan or draft if available and needed. Keep course source in the repository. If
Proof is unavailable, do not silently substitute another cloud document service; proceed with authorized repository work
and report any document-sharing limitation.

## 3. Research the actual technical workflow

- Read the full supplied tutorial or conversation when available. Preserve useful ideas while correcting stale or
  untested claims.
- Verify changing installation instructions, flags, APIs, supported platforms, pricing assumptions, and hosting
  requirements against current upstream documentation or source. Cite primary references beside the relevant lesson and
  collect them in the course references page.
- Attribute inspiration accurately. Do not imply endorsement or present another author's prose as original course
  material.
- Separate reproducibility, portability, determinism, and isolation where relevant. Describe what each tool actually
  guarantees.
- Record the date of technical review and relevant versions. Use real generated lockfiles where a pinned environment is
  promised. If learners must generate a lock, label the starter as a bootstrap and explain when it becomes pinned.
- Make cost, credentials, destructive commands, long jobs, and resource cleanup explicit at the gate where they matter.
  Use mock or dry-run modes during authoring when live calls are unnecessary.

## 4. Build one coherent, teachable lab

Create the smallest realistic example that supports the learning goals. Provide a working baseline, intentional exercise
gaps, meaningful checks, and reference solutions or grading criteria when appropriate.

- Keep paths, names, commands, configuration, and expected outputs consistent across lessons and downloadable files.
- Make each lesson's starting state clear. State the working directory and required earlier artifacts before commands
  depend on them.
- Separate learner starters from completed solutions. Never distribute a finished exercise while instructing learners to
  implement it unless this is intentional and explained.
- Provide a minimal smoke test after installing a tool, before relying on it for expensive or complex work.
- Make reruns predictable. Explain cleanup, resuming, and common failure recovery. Prefer temporary or disposable
  resources for experiments.
- For testing courses, include a deliberate defect that the verifier rejects, then restore the intended state. Passing
  an empty or irrelevant suite is not evidence.
- If downloads are offered, build archives from the maintained source, exclude credentials/caches/generated junk, and
  check that extracted files match the lesson instructions.

## 5. Author for the site's tutor workflow

Use [the lesson pattern](references/lesson-pattern.md) ([view on
GitHub](https://github.com/The-Focus-AI/standards/blob/main/skills/build-focus-course/references/lesson-pattern.md)) and
the repository's current authoring guide. Explain the concept before commands. Use the exact tutor-recognized heading
conventions.

Each hands-on lesson should have:

1. Objective and concept explanation.
2. A constructed-response concept check before substantial execution.
3. Small installation, smoke-test, preparation, and main-work gates as applicable.
4. Observable success evidence and a pause for learner confirmation at each gate.
5. Practical failure modes and recovery.
6. End-of-lesson questions and a collapsible answer key with explicit pass criteria.

Concept-only lessons may omit irrelevant installation gates. Avoid headings that promise verification without a real
check. Answer keys are pedagogical aids visible in page source, not access-controlled secrets.

Write an overview with the final artifact, audience, prerequisites, course map, honest effort estimate, downloads, and
first step. Part overviews should explain how their lessons connect. Add an about/references page. Use existing
frontmatter, directories, navigation, typography, and components; a new course should not require a site redesign.

## 6. Verify content, runtime, and rendered pages separately

Use repository-prescribed tools and checks. Do not replace the package manager, change dependency locks, or install
global packages merely to work around a local problem.

- **Content:** validate frontmatter, ordering, lesson counts, internal links, downloads, referenced files, answer
  criteria, and prerequisite continuity. Check for placeholders and conflicting instructions.
- **Runtime:** execute the baseline and key exercises in a fresh directory or suitable isolated environment. Test the
  claimed operating systems where practical. Check service startup, shutdown, reruns, and expected failure behavior when
  those are taught.
- **Site:** run required tests, type checks, and build. Inspect overview, a lesson, navigation/sidebar, answer-key
  interaction, code blocks, download links, and mobile layout in a browser.
- **Tutor export:** verify the rendered Markdown or other tutor input includes the right lesson and that its gates match
  the site's tutoring contract.

Keep evidence proportional to the change. Do not create tests that merely assert that new prose exists. When a
platform-specific runtime needs CI or a remote worker, use it within the user's authorized scope; otherwise explicitly
mark that check unexecuted. Never label an unexecuted lab as validated because the site builds.

## 7. Deliver and publish within the requested scope

Determine the real publication mechanism and repository permissions. Course authoring may be Git-based even when the
site has a learner login. A successful local build or account login does not establish publishing access.

- If the user requested creation only, deliver the reviewed course changes and preview; do not infer permission to merge
  or publish.
- If publication is requested and authorized, complete reviewable changes and required checks, use the repository's
  normal PR/release workflow, and wait for actual deployment. Attach created PRs to the chat when the app provides that
  tool.
- Do not treat a `draft` field as privacy unless the current rendering code enforces it.
- Verify the public course URL, catalog listing, representative lessons, tutor exports, and downloads after deployment.
  Distinguish a protected preview from a public live page.
- If access is missing, deliver the prepared content and exact remaining steps: repository/branch, checks run, blocked
  permission or service, publishing action, and URLs to verify. Do not invent a deployment result.

Finish with the course or preview link, what was built, what validation actually passed, publication status, and any
material limitation. Preserve unrelated local changes throughout.
