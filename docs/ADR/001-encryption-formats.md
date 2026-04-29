# ADR 001: Encryption Formats & Backward Compatibility

**Status:** Accepted
**Date:** 2026-02-05
**Context:** The Cookie Vault extension has evolved through multiple encryption strategies over time. Preserving backward compatibility is critical to prevent data loss for users with old backups.

## Supported Formats

### 1. Version 4 (Chunked AES-GCM)

- **Introduced:** v2.0.0
- **Use Case:** Large datasets (>1MB)
- **Structure:**
  ```json
  {
    "version": "v4",
    "salt": [Array of numbers],
    "chunks": [
      { "iv": [...], "data": [...] },
      { "iv": [...], "data": [...] }
    ],
    "chunkSize": 1048576,
    "totalSize": 1234567,
    "checksum": "sha256-hash..."
  }
  ```
- **Details:** Optimized to prevent UI freezing during decryption. Each chunk looks like a dependent block but is encrypted independently with its own IV.

### 2. Version 3 (Single-Pass AES-GCM)

- **Introduced:** v2.0.0
- **Use Case:** Small datasets (<1MB)
- **Structure:**
  ```json
  {
    "version": "v3",
    "salt": [...],
    "iv": [...],
    "data": [...],
    "checksum": "sha256-hash..."
  }
  ```
- **Details:** Simple, fast, single IV. Includes checksum for integrity verification.

### 3. Version 2 (Legacy WebCrypto)

- **Introduced:** v1.5.0
- **Status:** Deprecated (Read-only)
- **Structure:** Same as v3 but `version: "v2"` and **no checksum**.
- **Compatibility:** `decryptData` treats v2 exactly like v3 but skips the checksum verification step.

### 4. Legacy (SJCL)

- **Introduced:** v1.0.0 (Original Release)
- **Status:** Deprecated (Read-only)
- **Structure:**
  ```json
  {
    "iv": "...",
    "v": 1,
    "iter": 1000,
    "ks": 128,
    "ts": 64,
    "mode": "ccm",
    "adata": "",
    "cipher": "aes",
    "salt": "...",
    "ct": "..."
  }
  ```
- **Details:** Uses Stanford Javascript Crypto Library (SJCL). We detect this format by checking for specific fields (`iv`, `ct`, `mode`).

## Decision

We must maintain read support for **all four formats** indefinitely.

- **Write:** Always use v3 (small) or v4 (large).
- **Read:** Detect format by shape or version tag. Failing to support old formats would result in unrecoverable data for long-time users.

## Consequences

- `crypto.ts` is complex due to multiple decryption paths.
- Tests must cover all formats.
- Do NOT remove the SJCL dependency or legacy code paths even if they seem unused.
