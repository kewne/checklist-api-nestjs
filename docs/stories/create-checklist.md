# Create Checklist

**Status**: INCOMPLETE

As a user, I want to create a checklist template so that I can reuse it to produce checklist instances later.

## Acceptance Criteria

- A checklist can be created by providing a title and an optional list of items
- Each item has a required title and an optional description
- An optional `public` boolean flag can be provided (defaults to `false`); when set to `true`, the checklist is accessible to all users
- A successful creation returns HTTP 201

## Related Stories

- [List My Checklists](list-my-checklists.md)
- [View Checklist](view-checklist.md)
- [Share Checklist](share-checklist.md)
