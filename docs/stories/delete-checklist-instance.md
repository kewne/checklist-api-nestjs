# Delete Checklist Instance

As a user, I want to delete a checklist instance so that I can remove instances I no longer need.

## Acceptance Criteria

- Deleting a checklist instance by its ID returns HTTP 200
- The deleted instance is no longer accessible after deletion
- Deleting a non-existent instance returns HTTP 404
- Deleting an instance that belongs to another user returns HTTP 403

## Related Stories

- [View Checklist Instance](view-checklist-instance.md)
- [Update Checklist Instance](update-checklist-instance.md)
