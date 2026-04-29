# REQUIREMENTS.md — Cookie Vault

## 1. Quality & Hygiene (v1.1.1)

### RQ-1.1 Version Alignment

- `package.json` version MUST match `manifest.json` version (`1.1.0`).

### RQ-1.2 Memory Leak Fix

- `BackupFlow.tsx` MUST call `URL.revokeObjectURL(url)` after triggering download in both `chrome.downloads` and fallback `<a>` paths.

### RQ-1.3 Dead Dependency Removal

- `framer-motion` MUST be removed from `dependencies` in `package.json` and uninstalled.

### RQ-1.4 Manifest Permission Fix

- `clipboardWrite` MUST be added to `manifest.json` permissions to support programmatic clipboard access in `ExportTab`.

### RQ-1.5 Documentation Corrections

- `README.md` MUST remove non-existent `npm run test:coverage` script reference.
- `README.md` directory tree MUST reflect actual structure (no `src/manifest.json`, no `src/hooks/`).
- `docs/Features/01-mvp-backup-restore.md` MUST be marked as Done with all Definition of Done items checked.
- `PRIVACY.md` MUST correct the permissions table to match `manifest.json`.

### RQ-1.6 Accessibility — Checkbox

- `Checkbox.tsx` MUST use a native `<input type="checkbox">` (visually hidden, styled via Tailwind) OR implement full ARIA (`role="checkbox"`, `aria-checked`, Space/Enter keyboard handling).
- Touch target MUST be at least 44×44px.

### RQ-1.7 Accessibility — Tab Navigation

- Tab buttons in `App.tsx` MUST have `role="tab"`, `aria-selected`, and `aria-controls`.

### RQ-1.8 Accessibility — Live Regions

- Status and error message containers in `BackupFlow`, `RestoreFlow`, and `App.tsx` MUST be wrapped in `aria-live="polite"` regions.

### RQ-1.9 Accessibility — Reduced Motion

- CSS MUST include `prefers-reduced-motion` media query that disables animations/transitions.

### RQ-1.10 Accessibility — Touch Targets

- All interactive elements (buttons, inputs, checkboxes) MUST meet minimum 44×44px touch target.

### RQ-1.11 Shared Utilities Extraction

- Create `src/utils/downloadBlob.ts` to consolidate duplicated anchor-click fallback logic from `BackupFlow.tsx`, `netscape.ts`, and `jdownloader.ts`.
- Create `src/utils/filterByDomain.ts` to consolidate duplicated domain filtering logic from `netscape.ts` and `jdownloader.ts`.

### RQ-1.12 Refactor Flow State

- Extract a `useDomainSelection` hook to share domain group state logic between `BackupFlow` and `RestoreFlow`.

## 2. Cross-Browser Expansion (v1.2.0) — Completed

### RQ-2.1 Firefox Support

- [x] Adapt manifest for Gecko engine (`manifest-firefox.json` with `browser_specific_settings.gecko`).
- [x] Standardize all extension API calls on `webextension-polyfill` (`downloadBlob` uses `browser.downloads`).
- [x] Add `npm run build:firefox` build script.
- [x] Update README with Firefox loading instructions.

### RQ-2.2 Safari Support

- Skipped per user directive.

## 3. Cloud & Convenience (v1.3.0) — Future Phase

### RQ-3.1 Optional Encrypted Cloud Sync

- E2E encrypted backup to Google Drive / Dropbox.

### RQ-3.2 Auto-Backup

- Scheduled local backups.

### RQ-3.3 Cookie-Level Selective Restore

- Allow selecting individual cookies, not just domains.
