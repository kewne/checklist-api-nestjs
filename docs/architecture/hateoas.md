# HATEOAS

## Overview

Every response embeds hypermedia links describing the actions available from that resource. Clients navigate the API by following links rather than constructing URLs.

## Rationale

Without hypermedia, clients must hard-code URL patterns and independently track which operations are valid for a given resource in a given state. This couples client logic to server URL structure and makes it difficult to evolve the API or conditionally surface actions based on authorisation or resource state.

HATEOAS moves this knowledge to the server: the server includes only the links a client is permitted to follow from a given resource in its current state. Clients become declarative — they react to what is present in the response rather than reasoning about what should be permitted.

The alternative — a static API reference that clients implement against — was ruled out because it embeds routing and authorisation logic in every client, and breaks silently when the server changes.

## Behaviour and Invariants

- Every resource response includes a `_links` object
- A `self` link is always present, pointing to the canonical URL of the resource
- Links that the authenticated user is not permitted to follow are omitted entirely — absence of a link signals that the action is unavailable
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
