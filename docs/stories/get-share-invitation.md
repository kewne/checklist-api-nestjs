# Get Share Invitation

**Status**: DONE

As a user, I want to get a checklist share invitation so that I can view its details and share the acceptance link with others.

## Acceptance Criteria

- A user can retrieve any invitation by its ID
- An invitation can be accessed by anyone
- The invitation details include the checklist title and the expiration timestamp
- An invitation is retrievable whether or not it has expired
- Attempting to retrieve an invitation that doesn't exist results in an error
- Include a link that allows the user to accept the invitation
- The acceptance link is only present when the invitation has not expired

## Related Stories

- [Create Share Invitation](create-share-invitation.md)
- [Accept Share Invitation](accept-share-invitation.md)
- [List Checklist Shares](list-checklist-shares.md)
