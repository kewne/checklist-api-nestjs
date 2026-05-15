# Create Share Invitation

**Status**: DONE

As a user, I want to share my checklist with other users so that they can view and use my checklist template.

## Acceptance Criteria

- A checklist can be shared by providing a title for the invitation
- Only the checklist owner can share the checklist
- Sharing creates an **invitation** with a unique link that other users can access
- An invitation contains a link to an endpoint where another user can accept the invitation
- Attempting to share a non-existent checklist returns HTTP 404
- Attempting to share a checklist you don't own returns HTTP 403
- A successful invitation creation returns HTTP 201 with a `Location` header pointing to the created invitation
- Another user can accept the invitation by accessing the invitation link and confirming acceptance

## Related Stories

- [List Checklist Shares](list-checklist-shares.md)
- [Remove Checklist Share](remove-checklist-share.md)
- [List Shared Checklists](list-shared-checklists.md)
- [Create Checklist](create-checklist.md)
