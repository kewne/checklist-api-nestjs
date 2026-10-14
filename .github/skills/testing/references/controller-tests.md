# Write Controller Tests

Controller tests exercise the HTTP interface while mocking the controller's dependencies.

1. Read a neighboring controller spec, such as `src/checklist/checklist.controller.spec.ts`, to preserve the project's auth, authorization, validation, and response-enrichment setup.
2. Create a Nest testing module containing the controller and mocked dependencies. Initialize the application before requests and close it after each test using the existing lifecycle pattern.
3. Group tests by endpoint, including HTTP method and route.
4. Make requests using `supertest` against `app.getHttpServer()`. Do not replace HTTP requests with direct controller method calls.
5. Verify the response status, JSON body when present, and special headers such as `Location` when required. Include expected resource links when they are part of the contract.
6. Cover relevant successful, invalid-input, missing-resource, and unauthorized cases. Set up authenticated users and permissions using the existing test helpers. Assert that denied requests do not invoke protected mutations where applicable.
7. Keep persistence mocked here. Test Firestore queries, serialization, and stored state in repository tests instead.
8. Run the focused spec and required project gates through the main skill's Run Tests procedure.
