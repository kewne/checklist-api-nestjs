# Update Checklist Instance

As a user, I want to replace a checklist instance so that I can correct its title or items.

## Acceptance Criteria

- A checklist instance can be fully replaced by providing a new title and items
- A successful update returns HTTP 204 with no response body
- Updating a non-existent instance returns HTTP 404
- Updating an instance that belongs to another user returns HTTP 403

## Related Stories

- [View Checklist Instance](view-checklist-instance.md)
- [Delete Checklist Instance](delete-checklist-instance.md)
