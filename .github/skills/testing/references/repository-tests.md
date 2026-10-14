# Write Repository Tests

Repository tests always write to and read from the Firestore emulator. Never mock Firestore, its collections, document references, queries, snapshots, or persistence operations in repository tests. These tests must verify the actual persistence behavior.

1. Read a neighboring repository spec, such as `src/subscription/subscription.repository.spec.ts`, and the repository method being tested.
2. Use Nest's testing module with `FirestoreModule` and the real repository. Obtain the injected Firestore connection for fixture setup and persistence assertions.
3. Use the test environment configured by `src/setup-env.ts`: `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` and `FIRESTORE_PROJECT_ID=demo-test`. Confirm the emulator is running using the main skill's Run Tests procedure before executing the spec. Never fall back to a production database.
4. Generate unique identifiers for every test, following the existing `randomUUID()` pattern. Isolate fixtures so concurrent tests cannot overwrite or observe each other's data.
5. Seed real documents through Firestore or the repository as appropriate. For read/query tests, write fixtures to the emulator and assert the repository's returned values. For create/update/delete tests, perform the repository operation and read the persisted documents back from the emulator to verify fields, updates, or absence. Even missing-resource cases should use isolated emulator fixtures.
6. Cover relevant query filtering, missing documents, serialization, and timestamp conversion. Assert actual stored or returned data rather than merely spying on Firestore calls.
7. Track all documents created by fixtures and repository operations, including subcollection documents. Delete only that test's documents in `afterEach`, using the existing batch cleanup pattern. Do not wipe shared emulator collections or the entire emulator database.
8. Close resources using the neighboring spec's lifecycle pattern, including `firestore.terminate()` and `module.close()` in `afterAll` when applicable.
9. Run the focused spec and required project gates through the main skill's Run Tests procedure. Treat connection failures as environment failures, not reasons to replace emulator access with mocks.
