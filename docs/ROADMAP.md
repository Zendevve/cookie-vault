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

### v1.1.0 - The "Power User" Update (Current) ✅
- [x] **Netscape HTTP Cookie File Export**: Compatibility with `wget`, `curl`, `yt-dlp`.
- [x] **JDownloader Support**: JSON export with clipboard integration.
- [x] **Design System Overhaul**: "Liquid Glass" aesthetics and Apple HIG compliance.
- [x] **PRG Gold Tier Compliance**: Full documentation, brand assets, and repo standardization.

### v1.2.0 - Cross-Browser Expansion (Next) 📅
- [ ] **Firefox Support**: Adapt manifest for Gecko engine.
- [ ] **Safari Support**: Investigate Xcode conversion requirements.
- [ ] **Cross-Browser Sync**: Manual file transfer validation between engines.

### v1.3.0 - Cloud & Convenience 🔮
- [ ] **Optional Cloud Sync**: Encrypted E2E backup to Google Drive/Dropbox.
- [ ] **Auto-Backup**: Scheduled local backups.
- [ ] **Selective Restore**: Allow users to restore cookies for specific domains only.

---

## 🐛 Known Issues / Backlog

| Severity | Issue | Status |
| :--- | :--- | :--- |
| Low | UI glitch on very small popup windows (<400px width) | 🚧 Investigating |
| ~~Medium~~ | ~~Large backups (>50MB) may lag heavily during encryption~~ | ✅ **Resolved in v1.1.0** - Chunked encryption with progress tracking |
