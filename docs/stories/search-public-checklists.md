# Search Public Checklists

**Status**: NEW

As a user, I want to search for public checklists so that I can discover useful templates created by other users.

## Acceptance Criteria

- The endpoint accepts a search query parameter (e.g., `q` or `search`)
- The search matches against checklist titles and item titles
- Only public checklists (marked with `public: true`) are included in results
- The endpoint returns HTTP 200 with an array of matching checklists
- Each checklist in the response includes:
  - The checklist ID
  - The title
  - The list of items (with titles and descriptions)
  - The user ID of the creator
  - The timestamp of when the checklist was created
- An empty search query or no matches returns HTTP 200 with an empty array
- The response is a subset of checklist data suitable for read-only access
- A user can create instances from any checklist in the search results
- No authentication is required to search public checklists

## Related Stories

- [Create Checklist](create-checklist.md)
- [Create Checklist Instance from Template](create-instance-from-checklist.md)
- [List Shared Checklists](list-shared-checklists.md)
