# Technical Implementation Guide Template

For documenting library, tool, or technique recommendations with implementation details.

**Time required:** 30-45 minutes
**Best for:** Library selection, tool evaluation, implementation guidance for developers

---

```markdown
---
title: "[Topic]: [Recommendation Name]"
date: YYYY-MM-DD
topic: [short topic slug]
recommendation: [library/tool name]
version_researched: [version number if applicable]
use_when:
  - [condition when this is the right choice]
  - [another condition]
avoid_when:
  - [condition when this is NOT the right choice]
  - [another condition]
project_context:
  language: [detected language]
  relevant_dependencies: [list of related deps already in project]
---

## Summary

[2-3 paragraphs explaining what you found and why this is the best choice. Include key metrics: GitHub stars, weekly downloads, last release date. Annotate claims with numbered references like this[1].]

## Philosophy & Mental Model

[Explain the core concepts and design philosophy behind this library/tool. What mental model should a developer have when working with this? What are the key abstractions?[2]]

## Setup

[Step-by-step installation and configuration. Be explicit about every step.]

```bash
# installation commands
```

[Any configuration files needed:]

```[language]
// configuration code
```

## Core Usage Patterns

[Show the essential patterns. Focus on clarity and demonstrating the key APIs. Each example should teach a specific concept.]

### Pattern 1: [Name]

[Brief explanation of when/why to use this pattern]

```[language]
// code example
```

### Pattern 2: [Name]

[Brief explanation of when/why to use this pattern]

```[language]
// code example
```

### Pattern 3: [Name]

[Continue with 3-5 core patterns that cover 80% of use cases]

```[language]
// code example
```

## Anti-Patterns & Pitfalls

[What should developers AVOID doing with this library? Be explicit about common mistakes.]

### Don't: [Anti-pattern name]

```[language]
// bad code example
```

**Why it's wrong:** [explanation]

### Instead: [Correct approach]

```[language]
// correct code example
```

[Include 3-5 common pitfalls]

## Why This Choice

[Explain the decision-making process. What criteria mattered most? Why did this option win?]

### Decision Criteria

| Criterion | Weight | How [Recommendation] Scored |
| ----------- | -------- | ---------------------------- |
| [Criterion 1, e.g., "Bundle size"] | High | [How it performed] |
| [Criterion 2, e.g., "TypeScript support"] | Medium | [How it performed] |
| [Criterion 3, e.g., "Community size"] | Medium | [How it performed] |
| [Criterion 4, e.g., "Learning curve"] | Low | [How it performed] |

### Key Factors

- **[Factor 1]:** [Why this was important and how the recommendation addressed it]
- **[Factor 2]:** [Continue with 2-4 decisive factors]

## Alternatives Considered

[Document other options evaluated and when they would be the better choice.]

### [Alternative 1]

- **What it is:** [Brief description]
- **Why not chosen:** [Specific reasons it wasn't selected for this use case]
- **Choose this instead when:**
  - [Condition where this alternative is better]
  - [Another condition]
- **Key tradeoff:** [Main thing you gain/lose vs the recommendation]

### [Alternative 2]

- **What it is:** [Brief description]
- **Why not chosen:** [Specific reasons]
- **Choose this instead when:**
  - [Condition]
- **Key tradeoff:** [Main tradeoff]

### [Alternative 3]

[Continue for 2-4 serious alternatives that were evaluated]

## Caveats & Limitations

[When is this recommendation NOT appropriate? Be specific about limitations.]

- **[Caveat 1]:** [Detailed explanation of the limitation and what to use instead]
- **[Caveat 2]:** [Continue with all significant caveats]
- **[Caveat 3]:** [Include edge cases where the recommendation breaks down]

## References

[1] [Source title](URL) - [brief description of what this source provided]
[2] [Source title](URL) - [brief description]
[Continue numbering all sources used]

```
