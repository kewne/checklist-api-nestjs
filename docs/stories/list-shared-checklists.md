# List Shared Checklists

**Status**: NEW

As a user, I want to see the checklists that have been explicitly shared with me so that I can discover and use templates created by others.

## Acceptance Criteria

- The endpoint returns HTTP 200 with an array of shared checklists
- The array includes only checklists that have been explicitly shared with the user
- Each checklist in the response includes:
  - The checklist ID
  - The title
  - The list of items (with titles and descriptions)
  - The user ID of the original creator
  - The timestamp of when the checklist was created
- The response is a subset of checklist data suitable for read-only access
- A user can create instances from any checklist in this list

## Related Stories

- [Share Checklist](share-checklist.md)
- [Create Checklist Instance from Template](create-instance-from-checklist.md)
- [Create Checklist](create-checklist.md)
