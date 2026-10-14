---
name: testing
description: 'Write and run tests for this NestJS project. Use when: adding unit tests, controller HTTP tests, Firestore repository tests, regression coverage, or running and diagnosing Jest tests with Firebase emulators.'
argument-hint: 'Method, endpoint, repository, acceptance criterion, or test file to test'
---

# Testing

Write focused tests using existing project conventions and run them against a ready local test environment.

## Write Tests

1. Read the applicable project instructions, the behavior being tested, and a neighboring spec. Use story acceptance criteria when available.
2. Identify existing coverage and add only missing cases in an adjacent `*.spec.ts` file. Each test should describe one observable behavior.
3. Choose the appropriate guide and read it before writing:
   - [Unit tests](./references/unit-tests.md): isolated class methods and business logic.
   - [Controller tests](./references/controller-tests.md): HTTP status, JSON, headers, and authorization.
   - [Repository tests](./references/repository-tests.md): persistence using real writes and reads against the Firestore emulator, never a mocked Firestore client.
4. Cover relevant success, failure, and boundary cases. Reuse nearby fixtures and helpers rather than introducing a new testing framework.
5. Run the changed tests using the procedure below. Repair failures in the touched behavior and rerun the same focused check.

## Run Tests

1. From the workspace root, inspect `firebase.json`, `src/setup-env.ts`, and `jest.config.ts` for the configured emulator ports and test environment. Currently Firestore uses `127.0.0.1:8080`, Auth uses port `9099`, and tests use project `demo-test`.
2. Ensure the Firebase emulators are running before executing tests, including focused runs. Check the emulator UI at `http://127.0.0.1:4000` and confirm both Firestore and Auth are ready at their configured ports. A reachable UI alone is not sufficient.
3. Reuse an already-running emulator suite. If it is not running, check that the Firebase CLI is available with `firebase --version`, then start a long-running process:

   ```bash
   firebase emulators:start --project demo-test
   ```

   Wait for the startup output to confirm readiness before testing. Use the terminal tool's persistent/background mode for this server. If the CLI is missing or startup fails, report the blocker; do not redirect tests to production or start a duplicate suite on occupied ports.

4. Run the smallest relevant check first, for example:

   ```bash
   pnpm exec jest --runTestsByPath src/subscription/subscription.repository.spec.ts
   ```

   Substitute the actual changed spec path. Use Jest's `--testNamePattern` when a single behavior needs investigation.

5. After code changes, run the required project gates:

   ```bash
   pnpm test
   pnpm lint
   ```

6. Distinguish emulator connection/setup failures from assertion failures. Fix environment readiness before diagnosing persistence behavior. Do not change unrelated code to make unrelated failures pass.
7. Report commands run, results, and any checks blocked or not run. Leave pre-existing emulator processes running; stop only processes you started when they are no longer needed.

## Completion Checks

- Each requested behavior has an appropriate assertion, not merely a mock-call check.
- Controller tests verify the HTTP contract; repository tests verify real emulator persistence.
- Test data is isolated and cleaned up, and test resources are closed.
- Focused tests, the full test suite, and lint pass after code changes, or failures are explicitly reported.
