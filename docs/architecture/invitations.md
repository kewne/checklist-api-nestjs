# Checklist Sharing: Invitation Flow

## Overview

Sharing a checklist with another user is a two-step process. This design avoids granting access to a user without their consent and decouples the invitation from the identity resolution of the recipient.

## Flow

### Step 1: Owner Creates an Invitation

The checklist owner sends a `POST /checklists/:id/shares` request with the recipient's **email address**. This creates an **invitation document** — it does not immediately grant access.

```
POST /checklists/abc123/shares
{ "email": "friend@example.com" }

→ 201 Created
   Location: /checklists/abc123/invitations/inv456
```

The invitation records:

- `checklistId` — the checklist being shared
- `email` — the email address of the intended recipient
- `createdAt` — timestamp of the invitation
- `status` — `"pending"` initially

### Step 2: Recipient Accepts the Invitation

The recipient calls a separate endpoint to accept the invitation. The system resolves their authenticated user ID from their session and converts the invitation into a **share document**. On successful acceptance, the invitation document is deleted.

```
POST /invitations/:invitationId/accept

→ 204 No Content
```

On acceptance:

- A **share document** is created linking the checklist to the recipient's user ID
- The invitation document is **deleted** from the database
- The email must match the recipient's authenticated email
- The invitation must be less than 24 hours old

## Constraints

- An invitation is **valid for 24 hours** after creation; attempting to accept an expired invitation returns HTTP 410 Gone
- On successful acceptance, the invitation document is **automatically deleted** (not marked as accepted)
- An email address may only have one pending invitation per checklist at a time (409 if duplicate)
- A user ID may only have one active share per checklist at a time (409 if duplicate)
- The checklist owner cannot be the recipient of an invitation to their own checklist (409)
- Only the checklist owner can create or revoke invitations and shares

## Related Stories

- [Share Checklist](../stories/share-checklist.md)
- [List Checklist Shares](../stories/list-checklist-shares.md)
- [Remove Checklist Share](../stories/remove-checklist-share.md)
- [List Shared Checklists](../stories/list-shared-checklists.md)
