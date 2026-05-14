# Remove Checklist Share

**Status**: NEW

As a user, I want to revoke access to a shared checklist so that I can control who can view my checklist template.

## Acceptance Criteria

- Only the checklist owner can remove shares
- A successful removal returns HTTP 204 with no response body
- Attempting to remove a share for a non-existent checklist returns HTTP 404
- Attempting to remove a non-existent share returns HTTP 204
- Attempting to remove a share from a checklist you don't own returns HTTP 403
- After removal, the user no longer has access to the checklist (except if the checklist is public)

## Related Stories

- [Share Checklist](share-checklist.md)
- [List Checklist Shares](list-checklist-shares.md)
- [View Shared Checklists](list-shared-checklists.md)
