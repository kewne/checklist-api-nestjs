# Complete a Checklist Item

As a user, I want to mark a checklist item as complete so that I can record that I have finished that item.

## Acceptance Criteria

- An item can be marked complete by referencing its instance ID and item ID
- An optional note (up to 500 characters) can be supplied when completing the item
- Completing an item records the completion timestamp and the provided note
- A successful completion returns HTTP 303 redirecting to the parent checklist instance
- Completing an already-completed item is an error
- Completing an item on a non-existent instance returns HTTP 404
- Completing an item on an instance that belongs to another user returns HTTP 403

## Related Stories

- [View Checklist Instance](view-checklist-instance.md)
- [Reopen a Checklist Item](reopen-item.md)
