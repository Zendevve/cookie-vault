# Technology Stack — Cookie Vault

> Project: Cookie Vault  
> Analyzed: 2026-04-29

---

## 1. Overview

Cookie Vault is a **Chrome Extension (Manifest V3)** built as a single-page React application rendered inside the extension popup. It uses modern frontend tooling with strict TypeScript, Vite-based bundling, and a TailwindCSS design system.

---

## 2. Languages

| Language       | Version / Target                | Notes                                                                                    |
| -------------- | ------------------------------- | ---------------------------------------------------------------------------------------- |
| **TypeScript** | ~5.9.3                          | Strict mode enabled; two project references (`tsconfig.app.json` + `tsconfig.node.json`) |
| **CSS**        | Tailwind + custom CSS variables | Utility-first with semantic design tokens                                                |
| **HTML**       | HTML5                           | Single `index.html` entry point for the popup UI                                         |

---

## 3. Runtime Environment

| Layer               | Details                                                                       |
| ------------------- | ----------------------------------------------------------------------------- |
| **Primary Runtime** | Chromium browsers (Chrome, Edge, etc.) as a Manifest V3 extension             |
| **Popup Context**   | Standard browser tab rendering `index.html` via `chrome.action.default_popup` |
| **Test Runtime**    | jsdom (Vitest) with a global `chrome` mock                                    |
| **Module System**   | ES Modules (`"type": "module"` in package.json)                               |

---

## 4. Frameworks & UI Libraries

| Name              | Version   | Role                                            |
| ----------------- | --------- | ----------------------------------------------- |
| **React**         | ^19.2.0   | UI framework — functional components with hooks |
| **React DOM**     | ^19.2.0   | Rendering layer (StrictMode enabled)            |
| **TailwindCSS**   | ^3.4.1    | Utility-first CSS framework                     |
| **Framer Motion** | ^12.23.26 | Animation library (used for UI transitions)     |

---

## 5. Build Toolchain

| Tool                     | Version        | Purpose                                                                             |
| ------------------------ | -------------- | ----------------------------------------------------------------------------------- |
| **Vite**                 | ^7.2.4         | Dev server, bundler, and preview server                                             |
| **@vitejs/plugin-react** | ^5.1.1         | Fast Refresh and JSX transform for Vite                                             |
| **@crxjs/vite-plugin**   | ^2.0.0-beta.33 | Chrome Extension Manifest V3 integration (generates extension bundle from manifest) |
| **PostCSS**              | ^8.5.6         | CSS processing pipeline                                                             |
| **Autoprefixer**         | ^10.4.23       | Vendor prefix automation                                                            |
| **TypeScript Compiler**  | ~5.9.3         | Type checking (`tsc -b` runs before `vite build`)                                   |

### Build Commands

```bash
npm run build   # tsc -b && vite build
npm run dev     # vite (dev server)
npm run preview # vite preview
```

---

## 6. Testing Stack

| Tool                          | Version | Role                                               |
| ----------------------------- | ------- | -------------------------------------------------- |
| **Vitest**                    | ^4.0.16 | Test runner (replaces Jest)                        |
| **jsdom**                     | ^27.3.0 | DOM environment for unit tests                     |
| **@testing-library/react**    | ^16.3.1 | React component testing utilities                  |
| **@testing-library/jest-dom** | ^6.9.1  | Custom DOM matchers (`.toBeInTheDocument()`, etc.) |

### Test Commands

```bash
npm run test    # vitest
```

### Test Configuration

- `vitest.config.ts`: uses `@vitejs/plugin-react`, `globals: true`, `environment: 'jsdom'`, setup file at `src/test/setup.ts`
- Global `chrome` mock injected before all tests via `src/test/setup.ts`

---

## 7. Code Quality & Linting

| Tool                            | Version | Role                                          |
| ------------------------------- | ------- | --------------------------------------------- |
| **ESLint**                      | ^9.39.1 | Linting with flat config (`eslint.config.js`) |
| **typescript-eslint**           | ^8.46.4 | TypeScript rules for ESLint                   |
| **eslint-plugin-react-hooks**   | ^7.0.1  | Rules of Hooks enforcement                    |
| **eslint-plugin-react-refresh** | ^0.4.24 | Fast Refresh compatibility checks             |
| **globals**                     | ^16.5.0 | Browser global definitions for ESLint         |
| **Prettier**                    | ^3.7.4  | Code formatting                               |

### Formatting Rules (`.prettierrc`)

- `semi: true`
- `singleQuote: true`
- `tabWidth: 2`
- `trailingComma: "es5"`
- `printWidth: 100`

### Lint Commands

```bash
npm run lint    # eslint .
npm run format  # prettier --write .
```

---

## 8. Production Dependencies

| Package                 | Version   | Purpose                                                        |
| ----------------------- | --------- | -------------------------------------------------------------- |
| `react`                 | ^19.2.0   | UI framework                                                   |
| `react-dom`             | ^19.2.0   | React renderer                                                 |
| `framer-motion`         | ^12.23.26 | Animations                                                     |
| `lucide-react`          | ^0.561.0  | Icon library (SVG icons)                                       |
| `clsx`                  | ^2.1.1    | Conditional className utility                                  |
| `tailwind-merge`        | ^3.4.0    | Tailwind class deduplication/merging                           |
| `webextension-polyfill` | ^0.12.0   | Promise-based wrapper for Chrome extension APIs                |
| `sjcl`                  | ^1.0.8    | Stanford JavaScript Crypto Library (legacy decryption support) |
| `zxcvbn`                | ^4.4.2    | Password strength estimation                                   |
| `@types/zxcvbn`         | ^4.4.5    | TypeScript types for zxcvbn                                    |

---

## 9. Development Dependencies

| Package                       | Version        | Purpose                                                                          |
| ----------------------------- | -------------- | -------------------------------------------------------------------------------- |
| `vite`                        | ^7.2.4         | Build tool                                                                       |
| `@vitejs/plugin-react`        | ^5.1.1         | React plugin for Vite                                                            |
| `@crxjs/vite-plugin`          | ^2.0.0-beta.33 | Chrome extension bundling                                                        |
| `vitest`                      | ^4.0.16        | Test runner                                                                      |
| `jsdom`                       | ^27.3.0        | Browser-like DOM for tests                                                       |
| `@testing-library/react`      | ^16.3.1        | React testing helpers                                                            |
| `@testing-library/jest-dom`   | ^6.9.1         | jest-dom matchers                                                                |
| `typescript`                  | ~5.9.3         | TypeScript compiler                                                              |
| `typescript-eslint`           | ^8.46.4        | ESLint TypeScript plugin                                                         |
| `@types/*`                    | various        | Type definitions for chrome, react, react-dom, node, sjcl, webextension-polyfill |
| `tailwindcss`                 | ^3.4.1         | CSS framework                                                                    |
| `postcss`                     | ^8.5.6         | CSS processor                                                                    |
| `autoprefixer`                | ^10.4.23       | CSS autoprefixer                                                                 |
| `eslint`                      | ^9.39.1        | Linter                                                                           |
| `eslint-plugin-react-hooks`   | ^7.0.1         | React Hooks lint rules                                                           |
| `eslint-plugin-react-refresh` | ^0.4.24        | React Refresh lint rules                                                         |
| `globals`                     | ^16.5.0        | ESLint globals                                                                   |
| `prettier`                    | ^3.7.4         | Formatter                                                                        |

---

## 10. TypeScript Configuration

### Project Structure

- `tsconfig.json` — project references root
- `tsconfig.app.json` — application code (`src/`), target ES2022, DOM libs, `jsx: "react-jsx"`, strict linting
- `tsconfig.node.json` — build tooling (`vite.config.ts`), target ES2023, Node libs

### Key Compiler Options

- `strict: true` — all strict checks enabled
- `noUnusedLocals: true` / `noUnusedParameters: true` — no unused code allowed
- `verbatimModuleSyntax: true` — enforces `import type` where appropriate
- `erasableSyntaxOnly: true` — no emit of runtime syntax (TS 5.8+)
- `moduleResolution: "bundler"` — Vite-compatible resolution
- `types: ["vite/client", "chrome"]` — Vite env + Chrome extension API types

---

## 11. Notable Tech Choices

### 11.1 Chrome Extension Architecture

- **Manifest V3** with `action.default_popup` pattern (no background/service worker)
- Permissions: `cookies`, `downloads`, `activeTab`
- Offline-enabled extension
- Built via `@crxjs/vite-plugin` which auto-generates the extension bundle from `manifest.json`

### 11.2 Styling Architecture

- **TailwindCSS v3** with a fully custom design-token system defined in CSS variables (`:root` / `.dark`)
- Semantic color tokens: `background`, `foreground`, `primary`, `secondary`, `destructive`, `muted`, etc.
- Dark mode supported via `.dark` class (set on `<html>` in `index.html`)
- Custom `@layer` components/utilities for tab buttons, transitions, touch targets, and reduced-motion
- `cn()` utility from `lib/utils.ts` combines `clsx` + `tailwind-merge` for class composition

### 11.3 Component Architecture

- Custom lightweight UI primitives (Button, Input, Label, Checkbox) — no Radix/Shadcn dependency
- Icons exclusively from `lucide-react`
- ErrorBoundary implemented as a class component (the only class component in the app)

### 11.4 Encryption Architecture

- **Primary**: Web Crypto API (`crypto.subtle`) with PBKDF2 + AES-GCM-256
- **Legacy**: SJCL for backward-compatible decryption of old backups
- Two encryption paths: single-pass (v3, small data) and chunked (v4, large data >1MB)
- SHA-256 checksums for integrity verification

### 11.5 Export Format Support

- **Netscape HTTP Cookie File** — for yt-dlp, wget, curl, gallery-dl, aria2c
- **JDownloader JSON** — compatible with JDownloader 2 / Flag Cookies format

### 11.6 Package Manager

- **npm** (inferred from `package.json` and lockfile convention)

---

## 12. File Tree (Relevant Config)

```
Cookie Vault/
├── package.json
├── manifest.json
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── .prettierrc
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── test/setup.ts
    ├── lib/utils.ts
    ├── utils/
    │   ├── crypto.ts
    │   ├── cookies.ts
    │   ├── netscape.ts
    │   ├── jdownloader.ts
    │   └── password.ts
    └── components/
        ├── BackupFlow.tsx
        ├── RestoreFlow.tsx
        ├── ExportTab.tsx
        ├── DomainPicker.tsx
        ├── ErrorBoundary.tsx
        └── ui/
            ├── Button.tsx
            ├── Input.tsx
            ├── Label.tsx
            ├── Checkbox.tsx
            └── PasswordStrengthMeter.tsx
```

---

## 13. Version Summary

| Category         | Primary Versions |
| ---------------- | ---------------- |
| React            | 19.2.0           |
| TypeScript       | 5.9.3            |
| Vite             | 7.2.4            |
| TailwindCSS      | 3.4.1            |
| Vitest           | 4.0.16           |
| ESLint           | 9.39.1           |
| Chrome Extension | Manifest V3      |
