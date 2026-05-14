# List Checklist Shares

**Status**: NEW

As a user, I want to see who has access to my checklist so that I can manage sharing and understand who can view my template.

## Acceptance Criteria

- Only the checklist owner can list shares for a checklist
- The endpoint returns HTTP 200 with an array of shares
- Each share includes:
  - The user ID of the recipient
  - The timestamp of when the share was created
- Attempting to list shares for a non-existent checklist returns HTTP 404
- Attempting to list shares for a checklist you don't own returns HTTP 403
- An empty array is returned if the checklist has no shares

## Related Stories

- [Share Checklist](share-checklist.md)
- [Remove Checklist Share](remove-checklist-share.md)
- [View Checklist](view-checklist.md)
