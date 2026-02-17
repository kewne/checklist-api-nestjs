# Google Cloud CLI Feature

This devcontainer feature installs the Google Cloud CLI (gcloud) on Debian-based containers following the official installation instructions.

## Usage

Add this feature to your `devcontainer.json`:

```json
{
  "features": {
    "./features/gcloud-cli": {
      "version": "latest",
      "installComponents": "base"
    }
  }
}
```

## Options

- **version** (string): Version of the Google Cloud CLI to install. Use "latest" for the most recent version.
  - Default: "latest"
  - Examples: "latest", "556.0.0"

- **installComponents** (string): Space-separated list of package names to install
  - Default: "base"
  - Use "base" for Google Cloud CLI only, or specify actual package names:
    - `kubectl`: Kubernetes command-line tool
    - `google-cloud-cli-app-engine-python`: App Engine Python tools
    - `google-cloud-cli-app-engine-python-extras`: App Engine Python extras
    - `google-cloud-cli-app-engine-java`: App Engine Java tools
    - `google-cloud-cli-app-engine-go`: App Engine Go tools
    - `google-cloud-cli-gke-gcloud-auth-plugin`: GKE authentication plugin
    - `google-cloud-cli-cloud-build-local`: Cloud Build local development tools
    - `google-cloud-cli-datastore-emulator`: Datastore emulator
    - `google-cloud-cli-firestore-emulator`: Firestore emulator
    - `google-cloud-cli-pubsub-emulator`: Pub/Sub emulator
    - `google-cloud-cli-bigtable-emulator`: Bigtable emulator
    - `google-cloud-cli-spanner-emulator`: Spanner emulator

## What's Installed

The feature installs:

1. **Base installation**: `google-cloud-cli` package containing `gcloud`, `gcloud alpha`, `gcloud beta`, `gsutil`, and `bq` command-line tools
2. **Additional components**: Any package names specified in `installComponents` are passed directly to `apt-get install`

Common additional packages include:

- `kubectl`: Kubernetes command-line tool
- `google-cloud-cli-gke-gcloud-auth-plugin`: GKE authentication plugin
- `google-cloud-cli-app-engine-*`: App Engine development tools
- `google-cloud-cli-*-emulator`: Local development emulators

## Authentication

After installation, you'll need to authenticate with Google Cloud:

```bash
# For interactive authentication (opens browser)
gcloud init

# For service account authentication
gcloud auth activate-service-account --key-file=/path/to/service-account.json

# For application default credentials
gcloud auth application-default login
```

## Example Configurations

### Basic installation (CLI only):

```json
{
  "features": {
    "./features/gcloud-cli": {}
  }
}
```

### With Kubernetes support:

```json
{
  "features": {
    "./features/gcloud-cli": {
      "installComponents": "kubectl"
    }
  }
}
```

### With multiple components:

```json
{
  "features": {
    "./features/gcloud-cli": {
      "installComponents": "kubectl google-cloud-cli-app-engine-python google-cloud-cli-gke-gcloud-auth-plugin"
    }
  }
}
```

### With App Engine Python tools:

```json
{
  "features": {
    "./features/gcloud-cli": {
      "installComponents": "google-cloud-cli-app-engine-python google-cloud-cli-app-engine-python-extras"
    }
  }
}
```

### With emulators:

```json
{
  "features": {
    "./features/gcloud-cli": {
      "installComponents": "google-cloud-cli-datastore-emulator google-cloud-cli-firestore-emulator google-cloud-cli-pubsub-emulator"
    }
  }
}
```

### Full installation with common components:

```json
{
  "features": {
    "./features/gcloud-cli": {
      "installComponents": "kubectl google-cloud-cli-gke-gcloud-auth-plugin google-cloud-cli-app-engine-python google-cloud-cli-app-engine-python-extras google-cloud-cli-datastore-emulator google-cloud-cli-firestore-emulator"
    }
  }
}
```

## Requirements

- Debian-based container (Ubuntu, Debian)
- Internet access during container build
- Sufficient disk space for selected components

## Documentation

For more information about the Google Cloud CLI, see:

- [Official Google Cloud CLI documentation](https://docs.cloud.google.com/sdk/docs)
- [Installation guide](https://docs.cloud.google.com/sdk/docs/install-sdk#deb)
- [Authentication guide](https://docs.cloud.google.com/docs/authentication)
