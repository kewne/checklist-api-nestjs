# View Checklist Instance

As a user, I want to view a specific checklist instance so that I can see the current completion status of all its items.

## Acceptance Criteria

- Requesting an instance by its ID returns HTTP 200 with the instance in the response body
- The response includes the instance title and all of its items
- Each item includes its ID, title, optional description, and completion status (completed timestamp and optional note, or null if incomplete)
- The response includes a link to complete each incomplete item
- The response includes a link to reopen each completed item
- The response includes a link to add a new item to the instance
- Requesting a non-existent instance returns HTTP 404
- Requesting an instance that belongs to another user returns HTTP 403

## Related Stories

- [Create Checklist Instance from Template](create-instance-from-checklist.md)
- [Create Checklist Instance from Scratch](create-instance-from-scratch.md)
- [Update Checklist Instance](update-checklist-instance.md)
- [Delete Checklist Instance](delete-checklist-instance.md)
- [Complete a Checklist Item](complete-item.md)
- [Add Item to Checklist Instance](add-item-to-instance.md)
