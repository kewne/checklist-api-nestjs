# List My Checklist Instances

As a user, I want to list all of my checklist instances so that I can see which items I've completed.

## Acceptance Criteria

- Requesting the list returns only instances created by the authenticated user
- The response returns HTTP 200 with an array of checklist instances
- Each instance in the list includes its ID and title
