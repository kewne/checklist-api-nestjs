# Create Subscription

**Status**: NEW

As a user, I want to create a subscription so that I have access to all operations.

## Acceptance Criteria

- A user can create a subscription only for themselves.
- Subscription creation is recorded when the subscription provider sends a subscription creation event with the target user and an end date in the future.
- A created subscription is active until the end date provided by the subscription provider event.
- Attempting to create a subscription when the user already has an active subscription results in a conflict error.
- Attempting to create a subscription with a missing, invalid, or non-future end date results in an error.
- An active subscription grants the user access to write and mutating operations across the system, while read operations remain available without an active subscription.

## Related Stories

- [View My Subscription](view-my-subscription.story.md)
- [Subscription State](../architecture/subscriptions.architecture.md)
- [Authorization with CASL Abilities](../architecture/authorization.architecture.md)
- [Create Checklist](create-checklist.story.md)
- [Update Checklist](update-checklist.story.md)
- [Delete Checklist](delete-checklist.story.md)
- [Create Share Invitation](create-share-invitation.story.md)
- [Delete Share Invitation](delete-share-invitation.story.md)
- [Accept Share Invitation](accept-share-invitation.story.md)
- [Dismiss Checklist Share Invitation](dismiss-share-invitation.story.md)
- [Update Checklist Share](update-checklist-share.story.md)
- [Remove Checklist Share](remove-checklist-share.story.md)
- [Create Checklist Instance from Template](create-instance-from-checklist.story.md)
- [Create Checklist Instance from Scratch](create-instance-from-scratch.story.md)
- [Update Checklist Instance](update-checklist-instance.story.md)
- [Delete Checklist Instance](delete-checklist-instance.story.md)
- [Add Item to Checklist Instance](add-item-to-instance.story.md)
- [Complete a Checklist Item](complete-item.story.md)
- [Reopen a Checklist Item](reopen-item.story.md)
- [Clear Completed Items from a Checklist Instance](clear-completed-items.story.md)
