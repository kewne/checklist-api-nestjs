# The `create` Relation

## Overview

The `create` relation indicates a link where a client can submit a `POST` request to create a new resource. When following a link with the `create` relation, the server will create the resource and return a `201 Created` response.

## HTTP Method and Status Code

- **HTTP Method**: `POST`
- **Response Status**: `201 Created`
- **Response Body**: The created resource with its own `_links` (including a `self` link pointing to the newly created resource)

## Response Format

When a `POST` request is made to a `create` link, the response includes:

1. **Status Code**: `201 Created`
2. **Location Header**: Often includes a `Location` header pointing to the created resource's URL
3. **Response Body**: The newly created resource object with `_links`

Example response:

```
HTTP/1.1 201 Created
Location: https://api.example.com/resources/new-id-123
Content-Type: application/json

{
  "id": "new-id-123",
  "name": "New Resource",
  "... other properties ...": "...",
  "_links": {
    "self": {
      "href": "https://api.example.com/resources/new-id-123"
    },
    "... other relations ...": {}
  }
}
```

## Example Usage

### Finding a Create Link

A resource response includes a `create` link:

```json
{
  "id": "collection-1",
  "name": "My Collection",
  "_links": {
    "self": {
      "href": "https://api.example.com/collections/collection-1"
    },
    "create": {
      "href": "https://api.example.com/items",
      "name": "item"
    }
  }
}
```

### Creating a Resource

The client submits a `POST` request to the `create` link with the new resource data:

```bash
POST /items HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "name": "New Item",
  "description": "This is a new item"
}
```

### Server Response

The server responds with `201 Created` and the created resource:

```json
HTTP/1.1 201 Created
Location: https://api.example.com/items/item-456

{
  "id": "item-456",
  "name": "New Item",
  "description": "This is a new item",
  "_links": {
    "self": {
      "href": "https://api.example.com/items/item-456"
    },
    "update": {
      "href": "https://api.example.com/items/item-456"
    },
    "delete": {
      "href": "https://api.example.com/items/item-456"
    }
  }
}
```

## Client Implementation

A client should:

1. Extract the `create` link from a response
2. Prepare the request body with the new resource data
3. Send a `POST` request to the link's `href` with the appropriate `Content-Type` header
4. Handle the `201 Created` response and extract the created resource
5. Use the `self` link from the response to reference the newly created resource in future requests

## Related Relations

- [`create-from`](./create-from.md) - Creates a new resource based on an existing resource
