# courses.thefocus.ai platform reference

Observed on October 12, 2026. Reinspect these files before depending on this description.

## Repository and architecture

- GitHub: `https://github.com/The-Focus-AI/courses.thefocus.ai`
- Discover the local checkout from the workspace or clone the verified remote.
- Custom Astro application, Tailwind styling, Vercel deployment, Neon-backed learner state.
- Courses are repository Markdown, not entries created through a web course editor. Learner registration/progress does
  not confer author permissions.
- `src/content/courses` links to the root `content/` directory.

## Read first

Follow current `AGENTS.md`, including any additional required reads. Useful files include:

- `README.md`, `CONTEXT.md`, `mise.toml`
- `docs/agents/issue-workflow.md`, `docs/agents/lesson-authoring.md`, `docs/design.md`
- `src/content.config.ts`
- Course routes and `CourseLayout.astro`, `Sidebar`, `LessonNav`, `CopyToLlmPrompt`
- `src/lib/llms-txt.ts` and the live `/llms.txt`
- `.github/workflows/` and current hosting configuration

The project uses mise and pnpm. Follow its declared setup and version pins. Do not print secret values when
investigating environment requirements.

## Course layout

```text
content/<course-slug>/
  index.md
  about.md
  01-part-slug/
    index.md
    01-lesson-slug.md
    02-lesson-slug.md
  02-part-slug/
    index.md
    03-lesson-slug.md
public/downloads/<course-slug>/     # when downloadable code is needed
public/downloads/<course-slug>.zip # optional matching archive
```

Part numbers and lesson numbers serve different purposes. Existing courses use globally ordered lesson numbers across
parts. Confirm current sidebar and navigation behavior rather than assuming alphabetical ordering is sufficient.

The inspected schema defines `title`, optional `description`, `course`, `chapter`, `order`, `duration`, `type`,
`status`, and `tags`. `type` accepts `course`, `chapter`, `lesson`, `project`, `about`, and `review`. Copy supported
fields from current siblings; do not invent required metadata.

Course index frontmatter:

```yaml
title: "Course title"
description: "Concrete outcome and audience"
type: "course"
tags: ["hands-on", "intermediate"]
```

Part index frontmatter:

```yaml
title: "Part 1: Part title"
description: "What this part teaches"
type: "chapter"
chapter: "01-part-slug"
```

Lesson frontmatter:

```yaml
title: "Chapter 01: Lesson title"
description: "Observable learning outcome"
type: "lesson"
chapter: "01-part-slug"
order: 1
```

Use root-relative internal page links with trailing slashes, for example `/course-slug/01-part-slug/01-lesson-slug/`.
Inspect sibling navigation patterns. HTML pages have Markdown exports; overview exports use `index.md`. Verify exact
URLs from the current implementation.

**Visibility:** the inspected schema accepted `status: draft`, but rendering did not filter drafts. Unpublished content
must stay out of a publicly deployed branch unless that behavior has changed.

## Design and pedagogy

The inspected design uses dark backgrounds, muted olive accents, sharp borders, Inter, and IBM Plex Mono. Extend course
content using shared components and conventions rather than adding custom styles.

The tutor contract expects concept-first explanations, constructed-response questions, `## Gate: …` headings, an
end-of-lesson assessment, and answer keys with pass criteria. Gates represent actual pauses for evidence.

Useful samples include `content/nix-agent-lab/` for a cumulative technical lab and `content/fine-tune-local-agent/` for
gated installation and training. Also inspect a different course suited to the new topic.

## Publishing

At inspection time, Vercel's Git integration deployed main to production and PRs to previews.
`.github/workflows/deploy.yml` ran checks despite its filename; `mise deploy` built the site and did not itself publish.
Reconfirm this before release.

Check GitHub permissions, branch protection, PR checks, and deployment status. Preview authentication can prevent public
inspection even when deployment succeeds. Do not weaken preview protection to work around that; use an authorized
preview session or local verification, then verify production after an authorized publish.
