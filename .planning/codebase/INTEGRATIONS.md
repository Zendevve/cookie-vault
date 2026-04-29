# External Integrations — Cookie Vault

> Project: Cookie Vault  
> Analyzed: 2026-04-29

---

## 1. Overview

Cookie Vault integrates with browser extension APIs, standard Web APIs, and several third-party libraries to provide cookie backup, restore, and export functionality. This document catalogs every external integration, how it is used, and where it appears in the codebase.

---

## 2. Browser Extension APIs (chrome.\*)

Cookie Vault is a **Manifest V3 Chrome Extension**. It accesses browser APIs both directly (`chrome.*`) and through the `webextension-polyfill` wrapper.

### 2.1 chrome.cookies

**Permission:** `cookies` (declared in `manifest.json`)

**Usage:**

- **Read cookies**: `browser.cookies.getAll({})` — fetches all unpartitioned cookies for the current profile
- **Read partitioned cookies**: `browser.cookies.getAll({ partitionKey: {} })` — fetches CHIPS cookies (Chrome 119+); falls back silently on older browsers
- **Write cookies**: `browser.cookies.set(details)` — restores cookies during backup restore
- **Retry logic**: If setting an insecure cookie fails (e.g., HSTS domains like `.app`), the code retries with `secure: true` and HTTPS URL

**Files:**

- `src/utils/cookies.ts` — primary cookie read/write logic
- `src/test/setup.ts` — global mock for `chrome.cookies`
- `src/utils/cookies.test.ts` — mocked via `vi.mock('webextension-polyfill')`

**Edge Cases Handled:**

- Deduplication by composite key (`domain|name|path|partitionKey`)
- Expired cookie skipping
- Session cookie handling (no `expirationDate`)
- Host-only cookie handling (`delete setDetails.domain`)
- SameSite attribute preservation (`no_restriction`, `lax`, `strict`)

### 2.2 chrome.downloads

**Permission:** `downloads` (declared in `manifest.json`)

**Usage:**

- Downloads encrypted backup files (`.cv` extension)
- Downloads Netscape cookie files (`cookies.txt`)
- Downloads JDownloader cookie files (`cookies.json`)
- All downloads use `saveAs: true` to prompt the user for location

**Files:**

- `src/utils/netscape.ts` — `chrome.downloads.download()` for Netscape exports
- `src/utils/jdownloader.ts` — `chrome.downloads.download()` for JDownloader exports
- `src/components/BackupFlow.tsx` — `chrome.downloads.download()` for encrypted backups
- `src/test/setup.ts` — global mock for `chrome.downloads`

**Fallback:** When `chrome.downloads` is unavailable (non-extension environment), uses `<a>` element with `download` attribute.

### 2.3 chrome.action

**Usage:**

- Defines the popup entry point: `default_popup: "index.html"`
- Sets the tooltip title: `default_title: "Cookie Vault"`

**File:** `manifest.json`

### 2.4 activeTab

**Permission:** `activeTab` (declared in `manifest.json`)

**Usage:** Implicit permission granting temporary access to the active tab. Currently reserved for future domain-scoped export features.

**File:** `manifest.json`

---

## 3. WebExtension Polyfill

**Library:** `webextension-polyfill` (^0.12.0)

**Purpose:** Provides a standardized, Promise-based API wrapper around browser-specific extension APIs. The codebase uses the polyfill as the primary interface, with direct `chrome.*` access only for the downloads API in export modules.

**Usage Pattern:**

```ts
import browser from 'webextension-polyfill';
const cookies = await browser.cookies.getAll({});
```

**Files:**

- `src/utils/cookies.ts` — `browser.cookies.getAll()`, `browser.cookies.set()`
- `src/utils/cookies.test.ts` — `vi.mock('webextension-polyfill')`

**Types:** `@types/webextension-polyfill` (^0.12.4)

---

## 4. Web Crypto API

**API:** `crypto.subtle` (native browser Web Crypto)

**Usage:** Primary encryption/decryption engine for backup files.

### 4.1 Algorithms Used

| Algorithm   | Purpose                      | Parameters                        |
| ----------- | ---------------------------- | --------------------------------- |
| **PBKDF2**  | Key derivation from password | 100,000 iterations, SHA-256       |
| **AES-GCM** | Symmetric encryption         | 256-bit key, 12-byte IV per chunk |
| **SHA-256** | Checksum generation          | Data integrity verification       |

### 4.2 Operations

- `crypto.getRandomValues()` — generates salt (16 bytes) and IV (12 bytes)
- `crypto.subtle.importKey()` — imports password as raw key material
- `crypto.subtle.deriveKey()` — derives AES-GCM key via PBKDF2
- `crypto.subtle.encrypt()` — encrypts cookie data
- `crypto.subtle.decrypt()` — decrypts backup data
- `crypto.subtle.digest('SHA-256', ...)` — generates integrity checksums

**Files:**

- `src/utils/crypto.ts` — all Web Crypto operations
- `src/utils/password.ts` — SHA-256 checksum helpers

### 4.3 Encryption Formats

- **v3 (single-pass)**: Small data ≤1MB; single salt + IV + encrypted blob + checksum
- **v4 (chunked)**: Large data >1MB; shared salt, per-chunk IVs, checksum
- **Legacy (SJCL)**: Automatically detected and decrypted for backward compatibility

---

## 5. Stanford JavaScript Crypto Library (SJCL)

**Library:** `sjcl` (^1.0.8)

**Purpose:** Legacy decryption support for old Cookie Vault backups created with SJCL encryption.

**Usage:**

- Detected automatically during decryption when JSON has SJCL-specific fields (`iv`, `v`, `iter`, `mode`, `ct`)
- `sjcl.decrypt(password, fileContent)` — decrypts legacy format
- `sjcl` is **only used for decryption**; all new encryption uses Web Crypto API

**Files:**

- `src/utils/crypto.ts` — `decryptLegacy()` function
- `src/utils/crypto.test.ts` — tests legacy SJCL decryption path

**Types:** `@types/sjcl` (^1.0.34)

---

## 6. Password Strength Estimation (zxcvbn)

**Library:** `zxcvbn` (^4.4.2)

**Purpose:** Real-time password strength analysis in the backup flow.

**Usage:**

- `zxcvbn(password)` — returns score (0–4), crack time estimates, feedback, and warnings
- Displayed via `PasswordStrengthMeter` component with color-coded bars

**Files:**

- `src/utils/password.ts` — `getPasswordStrength()` wrapper
- `src/components/ui/PasswordStrengthMeter.tsx` — UI visualization
- `src/utils/password.test.ts` — unit tests

**Types:** `@types/zxcvbn` (^4.4.5)

---

## 7. Standard Web APIs

### 7.1 Blob & URL APIs

**Usage:**

- `new Blob([content], { type })` — packages encrypted data, Netscape text, and JDownloader JSON
- `URL.createObjectURL(blob)` — creates downloadable object URLs
- `URL.revokeObjectURL(url)` — cleans up object URLs after download

**Files:**

- `src/utils/crypto.ts` — encrypted backup Blob creation
- `src/utils/netscape.ts` — Netscape file download
- `src/utils/jdownloader.ts` — JDownloader file download
- `src/components/BackupFlow.tsx` — backup download

### 7.2 FileReader API

**Usage:** Reading encrypted backup files during restore.

**In tests:** `FileReader` is used in `crypto.test.ts` to read Blob contents back as text in jsdom.

**Files:**

- `src/utils/crypto.test.ts` — `blobToText()` helper

### 7.3 Clipboard API

**API:** `navigator.clipboard.writeText()`

**Usage:** Copies JDownloader-formatted cookie JSON to the system clipboard.

**File:** `src/utils/jdownloader.ts` — `copyJDownloaderToClipboard()`

**UI Feedback:** `ExportTab.tsx` shows a temporary "Copied!" state for 2 seconds.

### 7.4 TextEncoder / TextDecoder

**Usage:**

- `TextEncoder` — converts strings to Uint8Array for Web Crypto operations
- `TextDecoder` — converts decrypted Uint8Array back to strings

**Files:**

- `src/utils/crypto.ts` — encryption/decryption pipelines
- `src/utils/password.ts` — checksum generation

### 7.5 DOM APIs

**Usage:**

- `document.createElement('a')` — fallback download trigger when `chrome.downloads` is unavailable
- `document.getElementById('root')` — React root mounting point
- `window.location.reload()` — error boundary recovery

**Files:**

- `src/main.tsx`
- `src/utils/netscape.ts`
- `src/utils/jdownloader.ts`
- `src/components/BackupFlow.tsx`
- `src/components/ErrorBoundary.tsx`

### 7.6 File API (Input)

**Usage:** `<input type="file">` in restore flow accepts `.cv`, `.ckz`, `.json`, `.txt` files; `file.text()` reads content.

**File:** `src/components/RestoreFlow.tsx`

---

## 8. Animation & Icons

### 8.1 Framer Motion

**Library:** `framer-motion` (^12.23.26)

**Usage:** UI animations and transitions throughout the popup interface.

**Files:** Various component files (imported in components using motion primitives).

### 8.2 Lucide React

**Library:** `lucide-react` (^0.561.0)

**Usage:** All icons in the UI. Icons used include:

- `Shield`, `Download`, `Upload`, `Share2` — tab navigation
- `Lock`, `FileKey`, `ArrowLeft` — backup/restore flow
- `Search`, `CheckSquare`, `Square` — domain picker
- `AlertTriangle`, `RefreshCw`, `CheckCircle`, `XCircle` — status indicators
- `FileText`, `Clipboard`, `CheckCheck` — export actions
- `ChevronUp`, `ChevronDown` — collapsible panels

**Files:** All component files in `src/components/`

---

## 9. Export Format Integrations

### 9.1 Netscape HTTP Cookie File

**Target Tools:** yt-dlp, wget, curl, gallery-dl, aria2c

**Format Spec:** Tab-separated values with header; `TRUE`/`FALSE` booleans; Unix epoch seconds for expiration.

**Implementation:**

- `src/utils/netscape.ts` — `formatNetscape()`, `formatNetscapeForDomain()`, `downloadNetscape()`
- `src/utils/netscape.test.ts` — format validation tests

**Key Details:**

- Domain formatting respects `hostOnly` flag (leading dot = subdomains included)
- Session cookies use expiration `0`
- Millisecond timestamps are auto-converted to seconds

### 9.2 JDownloader Format

**Target Tool:** JDownloader 2

**Format Spec:** JSON array matching the "Flag Cookies" browser extension structure.

**Implementation:**

- `src/utils/jdownloader.ts` — `formatJDownloader()`, `formatJDownloaderForDomain()`, `downloadJDownloader()`, `copyJDownloaderToClipboard()`
- `src/utils/jdownloader.test.ts` — format validation tests

**Key Details:**

- Each cookie object includes all standard fields plus `storeId`
- `sameSite` defaults to `"unspecified"` when missing
- Supports both file download and clipboard copy

---

## 10. Testing Integrations

### 10.1 Vitest + jsdom

**Setup:** `vitest.config.ts` configures jsdom environment with React plugin and global test APIs.

### 10.2 Chrome Mock (Global)

**File:** `src/test/setup.ts`

Mocks available globally in all tests:

```ts
chrome = {
  cookies: { getAll: () => Promise.resolve([]), set: () => Promise.resolve({}) },
  downloads: { download: () => Promise.resolve(1) },
};
```

### 10.3 webextension-polyfill Mock

**File:** `src/utils/cookies.test.ts`

Uses `vi.mock('webextension-polyfill')` to mock `browser.cookies.getAll` and `browser.cookies.set` for isolated unit testing.

---

## 11. Integration Matrix

| Integration                    | Type        | Used In                                        | Mocked In Tests                    |
| ------------------------------ | ----------- | ---------------------------------------------- | ---------------------------------- |
| `chrome.cookies`               | Browser API | `src/utils/cookies.ts`                         | Yes (polyfill mock + global mock)  |
| `chrome.downloads`             | Browser API | Backup, Netscape, JDownloader flows            | Yes (`src/test/setup.ts`)          |
| `chrome.action`                | Browser API | `manifest.json` only                           | N/A                                |
| `webextension-polyfill`        | Library     | `src/utils/cookies.ts`                         | Yes (`vi.mock`)                    |
| `crypto.subtle`                | Web API     | `src/utils/crypto.ts`, `src/utils/password.ts` | No (native in jsdom)               |
| `crypto.getRandomValues`       | Web API     | `src/utils/crypto.ts`                          | No                                 |
| `sjcl`                         | Third-party | `src/utils/crypto.ts` (legacy decrypt)         | No                                 |
| `zxcvbn`                       | Third-party | `src/utils/password.ts`                        | No                                 |
| `navigator.clipboard`          | Web API     | `src/utils/jdownloader.ts`                     | No (not tested directly)           |
| `Blob` / `URL.createObjectURL` | Web API     | Crypto, Netscape, JDownloader, BackupFlow      | No                                 |
| `FileReader`                   | Web API     | `src/utils/crypto.test.ts`                     | N/A (test helper)                  |
| `TextEncoder` / `TextDecoder`  | Web API     | Crypto, Password                               | No                                 |
| `framer-motion`                | Third-party | Components                                     | Yes (implicit via testing-library) |
| `lucide-react`                 | Third-party | All UI components                              | Yes (SVG renders in jsdom)         |

---

## 12. Security Considerations

| Integration      | Security Note                                                                  |
| ---------------- | ------------------------------------------------------------------------------ |
| `chrome.cookies` | Access to all cookies in the user's profile; requires `cookies` permission     |
| `crypto.subtle`  | All encryption happens client-side; no server involved                         |
| `sjcl`           | Legacy only; modern backups use Web Crypto which is preferred                  |
| Password inputs  | Masked (`type="password"`); strength meter guides user toward strong passwords |
| Downloads        | `saveAs: true` ensures user controls where sensitive backup files are saved    |
