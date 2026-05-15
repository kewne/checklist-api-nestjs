# Authorization with CASL Abilities

## Overview

Authorization is implemented using CASL abilities. Each authenticated request receives an ability object representing what that user is permitted to do. Controllers check permissions using this ability and reject unauthorized requests before invoking service logic.

## Rationale

CASL abilities centralize authorization rules in a single place (`AbilityFactory`), avoiding scattered permission checks across multiple services and preventing inconsistent enforcement. Placing checks in controllers rather than services ensures:

1. **Visibility**: A reader can see at a glance which operations require which permissions by reading the controller
2. **Consistency**: Authorization rules are the single responsibility of the controller; services trust that only authorized requests reach them
3. **Decoupling**: Services need not know about authorization, access control, or resource ownership — they can focus purely on domain logic

Rejecting unauthorized requests early in the controller prevents services from executing operations they should not have attempted in the first place.

## Behaviour and Invariants

- Every authenticated HTTP request receives an ability object derived from the authenticated user
- Controllers must check the ability before passing control to a service
- If an ability check fails, the controller returns an error response; the service is never invoked
- A service method should assume that any request reaching it has already been authorized
- Ability objects are immutable and scoped to a single request; they cannot be shared or reused across requests

## Related Docs

- [HATEOAS](hateoas.md) — CASL abilities inform which links are included in responses
