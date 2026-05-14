# Add Item to Checklist Instance

As a user, I want to add a new item to an existing checklist instance so that I can include work that was not originally planned.

## Acceptance Criteria

- An item can be added to an existing instance by providing a title (up to 500 characters) and an optional description (up to 500 characters)
- The new item starts as incomplete
- A successful addition returns HTTP 200 with the updated instance in the response body
- Adding an item to a non-existent instance returns HTTP 404

## Related Stories

- [View Checklist Instance](view-checklist-instance.md)
- [Complete a Checklist Item](complete-item.md)
