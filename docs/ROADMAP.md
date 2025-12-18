# Cookie Vault Roadmap

A comprehensive plan to make Cookie Vault the **definitive** cookie backup solution.

---

## Completed ✅

### MVP: Backup & Restore

- AES-256 encryption with Web Crypto API
- Legacy `.ckz` file support (SJCL)
- Chrome extension with popup UI

### Phase 1: MCAF Fixes

- Package naming, Prettier, ESLint, comprehensive tests

### Phase 2: UI Enhancements

- Password confirmation, restore warnings, detailed results

### Phase 3: Selective Backup/Restore

- Domain grouping, search/filter, Select All/Deselect All

### Phase 4: UI/UX Polish

- High-contrast tab selection, custom checkboxes
- 60-30-10 color system, no pure black

---

## In Progress 🔄

### Phase 5: Security Hardening

- [ ] Password strength meter with visual feedback
- [ ] Backup file integrity verification (checksums)
- [ ] Password hint (optional, encrypted)
- [ ] Biometric unlock (WebAuthn) - future
- [ ] Two-factor encryption - future

---

## Future Phases 📋

### Phase 6: Cloud Sync & Profiles

- Multiple backup profiles (Work, Personal, Dev)
- Cloud storage integration (Google Drive, Dropbox)
- Auto-sync on browser close
- Cross-device restore via QR code

### Phase 7: Smart Cookie Management

- Cookie health dashboard (expiring soon)
- Domain categorization (Social, Shopping, Work)
- Sensitive cookie detection
- Cookie comparison (diff between backups)

### Phase 8: Advanced Restore Options

- Merge mode (add only, don't overwrite)
- Domain mapping (restore to staging)
- Restore to specific date (version history)

### Phase 9: Automation & Scheduling

- Scheduled auto-backups
- Rotate old backups (keep last N)
- CLI companion tool
- Webhook notifications

### Phase 10: Enterprise Features

- Team sharing (encrypted URLs)
- Cookie templates for dev environments
- Import from other tools
- Keyboard shortcuts

### Phase 11: Accessibility & i18n

- Full keyboard navigation
- Screen reader support (ARIA)
- Multi-language support
- RTL language support

### Phase 12: Analytics & Insights

- Backup history with statistics
- Cookie trends over time
- Privacy score
- GDPR compliance reports
