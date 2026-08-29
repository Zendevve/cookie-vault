# Repository Guidelines

## Project Overview

Cookie Vault is a privacy-first, browser extension (Manifest V3 for Chrome/Edge and Firefox) built with React 19, TypeScript, Vite, and Tailwind CSS. It provides client-side encrypted cookie backups, selective domain restoration, third-party export formats (Netscape/wget/curl, JDownloader 2, raw JSON/cURL headers), and automated cloud backups (Google Drive, Dropbox) without third-party tracking, analytics, or external telemetry.

## Architecture & Data Flow

The extension operates across two primary execution contexts coordinated via WebExtension APIs and persistent storage:

```
+-------------------------------------------------------------------------+
| Extension Popup UI (src/App.tsx, 400x500px, React 19)                   |
|                                                                         |
|  +---------------+  +---------------+  +---------------+  +----------+  |
|  |  BackupFlow   |  |  RestoreFlow  |  |   ExportTab   |  | Settings |  |
|  +-------+-------+  +-------+-------+  +-------+-------+  +----+-----+  |
|          |                  |                  |               |        |
|          v                  v                  v               v        |
|  +---------------+  +---------------+  +---------------+  +----------+  |
|  | DomainPicker  |  | useDomainSel  |  | exportFormats |  |  oauth   |  |
|  +-------+-------+  +-------+-------+  +-------+-------+  +----+-----+  |
|          \                  |                  /               |        |
|           +-----------------+-----------------+                |        |
|                             |                                  |        |
|                             v                                  v        |
|                      src/utils/crypto.ts             src/utils/storage  |
|                      (AES-256-GCM / PBKDF2)          (chrome.storage)   |
|                             |                                  |        |
+-----------------------------|----------------------------------|--------+
                              v                                  v
+-------------------------------------------------------------------------+
| Background Service Worker (src/background.ts)                           |
|  - Alarms listener (`cookie-vault-auto-backup` daily/weekly)             |
|  - Headless backup execution -> crypto.ts -> cloud-sync (Drive/Dropbox) |
+-------------------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------------------+
| Host Browser & External APIs                                            |
|  - chrome.cookies / browser.cookies (getAll, set)                       |
|  - chrome.identity (launchWebAuthFlow for PKCE OAuth)                   |
|  - Google Drive API / Dropbox API (Cloud backups)                       |
|  - browser.downloads / DOM fallback (File downloads)                    |
+-------------------------------------------------------------------------+
```

### Key Modules & Data Flow

1. **Cookie Ingestion & Normalization (`src/utils/cookies.ts`)**:
   - `getAllCookies()` queries unpartitioned and partitioned cookies across all stores via `browser.cookies.getAll({})`.
   - `groupCookiesByDomain()` clusters cookies by base domain (stripping leading dots, sorted descending by cookie count).
   - `filterCookiesByDomains()` filters cookies matching user-selected domain trees.
2. **Cryptographic Engine (`src/utils/crypto.ts`, `src/utils/password.ts`)**:
   - **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations, and a 16-byte cryptographically random salt (`crypto.getRandomValues`).
   - **Encryption**: AES-256-GCM with 12-byte random initialization vector (IV).
   - **V3 Single-Pass Format**: Payloads ≤ 1MB; produces `{ version: 3, salt, iv, data, checksum }`.
   - **V4 Chunked Format**: Payloads > 1MB; slices ciphertext into 1MB chunks with unique IVs: `{ version: 4, salt, chunks: [{ iv, data }], checksum, totalSize, chunkSize }`.
   - **Legacy Decryption**: Automatic format detection backwards compatibility with V2 (WebCrypto) and V1 (SJCL via `sjcl`).
   - **Integrity**: Deterministic SHA-256 verification checksum generated and validated on unencrypted string payloads.
3. **Cookie Restoration (`src/utils/cookies.ts`)**:
   - Sanitizes cookies before `browser.cookies.set()`: strips `hostOnly` (omits domain or prepends leading dot), deletes expired session dates, and preserves `sameSite` rules.
   - **HSTS / Protocol Fallback**: Sets `url: "https://${domain}${path}"` by default; automatically falls back to `http://` on failure when `secure: false`.
   - Emits step-by-step progress callbacks (`onProgress({ current, total, number })`) for live UI feedback.
4. **Export Engine (`src/utils/exportFormats.ts`, `netscape.ts`, `jdownloader.ts`)**:
   - Formats cookies into Netscape HTTP Cookie format (`#HttpOnly_` prefix, uppercase `TRUE`/`FALSE`, UNIX timestamp in seconds, 7-column TSV), JDownloader 2 JSON array schema, or raw cURL `Cookie:` header strings.
5. **Background & Cloud Sync (`src/background.ts`, `src/utils/cloud-sync/`)**:
   - Background alarms trigger headless cookie backups.
   - OAuth 2.0 PKCE flow via `browser.identity.launchWebAuthFlow` securely acquires access tokens for Google Drive (`drive.file` scope) or Dropbox without hardcoded client secrets.

## Key Directories

- `src/`: Root application source code.
  - `components/`: UI components (`BackupFlow.tsx`, `RestoreFlow.tsx`, `ExportTab.tsx`, `SettingsTab.tsx`, `DomainPicker.tsx`, `ErrorBoundary.tsx`).
  - `components/ui/`: Atomic UI primitives (`Button.tsx`, `Checkbox.tsx`) adhering to Apple HIG guidelines.
  - `hooks/`: Custom React hooks (`useDomainSelection.ts` for domain tree selection, search, and expansion state).
  - `utils/`: Core domain logic, cryptographic operations, browser API wrappers, export formatters.
  - `utils/cloud-sync/`: OAuth 2.0 PKCE client and Google Drive / Dropbox API connectors.
  - `lib/`: Shared helper functions (e.g., `cn()` in `utils.ts` for Tailwind class merging).
  - `test/`: Test setup and global mocks (`setup.ts`).
- `public/`: Static extension assets and icons (`icon-16.png`, `icon-48.png`, `icon-128.png`).
- `scripts/`: Custom build scripts (`build-firefox.mjs` for Firefox manifest generation and distribution packaging).
- `docs/`: Design system guidelines (`DESIGN_SYSTEM.md`), architecture decision records (`ADR/`), feature specifications (`Features/`).
- `.planning/`: Detailed project requirements, state tracking, and codebase references (`.planning/codebase/`).

## Development Commands

- **Install Dependencies**: `npm install`
- **Development Server**: `npm run dev` (starts Vite with `@crxjs/vite-plugin` for Chrome extension HMR)
- **Production Build (Chrome/Chromium)**: `npm run build` (type-checks with `tsc -b` and bundles into `dist/`)
- **Production Build (Firefox)**: `npm run build:firefox` (runs `npm run build` and copies to `dist-firefox/` with Firefox manifest)
- **Run Tests (Interactive / Watch)**: `npm test` (starts Vitest in watch mode)
- **Run Tests (Single Run / CI)**: `npx vitest run` or `npm test -- --run`
- **Lint Code**: `npm run lint` (runs ESLint 9 flat config across `**/*.{ts,tsx}`)
- **Format Code**: `npm run format` (runs Prettier over all files)
- **Preview Build**: `npm run preview`

## Code Conventions & Common Patterns

- **Language & Types**: Strict TypeScript (`tsconfig.app.json` enforces `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `erasableSyntaxOnly: true`, `verbatimModuleSyntax: true`).
  - Use `import type` for pure type imports.
  - Explicitly define interfaces for domain entities (`Cookie`, `VaultSettings`, `DomainSelection`, `WebCryptoBackupFormat`, `ChunkedBackupFormat`).
  - Zero usage of `any` in application code.
- **State Management**:
  - Local component state managed with standard React hooks (`useState`, `useCallback`, `useMemo`, `useRef`).
  - Complex UI domain interactions encapsulated in custom hooks (e.g., `useDomainSelection.ts`).
  - Extension-level persistent state managed through `chrome.storage.local` via typed helper `src/utils/storage.ts`.
- **Async & Error Handling**:
  - Use `async`/`await` throughout; avoid raw Promise chains.
  - Defensive API checks: check for extension APIs before invocation (`typeof chrome !== 'undefined' && !!chrome.cookies`).
  - Safe error extraction: `const message = err instanceof Error ? err.message : 'Unknown error'`.
  - Non-blocking batch processing: in cookie restore or encryption flows, individual item failures do not abort the entire batch; collect granular errors in structured result objects (`RestoreDetails`).
  - Fallback mechanisms: graceful degradation for file downloads (falling back to DOM `<a>` tag) and HTTP/HTTPS protocol retries.
  - UI crash prevention: top-level `ErrorBoundary.tsx` catches render errors and presents a recovery action.
- **Design System & UI Patterns (Apple HIG)**:
  - Styling with Tailwind CSS utility classes and semantic CSS tokens (`var(--background)`, `var(--primary)`, etc.).
  - Dark mode by default (slate-950 base `hsl(222.2, 84%, 4.9%)`; never pure `#000`).
  - Touch targets must be at least 44x44pt (`min-h-[44px] min-w-[44px]`).
  - Support `prefers-reduced-motion` (disable non-essential CSS transitions).
  - High color contrast ratio (minimum 4.5:1 for text).
- **MCAF Workflow Adherence**:
  - Always follow the MCAF engineering discipline: Read context & docs -> Multi-step plan -> Implement code WITH tests -> Run tests in layers -> Format -> Build -> Commit.

## Important Files

- `manifest.json`: Chrome / Chromium extension Manifest V3 definition (`background.service_worker: "src/background.ts"`).
- `manifest-firefox.json`: Firefox-specific extension manifest (`background.scripts: ["src/background.ts"]`, `browser_specific_settings.gecko.id`).
- `src/App.tsx`: Main popup UI container and tab router (400x500px fixed viewport).
- `src/background.ts`: Extension service worker managing automated background backups and alarms.
- `src/utils/crypto.ts`: Encryption, decryption, chunking, and backward-compatible format parsers.
- `src/utils/cookies.ts`: Chrome cookie ingestion, filtering, and sanitization/restore logic.
- `src/utils/storage.ts`: Strongly-typed `chrome.storage.local` settings wrapper.
- `vite.config.ts`: Vite build configuration with `@crxjs/vite-plugin` and `@vitejs/plugin-react`.
- `vitest.config.ts`: Vitest test runner configuration using `jsdom` environment and global test setup.
- `eslint.config.js`: ESLint 9 flat configuration.
- `scripts/build-firefox.mjs`: Node.js script to create the Firefox extension distribution in `dist-firefox/`.

## Runtime/Tooling Preferences

- **Runtime Environment**: Node.js >= 20.0.0 (or ES2022+ compatible runtime). Use `node:` protocol for built-in imports in scripts (e.g., `node:fs`, `node:path`).
- **Package Manager**: `npm` (with `package-lock.json`, lockfile version 3).
- **Module System**: Pure ES Modules (`"type": "module"` in `package.json`).
- **Tooling Constraints**:
  - Do NOT import Node built-ins inside browser/extension source code under `src/`.
  - Use `webextension-polyfill` (`import browser from 'webextension-polyfill'`) or `chrome.*` for cross-browser extension APIs.
  - TS Solution references: Always run type checking via `tsc -b`.

## Testing & QA

- **Frameworks**: Vitest v4 (`vitest`), `jsdom` v27, `@testing-library/react` v16, `@testing-library/jest-dom` v6.
- **Global Setup (`src/test/setup.ts`)**:
  - Initializes `globalThis.chrome` stub for `cookies` and `downloads`.
  - Mocks `webextension-polyfill` to prevent extension runtime errors in jsdom.
- **Testing Principles**:
  - **Co-location**: Tests live directly alongside the source file (e.g., `src/utils/crypto.test.ts` next to `src/utils/crypto.ts`).
  - **Real Cryptography**: `crypto.subtle` runs with native Web Crypto in jsdom—never mock cryptographic primitives.
  - **Mock Host Boundaries Only**: Only mock external browser extension APIs (`browser.cookies`, `browser.downloads`), cloud endpoints, or non-deterministic external utilities (`zxcvbn`).
  - **Behavioral & Scenario Coverage**: Tests must assert real flows and boundary cases (e.g., HTTPS retry fallback, checksum mismatch rejection, chunked encryption > 1MB, Netscape TSV format compliance, expired cookie omission).
  - **Mock Hygiene**: Always clear mocks in `beforeEach(() => { vi.clearAllMocks(); })`.
- **Running Tests**:
  - Watch mode during development: `npm test`
  - Single execution for CI or pre-commit verification: `npx vitest run` or `npm test -- --run`
