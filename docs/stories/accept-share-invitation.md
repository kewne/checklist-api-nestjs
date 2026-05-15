# Accept Share Invitation

**Status**: DONE

As a user, I want to accept a checklist share invitation so that I can access a checklist that was shared with me.

## Acceptance Criteria

- A user can accept a pending invitation by calling an endpoint.
- The invitation must have been created within the last 24 hours
- A successful acceptance returns HTTP 204 with no response body
- Accepting an invitation creates a share granting the user read-only access to the checklist
- Attempting to accept a non-existent invitation returns HTTP 404
- Attempting to accept an expired invitation (older than 24 hours) returns HTTP 410
- Attempting to accept an already-deleted invitation returns HTTP 404

## Related Stories

- [Share Checklist](share-checklist.md)
- [List Shared Checklists](list-shared-checklists.md)
- [Create Checklist Instance from Template](create-instance-from-checklist.md)
