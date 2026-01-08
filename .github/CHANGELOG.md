# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
