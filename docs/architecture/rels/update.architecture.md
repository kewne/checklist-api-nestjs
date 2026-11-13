# The `update` Relation

## Overview

The `update` relation indicates that following the link will modify the current resource. It covers non-trivial updates beyond full replacement: adding members, or applying a targeted transformation such as clearing completed items.

## Rationale

Standard IANA link relations do not define a semantics for modifying a resource through a purpose-specific affordance. A single `update` relation for all such affordances keeps the vocabulary small and lets clients treat every modification intent uniformly. When several update affordances coexist on the same resource, each link is distinguished by its `name` and human-readable `title`.

## Behaviour and Invariants

- An `update` link describes a modification possibility based on resource state, independently of the caller's permissions; authorization is enforced when the destination is requested
- A resource may expose several `update` links; each carries a `name` identifying the specific update affordance
- Following an `update` link changes the resource and redirects back to it, so clients can re-fetch the updated representation

## Example

A checklist instance exposes two update affordances: adding an item and clearing completed items:

```json
{
  "_links": {
    "self": { "href": "/checklist-instances/abc" },
    "update": [
      { "href": "/checklist-instances/abc/add-item", "name": "add-item" },
      {
        "href": "/checklist-instances/abc/clear-completed-items",
        "name": "clear-completed-items"
      }
    ]
  }
}
```

The `clear-completed-items` link is only present when the instance has at least one completed item; following it removes every completed item while preserving incomplete items unchanged, and the operation succeeds as a no-op when there is nothing to clear.
