# Get Share Invitation

**Status**: NEW

As a user, I want to get a checklist share invitation so that I can give the link to another user to accept.

## Acceptance Criteria

- A user can retrieve an invitation by calling `GET /checklists/:checklistId/invitations/:invitationId`
- The endpoint returns HTTP 200 with the invitation details including the acceptance link
- The invitation details include the checklist title and the unique acceptance URL
- Only the invitation creator can retrieve the invitation details
- Attempting to get a non-existent invitation returns HTTP 404
- Attempting to get an invitation you didn't create returns HTTP 403
- The invitation must still be valid (not yet accepted or expired)
- Attempting to get an expired invitation (older than 24 hours) returns HTTP 410

## Related Stories

- [Create Share Invitation](create-share-invitation.md)
- [Accept Share Invitation](accept-share-invitation.md)
- [List Checklist Shares](list-checklist-shares.md)
