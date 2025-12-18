# Feature: MVP - Encrypted Backup & Restore

Status: In Progress
Owner: Developer
Related ADRs: N/A

---

## Goal Breakdown

Reimplement the core functionality of the "Cookie Backup and Restore" extension using a modern technology stack (React, Vite, TypeScript). The goal is to provide a secure, user-friendly way to backup browser cookies to an encrypted file and restore them later.

---

## Proposed Changes

### UI Components

#### [NEW] `src/App.tsx` (or `Popup.tsx`)

- Main interface.
- Tabs or Clean UI to switch between "Backup" and "Restore".
- Password input fields.
- Progress indicators.

### Logic

#### [NEW] `src/utils/crypto.ts`

- Functions for encryption and decryption.
- Should ideally support the legacy SJCL format for backward compatibility if possible, or migrate to Web Crypto API (AES-GCM) for new backups. _Decision: Support import of legacy SJCL, use Web Crypto for new backups._

#### [NEW] `src/utils/cookies.ts`

- Wrappers for `chrome.cookies.getAll` and `chrome.cookies.set`.
- Handling of specialized cookie attributes (hostOnly, session, etc.).

---

## Flows

### Backup Flow

1. User opens extension.
2. User enters a password.
3. User clicks "Backup".
4. App fetches all cookies (`chrome.cookies.getAll`).
5. App encrypts the cookie data using the password (AES-GCM).
6. App triggers a download of a `.json.enc` (or `.ckz`) file.

### Restore Flow

1. User opens extension.
2. User selects a backup file.
3. User enters the password.
4. User clicks "Restore".
5. App decrypts the file.
6. App iterates through cookies and sets them (`chrome.cookies.set`).
7. App shows progress.

---

## Verification Plan

### Automated Tests

- Unit tests for `crypto.ts` (verify encryption/decryption round trip).
- Unit tests for cookie formatting logic.

### Manual Verification

- Install extension.
- Log in to a site (e.g., generic test site).
- Backup cookies.
- Clear cookies (log out).
- Restore cookies.
- Reload page -> Should be logged in.

---

## Definition of Done

- [ ] Backup functionality works with encryption.
- [ ] Restore functionality works.
- [ ] UI is polished (Dark mode support).
- [ ] Code is TypeScript compliant.
