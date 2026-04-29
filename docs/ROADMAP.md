# 🗺️ Product Roadmap

## Status Key

- ✅ **Done**: Completed and merged.
- 🚧 **In Progress**: Currently being worked on.
- 📅 **Planned**: Scheduled for a future release.
- 🔮 **Future**: Under consideration.

---

## 🚀 Version History & Plan

### v1.0.0 - Foundation (Released) ✅

- [x] Basic Backup & Restore functionality.
- [x] AES-256-GCM Encryption.
- [x] Local-first storage.
- [x] Password protection.

### v1.1.1 - Quality & Hygiene Patch ✅

- [x] **Version Alignment**: package.json synced with manifest.json.
- [x] **Memory Leak Fix**: Object URLs properly revoked after downloads.
- [x] **Dead Code Removal**: Removed unused `framer-motion` dependency.
- [x] **Manifest Permission Fix**: Added `clipboardWrite` permission.
- [x] **Documentation Corrections**: README, PRIVACY.md, Feature docs updated.
- [x] **Accessibility Hardening**: Native checkbox, ARIA tabs, live regions, progressbar roles, 44px touch targets, reduced motion support.
- [x] **Refactoring**: Extracted `downloadBlob`, `filterByDomain`, `useDomainSelection`.
- [x] **Test Backfill**: 23 new tests for components, hooks, and utilities.

### v1.1.0 - The "Power User" Update ✅

- [x] **Netscape HTTP Cookie File Export**: Compatibility with `wget`, `curl`, `yt-dlp`.
- [x] **JDownloader Support**: JSON export with clipboard integration.
- [x] **Design System Overhaul**: "Liquid Glass" aesthetics and Apple HIG compliance.
- [x] **PRG Gold Tier Compliance**: Full documentation, brand assets, and repo standardization.

### v1.2.0 - Cross-Browser Expansion (Current) ✅

- [x] **Firefox Support**: Adapted manifest for Gecko engine (`manifest-firefox.json` with `browser_specific_settings.gecko`).
- [x] **Build Script**: Added `npm run build:firefox` to produce `dist-firefox/`.
- [x] **Polyfill Standardization**: `downloadBlob` now uses `browser.downloads` via `webextension-polyfill` instead of `chrome.downloads` directly.
- [x] **Cross-Browser Sync**: Cookie Vault backups are engine-agnostic (same `.cv` format works in both Chromium and Firefox).
- [ ] ~~Safari Support~~: Skipped per product decision.

### v1.3.0 - Cloud & Convenience (Next) 🔮

- [ ] **Optional Cloud Sync**: Encrypted E2E backup to Google Drive/Dropbox.
- [ ] **Auto-Backup**: Scheduled local backups.
- [ ] **Selective Restore**: Allow users to restore cookies for specific domains only.

---

## 🐛 Known Issues / Backlog

| Severity   | Issue                                                       | Status                                                                |
| :--------- | :---------------------------------------------------------- | :-------------------------------------------------------------------- |
| Low        | UI glitch on very small popup windows (<400px width)        | 🚧 Investigating                                                      |
| ~~Medium~~ | ~~Large backups (>50MB) may lag heavily during encryption~~ | ✅ **Resolved in v1.1.0** - Chunked encryption with progress tracking |
