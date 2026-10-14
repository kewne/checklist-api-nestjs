# HATEOAS

## Overview

Every resource response embeds hypermedia links describing navigation and actions associated with that resource. Successful representations do not vary with the authenticated user; user-dependent destinations are resolved through redirect endpoints with the `/my/` path prefix.

## Rationale

Without hypermedia, clients must hard-code URL patterns and independently track which operations are valid for a given resource in a given state. This couples client logic to server URL structure and makes it difficult to evolve the API or surface actions based on resource state.

HATEOAS moves navigation knowledge to the server. Clients follow the links supplied for a resource in its current state without constructing destinations themselves. A link describes a navigation possibility, not a grant of permission; authorization is enforced when the destination is requested.

Filtering links by the caller's permissions or embedding caller-specific destinations would make the same resource's successful representation depend on who requested it. Keeping representations stable separates resource state from caller identity and avoids coupling shared navigation to a particular user's permissions.

When a destination depends on the current user, a stable link to a `/my/` endpoint preserves discoverability without embedding that user's identity in the originating representation. The endpoint resolves the authenticated user's destination and redirects to its canonical endpoint. This adds a navigation round trip, but keeps identity resolution in one place and preserves canonical resource addresses.

The alternative, a static API reference that clients implement against, embeds routing knowledge in every client and can break silently when the server changes.

## Behaviour and Invariants

- Every resource response includes a `_links` object
- A `self` link is always present, pointing to the canonical URL of the resource
- For the same resource state, a successful response's content and links are independent of the authenticated user
- Links may reflect resource state, but are not added, removed, or rewritten according to the caller's identity or permissions
- Links to destinations determined by the authenticated user point to endpoints with the `/my/` path prefix; those endpoints redirect to the correct canonical endpoint for that user rather than returning a personalized resource representation
- User-dependent resolution happens when the `/my/` endpoint is requested, not when the originating representation is built
- Authorization still applies to both resolution and access to the destination; a link or redirect does not grant access, and failed authorization remains an error
- Link relations are stable identifiers; custom relations are documented under `docs/architecture/rels/`

## Link Relations Reference

Relations used across the API:

| Relation        | Meaning                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `self`          | The canonical URL of the current resource                                |
| `related`       | A resource that this resource was derived from or is linked to           |
| `create`        | Create a new subordinate resource (see [rels/create.md](rels/create.md)) |
| `create-from`   | Create a new resource using the current resource as a template           |
| `update`        | Modify the current resource or a part of it                              |
| `delete`        | Delete the current resource                                              |
| `complete-item` | Mark an item within the resource as complete                             |
| `reopen-item`   | Reopen a previously completed item                                       |
| `items`         | A member resource within a collection                                    |

## Related Docs

- [The `create` relation](rels/create.md)
- [Resource link enrichers](resource-link-enrichers.md)
- [Authorization](authorization.md)
