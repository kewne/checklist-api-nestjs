# The `create` Relation

## Overview

The `create` relation indicates that following the link will create a new resource subordinate to the current one.

## Rationale

Standard IANA link relations cover navigation and resource relationships but do not define a semantics for "submit here to create a child resource". A custom `create` relation makes this intent explicit and consistent across the API, so clients can treat all creation affordances uniformly without inspecting URLs or relying on out-of-band documentation.

## Behaviour and Invariants

- A `create` link is only present when the authenticated user has permission to create the subordinate resource
- Following a `create` link produces a new resource; the response includes a `self` link pointing to the newly created resource
- The relation may appear on collection resources (to create a member) or on individual resources (to create a dependent resource)

## Example

A checklist resource exposes a `create` link for adding items:

```json
{
  "_links": {
    "self": { "href": "/checklists/abc" },
    "create": { "href": "/checklists/abc/items", "name": "item" }
  }
}
```

The response to following the link includes a `self` link for the newly created resource:

```json
{
  "id": "item-1",
  "_links": {
    "self": { "href": "/checklists/abc/items/item-1" }
  }
}
```

- [`create-from`](./create-from.md) - Creates a new resource based on an existing resource
