# DELETE Idempotency

When a DELETE request targets a resource that does not exist:

1. The operation is still considered successful
2. Return HTTP 204 No Content
3. No response body is included
4. Clients should treat this as a successful deletion

## Example

```
DELETE /checklists/123/shares/999

# If the share doesn't exist or is already deleted:
# HTTP 204 No Content
```

This response indicates to the client that the resource is no longer present, whether it was just deleted or never existed in the first place.
