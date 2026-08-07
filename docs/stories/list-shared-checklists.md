# List Shared Checklists

**Status**: NEW

As a user, I want to see the checklists that have been explicitly shared with me so that I can discover and use templates created by others.

## Acceptance Criteria

- A user can retrieve a list of all checklists that have been explicitly shared with them
- The list includes only checklists shared by other users (not their own)
- Each checklist in the list includes:
  - The checklist ID
  - The title
  - The list of items (with titles and descriptions)
  - The user ID of the original creator
  - The timestamp of when the checklist was created
- A user can create instances from any checklist in this list
- The list can be empty if no checklists have been shared with the user

## Related Stories

- [Share Checklist](share-checklist.md)
- [Create Checklist Instance from Template](create-instance-from-checklist.md)
- [Create Checklist](create-checklist.md)
