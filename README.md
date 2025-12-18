<div align="center">

# 🔐 Cookie Vault

**Secure backup and restoration of your browser cookies**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Chrome Extension](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome)](https://developer.chrome.com/docs/extensions/mv3/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vite.dev/)

*Never lose your login sessions again.*

</div>

---

## ✨ What is Cookie Vault?

**Cookie Vault** is a Chrome extension that lets you **backup all your browser cookies** to an encrypted file and **restore them** whenever you need — perfect for:

- 🖥️ **Migrating to a new computer** without re-logging into every website
- 💾 **Fresh OS installs** while keeping all your sessions intact
- 🔄 **Switching browsers** or profiles seamlessly
- 🛡️ **Secure backup** of your authentication state

<div align="center">
  <img src="legacy_source/demo.gif" alt="Cookie Vault Demo" width="400">
</div>

---

## 🚀 Quick Start

### Installation (Development)

```bash
# Clone the repository
git clone https://github.com/your-username/cookie-vault.git
cd cookie-vault

# Install dependencies
npm install

# Build the extension
npm run build
```

### Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

---

## 📖 Usage

### Backup Your Cookies

1. Click the Cookie Vault icon in your browser toolbar
2. Enter a **strong password** (you'll need this to restore!)
3. Click **Backup Cookies**
4. Save the `.cv` file somewhere safe

### Restore Your Cookies

1. Click the Cookie Vault icon
2. Switch to the **Restore** tab
3. Select your `.cv` backup file
4. Enter your password
5. Click **Restore Cookies**

> **💡 Tip:** Cookie Vault also supports legacy `.ckz` files from the original extension!

---

## 🔒 Security

Cookie Vault takes your security seriously:

| Feature | Implementation |
|---------|---------------|
| **Encryption** | AES-256-GCM via Web Crypto API |
| **Key Derivation** | PBKDF2 with 100,000 iterations |
| **Legacy Support** | SJCL decryption for `.ckz` files |
| **No Cloud** | All data stays on your device |

Your password **never leaves your browser**. Backups are encrypted locally before download.

---

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm 9+

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Build for production |
| `npm run test` | Run tests (Vitest) |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

### Project Structure

```
cookie-vault/
├── src/
│   ├── components/ui/    # Reusable UI components
│   ├── utils/            # Crypto & cookie utilities
│   ├── App.tsx           # Main application
│   └── main.tsx          # Entry point
├── dist/                 # Built extension (load this in Chrome)
├── docs/                 # Documentation
└── manifest.json         # Chrome Extension manifest
```

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage
```

**Current test coverage:**
- ✅ Encryption/decryption (round-trip)
- ✅ Legacy SJCL format support
- ✅ Cookie restoration logic
- ✅ HSTS retry mechanism

---

## 📋 Roadmap

- [x] **v1.0** — Core backup/restore functionality
- [x] **v1.0** — Legacy `.ckz` file support
- [ ] **v1.1** — Selective backup by domain
- [ ] **v1.1** — Restore warnings UI
- [ ] **v1.2** — Password strength indicator
- [ ] **v2.0** — Firefox support

---

## 🤝 Contributing

Contributions are welcome! Please read our development guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm run test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Original [Cookie Backup and Restore](https://chrome.google.com/webstore/detail/cookie-backup-and-restore/cndobhdcpmpilkebeebeecgminfhkpcj) extension
- [SJCL](https://bitwiseshiftleft.github.io/sjcl/) for legacy encryption support
- Built with [Vite](https://vite.dev/), [React](https://react.dev/), and [CRXJS](https://crxjs.dev/vite-plugin)

---

<div align="center">

**Made with ❤️ for seamless browser migrations**

*Last updated: December 2024*

</div>
