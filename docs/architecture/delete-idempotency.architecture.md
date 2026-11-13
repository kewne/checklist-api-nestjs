# DELETE Idempotency

## Overview

DELETE operations are idempotent: deleting a resource that does not exist returns the same successful response as deleting one that does.

## Rationale

Clients often cannot reliably determine whether a prior delete succeeded — network failures, retries, and race conditions mean the same DELETE may be sent more than once. Treating "resource not found" as an error would force clients to implement separate existence checks or handle spurious failures.

Making DELETE unconditionally successful removes this burden: the post-condition (the resource is gone) is always satisfied, regardless of prior state.

## Behaviour and Invariants

- A DELETE targeting a resource that does not exist returns a success response identical to a successful deletion
- No distinction is made between "just deleted" and "never existed"
- The response carries no information about whether the resource was present before the request
