# Privacy Policy

Cookie Vault is a **local-first** utility. Your data never leaves your device.

## Data Collection

**None.** Cookie Vault:

- ❌ Does not collect analytics
- ❌ Does not phone home to any server
- ❌ Does not contain tracking pixels
- ❌ Does not store data in the cloud
- ❌ Does not require an account

## Data Processing

All operations occur **locally**:

- 🔐 Encryption uses Web Crypto API (browser-native AES-256-GCM)
- 💾 Backups save to your local filesystem only
- 🔑 Passwords are never transmitted or stored
- 📋 Clipboard operations stay on your device

## Permissions Explained

| Permission   | Purpose                                                     |
| ------------ | ----------------------------------------------------------- |
| `cookies`    | Read/write browser cookies (core functionality)             |
| `activeTab`  | Access current tab only when you click the extension        |
| `downloads`  | Save backup files to your Downloads folder                  |
| `storage`    | Save extension preferences locally                          |

## What We Don't Request

Cookie Vault intentionally does **not** request these permissions:

- ❌ `<all_urls>` - We don't need background access to all websites
- ❌ `tabs` - We don't need to see your browsing history
- ❌ `webRequest` - We don't intercept your network traffic
- ❌ `history` - We don't access your browsing history

## Verification

This extension uses [reproducible builds](SECURITY.md). You can verify the
published binary matches the source code.

## Contact

For privacy concerns, please open an issue on our GitHub repository.
