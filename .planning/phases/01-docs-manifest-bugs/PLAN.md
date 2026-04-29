# PLAN.md — Phase 1: Docs, Manifest & Bug Fixes

**Objective:** Close immediate high-impact/low-effort gaps identified in codebase analysis.
**Target Version:** v1.1.1
**Estimated Effort:** Low

---

## Context

- `package.json` version is `1.0.0` but `manifest.json` is `1.1.0`.
- `README.md` references non-existent `npm run test:coverage` and inaccurate directory tree.
- `docs/Features/01-mvp-backup-restore.md` still lists status as "In Progress" despite being shipped.
- `PRIVACY.md` lists `storage` permission that `manifest.json` does not request.
- `BackupFlow.tsx` leaks object URLs by never calling `URL.revokeObjectURL()`.
- `framer-motion` is in dependencies but unused anywhere in `src/`.
- `ExportTab` uses `navigator.clipboard.writeText()` but `manifest.json` lacks `clipboardWrite` permission.

---

## Tasks

### T1 — Version Alignment

- **File:** `package.json`
- **Change:** Update `"version"` from `"1.0.0"` to `"1.1.0"`.

### T2 — Fix Memory Leak

- **File:** `src/components/BackupFlow.tsx`
- **Change:** After `chrome.downloads.download({ url })` and after the fallback `<a>` click, call `URL.revokeObjectURL(url)`.

### T3 — Remove Dead Dependency

- **File:** `package.json`
- **Change:** Remove `"framer-motion"` from `dependencies`.
- **Command:** `npm uninstall framer-motion`

### T4 — Add Clipboard Permission

- **File:** `manifest.json`
- **Change:** Add `"clipboardWrite"` to the `permissions` array.

### T5 — Fix README Inaccuracies

- **File:** `README.md`
- **Changes:**
  - Remove `npm run test:coverage` reference (script does not exist).
  - Fix directory tree: remove `src/manifest.json` and `src/hooks/` (do not exist).

### T6 — Update Stale Feature Docs

- **File:** `docs/Features/01-mvp-backup-restore.md`
- **Change:** Mark status as "Done", check all Definition of Done items.

### T7 — Fix PRIVACY.md Permission Table

- **File:** `PRIVACY.md`
- **Change:** Correct permissions table to match actual `manifest.json` permissions (`cookies`, `downloads`, `activeTab`, `clipboardWrite`). Remove `storage` if listed but not requested.

---

## Verification

- [x] `package.json` version reads `1.1.0`.
- [x] `npm ls framer-motion` returns empty (not installed).
- [x] `manifest.json` includes `clipboardWrite` in permissions.
- [x] `BackupFlow.tsx` contains `URL.revokeObjectURL(url)` in both download paths.
- [x] README no longer mentions `test:coverage` and directory tree is accurate.
- [x] Feature doc shows status Done.
- [x] PRIVACY.md permission table is accurate.
- [x] `npm run test` passes (53 tests).
- [x] `npm run build` passes.
- [x] `npm run format` applied.

---

## Risks

- **Low:** Removing framer-motion could affect lockfile; npm install will refresh it.
- **Low:** Adding clipboardWrite permission triggers Chrome extension permission warning on update; this is expected and correct.
- **Low:** URL.revokeObjectURL must be called after the download is initiated, not before.
