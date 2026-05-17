# Checklist Share Invitation

A **checklist share invitation** is a temporary, unguessable token that allows a user to gain access to a checklist shared by another user.

## Purpose

When a checklist owner wants to share their template with another user, they create an invitation. The owner can then send the invitation link to the recipient out-of-band (via email, chat, etc.). When the recipient accepts the invitation, it is replaced with a permanent share, granting them read-only access to the checklist.

## Contents

A checklist share invitation contains:

- **Invitation ID**: An unguessable identifier (token) that uniquely identifies the invitation
- **Invitation Title**: A title assigned by the checklist owner to easily identify the invitation (for the owner's reference only; not exposed to recipients)
- **Checklist Title**: The title of the checklist being shared. This is displayed to both the owner and recipients.
- **Created Timestamp**: When the invitation was created
- **Expiration Timestamp**: When the invitation expires (24 hours after creation)

## Lifecycle

1. **Created**: A checklist owner creates an invitation for their checklist
2. **Expired**:
   - If expired: The invitation becomes unusable and cannot be accepted

## Related Concepts

- **Share**: The permanent relationship created when an invitation is accepted
- **Checklist Owner**: The user who created the checklist and can create invitations for it
- **Read-only Access**: The permission level granted to a user who accepts an invitation
