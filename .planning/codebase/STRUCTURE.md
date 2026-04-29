# Cookie Vault — Structure

> Directory layout, file organization, module boundaries, and code conventions.

---

## 1. Repository Tree

```
cookie-vault/
├── .planning/
│   └── codebase/
│       ├── ARCHITECTURE.md          # This document's companion
│       └── STRUCTURE.md             # You are here
├── docs/
│   ├── ADR/
│   │   └── 001-encryption-formats.md
│   ├── Development/
│   │   └── setup.md
│   ├── Features/
│   │   └── 01-mvp-backup-restore.md
│   ├── images/
│   │   ├── banner_large.png
│   │   ├── banner_small.png
│   │   ├── banner_social.png
│   │   ├── icon.png
│   │   └── icon-rounded.png
│   ├── templates/
│   │   ├── ADR-Template.md
│   │   └── Feature-Template.md
│   ├── DESIGN_SYSTEM.md
│   └── ROADMAP.md
├── public/
│   ├── icons/
│   │   ├── icon-16.png
│   │   ├── icon-48.png
│   │   └── icon-128.png
│   ├── demo.gif
│   └── vite.svg
├── scripts/
│   └── build-deterministic.sh
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Label.tsx
│   │   │   └── PasswordStrengthMeter.tsx
│   │   ├── BackupFlow.tsx
│   │   ├── DomainPicker.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ExportTab.tsx
│   │   └── RestoreFlow.tsx
│   ├── lib/
│   │   └── utils.ts
│   ├── test/
│   │   └── setup.ts
│   ├── utils/
│   │   ├── cookies.ts
│   │   ├── cookies.test.ts
│   │   ├── crypto.ts
│   │   ├── crypto.test.ts
│   │   ├── jdownloader.ts
│   │   ├── jdownloader.test.ts
│   │   ├── netscape.ts
│   │   ├── netscape.test.ts
│   │   ├── password.ts
│   │   └── password.test.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── deprecated/
│   └── legacy_source/
│       └── manifest.json
├── AGENTS.md
├── eslint.config.js
├── manifest.json
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vitest.config.ts
└── vite.config.ts
```

---

## 2. Directory Organization

### 2.1 `src/` — Application Source

All runtime code lives under `src/`. It is organized into four primary zones:

#### `src/components/` — UI Layer

React components only. Split by granularity:

| Subdirectory             | Purpose                                                                                                                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/`     | **Primitive components** — atomic, reusable, zero business logic. Examples: `Button`, `Input`, `Label`, `Checkbox`, `PasswordStrengthMeter`.                                                               |
| `src/components/` (root) | **Feature components** — higher-level screens and widgets that compose primitives and wire them to utility functions. Examples: `BackupFlow`, `RestoreFlow`, `ExportTab`, `DomainPicker`, `ErrorBoundary`. |

#### `src/utils/` — Domain Logic

Pure business logic and side-effect wrappers. Every module is co-located with its unit tests.

| File             | Responsibility                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `cookies.ts`     | Browser cookie API wrappers (`getAllCookies`, `restoreCookies`), domain grouping/filtering.  |
| `crypto.ts`      | Encryption/decryption engine (Web Crypto API + SJCL legacy). Defines the `Cookie` interface. |
| `netscape.ts`    | Netscape HTTP Cookie File format serialization (`formatNetscape`, `downloadNetscape`).       |
| `jdownloader.ts` | JDownloader JSON format serialization (`formatJDownloader`, `copyJDownloaderToClipboard`).   |
| `password.ts`    | Password strength analysis (`zxcvbn`) and SHA-256 checksum helpers.                          |

#### `src/lib/` — Infrastructure

Shared helpers that are not domain-specific.

| File       | Responsibility                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `utils.ts` | The `cn(...)` utility — merges `clsx` conditional classes with `tailwind-merge` deduplication. Used by virtually every UI primitive. |

#### `src/test/` — Test Configuration

Global test setup and mocks.

| File       | Responsibility                                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `setup.ts` | Provides a global `chrome` mock (`cookies`, `downloads`) so utilities can run under Vitest/jsdom without a real browser extension environment. |

#### `src/assets/` — Static Assets

Images and SVGs imported by components (e.g., `react.svg`).

---

### 2.2 `docs/` — Project Documentation

Follows MCAF conventions. Documentation is versioned in Git alongside code.

| Subdirectory        | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `docs/ADR/`         | Architectural Decision Records. One record per significant decision. |
| `docs/Development/` | Developer onboarding and setup guides.                               |
| `docs/Features/`    | Feature specifications and definition-of-done checklists.            |
| `docs/templates/`   | Reusable templates for ADRs and feature docs.                        |
| `docs/images/`      | Brand assets (banners, icons) used in README and store listings.     |

---

### 2.3 `public/` — Unprocessed Static Files

Files here are copied as-is into the `dist/` folder by Vite.

- `icons/` — Extension icons required by `manifest.json` (16×16, 48×48, 128×128).
- `demo.gif`, `vite.svg` — Miscellaneous static assets.

---

### 2.4 `scripts/` — Build Helpers

- `build-deterministic.sh` — Shell script for deterministic/reproducible builds (if needed for store submission hashing).

---

### 2.5 `deprecated/` — Legacy Reference

- `legacy_source/manifest.json` — Old manifest from a previous version, kept for historical reference.

---

## 3. Module Boundaries

### Dependency Rules

```
┌─────────────────────────────────────┐
│  Feature Components                 │
│  (BackupFlow, RestoreFlow, etc.)    │
│  ──► ui/ primitives                 │
│  ──► utils/ domain logic            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  UI Primitives (components/ui/)     │
│  ──► lib/utils.ts (cn helper)       │
│  ──► React only                     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Utils (cookies, crypto, etc.)      │
│  ──► Browser APIs (chrome.*)        │
│  ──► 3rd-party (sjcl, zxcvbn)       │
│  ✗ NO React                         │
└─────────────────────────────────────┘
```

### Boundary Contracts

| Module                    | May Import                                                 | Must NOT Import                      |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------ |
| `components/ui/*`         | `react`, `lucide-react`, `lib/utils.ts`                    | `utils/*` (no business logic)        |
| `components/*` (features) | `react`, `components/ui/*`, `utils/*`, `lib/utils.ts`      | —                                    |
| `utils/*`                 | `webextension-polyfill`, `sjcl`, `zxcvbn`, other `utils/*` | `react`, `components/*`              |
| `lib/utils.ts`            | `clsx`, `tailwind-merge`                                   | `react`, `utils/*`                   |
| `test/setup.ts`           | —                                                          | application modules (it is the mock) |

---

## 4. File Naming Conventions

| Type                | Convention                   | Example                                |
| ------------------- | ---------------------------- | -------------------------------------- |
| React Components    | PascalCase                   | `BackupFlow.tsx`, `Button.tsx`         |
| Utility Modules     | camelCase                    | `cookies.ts`, `crypto.ts`              |
| Co-located Tests    | `*.test.ts` (same directory) | `cookies.test.ts`                      |
| CSS / Global Styles | kebab-case                   | `index.css`, `App.css`                 |
| Configuration       | kebab-case or dotfile        | `tailwind.config.js`, `vite.config.ts` |

---

## 5. Configuration Files

| File                 | Purpose                                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `manifest.json`      | Chrome Extension Manifest V3. Declares permissions (`cookies`, `downloads`, `activeTab`), popup HTML, and icons. |
| `vite.config.ts`     | Vite build configuration. Uses `@vitejs/plugin-react` and `@crxjs/vite-plugin` to bundle the extension.          |
| `vitest.config.ts`   | Vitest test runner configuration (jsdom environment, setup file).                                                |
| `tailwind.config.js` | Tailwind theme extension — maps CSS custom properties (`--primary`, `--background`, etc.) to utility classes.    |
| `tsconfig.json`      | TypeScript project references (`tsconfig.app.json` + `tsconfig.node.json`).                                      |
| `eslint.config.js`   | ESLint flat config (TypeScript + React Hooks + Refresh rules).                                                   |
| `postcss.config.js`  | PostCSS pipeline (Tailwind + autoprefixer).                                                                      |
| `package.json`       | Dependencies and scripts (`dev`, `build`, `test`, `lint`, `format`).                                             |

---

## 6. Build Output

Vite builds into `dist/`:

```
dist/
├── index.html              # Popup HTML
├── manifest.json           # Copied/generated by CRXJS
├── assets/                 # Bundled JS/CSS chunks
└── public/                 # Copied static files (icons, etc.)
```

The `dist/` folder is loaded as an **unpacked extension** in Chrome during development and zipped for store distribution.

---

## 7. Testing Strategy

- **Unit tests** co-located with source (`*.test.ts`).
- **Framework:** Vitest + jsdom.
- **Browser API mocking:** `src/test/setup.ts` creates a minimal global `chrome` object so `cookies.ts` and `crypto.ts` can execute without a real extension host.
- **Component tests:** Use `@testing-library/react` for UI primitive verification (if present).
- **No E2E tests** in this repository; manual verification against `chrome://extensions` is the current integration strategy.
