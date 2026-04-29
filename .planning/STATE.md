# STATE.md — Cookie Vault

**Current Milestone:** v1.2.0 Cross-Browser Expansion (Completed)  
**Next Milestone:** v1.3.0 Cloud & Convenience  
**Branch:** `main`

---

## What Was Done (v1.1.0)

- Netscape & JDownloader exports
- Design system overhaul (Apple HIG)
- PRG Gold compliance
- Chunked encryption for large backups
- Password strength meter + SHA-256 checksums

---

## Completed (v1.1.1 — All Phases)

### Phase 1 — Docs, Manifest & Bug Fixes

- [x] Aligned package.json version to 1.1.0
- [x] Fixed URL.revokeObjectURL memory leak in BackupFlow
- [x] Removed unused framer-motion dependency
- [x] Added clipboardWrite permission to manifest
- [x] Fixed README inaccuracies (test:coverage, directory tree)
- [x] Updated stale feature docs to Done
- [x] Fixed PRIVACY.md permission table

### Phase 2 — Accessibility Hardening

- [x] Replaced custom button-checkbox with native accessible `<input type="checkbox">`
- [x] Added ARIA roles to tab navigation (`role="tab"`, `aria-selected`, `aria-controls`, `role="tabpanel"`)
- [x] Added `aria-live="polite"` regions for status messages
- [x] Added `role="progressbar"` with ARIA values to progress bars
- [x] Enforced 44px touch targets on all interactive elements
- [x] Added `prefers-reduced-motion` support

### Phase 3 — Refactoring

- [x] Extracted `downloadBlob` utility
- [x] Extracted `filterByDomain` utility
- [x] Extracted `useDomainSelection` hook

### Phase 4 — Test Backfill

- [x] Added `downloadBlob.test.ts` (3 tests)
- [x] Added `filterByDomain.test.ts` (6 tests)
- [x] Added `useDomainSelection.test.ts` (6 tests)
- [x] Added `DomainPicker.test.tsx` (6 tests)
- [x] Added `ErrorBoundary.test.tsx` (2 tests)
- [x] All 76 tests pass
- [x] Build passes
- [x] Format applied

---

## Completed (v1.2.0 — Cross-Browser Expansion)

- [x] Created `manifest-firefox.json` with Gecko settings (`browser_specific_settings.gecko.id`, `strict_min_version: 109.0`)
- [x] Added `scripts/build-firefox.mjs` to produce `dist-firefox/`
- [x] Added `npm run build:firefox` script to `package.json`
- [x] Replaced `chrome.downloads` with `browser.downloads` via `webextension-polyfill` in `downloadBlob.ts`
- [x] Updated global test setup to mock `webextension-polyfill` for all tests
- [x] Updated README with Firefox build and load instructions
- [x] Safari support skipped per user directive
- [x] All 76 tests pass
- [x] Both Chrome and Firefox builds succeed
- [x] Format applied

---

## What's Next

**v1.3.0** — Cloud & Convenience (optional encrypted cloud sync, auto-backup, cookie-level selective restore).

---

_Last updated: 2026-04-29_
