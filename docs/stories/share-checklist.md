# Share Checklist

**Status**: NEW

As a user, I want to share my checklist with other users so that they can view and use my checklist template.

## Acceptance Criteria

- A checklist can be shared with another user by providing their email address
- Only the checklist owner can share the checklist
- Sharing creates an **invitation** (not an immediate share); access is only granted once the recipient accepts the invitation
- Attempting to share a non-existent checklist returns HTTP 404
- Sharing with an email address that already has a pending invitation or active share returns HTTP 409
- Sharing a checklist with the owner's own email returns HTTP 409
- A successful invitation creation returns HTTP 201 with a `Location` header pointing to the created invitation
- Attempting to share a checklist you don't own returns HTTP 403

## Related Stories

- [List Checklist Shares](list-checklist-shares.md)
- [Remove Checklist Share](remove-checklist-share.md)
- [List Shared Checklists](list-shared-checklists.md)
- [Create Checklist](create-checklist.md)
