# Checklist Sharing: Invitation Flow

## Overview

Sharing a checklist uses a token-based invitation: the owner creates an invitation and shares the resulting link through any channel; any authenticated user who follows that link can accept it. No email addresses are involved.

## Rationale

An email-based invitation would require the owner to know the recipient's exact registered email, would couple acceptance to identity resolution, and would silently break if the recipient is not yet registered. It also forces the system to act as a messaging layer.

A token-based approach avoids all of this: the invitation ID itself is the secret. The owner distributes the link however they choose (messaging, email client, etc.), and the system only needs to verify that the accepting user is authenticated. The `title` field exists purely as a human-readable label for the owner to track what the invitation is for.

## Behaviour and Invariants

- An invitation is created with a title (owner's label) and produces an opaque invitation ID
- Any authenticated user who presents a valid invitation ID can accept it — there is no recipient restriction
- An invitation expires 24 hours after creation; acceptance after expiry is rejected
- Successful acceptance atomically creates a share for the accepting user and deletes the invitation — there is no intermediate "accepted but pending" state
- A user may hold at most one active share per checklist at a time
- Only the checklist owner can create or revoke invitations and shares
