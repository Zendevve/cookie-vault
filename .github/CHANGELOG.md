# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-04-29

### Added

- **Firefox Support**: Added `manifest-firefox.json` with Gecko-specific settings (`browser_specific_settings.gecko`).
- **Firefox Build Script**: Added `npm run build:firefox` to produce a Firefox-ready `dist-firefox/` package.
- **Cross-Browser Polyfill**: `downloadBlob` now uses `browser.downloads` via `webextension-polyfill` instead of `chrome.downloads` directly, ensuring Promise-based API consistency across Chromium and Gecko engines.

### Changed

- **Test Setup**: Global mock for `webextension-polyfill` added to `src/test/setup.ts` so all tests load consistently without "browser extension only" errors.

## [1.1.1] - 2026-04-29

### Fixed

- **Version Alignment**: `package.json` version now matches `manifest.json` (`1.1.0`).
- **Memory Leak**: `BackupFlow` now correctly revokes object URLs after triggering downloads.
- **Manifest Permissions**: Added missing `clipboardWrite` permission for clipboard operations.
- **Documentation**: Corrected README directory tree, removed non-existent `test:coverage` script reference, fixed PRIVACY.md permission table, and marked MVP feature docs as Done.

### Changed

- **Accessibility**: Replaced custom `<button>` checkbox with native `<input type="checkbox">` for full screen-reader support.
- **ARIA**: Added `role="tab"`, `aria-selected`, `aria-controls`, and `role="tabpanel"` to navigation.
- **Live Regions**: Status and error messages now use `aria-live="polite"` for screen-reader announcements.
- **Progress Bars**: Added `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`.
- **Touch Targets**: All interactive elements now meet minimum 44×44px (buttons, tabs, checkboxes, back navigation).
- **Reduced Motion**: `prefers-reduced-motion` media query disables animations for accessibility.
- **Refactoring**: Extracted shared `downloadBlob`, `filterByDomain` utilities and `useDomainSelection` hook to eliminate duplication.

### Added

- **Tests**: Added 23 new tests covering `downloadBlob`, `filterByDomain`, `useDomainSelection`, `DomainPicker`, and `ErrorBoundary`.

## [1.1.0] - 2026-01-08

### Added

- **Export Formats**: Added support for exporting cookies in Netscape HTTP Cookie File format (compatible with `yt-dlp`, `wget`, `curl`).
- **JDownloader Support**: Added support for exporting to JDownloader JSON format with one-click clipboard copy.
- **Partitioned Cookies**: Added support for CHIPS (Partitioned Cookies) to ensure full session capture.
- **Design System**: Implemented Apple HIG-compliant design system with accessibility improvements.
- **CI/CD**: Added GitHub Actions workflow for reproducible builds and automated releases.
- **Docs**: Added comprehensive `PRIVACY.md` and `SECURITY.md`.

### Changed

- **Permissions**: Removed broad `host_permissions` ("<all_urls>") in favor of `activeTab` to implement Zero Standing Privileges model.
- **Offline Support**: Enabled `offline_enabled` in manifest.

## [1.0.0] - 2025-12-XX

### Added

- Initial release of Cookie Vault.
- AES-256-GCM encryption for backups.
- Support for restoring legacy `.ckz` files.
- Local-first architecture.
