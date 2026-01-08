# Security & Build Verification

Cookie Vault is designed with security-first principles to protect your sensitive session data.

## Security Model

### Zero Standing Privileges

Cookie Vault uses the `activeTab` permission model:

- Extension cannot access any data without explicit user action
- Clicking the extension icon grants temporary access to the current tab only
- Access is revoked when the tab is closed or navigated
- No background scripts running when popup is closed

### Encryption

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2 with 100,000 iterations and SHA-256
- **Salt**: Cryptographically random 128-bit salt per backup
- **IV**: Cryptographically random 96-bit IV per backup
- **Integrity**: Built-in checksum verification (v3 format)

### No Remote Code

- All functionality is bundled at build time
- No remote script loading
- No external dependencies at runtime
- Works offline (`offline_enabled: true`)

## Reproducible Builds

Cookie Vault uses deterministic builds to ensure the Chrome Web Store binary matches the public source code.

### Verify a Release

1. **Download from Chrome Web Store**
   - Install the extension
   - Navigate to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Pack extension" or locate the `.crx` file

2. **Extract the extension**
   ```bash
   # Rename .crx to .zip and extract
   unzip cookie-vault.zip -d extracted/
   ```

3. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/cookie-vault
   cd cookie-vault
   git checkout v1.1.0  # Match the installed version
   ```

4. **Run the deterministic build**
   ```bash
   npm ci
   npm run build
   ./scripts/build-deterministic.sh
   ```

5. **Compare hashes**
   ```bash
   sha256sum cookie-vault-local.zip
   # Compare with the hash in the GitHub Release
   ```

### GitHub Actions

Every tagged release is built automatically via GitHub Actions:

- Build runs in a clean Ubuntu environment
- Timestamps are normalized for reproducibility
- SHA256 checksums are published with each release
- Build logs are public and auditable

## Reporting Vulnerabilities

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email security concerns directly or use GitHub's private vulnerability reporting
3. Include steps to reproduce the vulnerability
4. Allow 90 days for a fix before public disclosure

## Threat Model

### In Scope

- Password brute-forcing (mitigated by PBKDF2 with 100k iterations)
- Backup file tampering (detected by checksum verification)
- Extension compromise (mitigated by reproducible builds)

### Out of Scope

- Malware with kernel-level access
- Physical access to unlocked device
- Compromised browser installation
- User sharing their backup password

## Audit History

| Date       | Auditor        | Scope                  | Result |
| ---------- | -------------- | ---------------------- | ------ |
| 2026-01-08 | Self-audit     | Permission refactor    | Pass   |

---

*Last updated: 2026-01-08*
