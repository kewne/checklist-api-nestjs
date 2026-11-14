# Delete Share Invitation

**Status**: NEW

As a checklist owner, I want to delete share invitations so that they can't be accepted anymore.

## Acceptance Criteria

- The user must have an active subscription
- A checklist owner can delete a share invitation they have created
- Once deleted, an invitation can no longer be accepted by recipients
- A deleted invitation cannot be reactivated
- Only the checklist owner can delete invitations for their checklists
- A deleted invitation is removed from the list of active invitations for that checklist
- Deleting an invitation does not affect the checklist itself or any already-accepted shares

## Related Stories

- [Create Subscription](create-subscription.story.md)
- [Create Share Invitation](create-share-invitation.story.md)
- [List Checklist Share Invitations](list-checklist-share-invitations.story.md)
- [Accept Share Invitation](accept-share-invitation.story.md)
- [Get Share Invitation](get-share-invitation.story.md)
- [List Checklist Shares](list-checklist-shares.story.md)
- [Checklist Sharing: Invitation Flow](../architecture/invitations.architecture.md)
- [Checklist Share Invitation](../glossary/checklist-share-invitation.glossary.md)
