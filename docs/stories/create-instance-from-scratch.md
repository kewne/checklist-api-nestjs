# Create Checklist Instance from Scratch

As a user, I want to create a checklist instance without using a template so that I can track an ad-hoc checklist.

## Acceptance Criteria

- A checklist instance can be created by providing a title and a list of items directly
- Each item has a required title and an optional description
- All items start as incomplete
- A successful creation returns HTTP 201 with the new instance in the response body

## Related Stories

- [List My Checklist Instances](list-my-instances.md)
- [View Checklist Instance](view-checklist-instance.md)
