# Resource Link Enrichers

## Overview

A resource builder can be created with a _resource key_ identifying the kind of resource being built. When the resource is serialised, all _link enrichers_ registered for that key run automatically, adding the links that every resource of that kind should carry.

## Rationale

Endpoints that return the same kind of resource were each assembling the same links by hand at every call site. This duplicated link-building knowledge across controllers, made the link surface of a resource kind hard to see in one place, and allowed drift — one endpoint forgetting or diverging on links its siblings include.

Resource keys invert the responsibility: the endpoint declares _what_ the resource is, and the enrichers registered for that key decide _which links_ it carries. Adding a link to every resource of a kind becomes a single change.

Alternatives considered:

- **Enrichers as injectable services** — rejected. Enrichers are deliberately plain, pure functions: they take the builder and the wrapped entity and return nothing. Purity keeps enrichment performance consistent and predictable — an enricher cannot secretly perform I/O or call a service during serialisation, so response times don't depend on hidden dependencies. It also keeps enrichers trivially testable and guarantees link building stays synchronous and side-effect free.
- **Eager enrichment when the builder is created** — rejected. The wrapped entity is only known when the resource is finalised, so eager enrichment would force callers to supply the entity earlier than they naturally have it. Running enrichers lazily at finalisation time leaves call sites unchanged.
- **Registration distributed across feature modules, or discovered via decorators** — rejected in favour of a single central registry. The registry doubles as a catalogue: one place shows every resource key and the links it implies, mirroring the link relations reference.

## Behaviour and Invariants

- Building a resource without a key behaves exactly as before — no enrichment occurs.
- Enrichers run in registration order when the resource is finalised, each receiving the builder and the wrapped entity.
- Enrichers only add links; they do not alter the wrapped entity and must not perform I/O.
- Resource keys are type-checked: a link factory typed with a map of keys to entity types only accepts those keys, and an untyped factory accepts none — an unregistered key is a compile-time error, not a runtime failure. The same map determines the entity type an enricher receives and the payload the resource must be finalised with, so keys, enrichers, and payloads cannot drift apart.
- Call sites remain free to add endpoint-specific links on top of enriched ones; enrichment is additive, not exclusive.

## Related Docs

- [HATEOAS](hateoas.md)
