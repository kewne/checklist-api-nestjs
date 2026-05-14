# HATEOAS - Hypermedia As The Engine Of Application State

## Overview

This API follows the HATEOAS (Hypermedia As The Engine Of Application State) principle, which is a core constraint of REST architecture. Every response in this API includes a `_links` object that contains hyperlinks to related resources and actions.

## Response Structure

All responses follow this pattern:

```json
{
  "id": "resource-id",
  "name": "resource-name",
  "... other properties ...": "...",
  "_links": {
    "self": { "href": "https://api.example.com/resource/id" },
    "relation-name": { "href": "https://api.example.com/other/path" },
    "another-relation": [
      { "href": "https://api.example.com/path1" },
      { "href": "https://api.example.com/path2" }
    ]
  }
}
```

## Common Link Relations

Link relations describe the relationship between the current resource and the linked resource. Common relations used in this API include:

| Relation        | Purpose                                                |
| --------------- | ------------------------------------------------------ |
| `self`          | Link to the current resource                           |
| `related`       | Link to a related resource                             |
| `update`        | Link to update or modify the resource                  |
| `delete`        | Link to delete the resource                            |
| `create`        | Link to create a new related resource                  |
| `create-from`   | Link to create a new resource based on the current one |
| `complete-item` | Link to complete an item within a resource             |
| `reopen-item`   | Link to reopen a completed item                        |

## Usage Examples

### Basic Response with Links

A checklist resource includes a link to create an instance from it:

**Request:**

```
GET /checklists/abc123
```

**Response:**

```json
{
  "id": "abc123",
  "name": "Morning Routine",
  "description": "Daily morning tasks",
  "_links": {
    "self": {
      "href": "https://api.example.com/checklists/abc123"
    },
    "create-from": {
      "href": "https://api.example.com/users/user123/instances?checklist_id=abc123",
      "name": "create-instance"
    }
  }
}
```

### Resource with Related Resource

A checklist instance includes a link to its related source checklist:

**Response:**

```json
{
  "id": "instance456",
  "checklistId": "abc123",
  "items": [...],
  "_links": {
    "self": {
      "href": "https://api.example.com/instances/instance456"
    },
    "related": {
      "href": "https://api.example.com/checklists/abc123",
      "title": "abc123"
    },
    "update": {
      "href": "https://api.example.com/instances/instance456/items",
      "name": "add-item"
    },
    "complete-item": [
      {
        "href": "https://api.example.com/instances/instance456/items/item1/complete"
      },
      {
        "href": "https://api.example.com/instances/instance456/items/item2/complete"
      }
    ]
  }
}
```

## Best Practices

1. **Always include a `self` link**: Every resource should have a `self` link pointing to itself.

2. **Use semantic relation names**: Use standard relation names (`related`, `update`, `delete`) and descriptive names for custom relations (`create-from`, `complete-item`).

3. **Provide action links**: Include links that indicate what operations the client can perform next (`update`, `delete`, `create`).

4. **Use the `name` property**: For links with duplicate relations, use the `name` property to distinguish them:

   ```json
   "action": [
     { "href": "...", "name": "approve" },
     { "href": "...", "name": "reject" }
   ]
   ```

5. **Avoid hardcoding URLs in clients**: Use the links provided in responses to navigate the API.
