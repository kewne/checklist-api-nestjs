---
name: write-user-stories
description: 'Write user stories for features. Use when: creating feature specifications, documenting requirements, designing new functionality. Enforces acceptance criteria, omits HTTP details, and links related stories.'
---

# Writing User Stories

## When to Use

- Creating feature specifications for new functionality
- Documenting product requirements in a structured format
- Designing feature interactions and acceptance conditions
- Planning work that spans multiple related features

## Procedure

### 1. Choose a Clear Feature Title

Use a concise, action-oriented title that describes what is being created or changed. Examples:

- Create Checklist
- Share Checklist Instance
- Accept Share Invitation

### 2. Write the User Story

Follow the standard format: **"As a [user type], I want to [action] so that [benefit]"**

This captures:

- **User type**: Who is this for? (user, admin, guest)
- **Action**: What do they want to do?
- **Benefit**: Why do they want it? (the value delivered)

Example:

> As a user, I want to create a checklist template so that I can reuse it to produce checklist instances later.

### 3. Add Acceptance Criteria

Write clear, testable criteria that define when the feature is complete. Focus on:

- **What users can do** (capabilities and behaviors)
- **Input constraints** (what data is required, optional, or validated)
- **Business logic** (rules about visibility, defaults, state transitions)

**Important**: Do NOT prescribe HTTP methods (GET, POST, PUT, DELETE) or specific URL paths. The acceptance criteria describe _behavior_, not implementation.

**Examples of good criteria:**

- "A checklist can be created by providing a title and an optional list of items"
- "Each item has a required title and an optional description"
- "An optional `public` boolean flag can be provided (defaults to `false`)"

**Examples to avoid:**

- "POST /checklists creates a checklist" (prescribes HTTP method)
- "The endpoint returns status code 201" (prescribes HTTP status code)
- "A PUT request to /checklists/{id} updates it" (prescribes method and URL)
- "The endpoint returns HTTP 200 with updated share details" (prescribes status code)
- "Attempting to update a non-existent share returns HTTP 404" (prescribes status code)

### 4. Add Links to Related Stories

At the end, list related stories that:

- Are prerequisites (must be done first)
- Are enabled by this feature (this is a dependency for them)
- Share common concerns or data models
- Are in the same workflow

Use markdown links to the story files:

```markdown
## Related Stories

- [List My Checklists](list-my-checklists.md)
- [View Checklist](view-checklist.md)
- [Share Checklist](share-checklist.md)
```

## Key Principles

**1. Add Acceptance Criteria**

- Every user story must define clear, testable acceptance criteria
- Criteria focus on user-visible behavior, not technical implementation
- Use simple, measurable language

**2. Don't Prescribe URLs, HTTP Methods, or Status Codes**

- Acceptance criteria describe _what_ the system does, not _how_
- Implementation details (REST verbs, paths, HTTP status codes) are architectural decisions, not requirements
- Focus on the outcome and user-visible behavior instead of "returns HTTP 200" or "returns HTTP 404"
- Let the architecture evolve without changing story definitions

**3. Add Links to Related Stories**

- Connect stories that form workflows or share concerns
- Help teams understand dependencies and impact
- Make navigation easier for future reference

## File Structure

Save each story in `docs/stories/` with a kebab-case filename matching the story title:

```
docs/stories/
├── create-checklist.md
├── view-checklist.md
├── list-my-checklists.md
└── share-checklist.md
```

## Glossary

For clarity on domain-specific terms, refer to the [glossary](../../docs/glossary) which documents key concepts used in user stories. When defining acceptance criteria, use terminology consistent with the glossary to ensure clear communication across the team.

## Story Status

Every story must include a **Status** field that tracks implementation progress:

- **DONE**: The feature is fully implemented and deployed
- **NEW**: The feature has never been implemented (story only; no code exists)
- **INCOMPLETE**: The feature is partially implemented, or the implementation does not fully match the acceptance criteria or description (work remains to align code with requirements)

Use these statuses to help teams understand which features are available, which are still in design phase, and which are work-in-progress or misaligned with their specifications.

## Template

```markdown
# [Feature Name]

**Status**: INCOMPLETE

As a [user type], I want to [action] so that [benefit].

## Acceptance Criteria

- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

## Related Stories

- [Other Story](other-story.md)
```
