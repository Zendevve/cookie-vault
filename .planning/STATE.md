# STATE.md — Cookie Vault

**Current Milestone:** v1.1.1 Quality & Hygiene Patch (Completed)  
**Next Milestone:** v1.2.0 Cross-Browser Expansion  
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

## What's Next

**v1.2.0** — Firefox / cross-browser support (Gecko manifest, polyfill standardization, Safari investigation).

---

_Last updated: 2026-04-29_
