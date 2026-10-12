# Lesson pattern

Adapt this to the current repository guide. Replace every placeholder. Omit genuinely irrelevant gates while retaining
concept checks and end-of-lesson assessment.

```markdown
---
title: "Chapter NN: Title"
description: "What the learner can demonstrate afterward"
type: "lesson"
chapter: "NN-part-slug"
order: 1
---

# Chapter NN: Title

## Objective

Explain [mechanism] and demonstrate [observable result].

## Concept

Teach the mechanism and why it matters before showing commands.
Connect it to the artifact from the previous lesson.

## Concept check

Ask the learner to explain or predict something in their own words.
State what they should tell their tutor before continuing.

## Gate: Install

State supported OS, working directory, prerequisite state, and any access/cost.
Give small executable command blocks, explaining significant choices.
Link to current upstream instructions where appropriate.

## Gate: Verify it runs (smoke test)

Provide the smallest useful check and recognizable success evidence.
Ask the learner to show that evidence before proceeding.

## Gate: Prepare artifacts

Create or inspect inputs before transforming or consuming them.
Name exact files and show how to verify the prepared state.

## Gate: Do the work

Provide the exercise, acceptance conditions, and verification command.
Explain what failures mean and what evidence permits progression.
State any teardown or cleanup required for resources created here.

## Known failure modes

Describe likely symptoms, diagnoses, and specific recovery steps.

## Check your understanding

1. Explain the mechanism in your own words.
2. Predict the result of a meaningful change.
3. Diagnose a realistic failure or explain a tradeoff.

<details>
<summary>Answer key — attempt every question first</summary>

## Answer key

1. Give the expected reasoning, allowing equivalent correct explanations.
   **Pass criteria:** State the essential facts the learner must include.
2. Give the prediction and its justification.
   **Pass criteria:** State the required causal explanation.
3. Explain the diagnosis or tradeoff.
   **Pass criteria:** State the evidence and limitations required.

</details>

Use the repository's existing previous/next/overview navigation pattern.
```

## Before accepting a lesson

- Its commands work from the declared starting state, not only the author's machine.
- Its pass conditions require evidence of the learning objective.
- Its exercise adds useful capability or understanding to the course outcome.
- Its answer key grades understanding, not memorization of one sentence.
- Its title, overview entry, sidebar position, download paths, and links agree.
- Its expected output is captured from a real run or clearly illustrative.
- A tutor can identify exactly where to stop and what to ask the learner next.
