# ROADMAP.md — Cookie Vault (GSD)

## Milestone: v1.1.1 Quality & Hygiene

**Goal:** Close immediate high-impact gaps identified in codebase analysis before expanding to new platforms.

### Phase 1 — Documentation & Manifest Fixes

- Align package.json version to manifest.json
- Fix README inaccuracies
- Update stale feature docs
- Fix PRIVACY.md permission table
- Add clipboardWrite to manifest

### Phase 2 — Bug Fixes & Dead Code Removal

- Fix URL.revokeObjectURL memory leak in BackupFlow
- Remove framer-motion dependency

### Phase 3 — Accessibility Hardening

- Replace custom Checkbox with accessible native input
- Add ARIA roles to tabs
- Add aria-live regions
- Add prefers-reduced-motion support
- Enforce 44px touch targets

### Phase 4 — Refactoring & Shared Utilities

- Extract downloadBlob utility
- Extract filterByDomain utility
- Extract useDomainSelection hook

### Phase 5 — Test Backfill

- Add component tests for DomainPicker
- Add integration tests for backup→download flow
- Test ErrorBoundary render-throw scenario

---

## Milestone: v1.2.0 Cross-Browser Expansion

**Goal:** Port extension to Firefox and Safari.

### Phase 6 — Firefox Manifest & Polyfill Standardization

- Create Gecko-compatible manifest
- Replace direct `chrome.*` calls with webextension-polyfill
- Test in Firefox

### Phase 7 — Safari Investigation

- Research Xcode extension conversion

---

## Milestone: v1.3.0 Cloud & Convenience

**Goal:** Optional cloud sync and automation.

### Phase 8 — Cloud Sync Research

- Google Drive / Dropbox API investigation
- E2E encryption design

### Phase 9 — Auto-Backup & Selective Restore

- Scheduled alarms
- Cookie-level picker UI

---

_Last updated: 2026-04-29_
