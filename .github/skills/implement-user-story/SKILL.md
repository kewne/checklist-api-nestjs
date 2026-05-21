---
name: implement-user-story
description: 'Implement a user story from specification to working code. Use when: taking a user story from docs/stories and implementing the feature end-to-end. Searches architecture docs for relevant designs, adds service methods, controller endpoints, and tests.'
argument-hint: 'Reference the user story file path or name'
---

# Implementing User Stories

This skill provides a step-by-step workflow for taking a user story from specification to a complete implementation. It covers domain logic, authorization, HTTP endpoints, acceptance testing, and code quality checks.

## When to Use

- Implementing a new feature from a user story specification
- Adding missing acceptance criteria implementation
- Extending existing features with new capabilities
- Starting work on a story that spans multiple components (service, controller, repository)

## Procedure

### 1. Understand the User Story

Read the user story file to extract:

- **User type and intent**: Who is performing the action and why?
- **Acceptance criteria**: What must be true for the feature to be complete?
- **Related stories**: What other features does this depend on or enable?

Take note of any constraints around:

- Authorization and access control (who is permitted to perform the action?)
- Business logic rules (what validates the request? what prevents invalid states?)
- State transitions (how does the resource change as a result of this operation?)

**Example**: For "Remove Checklist Share", identify that:

- Only the checklist **owner** can remove shares
- A removed share must no longer be accessible to the recipient
- The checklist itself remains intact

### 2. Search Architecture Docs for Relevant Designs

Check `docs/architecture/` for any documented patterns or design decisions that apply to the feature:

- [authorization.md](../../../docs/architecture/authorization.md) — how authorization is checked
- [delete-idempotency.md](../../../docs/architecture/delete-idempotency.md) — delete operation semantics
- [hateoas.md](../../../docs/architecture/hateoas.md) — response format and link relations
- [invitations.md](../../../docs/architecture/invitations.md) — patterns for workflow operations
- [rels/](../../../docs/architecture/rels/) — link relation semantics and naming

If the architecture is undocumented and the design is non-obvious, consider [writing architecture docs](../write-architecture-docs/SKILL.md) before implementing.

### 3. Identify Test Coverage: Existing vs. Needed

Before writing tests, understand what test coverage already exists:

**Find existing tests**:

1. Search for test files related to the feature (e.g., `*.spec.ts` files in the affected modules)
2. Look at existing tests in related services and controllers to understand the testing patterns
3. Check if there are tests for related stories that may partially cover this story

**Document existing tests**:

- List any tests that already verify parts of this story's acceptance criteria
- Note which tests are currently passing and will continue to pass

**Identify tests to write**:

- For each acceptance criterion, determine if an existing test covers it
- If not, list the test that needs to be written
- Categorize by type:
  - **Controller tests**: HTTP interface, status codes, authorization
  - **Service tests**: Business logic, error conditions, state transitions
  - **Repository tests**: Data persistence (if needed)

**Example test coverage matrix**:

| Acceptance Criterion             | Test Type  | Existing? | Test Name                           |
| -------------------------------- | ---------- | --------- | ----------------------------------- |
| Owner can remove share           | Controller | No        | should remove share when authorized |
| Non-owner cannot remove share    | Controller | No        | should return 403 when not owner    |
| Share is deleted from data store | Service    | No        | should delete share from repository |
| Checklist remains intact         | Service    | No        | should not modify checklist itself  |

Once you've mapped acceptance criteria to tests, proceed to write only the tests that are missing.

### 4. Run Tests and Linter

Verify that all tests pass and code follows the style guide:

```bash
pnpm test
pnpm lint
```

**Common issues**:

- **Test failures**: Run the specific test file to see details: `pnpm test -- <file>`
- **Linter errors**: Fix automatically where possible: `pnpm lint -- --fix`
- **Type errors**: Ensure all types are imported and used correctly

### 5. Verify All Acceptance Criteria Are Met

Go through each acceptance criterion from the user story and verify:

- ✅ Can the correct user type perform the action?
- ✅ Are unauthorized users denied with 403 Forbidden?
- ✅ Is the resource modified/created/deleted as expected?
- ✅ Are related resources unaffected?
- ✅ Are error conditions handled correctly (404, 409, 400, etc.)?
- ✅ Do responses include the appropriate links?

If any criterion is not fully tested or implemented, return to the appropriate step.

## Key Principles

**1. Architecture First**: Search docs before writing code. Consistency across the codebase matters more than individual implementation choices.

**2. Authorization in Controllers**: Controllers check permissions; services assume authorization has already been verified. This keeps authorization logic centralized and visible.

**3. Service Logic is Domain Logic**: Services accept domain parameters (not HTTP), enforce business rules, and delegate to repositories. They know nothing about HTTP.

**4. Tests are Specifications**: Each test documents an acceptance criterion or edge case. Reading tests should answer: "What does this feature do?"

**5. Every Acceptance Criterion Needs a Test**: If you can't write a test for it, it's not sufficiently clear.

## Related Resources

- Architecture docs: [docs/architecture/](../../../docs/architecture/)
- Project guidelines: [AGENTS.md](../../../AGENTS.md)
- Development workflow: `pnpm test`, `pnpm lint`
