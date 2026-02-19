# Structure

Don't create barrel files unless I explicitly say so.

# Testing Strategy

Tests fall into the following categories:

## Unit tests

These test a single class method and are used for simple methods and classes that can be easily tested in isolation.

## Controller tests

These test a controller's HTTP interface.
They create Nest's testing module with that controller and mock the controller's dependencies.

The tests are grouped by endpoint and should verify:

- the status code
- the JSON of the response (if it exists)
- any special headers in the response (e.g. `Location`)

Requests are made using the supertest library.

# Development workflow

Run tests after making code changes: `pnpm test`

Run the linter after making code changes: `pnpm lint`
