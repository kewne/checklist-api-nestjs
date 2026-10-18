# Checklist API

A [NestJS](https://nestjs.com/) REST API for managing checklists, checklist instances, sharing invitations, and subscriptions, backed by Google Cloud Firestore and Firebase Authentication.

## Prerequisites

- **Node.js** (v24 recommended, matching `app.yaml`)
- **pnpm** (`v10+`)
- **Firebase CLI** (`firebase-tools`) and **Java** (for local Firebase emulators)
- **Google Cloud SDK** (`gcloud`) for deploying to Google App Engine

## Project Setup

```bash
pnpm install
```

## Running the Application

Start the local Firebase emulators (Auth on port `9099`, Firestore on port `8080`, Emulator UI on port `4000`):

```bash
firebase emulators:start --project demo-test
```

Run the NestJS server:

```bash
# development
pnpm run start

# watch mode
pnpm run start:dev

# build and run production bundle
pnpm run build
pnpm run start:prod
```

## Testing

Tests run with Jest against the local Firebase emulators (`FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`, project `demo-test`).

1. Ensure the Firebase emulators are running:

   ```bash
   firebase emulators:start --project demo-test
   ```

2. Run tests and linting:

   ```bash
   # run all tests
   pnpm test

   # run a specific test file
   pnpm exec jest --runTestsByPath src/app.controller.spec.ts

   # run tests with coverage
   pnpm run test:cov

   # lint
   pnpm lint
   ```

## Deployment

The API is deployed to **Google App Engine** (`default` service) using `app.yaml`.

| Environment | Google Cloud Project        | Service   | Hostname                                     |
| ----------- | --------------------------- | --------- | -------------------------------------------- |
| Staging     | `checklists-staging-486418` | `default` | `checklists-staging-486418.ew.r.appspot.com` |
| Production  | `checklists-486418`         | `default` | `checklists-486418.ew.r.appspot.com`         |

> **Note:** Always pass `--project` explicitly to `gcloud` commands. App Engine deployment (`gcloud app deploy`) uploads local files (configured via `.gcloudignore`) and does not deploy Firestore rules or indexes.

### 1. Preflight Checks

Before deploying to either environment:

1. Check the working tree (`git status --short --branch`) to verify what local files will be uploaded.
2. Ensure you are authenticated with Google Cloud (`gcloud auth list`, or sign in via `gcloud auth login`).
3. Verify access to the target App Engine application and obtain its `defaultHostname`:

   ```bash
   gcloud app describe --project=PROJECT_ID --format='yaml(id,defaultHostname,servingStatus)'
   ```

4. Build a fresh production bundle (`app.yaml` runs `node dist/src/main`):

   ```bash
   pnpm build
   ```

### 2. Deploy to Staging

Deploy to the staging project and promote the new version to receive all traffic:

```bash
gcloud app deploy app.yaml --project=checklists-staging-486418 --promote --quiet
```

Verify the staging deployment:

```bash
# Confirm traffic split assigns 1.0 to the new version
gcloud app services describe default --project=checklists-staging-486418 --format='yaml(id,split)'

# Verify the live endpoint responds (returns HTTP 401 without credentials)
curl --silent --show-error --max-time 60 --include https://checklists-staging-486418.ew.r.appspot.com/
```

### 3. Deploy to Production

After verifying staging (and confirming you are ready to promote a new version to receive 100% of production traffic), deploy to the production project:

```bash
gcloud app deploy app.yaml --project=checklists-486418 --promote --quiet
```

Verify the production deployment:

```bash
# Confirm traffic split assigns 1.0 to the new version
gcloud app services describe default --project=checklists-486418 --format='yaml(id,split)'

# Verify the live endpoint responds (returns HTTP 401 without credentials)
curl --silent --show-error --max-time 60 --include https://checklists-486418.ew.r.appspot.com/
```

### Troubleshooting Deployments

If verification fails, inspect the logs for the deployed version:

```bash
gcloud app logs read --project=PROJECT_ID --service=default --version=VERSION_ID --limit=50
```

## Documentation

- User stories: `docs/stories/`
- Architecture documentation: `docs/architecture/`
- Domain glossary: `docs/glossary/`
- REST specification & profiles: `restspec/`
