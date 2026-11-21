# Add or Remove a Note on a Checklist Item

**Status:** DONE

As a user, I want to add, update, or remove a note on an item in a checklist instance so that I can record item-specific observations or details regardless of whether the item is completed.

## Acceptance Criteria

- A note (non-empty string up to 500 characters) can be set or replaced on an item by referencing its instance ID and item ID
- Setting a note returns HTTP 204 with no response body
- A note on an item is preserved when the item is completed, reopened, or when the checklist instance is replaced with matching item IDs
- An existing note on an item can be removed by referencing its instance ID and item ID, returning HTTP 204 with no response body
- Removing a note from an item that does not have a note succeeds as a no-op with HTTP 204
- Setting or removing a note on a non-existent instance or item returns HTTP 404
- Only the instance owner can set or remove notes on its items; requests from other users return HTTP 403

## Related Stories

- [View Checklist Instance](view-checklist-instance.md)
- [Complete a Checklist Item](complete-item.md)
- [Reopen a Checklist Item](reopen-item.md)
