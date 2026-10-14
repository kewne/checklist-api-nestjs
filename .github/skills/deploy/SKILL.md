---
name: deploy
description: 'Deploy the checklist API to staging or production on Google App Engine. Use when: deploying, releasing, promoting a version, or verifying a deployment in either environment.'
argument-hint: 'staging | production'
---

# Deploy

Deploy the current workspace to the requested Google App Engine environment and verify the result. Run commands from the workspace root.

## Select the Environment

| Environment | Google Cloud project        | Service   |
| ----------- | --------------------------- | --------- |
| staging     | `checklists-staging-486418` | `default` |
| production  | `checklists-486418`         | `default` |

These project mappings are defined in `.firebaserc`. Both environments use `app.yaml`. Its `NODE_ENV: production` setting applies to both; it does not select the deployment target.

- If the user has not named an environment in the active request or conversation, ask before deploying. Never infer production from the branch or CLI configuration.
- Require an explicit request for production before deploying there. A staging deployment does not authorize a production deployment. Even when production was explicitly requested, always ask for a second confirmation immediately before running the production deployment command.
- Always pass `--project` to cloud commands. The Firebase `default` alias points to production; do not rely on defaults or change the global CLI project.
- App Engine deployment does not deploy Firestore rules or indexes. Do not deploy these or other infrastructure unless separately requested.

## Preflight

1. Run `git status --short --branch` to identify the deployment source. Deployment uploads local files, not just committed code. If there are uncommitted changes, explain that they would be included and ask whether to proceed. Never discard changes, commit, or switch branches as part of deployment.
2. Read `app.yaml`, `.gcloudignore`, `.firebaserc`, and the build script in `package.json` if they have not already been inspected in this task.
3. Check access to the selected project:

   ```bash
   gcloud app describe --project=PROJECT_ID --format='yaml(id,defaultHostname,servingStatus)'
   ```

   Use the returned `defaultHostname` for verification rather than guessing the region. Stop if the project is unexpected or the App Engine application is unavailable; do not create infrastructure automatically.

4. If no account is active, run `gcloud auth list --format='table(account,status)'`. If authentication is missing, tell the user to run `gcloud auth login` in their terminal and resume once they have signed in. Never request login codes, tokens, or credentials through chat. If multiple existing accounts are plausible, ask which to use.
5. Run `pnpm build` and stop on failure. Do not repair unrelated code as part of deployment. The configured entrypoint is `node dist/src/main`, so deploy the fresh build, not stale output.
6. If code changed during this task, follow the testing skill at `../testing/SKILL.md` and its required gates before deployment. A deployment-only task does not require repeating tests already passed for unchanged source; report which checks were actually run.

## Deploy to Staging

```bash
gcloud app deploy app.yaml --project=checklists-staging-486418 --promote --quiet
```

## Deploy to Production

After preflight, ask the user to confirm deployment to production project `checklists-486418` and promotion of the new version to receive all production traffic. Wait for a separate affirmative answer, even if the initial request explicitly named production. Only then run:

```bash
gcloud app deploy app.yaml --project=checklists-486418 --promote --quiet
```

Both commands promote the new version to receive traffic. Explain that effect before running the command. Capture the deployed version ID and URL from the output. If deployment fails, report the failed stage; do not claim success, retry against another environment, or automatically roll back.

## Verify

1. Confirm the deployed version receives all traffic in the selected project:

   ```bash
   gcloud app services describe default --project=PROJECT_ID --format='yaml(id,split)'
   ```

   Check that `split.allocations` assigns `1.0` to the version returned by deployment.

2. Check the live endpoint using the hostname returned by `gcloud app describe`:

   ```bash
   curl --silent --show-error --max-time 60 --include https://DEFAULT_HOSTNAME/
   ```

   Without credentials, the root endpoint currently returns HTTP `401` with `Missing or invalid authorization header`. This confirms reachability and authentication enforcement, not authenticated functionality or database access. Report unexpected responses, timeouts, or server errors as verification failures.

3. If verification fails, inspect logs for the deployed version:

   ```bash
   gcloud app logs read --project=PROJECT_ID --service=default --version=VERSION_ID --limit=50
   ```

   Summarize relevant errors without exposing secrets or user data. Ask before changing traffic or deploying a fix outside the original scope.

## Completion

Report the environment, project, deployed version, clickable URL, traffic allocation, and HTTP check result. Distinguish deployment success from verification failure and note any checks not performed. Do not claim a full authenticated smoke test based on a `401` response alone.
