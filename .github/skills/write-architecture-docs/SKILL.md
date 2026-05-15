---
name: write-architecture-docs
description: 'Write architecture documentation for a feature or design decision. Use when: documenting design rationale, capturing architectural decisions, explaining patterns or constraints, describing cross-cutting concerns.'
---

# Writing Architecture Docs

Architecture docs live in `docs/architecture/` and serve two purposes:

1. **Decision docs** — explain **why** a design was chosen and **what problem** it solves.
2. **Pattern references** — catalogue recurring patterns (e.g. link relations, error shapes) so they can be applied consistently across the codebase.

They are NOT API references or implementation guides.

## When to Use

- Documenting a non-obvious design decision or trade-off
- Defining a pattern that recurs across the codebase and needs a canonical reference (e.g. what each link relation means)
- Capturing constraints and their rationale
- Describing cross-cutting concerns (auth, idempotency, error handling strategies)

## What to Include

### 1. Overview

One or two sentences summarising the problem being solved and the chosen approach.

### 2. Rationale

Explain **why** this approach was taken. What alternatives were considered? What constraints drove the decision?

Focus on:

- The problem that needed solving
- Trade-offs made
- Constraints that ruled out alternatives

### 3. Behaviour and Invariants

Describe the observable behaviour and rules that always hold. Use plain prose or bullet points.

Focus on:

- What the system guarantees
- Edge cases and how they are handled
- State transitions or lifecycle rules

### 4. Related Docs (optional)

Link to other architecture docs that share context or are prerequisites.

## What NOT to Include

**Do not include implementation details that are obvious from reading the code.** These go stale, duplicate the source of truth, and obscure the architectural intent.

Specifically, omit:

- URL templates or path parameters (e.g. `POST /checklists/:id/shares`)
- HTTP status codes or method names
- Field names, DTO shapes, or database schema details
- Code snippets that just restate what the implementation already shows
- Requirements or acceptance criteria from user stories, unless restating them is necessary to explain a design decision or invariant

**Exception — illustrative examples**: JSON payloads and URLs are allowed when they demonstrate a pattern, rule, or non-obvious behaviour that is hard to convey in prose alone. Keep them minimal and abstract; do not copy-paste real request/response payloads. An example should clarify the architecture, not document the API.

## Key Principles

- **Rationale over specification**: A reader should come away understanding _why_, not _how_.
- **Timeless over timely**: Write for a reader who can already see the code; explain what the code cannot.
- **Concise**: A half-page doc that explains the core insight is better than two pages of HTTP examples.
