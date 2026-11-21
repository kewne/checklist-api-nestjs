# Reopen a Checklist Item

As a user, I want to mark a completed checklist item as incomplete so that I can reopen it if it was completed by mistake or needs to be redone.

## Acceptance Criteria

- A completed item can be marked incomplete by referencing its instance ID and item ID
- Reopening an item clears its completion timestamp while preserving any note on the item
- A successful reopening returns HTTP 303 redirecting to the parent checklist instance
- Reopening an already-incomplete item is an error
- Reopening an item on a non-existent instance returns HTTP 404
- Reopening an item on an instance that belongs to another user returns HTTP 403

## Related Stories

- [View Checklist Instance](view-checklist-instance.md)
- [Complete a Checklist Item](complete-item.md)
- [Add or Remove a Note on a Checklist Item](item-notes.md)
