# Deprecated Code

This directory contains legacy source code from previous versions of Cookie Vault (v1.x and earlier).

## Why is this here?
We keep this code for reference to ensure backward compatibility with older backup file formats. The `legacy_source/` folder contains the original SJCL-based encryption logic used in the old popup implementation.

## Do I need to touch this?
**No.** This code is not part of the current build process. It is strictly for reference if debugging issues with decrypting very old backup files.

## Structure
- `legacy_source/`: The original vanilla JS implementation before the React rewrite.
