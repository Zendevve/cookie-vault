# Cookie Vault — Architecture

> High-level architectural overview of the Cookie Vault Chrome Extension.
> Stack: React 19, Vite, TypeScript, Tailwind CSS, Manifest V3.

---

## 1. Overview

Cookie Vault is a **browser-extension popup application** (no background service worker) that lets users back up, restore, and export browser cookies. It runs entirely inside the popup context, interacting with the `chrome.cookies` and `chrome.downloads` APIs via `webextension-polyfill`. All UI state is managed with plain React hooks; no external state library is used.

---

## 2. Component Hierarchy

```
main.tsx (StrictMode + createRoot)
└── App.tsx (Tab container: backup | restore | export)
    └── ErrorBoundary (class-based fallback UI)
        ├── Header (branding + icon)
        ├── Tab Navigation (3 buttons)
        └── Content Area
            ├── BackupFlow
            │   ├── PasswordStep
            │   │   ├── Input (password)
            │   │   ├── Input (confirm)
            │   │   ├── PasswordStrengthMeter
            │   │   └── Button
            │   └── PreviewStep
            │       ├── DomainPicker
            │       └── Button (Backup)
            ├── RestoreFlow
            │   ├── FileStep
            │   │   ├── File drop/input
            │   │   ├── Input (password)
            │   │   └── Button
            │   └── PreviewStep
            │       ├── DomainPicker
            │       └── Button (Restore)
            └── ExportTab
                ├── Netscape card → Button
                └── JDownloader card → Button (Copy + Download)

Shared / Primitives
├── DomainPicker (used by BackupFlow & RestoreFlow)
├── Button, Input, Label, Checkbox (ui/ primitives)
└── PasswordStrengthMeter (ui/ primitive)
```

### Key Components

| Component       | Responsibility                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| `App.tsx`       | Top-level layout, tab switching, holds `exportStatus` state lifted from `ExportTab`.                          |
| `BackupFlow`    | Two-step wizard (password → domain preview). Fetches cookies, encrypts, triggers download.                    |
| `RestoreFlow`   | Two-step wizard (file+password → domain preview). Decrypts file, restores cookies via `chrome.cookies.set`.   |
| `ExportTab`     | Stateless (except clipboard feedback). Delegates status to parent. Exports to Netscape / JDownloader formats. |
| `DomainPicker`  | Controlled component. Searchable, selectable list of domain groups. Pure presentation + callback delegation.  |
| `ErrorBoundary` | Class component catching render errors and showing a reload UI.                                               |

---

## 3. Data Flow

### 3.1 Backup Flow

```
User enters password + confirm
        │
        ▼
BackupFlow validates passwords
        │
        ▼
getAllCookies()  ──►  chrome.cookies.getAll({}) + partitionKey
        │
        ▼
groupCookiesByDomain()  ──►  DomainGroup[]
        │
        ▼
DomainPicker renders groups (all selected by default)
        │
        ▼
User toggles domains → filterCookiesByDomains()
        │
        ▼
encryptData(cookies, password)  ──►  Web Crypto API (AES-GCM)
        │
        ▼
Blob → chrome.downloads.download (or anchor fallback)
```

### 3.2 Restore Flow

```
User selects .cv / .ckz file + password
        │
        ▼
file.text() → decryptData(text, password)
        │
        ▼
Auto-detect format (v4 chunked / v3 single / v2 legacy / SJCL)
        │
        ▼
groupCookiesByDomain()  ──►  DomainPicker
        │
        ▼
User selects domains → filterCookiesByDomains()
        │
        ▼
restoreCookies(cookies)  ──►  chrome.cookies.set (with HSTS retry)
        │
        ▼
RestoreResult (success / skipped / failed details)
```

### 3.3 Export Flow

```
User clicks Export button
        │
        ▼
getAllCookies()
        │
        ▼
┌─────────────┐   ┌─────────────────┐
│ Netscape    │   │ JDownloader     │
│ formatNetscape│   │ formatJDownloader│
└──────┬──────┘   └────────┬────────┘
       │                   │
       ▼                   ▼
   downloadNetscape()   downloadJDownloader() / copyJDownloaderToClipboard()
```

### 3.4 State Lifting

- **`App.tsx`** lifts the `exportStatus` state because the status message banner is rendered **outside** `ExportTab` (in `App.tsx`'s export tab panel).
- All other state (passwords, file handles, domain selections, progress) lives inside the respective flow components (`BackupFlow`, `RestoreFlow`).
- `DomainPicker` is a fully **controlled component**: it receives `groups`, `searchQuery`, and callbacks (`onToggle`, `onSelectAll`, etc.) from its parent.

---

## 4. State Management

- **Technology:** React `useState` + `useMemo` only.
- **No external stores** (Redux, Zustand, Context API, etc.).
- **Rationale:** The application has shallow state requirements (single-user, single-session, no cross-tab sync). Local state keeps the bundle small and eliminates boilerplate.

### State Distribution

| State                                                        | Owner                        | Notes                         |
| ------------------------------------------------------------ | ---------------------------- | ----------------------------- |
| Active tab (`backup`/`restore`/`export`)                     | `App.tsx`                    |                               |
| Export status (`idle`/`loading`/`success`/`error` + message) | `App.tsx`                    | Lifted from `ExportTab`       |
| Backup password, confirm, step, progress                     | `BackupFlow`                 |                               |
| Restore file, password, step, progress, details              | `RestoreFlow`                |                               |
| Domain groups, search query                                  | `BackupFlow` / `RestoreFlow` | Passed down to `DomainPicker` |
| Clipboard copied feedback                                    | `ExportTab`                  | Local UI feedback only        |

---

## 5. Security Model (Encryption)

### 5.1 Encryption at Rest

Cookie Vault encrypts backup files **client-side** before they touch disk. The server never exists; everything is local.

| Property           | Implementation                                        |
| ------------------ | ----------------------------------------------------- |
| Algorithm          | AES-256-GCM (Web Crypto API)                          |
| Key Derivation     | PBKDF2, 100,000 iterations, SHA-256                   |
| Salt               | 16-byte random per backup                             |
| IV                 | 12-byte random per chunk (v4) or per message (v3)     |
| Integrity          | SHA-256 checksum of original plaintext (v3 & v4)      |
| Chunking Threshold | > 1 MB → v4 chunked encryption to prevent UI freezing |

### 5.2 Format Versions

The system supports **four backward-compatible read formats** (see `docs/ADR/001-encryption-formats.md`):

1. **v4 (Chunked)** — Write path for large datasets. Splits data into 1 MB chunks, each with its own IV.
2. **v3 (Single-Pass)** — Write path for small datasets. One IV, includes checksum.
3. **v2 (Legacy WebCrypto)** — Read-only. Same shape as v3 but no checksum verification.
4. **Legacy SJCL** — Read-only. Original Stanford Javascript Crypto Library format (CCM mode, 128-bit key, 1k iterations).

**Critical rule:** The SJCL dependency and legacy decryption paths must never be removed, or long-time users lose access to old backups.

### 5.3 Password Handling

- Passwords are held in **component state only** (never `localStorage`, `chrome.storage`, or disk).
- Password strength is evaluated with `zxcvbn` (offline slow-hash crack-time estimation).
- No password recovery mechanism exists by design (zero-knowledge).

### 5.4 Browser API Security

- Uses `chrome.cookies` API with `host_permissions` deliberately empty; the extension only accesses cookies the browser already exposes to extensions.
- Partitioned cookies (CHIPS) are explicitly fetched via `partitionKey` where supported.

---

## 6. Extension Architecture (Popup vs Background)

### 6.1 Manifest V3 — Popup-Only

Cookie Vault is a **pure popup extension**. There is **no background service worker** and no content script.

```json
{
  "manifest_version": 3,
  "action": {
    "default_popup": "index.html",
    "default_title": "Cookie Vault"
  },
  "permissions": ["cookies", "downloads", "activeTab"]
}
```

### 6.2 Why No Background Script?

- All operations are **user-initiated** (backup, restore, export).
- No need for event listeners (`onStartup`, `onInstalled`, alarms, etc.).
- Keeping everything in the popup simplifies the architecture, reduces memory footprint, and avoids service-worker lifecycle issues.

### 6.3 Cross-Browser Compatibility

- Uses `webextension-polyfill` to wrap `chrome.*` APIs in a Promise-based standard.
- Environment detection (`isExtension` in `cookies.ts`) allows the app to run in a standard browser tab during development, returning mock cookies instead of failing.

---

## 7. Key Design Patterns

### 7.1 Progressive Disclosure (Wizard Flows)

Both `BackupFlow` and `RestoreFlow` use a two-step wizard:

1. **Input step** — gather password (and file for restore).
2. **Preview step** — show domain-level selection before destructive action.

This reduces cognitive load and prevents accidental full-browser overwrites.

### 7.2 Composition with Primitive UI Components

The `components/ui/` folder contains atomic, unstyled-logic-free primitives (`Button`, `Input`, `Label`, `Checkbox`). Feature components compose these primitives rather than inline DOM elements, ensuring consistent focus rings, sizing, and accessibility behavior.

### 7.3 Pure Utility Modules

Business logic is extracted into `src/utils/` as pure (or mostly pure) modules:

- `crypto.ts` — encryption/decryption, zero React.
- `cookies.ts` — cookie grouping, filtering, restore orchestration.
- `netscape.ts` / `jdownloader.ts` — format serializers, zero React.
- `password.ts` — strength analysis + checksums.

This makes the logic trivial to unit-test without rendering components.

### 7.4 Co-located Tests

Every utility module has a matching `*.test.ts` file in the same directory. Tests use Vitest + jsdom with mocked browser APIs (`src/test/setup.ts` provides a global `chrome` mock).

### 7.5 Semantic Design Tokens

Styling is done via Tailwind CSS mapped to CSS custom properties (`--background`, `--primary`, etc.). The token system supports automatic light/dark mode switching and enforces Apple HIG contrast and spacing rules (see `docs/DESIGN_SYSTEM.md`).

---

## 8. Technology Matrix

| Layer             | Technology                                  |
| ----------------- | ------------------------------------------- |
| Framework         | React 19 (functional components + hooks)    |
| Language          | TypeScript 5.9 (strict mode)                |
| Build Tool        | Vite 7                                      |
| Extension Bundler | `@crxjs/vite-plugin` (Manifest V3)          |
| Styling           | Tailwind CSS 3 + CSS custom properties      |
| Testing           | Vitest 4 + jsdom + `@testing-library/react` |
| Crypto (modern)   | Web Crypto API (`crypto.subtle`)            |
| Crypto (legacy)   | SJCL (`sjcl`)                               |
| Polyfill          | `webextension-polyfill`                     |
| Icons             | `lucide-react`                              |
| Password Strength | `zxcvbn`                                    |
