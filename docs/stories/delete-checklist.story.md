# Delete Checklist

As a user, I want to delete a checklist template so that I can remove templates I no longer need.

## Acceptance Criteria

- The user must have an active subscription
- Deleting a checklist by its ID returns HTTP 204
- The deleted checklist is no longer accessible after deletion
- Deleting a non-existent checklist returns HTTP 404

## Related Stories

- [Create Subscription](create-subscription.story.md)
- [View Checklist](view-checklist.story.md)
- [Update Checklist](update-checklist.story.md)
