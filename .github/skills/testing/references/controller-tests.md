# Write Controller Tests

Controller tests exercise the HTTP interface while mocking the controller's dependencies.

For `My*Controller` redirect resolvers, limit coverage to authentication requirements (when applicable) and correct redirection status and `Location`, including relevant path and query parameters. Do not follow redirects or assert destination representations, service calls, mutations, or body validation. Keep canonical endpoint behavior in its own controller tests, and do not register destination controllers or service mocks solely to exercise redirects.

1. Read a neighboring controller spec, such as `src/checklist/checklist.controller.spec.ts`, to preserve the project's auth, authorization, validation, and response-enrichment setup.
2. Create a Nest testing module containing the controller and mocked dependencies. Initialize the application before requests and close it after each test using the existing lifecycle pattern.
3. Group tests by endpoint, including HTTP method and route.
4. Make requests using `supertest` against `app.getHttpServer()`. Set a fixed `Host` header, such as `.set('Host', 'api.example.test')`, to obtain stable absolute link `href`s and redirect destinations independent of Supertest's ephemeral port. Use the same host when comparing responses and assert complete URLs instead of stripping origins or matching only path suffixes. Keep `app.init()`; do not switch to `app.listen()` solely to stabilize links. Do not replace HTTP requests with direct controller method calls.
5. Verify the response status, JSON body when present, and special headers such as `Location` when required. Include expected resource links when they are part of the contract.
6. Cover relevant successful, invalid-input, missing-resource, and unauthorized cases. Verify anonymous requests are rejected when authentication is required, but do not test invalid tokens in controller tests; token validation belongs in authentication guard tests. Set up authenticated users and permissions using the existing test helpers. Assert that denied requests do not invoke protected mutations where applicable.
7. Keep persistence mocked here. Test Firestore queries, serialization, and stored state in repository tests instead.
8. Run the focused spec and required project gates through the main skill's Run Tests procedure.
