# Update Checklist

As a user, I want to replace a checklist template so that I can keep it up to date with the correct title and items.

## Acceptance Criteria

- A checklist can be fully replaced by providing a new title and items
- Should be able to distinguish between items that are new and ones that existed previously
- Items omitted from the payload are removed from the checklist
- A successful update returns HTTP 200 with the updated checklist
- Updating a non-existent checklist returns HTTP 404

## Related Stories

- [View Checklist](view-checklist.md)
- [Delete Checklist](delete-checklist.md)
