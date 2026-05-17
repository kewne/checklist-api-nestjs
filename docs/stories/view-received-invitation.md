# View Received Invitation

**Status**: NEW

As a user, I want to view details of a share invitation I received so that I can decide whether to accept it.

## Acceptance Criteria

- A user can retrieve an invitation by its ID
- An invitation can be accessed by anyone
- The invitation details include only the checklist title and expiration timestamp
- An invitation is retrievable whether or not it has expired
- Attempting to retrieve an invitation that doesn't exist results in an error
- Include a link that allows the user to accept the invitation
- The acceptance link is only present when the invitation has not expired

## Related Stories

- [Get Share Invitation](get-share-invitation.md)
- [Create Share Invitation](create-share-invitation.md)
- [Accept Share Invitation](accept-share-invitation.md)
