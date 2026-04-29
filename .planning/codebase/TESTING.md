# Cookie Vault — Testing Strategy

> Auto-generated codebase map. Documents the test framework, file locations, coverage areas, patterns, mock philosophy, and identified coverage gaps.

---

## 1. Test Framework & Configuration

### Runner: Vitest

- **Config file:** `vitest.config.ts`
- **Environment:** `jsdom`
- **Globals:** enabled (`describe`, `it`, `expect`, `vi`, etc. available without imports in principle, though tests still explicitly import them)
- **Setup file:** `src/test/setup.ts` (runs before every test file)
- **React support:** `@vitejs/plugin-react` is loaded in the Vitest config so JSX transforms work in tests.

### NPM Command

```bash
npm run test        # vitest (watch mode in dev, run mode in CI)
```

---

## 2. Test File Locations

All tests are **co-located with source files** inside `src/utils/`:

| Test File                       | Source File                | Domain                                       |
| ------------------------------- | -------------------------- | -------------------------------------------- |
| `src/utils/crypto.test.ts`      | `src/utils/crypto.ts`      | Encryption, decryption, legacy compatibility |
| `src/utils/password.test.ts`    | `src/utils/password.ts`    | Password strength, SHA-256 checksums         |
| `src/utils/cookies.test.ts`     | `src/utils/cookies.ts`     | Cookie restore, grouping, filtering          |
| `src/utils/netscape.test.ts`    | `src/utils/netscape.ts`    | Netscape format export                       |
| `src/utils/jdownloader.test.ts` | `src/utils/jdownloader.ts` | JDownloader JSON format export               |

**No `*.test.tsx` files exist.** There are zero component-level tests.

---

## 3. Global Test Setup (`src/test/setup.ts`)

The setup file mocks the Chrome extension runtime API globally so tests can run outside the browser:

```ts
(globalThis as any).chrome = {
  cookies: { getAll: () => Promise.resolve([]), set: () => Promise.resolve({}) },
  downloads: { download: () => Promise.resolve(1) },
};
```

This satisfies runtime checks like `typeof chrome !== 'undefined' && !!chrome.cookies`.

---

## 4. Coverage Areas

### Well-Covered

| Module          | What Is Tested                                                                                                                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Crypto**      | V3 single-pass encryption/decryption, V4 chunked encryption/decryption, checksum verification, tamper detection, legacy v2 downgrade, legacy SJCL decryption, corrupted legacy data rejection.                                                                         |
| **Password**    | Strength scoring (empty, short, medium, long), crack-time estimates, checksum generation consistency, checksum verification, corruption detection.                                                                                                                     |
| **Cookies**     | Successful restore, expired-cookie skipping, HTTPS retry upgrade, double-failure handling, progress callback invocation, hostOnly/session cookie stripping, grouping by domain with dot normalization, domain filtering.                                               |
| **Netscape**    | Header presence, uppercase TRUE/FALSE, millisecond-to-second timestamp conversion, session-cookie zero expiration, hostOnly domain formatting, leading-dot insertion, 7-column tab-separated structure, domain filtering (exact, subdomain, parent, case-insensitive). |
| **JDownloader** | Valid JSON output, array shape, required field presence, value preservation, missing-field defaults, pretty-printed formatting, domain filtering (exact, parent).                                                                                                      |

### Not Covered

| Area                            | Missing Tests                                                                                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React Components**            | `App.tsx`, `BackupFlow.tsx`, `RestoreFlow.tsx`, `ExportTab.tsx`, `DomainPicker.tsx`, `ErrorBoundary.tsx`, and all `components/ui/*.tsx` primitives have no tests. |
| **Integration / E2E**           | No tests exercise the full backup→download or file→restore flow end-to-end.                                                                                       |
| **Browser API Integration**     | `getAllCookies()`'s real `browser.cookies.getAll` call and partitioned-cookie fetching are only hit through mocks.                                                |
| **Clipboard / Download**        | `downloadNetscape`, `downloadJDownloader`, `copyJDownloaderToClipboard` contain no test coverage.                                                                 |
| **File I/O**                    | File reading in `RestoreFlow` (`file.text()`) is not tested at the unit level.                                                                                    |
| **Progress Callbacks (Crypto)** | The `onProgress` callbacks inside `encryptData`/`decryptData` are not asserted.                                                                                   |
| **ErrorBoundary**               | No error-throwing render tests.                                                                                                                                   |
| **UI Interactions**             | Tab switching, search filtering, select-all/deselect-all, checkbox toggling, and password confirmation validation are not tested.                                 |

---

## 5. Testing Patterns

### Describe Blocks & Grouping

Tests use nested `describe` blocks to group by function and then by scenario:

```ts
describe('Crypto Utils', () => {
  describe('V3 (Single Pass) Encryption', () => {
    it('should use v3 format for small data', async () => { ... });
    it('should encrypt and decrypt correctly', async () => { ... });
  });
});
```

### Fixture Pattern

A `baseCookie` object is cloned and overridden per test to keep fixtures DRY:

```ts
const baseCookie: Cookie = {
  name: 'session_id',
  value: 'abc123',
  domain: '.example.com',
  path: '/',
  secure: true,
  httpOnly: true,
  storeId: '0',
};

// In a test:
const secureCookie: Cookie = { ...baseCookie, secure: true };
```

This pattern appears in `netscape.test.ts`, `jdownloader.test.ts`, and `cookies.test.ts`.

### Async Test Patterns

- `async/await` is used consistently for crypto and cookie operations.
- Blob reading is wrapped in a helper (`blobToText`) to bridge jsdom's FileReader.

### Assertion Style

- **Vitest built-ins** preferred: `toBe`, `toEqual`, `toBeDefined`, `toHaveLength`, `toContain`, `toMatch`, `toThrow`, `rejects.toThrow`.
- **No `@testing-library/jest-dom` custom matchers are currently used** in existing tests, despite being installed.

---

## 6. Mock Usage

The project follows the AGENTS.md rule: **mocks are used only for external third-party systems**, not for internal logic.

### What Is Mocked

| Dependency              | Mock Type                     | File                |
| ----------------------- | ----------------------------- | ------------------- |
| `webextension-polyfill` | `vi.mock` module factory      | `cookies.test.ts`   |
| `zxcvbn`                | `vi.mock` module factory      | `password.test.ts`  |
| `chrome` global         | Object injected in `setup.ts` | `src/test/setup.ts` |

### Mock Patterns

**Module-level mock with `vi.mock`:**

```ts
vi.mock('webextension-polyfill', () => ({
  default: {
    cookies: { getAll: vi.fn(), set: vi.fn() },
  },
}));
```

**Mocked function return chaining:**

```ts
vi.mocked(browser.cookies.set)
  .mockRejectedValueOnce(new Error('Failed'))
  .mockResolvedValueOnce({} as any);
```

**Progress callback spy:**

```ts
const onProgress = vi.fn();
await restoreCookies([...], onProgress);
expect(onProgress).toHaveBeenCalledTimes(2);
```

**Resetting mocks between tests:**

```ts
beforeEach(() => {
  vi.clearAllMocks();
});
```

### What Is NOT Mocked

- Internal utilities (`encryptData` tests the real Web Crypto API via jsdom).
- `generateChecksum` / `verifyChecksum` use the real `crypto.subtle.digest`.
- `formatNetscape` and `formatJDownloader` are pure functions tested without mocks.

---

## 7. Gaps in Test Coverage

### Critical Gaps

1. **Zero component tests.** The entire UI layer (`src/components/`) is untested. This includes:
   - Form validation logic (password mismatch, empty fields).
   - Step-based wizard state machines (`BackupFlow`, `RestoreFlow`).
   - Conditional rendering (progress bars, status messages, warning panels).
   - `DomainPicker` search, toggle, select-all behavior.

2. **No integration tests for file operations.**
   - Downloading blobs via `chrome.downloads.download`.
   - Creating object URLs and anchor-click fallbacks.
   - Clipboard writes.

3. **No tests for `getAllCookies()` in extension mode.**
   - The partitioned-cookie fallback path (`catch { ... }`) is never exercised.
   - Deduplication logic is not verified.

4. **ErrorBoundary untested.**
   - No render-throw scenario validates the fallback UI.

### Medium Gaps

5. **Crypto progress callbacks not asserted.**
   - `encryptData` and `decryptData` accept `onProgress` but no test checks the sequence of calls.

6. **Large-data chunked encryption only tests size/format, not integrity edge cases.**
   - No test verifies behavior at exact 1 MB boundary.

7. **`cookies.ts` non-extension path.**
   - The mock-cookie return path when `!isExtension` is not covered.

### Minor Gaps

8. **`App.tsx` tab switching and state reset.**
9. **UI primitive interactions** (focus rings, disabled states, ref forwarding).
10. **Dark mode / CSS variable toggling** (if ever tested in future E2E suite).

---

## 8. Recommendations to Close Gaps

| Priority | Action                                                                                                       | Effort |
| -------- | ------------------------------------------------------------------------------------------------------------ | ------ |
| High     | Add `@testing-library/react` component tests for `DomainPicker` and `BackupFlow`/`RestoreFlow` wizard steps. | Medium |
| High     | Add an integration test that exercises `BackupFlow` → `encryptData` → mock download end-to-end.              | Medium |
| Medium   | Test `ErrorBoundary` by rendering a child that throws.                                                       | Low    |
| Medium   | Assert `onProgress` call counts and arguments in `crypto.test.ts`.                                           | Low    |
| Medium   | Add a test for `getAllCookies` deduplication using a mocked `browser.cookies.getAll` return value.           | Low    |
| Low      | Add visual/state tests for `Button` variants and `Input` focus behavior.                                     | Low    |

---

_Last updated: 2026-04-29_
