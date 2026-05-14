# Share Checklist

**Status**: NEW

As a user, I want to share my checklist with other users so that they can view and use my checklist template.

## Acceptance Criteria

- A checklist can be shared with another user by providing their user ID
- Only the checklist owner can share the checklist
- A share grants the recipient read-only access to the checklist
- Attempting to share a non-existent checklist returns HTTP 404
- Sharing with a non-existent user returns HTTP 400
- Sharing a checklist with a user who already has access returns HTTP 409
- Sharing a checklist with oneself (the owner) returns HTTP 409
- A successful share creation returns HTTP 201 with a `Location` header pointing to the created share
- Attempting to share a checklist you don't own returns HTTP 403

## Related Stories

- [List Checklist Shares](list-checklist-shares.md)
- [Remove Checklist Share](remove-checklist-share.md)
- [View Shared Checklists](list-shared-checklists.md)
- [Create Checklist](create-checklist.md)
