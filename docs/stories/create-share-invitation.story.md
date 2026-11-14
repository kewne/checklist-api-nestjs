# Create Share Invitation

**Status**: DONE

As a user, I want to share my checklist with other users so that they can view and use my checklist template.

## Acceptance Criteria

- Only the checklist owner can share the checklist
- Sharing creates an **invitation** with an unguessable link or token that can be used to identify the invitation
- Attempting to share a non-existent checklist results in a not found error
- Attempting to share a checklist you don't own results in a forbidden error

## Related Stories

- [List Checklist Shares](list-checklist-shares.story.md)
- [Remove Checklist Share](remove-checklist-share.story.md)
- [List Shared Checklists](list-shared-checklists.story.md)
- [Create Checklist](create-checklist.story.md)
- [Checklist Sharing: Invitation Flow](../architecture/invitations.architecture.md)
- [Checklist Share Invitation](../glossary/checklist-share-invitation.glossary.md)
