# Codebase Concerns — Cookie Vault

> Focus-area analysis by gsd-codebase-mapper (Concerns Focus)
> Date: 2026-04-29

---

## 1. Security Considerations

### Permission Model & Documentation Mismatch

`SECURITY.md`, `README.md`, and `PRIVACY.md` describe a **"Zero Standing Privileges"** model centered on the `activeTab` permission. However, `manifest.json` requests the persistent `cookies` permission, which grants broad, standing access to all cookies across all sites. `activeTab` is supplementary and does not negate the persistent cookie access. The privacy and security claims are misleading to users and auditors.

### Missing Clipboard Permission

`ExportTab` calls `navigator.clipboard.writeText()` (via `copyJDownloaderToClipboard` in `jdownloader.ts`). Manifest V3 in Chrome typically requires the `clipboardWrite` permission for programmatic clipboard access. It is not declared in `manifest.json`. This may fail silently in some contexts or future browser versions.

### No Content Security Policy

`manifest.json` does not define a `content_security_policy`. For an extension handling sensitive encrypted data, a strict CSP (e.g., `script-src 'self'`) is a defense-in-depth measure against XSS or extension compromise.

### Object URL Memory Leaks

`BackupFlow.tsx` creates a `URL.createObjectURL(blob)` but **never calls `URL.revokeObjectURL(url)`** in either the `chrome.downloads` path or the fallback `<a>` click path. `netscape.ts` and `jdownloader.ts` correctly revoke URLs. This leaks memory in a long-lived popup session.

### Password Retention in Memory

Passwords are stored in React state as standard JavaScript strings. Strings are immutable in JS and cannot be securely zeroed from memory. After backup/restore completes, `setPassword('')` merely dereferences the string; it may persist in heap until GC runs. This is a fundamental JS limitation but should be acknowledged in the threat model.

### Console Error Leakage

`RestoreFlow.tsx` logs errors to `console.error(err)`. In rare cases, error objects might contain sensitive context (e.g., internal state). Production extensions should sanitize logged errors.

### Fragile Legacy Error Detection

`decryptLegacy` in `crypto.ts` uses substring matching (`indexOf('corrupt')`, `indexOf('invalid')`) on SJCL error messages to classify failures. This is brittle and could misclassify errors or break if SJCL updates its messages.

### Type Safety Erosion in Crypto Layer

`crypto.ts` contains multiple `eslint-disable @typescript-eslint/no-explicit-any` comments for core encryption/decryption functions. Reduced type safety in cryptographic code increases the risk of subtle bugs (e.g., passing a string where a TypedArray is expected).

### SJCL Legacy Dependency

`sjcl` v1.0.8 is included solely for decrypting legacy backups (per ADR-001). It is no longer actively maintained and uses older cryptographic primitives (CCM mode, 128-bit keys, 1000 iterations). While read-only, it increases supply-chain attack surface and must be retained indefinitely.

---

## 2. Performance Issues

### Dead Dependency (`framer-motion`)

`framer-motion` is listed in `dependencies` but is **not imported or used anywhere** in `src/`. It bloats the production bundle for no benefit.

### Heavy Dependency (`zxcvbn`)

`zxcvbn` is a large library (~800KB unpacked). It is used for password strength estimation. Consider lazy-loading it or evaluating lighter alternatives if bundle size becomes critical.

### No Cookie Caching

`getAllCookies()` is invoked fresh on every backup preview, export, and clipboard copy. For users with thousands of cookies, this causes repeated, unnecessary Chrome API round-trips.

### Synchronous Domain Filtering

`formatNetscapeForDomain` and `formatJDownloaderForDomain` both iterate the full cookie array with string operations. For very large sets, this is repeated work that could be memoized or shared.

---

## 3. Accessibility Gaps

### Custom Checkbox Is Not Accessible

`Checkbox.tsx` renders a `<button>` instead of a native `<input type="checkbox">`. It lacks `role="checkbox"`, `aria-checked`, and keyboard event handling (Space/Enter). Screen readers will not announce it as a checkbox, and keyboard-only users may be unable to toggle it.

### Tab Navigation Is Not Semantic

The tab buttons in `App.tsx` are plain `<button>` elements. They lack `role="tab"`, `aria-selected`, and `aria-controls`. Screen reader users will not perceive the tab panel relationship.

### Missing ARIA on Collapsible Panel

The warnings panel in `RestoreFlow.tsx` uses a `<button>` to toggle visibility but lacks `aria-expanded` and `aria-controls`.

### Progress Bars Are Not Announced

The encryption/decryption progress bars are `<div>` elements with no `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, or `aria-valuemax`. Screen readers will ignore them.

### Status Messages Lack Live Regions

Dynamic status/error messages appear in `div`s but are not wrapped in an `aria-live` region. Screen readers may not announce status changes (e.g., "Backup complete", "Decryption failed").

### Color-Only State Communication

`PasswordStrengthMeter.tsx` uses a 5-segment color bar (red → green) without text labels on each segment. While a text label appears below, the bar itself communicates state through color alone, violating the project's own `DESIGN_SYSTEM.md` guideline to "always pair color with another visual indicator."

### Touch Targets Below Apple HIG Minimum

- `Checkbox` is `w-5 h-5` (20×20px), well below the 28×28px absolute minimum and far below the 44×44pt recommended target.
- `Button` default size is `h-10` (40px), below the 44px minimum.
- The "Back" navigation buttons in `BackupFlow` and `RestoreFlow` are unstyled raw `<button>` elements sized by content, likely falling below the threshold.

### Focus Management During Step Transitions

When switching between "password" and "preview" steps in `BackupFlow`/`RestoreFlow`, focus is not programmatically moved to the new heading or first focusable element. Keyboard users may lose their place.

---

## 4. Browser Compatibility Limitations

### Chrome-Only Manifest V3

The extension is locked to Chromium-based browsers. Firefox (Gecko) and Safari support are on the roadmap (v1.2.0) but no adaptation work has started. Manifest V3 differences in Firefox (e.g., background service workers vs. persistent background pages) are unaddressed.

### Inconsistent Use of WebExtension Polyfill

`webextension-polyfill` is installed and used in `cookies.ts`, but `chrome.downloads` is accessed directly in `BackupFlow.tsx`, `netscape.ts`, and `jdownloader.ts`. This fractures cross-browser compatibility and makes the Firefox port harder.

### CHIPS `partitionKey` Is Chrome-Specific

The partitioned cookie fetch in `cookies.ts` uses `partitionKey: {}`, which is a Chrome 119+ extension. It is wrapped in try/catch, which is correct, but this code path is untested in non-Chrome environments.

### `navigator.clipboard` Reliability

`copyJDownloaderToClipboard` uses `navigator.clipboard.writeText`. In Firefox extensions, this API may behave differently or require specific permissions. Without cross-browser testing, this is a latent defect.

### React 19 Bleeding Edge

The project uses React `^19.2.0`, which is very new. Some downstream tools or browser environments may not be fully validated against React 19.

---

## 5. Code Smells

### Version Drift

`manifest.json` declares version `1.1.0`, but `package.json` declares `1.0.0`. This mismatch can confuse release automation and users.

### Stale Feature Documentation

`docs/Features/01-mvp-backup-restore.md` still lists status as **"In Progress"** and has unchecked "Definition of Done" items, despite the features being shipped in v1.0.0/v1.1.0.

### README Inaccuracies

`README.md` references `npm run test:coverage` (script does not exist in `package.json`) and shows `src/manifest.json` and `src/hooks/` in the directory tree (manifest is at root; hooks folder does not exist).

### PRIVACY.md Permission Mismatch

Lists `storage` permission in the permissions table, but `manifest.json` does not request it.

### Duplicated Domain Filtering Logic

`formatNetscapeForDomain` and `formatJDownloaderForDomain` contain nearly identical filtering algorithms. This violates DRY and risks divergence.

### Duplicated Download Fallback Logic

The non-extension fallback download logic (`const a = document.createElement('a')...`) is duplicated across `BackupFlow.tsx`, `netscape.ts`, and `jdownloader.ts`. It should be a shared utility.

### Duplicated UI State Logic

`BackupFlow.tsx` and `RestoreFlow.tsx` both manage nearly identical state shapes (`step`, `password`, `status`, `message`, `progress`, `domainGroups`, `searchQuery`, handlers for toggle/selectAll/deselectAll). This should be extracted to a shared hook (e.g., `useDomainSelection`).

### Leaky Abstraction in `App.tsx`

`App.tsx` hoists `exportStatus` state purely to display a styled message box below `ExportTab`. `ExportTab` could manage its own status message internally, reducing coupling.

### Custom Checkbox Reinventing the Platform

Using a `<button>` to mimic a checkbox loses built-in form integration, native focus rings, and accessibility. A visually styled native `<input type="checkbox">` or a headless UI library would be safer.

### Type Assertion for `partitionKey`

`cookies.ts` uses `as any` casts for `partitionKey`, suppressing TypeScript safety. A proper type extension or branded type would be better.

---

## 6. Missing Features vs Roadmap

| Roadmap Item                   | Status           | Gap                                                                                                                                                |
| ------------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v1.2.0 Firefox Support**     | 📅 Planned       | Not started. Manifest, polyfill usage, and API calls are Chrome-specific.                                                                          |
| **v1.2.0 Safari Support**      | 📅 Planned       | Not started. Xcode conversion requirements not investigated.                                                                                       |
| **v1.3.0 Optional Cloud Sync** | 🔮 Future        | No implementation.                                                                                                                                 |
| **v1.3.0 Auto-Backup**         | 🔮 Future        | No implementation.                                                                                                                                 |
| **v1.3.0 Selective Restore**   | 🔮 Future        | Ambiguous — domain-level selective restore UI already exists in `RestoreFlow.tsx`. If the roadmap means _cookie-level_ selection, that is missing. |
| **UI glitch on popups <400px** | 🚧 Investigating | Listed in Known Issues since v1.1.0 with no fix committed.                                                                                         |

---

## 7. TODOs / FIXMEs

**None found in active source code.**

A single `BUG:` string exists in `deprecated/legacy_source/sjcl.js` (line 24). This is vendored legacy code and outside the active build.

---

## 8. Recommendations & Opportunities

### Immediate (High Impact / Low Effort)

1. **Align versions**: Set `package.json` version to `1.1.0` to match `manifest.json`.
2. **Fix memory leaks**: Add `URL.revokeObjectURL(url)` in `BackupFlow.tsx` after triggering the download.
3. **Update stale docs**: Mark `docs/Features/01-mvp-backup-restore.md` as Done; correct README paths and scripts; fix PRIVACY.md permission table.
4. **Remove dead code**: Uninstall or remove `framer-motion` from `package.json`.
5. **Add missing manifest permissions**: Consider adding `clipboardWrite` if clipboard operations are a core feature.

### Short-Term (Medium Effort)

6. **Extract shared utilities**: Create `downloadBlob.ts` and `filterByDomain.ts` to eliminate duplication across `BackupFlow`, `netscape.ts`, and `jdownloader.ts`.
7. **Refactor flows**: Extract a `useDomainSelection` hook to share state logic between `BackupFlow` and `RestoreFlow`.
8. **Improve accessibility**: Replace the custom `<button>` checkbox with a native `<input type="checkbox">` (visually hidden, styled via Tailwind) or add full ARIA support.
9. **Add live regions**: Wrap status message containers in `aria-live="polite"` regions.
10. **Enforce touch targets**: Audit all interactive elements and ensure `min-height: 44px` / `min-width: 44px`.

### Long-Term (Strategic)

11. **Cross-browser port**: Standardize all extension API calls on `webextension-polyfill`; create a Firefox manifest V2/V3 adapter; begin Safari Xcode conversion research.
12. **E2E testing**: Add Playwright or WebDriver tests that load the extension in a real Chromium instance to validate `chrome.cookies` integration, rather than relying solely on Vitest mocks.
13. **Bundle optimization**: Evaluate lazy-loading `zxcvbn` or replacing it with a lighter strength estimator.
14. **CSP hardening**: Add a strict `content_security_policy` to `manifest.json`.
15. **Secure memory practices**: Document the JS string immutability limitation in the threat model; evaluate using `Uint8Array` for password buffers if feasible.
