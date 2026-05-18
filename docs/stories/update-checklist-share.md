# Update Checklist Share

**Status**: NEW

As a user, I want to change the title of a checklist share so that I can give it a clearer, more meaningful name.

## Acceptance Criteria

- Only the checklist owner can update a share's title
- A share's title can be updated successfully with a new, non-empty value
- The recipient user ID and creation timestamp are not affected by the update
- A title is required and must not be empty
- Attempting to update a share for a non-existent checklist results in a not found error
- Attempting to update a non-existent share results in a not found error
- Attempting to update a share for a checklist you don't own results in a forbidden error
- Attempting to update a share with an empty or missing title results in a validation error

## Related Stories

- [Create Share Invitation](create-share-invitation.md)
- [Accept Share Invitation](accept-share-invitation.md)
- [List Checklist Shares](list-checklist-shares.md)
- [Remove Checklist Share](remove-checklist-share.md)
