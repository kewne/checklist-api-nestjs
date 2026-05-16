# The `accept` Relation

## Overview

The `accept` relation indicates that issuing a POST request to the link will accept the current resource on behalf of the authenticated user.

## Rationale

Standard IANA link relations do not define a semantics for accepting an invitation or offer. A custom `accept` relation makes this intent explicit and consistent, so clients can locate the acceptance affordance without inspecting URLs or relying on out-of-band documentation.

## Behaviour and Invariants

- An `accept` link is only present when the resource can still be accepted (i.e. it has not expired)
- Following an `accept` link is a non-idempotent action that records the acceptance

## Example

A share invitation resource exposes an `accept` link when the invitation has not yet expired:

```json
{
  "title": "My Checklist",
  "expiresAt": "2026-05-17T12:00:00.000Z",
  "_links": {
    "self": { "href": "/checklists/abc/invitations/xyz" },
    "accept": { "href": "/checklists/abc/invitations/xyz/accept" }
  }
}
```
