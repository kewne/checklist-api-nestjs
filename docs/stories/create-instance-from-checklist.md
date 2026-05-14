# Create Checklist Instance from Template

As a user, I want to create a checklist instance from an existing checklist template so that I can start tracking progress against a known set of items.

## Acceptance Criteria

- A checklist instance can be created by referencing a checklist template's ID via the `checklist_id` query parameter
- The instance is pre-populated with all items from the referenced template, each starting as incomplete
- An optional custom title can be provided in the request body; if omitted, the title defaults to `"<checklistTitle> - <ISO timestamp>"`
- The created instance records a reference to the source checklist
- A successful creation returns HTTP 201 with the new instance in the response body
- Referencing a non-existent checklist returns HTTP 404

## Related Stories

- [View Checklist](view-checklist.md)
- [View Checklist Instance](view-checklist-instance.md)
