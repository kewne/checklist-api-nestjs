# Write Controller Tests

Controller tests exercise the HTTP interface while mocking the controller's dependencies.

For `My*Controller` redirect resolvers, limit coverage to authentication requirements (when applicable) and correct redirection status and `Location`, including relevant path and query parameters. Do not follow redirects or assert destination representations, service calls, mutations, or body validation. Keep canonical endpoint behavior in its own controller tests, and do not register destination controllers or service mocks solely to exercise redirects.

1. Read a neighboring controller spec, such as `src/checklist/checklist.controller.spec.ts`, to preserve the project's auth, authorization, validation, and response-enrichment setup.
2. Create a Nest testing module containing the controller and mocked dependencies. Initialize the application before requests and close it after each test using the existing lifecycle pattern.
3. Group tests by endpoint, including HTTP method and route.
4. Make requests using the `testRequest` wrapper from `test/http-request.ts`. Import it as `createTestRequest`, initialize a `testRequest` variable with `createTestRequest(app.getHttpServer())` after `await app.init()` in the existing setup, and reuse that variable in tests. Create a fresh agent for each test, not once for the suite. The wrapper defaults `Host` to `api.example.test`, keeping absolute link `href`s and redirect destinations independent of Supertest's ephemeral port. Assert complete URLs with that host instead of stripping origins or matching only path suffixes. Override `.set('Host', ...)` only when intentionally testing a different host. Keep `app.init()`; do not switch to `app.listen()` solely to stabilize links. Do not replace HTTP requests with direct controller method calls.
5. Verify the response status, JSON body when present, and special headers such as `Location` when required. Include expected resource links when they are part of the contract.
6. Cover relevant successful, invalid-input, missing-resource, and unauthorized cases. Verify anonymous requests are rejected when authentication is required, but do not test invalid tokens in controller tests; token validation belongs in authentication guard tests. Set up authenticated users and permissions using the existing test helpers. Assert that denied requests do not invoke protected mutations where applicable.
7. Keep persistence mocked here. Test Firestore queries, serialization, and stored state in repository tests instead.
8. Run the focused spec and required project gates through the main skill's Run Tests procedure.

## Request Setup

For a spec under `src/checklist`, import the wrapper directly and declare the request variable:

```typescript
import { testRequest as createTestRequest } from '../../test/http-request';

let testRequest: ReturnType<typeof createTestRequest>;
```

At the end of the existing `beforeEach` or per-test app-building helper, initialize the agent after the app:

```typescript
await app.init();
testRequest = createTestRequest(app.getHttpServer());
```

Use the variable for HTTP requests in tests:

```typescript
const response = await testRequest.get('/checklists/123').expect(200);
```

Adjust the relative import for the spec's directory. Native Supertest chaining, including `.auth()`, `.query()`, `.send()`, and `.set()`, remains available.
