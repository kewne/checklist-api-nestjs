#!/bin/bash
set -e

# The install.sh script is run during container creation
echo "Installing Google Cloud CLI..."

# Get the options passed from devcontainer-feature.json
VERSION=${VERSION:-"latest"}
INSTALL_COMPONENTS=${INSTALLCOMPONENTS:-"base"}

# Update package lists
echo "Updating package lists..."
apt-get update

# Install prerequisites
echo "Installing prerequisites (ca-certificates, gnupg, curl)..."
apt-get install -y ca-certificates gnupg curl

# Import the Google Cloud public key
echo "Importing Google Cloud public key..."
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg

# Add the gcloud CLI distribution URI as a package source
echo "Adding Google Cloud CLI repository..."
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list

# Update package lists again to include the new repository
echo "Updating package lists with Google Cloud repository..."
apt-get update

# Install Google Cloud CLI
if [ "$VERSION" = "latest" ]; then
    echo "Installing latest version of Google Cloud CLI..."
    apt-get install -y google-cloud-cli
else
    echo "Installing Google Cloud CLI version $VERSION..."
    apt-get install -y google-cloud-cli=$VERSION-0
fi

# Install additional components
if [ "$INSTALL_COMPONENTS" != "base" ] && [ -n "$INSTALL_COMPONENTS" ]; then
    echo "Installing additional components: $INSTALL_COMPONENTS"
    apt-get install -y $INSTALL_COMPONENTS
fi

# Clean up package lists to reduce image size
apt-get clean
rm -rf /var/lib/apt/lists/*

# Verify installation
echo "Verifying Google Cloud CLI installation..."
gcloud version

echo "Google Cloud CLI installation completed successfully!"
echo "Note: You will need to run 'gcloud init' or 'gcloud auth login' to authenticate with Google Cloud."
