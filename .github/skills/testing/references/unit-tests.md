# Write Unit Tests

Use unit tests for a single class method that can be exercised in isolation, including service business logic.

1. Read a neighboring spec, such as `src/subscription/subscription.service.spec.ts`, and follow its construction and mocking patterns.
2. Group tests by class and method with `describe`. Use behavior-focused test names and arrange, act, assert structure.
3. Create fresh subject instances and dependency mocks in `beforeEach`. Mock repository and service dependencies with `jest.fn()` rather than connecting to Firestore.
4. Assert returned values, state transitions, or thrown errors. Assert dependency arguments and calls when they are part of the behavior, including the absence of writes when validation fails.
5. Cover meaningful success, missing-resource, invalid-state, and boundary cases required by the method's contract. Keep HTTP status and response-shape assertions in controller tests.
6. Control time when testing expiration or timestamps using existing fake-timer patterns, and restore real timers afterward. Reset mocks and restore spies to prevent leakage between tests.
7. Run the focused spec and required project gates through the main skill's Run Tests procedure.

Unit tests mock persistence dependencies; repository tests do not. The shared run workflow still checks emulator readiness before running tests.
