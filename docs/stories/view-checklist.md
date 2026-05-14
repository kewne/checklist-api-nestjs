# View Checklist

As a user, I want to view a specific checklist template so that I can inspect its title and items before using it.

## Acceptance Criteria

- Requesting a checklist by its ID returns HTTP 200 with the checklist in the response body
- The response includes the checklist's title and all of its items
- Each item includes its ID, title, and optional description
- The response includes a link to create a checklist instance from this checklist
- Requesting a non-existent checklist returns HTTP 404

## Related Stories

- [List My Checklists](list-my-checklists.md)
- [Update Checklist](update-checklist.md)
- [Delete Checklist](delete-checklist.md)
- [Create Checklist Instance from Template](create-instance-from-checklist.md)
