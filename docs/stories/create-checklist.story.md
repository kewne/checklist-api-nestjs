# Create Checklist

**Status**: INCOMPLETE

As a user, I want to create a checklist template so that I can reuse it to produce checklist instances later.

## Acceptance Criteria

- The user must have an active subscription
- A checklist can be created by providing a title and an optional list of items
- Each item has a required title and an optional description
- An optional `public` boolean flag can be provided (defaults to `false`); when set to `true`, the checklist is accessible to all users
- A successful creation returns HTTP 201

## Related Stories

- [Create Subscription](create-subscription.story.md)
- [List My Checklists](list-my-checklists.story.md)
- [View Checklist](view-checklist.story.md)
- [Share Checklist](share-checklist.story.md)
