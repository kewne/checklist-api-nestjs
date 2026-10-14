# Subscription State

## Overview

A user's subscription entry in Firebase stores only an end date, not a status. The application derives the returned status, `ACTIVE` or `INACTIVE`, from the presence of that entry and whether its end date is after the current time.

## Rationale

Keeping subscription state in Firebase gives the application a shared, persisted source of truth associated with the user. Clients do not decide their own subscription state.

Deriving status from the end date avoids storing two values that could contradict each other. It also avoids depending on a scheduled update to expire subscriptions on time. The trade-off is that status must be evaluated against the current time whenever subscription state is read.

## Behaviour and Invariants

- Subscription status is derived, never stored; the returned status is either `ACTIVE` or `INACTIVE`.
- If no subscription entry exists for the user, the returned status is `INACTIVE`.
- If an entry exists and its end date is strictly after the current time, the returned status is `ACTIVE`.
- If the end date is at or before the current time, the returned status is `INACTIVE`.
- The end date represents the end of the known validity period, not a promise of renewal.
- Time comparisons use the application's trusted clock and compare absolute instants, independent of the user's time zone.
- A missing or invalid end date cannot establish an active subscription.
- Reading subscription state does not mutate it; the passage of time can change whether it is currently active without changing the stored record.
- An absent subscription and a failure to retrieve subscription information remain distinct outcomes. Retrieval failure must not be presented as absence or establish an active subscription.

## Related Docs

- [View My Subscription](../stories/view-my-subscription.md)
- [Authorization](authorization.md)
