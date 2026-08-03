# Accept Share Invitation

**Status**: DONE

As a user, I want to accept a checklist share invitation so that I can access a checklist that was shared with me.

## Acceptance Criteria

- A user can accept a pending invitation by calling an endpoint.
- The invitation must have been created within the last 24 hours
- A successful acceptance replaces the invitation with a share granting the user read-only access to the checklist
- The created share has the same title as the invitation it originated from
- Attempting to accept a non-existent invitation results in a not found error
- Attempting to accept an expired invitation (older than 24 hours) results in an error
- A user cannot accept an invitation for a checklist they already have access to
- After accepting an invitation, the invitation no longer exists

## Related Stories

- [Share Checklist](share-checklist.md)
- [List Shared Checklists](list-shared-checklists.md)
- [Create Checklist Instance from Template](create-instance-from-checklist.md)
