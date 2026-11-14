# Clear Completed Items from a Checklist Instance

**Status**: NEW

As a user, I want to remove all completed items from a checklist instance in one action so that I can tidy up the instance and focus on the remaining work.

## Acceptance Criteria

- The user must have an active subscription
- All completed items of a checklist instance can be removed in a single operation by referencing the instance ID
- Only completed items are removed; incomplete items are preserved unchanged (including their order, titles, and descriptions)
- The operation succeeds even when the instance has no completed items (it is a no-op)
- A successful clear redirects to the parent checklist instance
- Clearing completed items on a non-existent instance returns HTTP 404
- Clearing completed items on an instance the user does not have write access to returns HTTP 403

## Related Stories

- [Create Subscription](create-subscription.story.md)
- [Complete a Checklist Item](complete-item.story.md)
- [Reopen a Checklist Item](reopen-item.story.md)
- [View Checklist Instance](view-checklist-instance.story.md)
