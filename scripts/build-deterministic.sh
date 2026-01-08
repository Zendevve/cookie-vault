#!/bin/bash
# Deterministic build script for Cookie Vault
# This script creates a reproducible ZIP that can be verified against CI builds
#
# Usage: ./scripts/build-deterministic.sh
#
# The resulting hash should match the GitHub Release checksums.txt

set -e

echo "🔨 Building Cookie Vault..."
npm run build

echo "📦 Creating deterministic ZIP..."
cd dist

# Set all timestamps to Unix epoch for reproducibility
# This ensures identical builds produce identical hashes
find . -exec touch -t 197001010000.00 {} +

# Create ZIP with:
# -r: recursive
# -X: exclude extra file attributes (uid/gid, etc.)
# Sorted file list ensures consistent ordering
zip -rX ../cookie-vault-local.zip $(find . -type f | sort)

cd ..

echo ""
echo "✅ Build complete!"
echo ""
echo "SHA256 Checksum:"
sha256sum cookie-vault-local.zip
echo ""
echo "Compare this hash with the GitHub Release checksums.txt to verify authenticity."
echo "If the hashes match, the binary is verified as authentic."
