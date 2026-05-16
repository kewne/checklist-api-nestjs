# List Checklist Share Invitations

**Status**: NEW

As a user, I want to see the share invitations I've sent for my checklists so that I can track who I've invited and manage my invitations.

## Acceptance Criteria

- Only the checklist owner can list invitations for a checklist
- A user can retrieve a list of all invitations sent for their checklist
- Each invitation in the list includes:
  - The invitation ID
  - The checklist title
  - The timestamp of when the invitation was created
  - The expiration timestamp
  - Whether the invitation has been accepted
- Attempting to list invitations for a non-existent checklist results in an error
- Attempting to list invitations for a checklist you don't own results in an error
- An empty list is returned if the checklist has no invitations
- Invitations are returned in reverse chronological order (newest first)

## Related Stories

- [Create Share Invitation](create-share-invitation.md)
- [Get Share Invitation](get-share-invitation.md)
- [Accept Share Invitation](accept-share-invitation.md)
- [List Checklist Shares](list-checklist-shares.md)
- [View Checklist](view-checklist.md)
