# Cookie Vault — Coding Conventions

> Auto-generated codebase map. Describes the style rules, TypeScript configuration, naming conventions, component architecture, and Tailwind patterns used throughout the project.

---

## 1. Style & Formatting

### ESLint (`eslint.config.js`)

- **Target files:** `**/*.{ts,tsx}`
- **Ignored:** `dist/`
- **Configs stacked:**
  - `@eslint/js` — `recommended`
  - `typescript-eslint` — `recommended`
  - `eslint-plugin-react-hooks` — `flat.recommended`
  - `eslint-plugin-react-refresh` — `vite` preset
- **Language options:** `ecmaVersion: 2020`, browser globals via `globals`.
- **Explicit-any policy:** Strict in principle, but pragmatically disabled per-line with `// eslint-disable-next-line @typescript-eslint/no-explicit-any` when interfacing with untyped browser APIs, generic JSON encryption, or legacy SJCL payloads.

### Prettier (`.prettierrc`)

| Rule            | Value  |
| --------------- | ------ |
| `semi`          | `true` |
| `singleQuote`   | `true` |
| `tabWidth`      | `2`    |
| `trailingComma` | `es5`  |
| `printWidth`    | `100`  |

**Enforcement:** `npm run format` (Prettier write) is run after tests pass and before build.

---

## 2. TypeScript Strictness

Project uses `tsconfig.app.json` with **strict mode fully enabled**:

- `"strict": true`
- `"noUnusedLocals": true`
- `"noUnusedParameters": true`
- `"erasableSyntaxOnly": true`
- `"noFallthroughCasesInSwitch": true`
- `"noUncheckedSideEffectImports": true`

Other notable compiler settings:

| Setting                      | Value                       | Impact                                                 |
| ---------------------------- | --------------------------- | ------------------------------------------------------ |
| `target`                     | `ES2022`                    | Modern JS output; async/await, top-level await, etc.   |
| `module`                     | `ESNext`                    | Native ESM; no CJS interop needed.                     |
| `moduleResolution`           | `bundler`                   | Vite-compatible resolution.                            |
| `jsx`                        | `react-jsx`                 | Automatic JSX runtime (no `React` import required).    |
| `verbatimModuleSyntax`       | `true`                      | Enforces `import type` / `export type` for pure types. |
| `allowImportingTsExtensions` | `true`                      | `.ts`/`.tsx` extensions in imports.                    |
| `types`                      | `["vite/client", "chrome"]` | Vite env + Chrome extension API types.                 |

---

## 3. Naming Conventions

| Category                  | Convention                    | Example                                       |
| ------------------------- | ----------------------------- | --------------------------------------------- |
| React components (files)  | PascalCase                    | `BackupFlow.tsx`, `PasswordStrengthMeter.tsx` |
| Utility modules (files)   | camelCase                     | `cookies.ts`, `netscape.ts`                   |
| Test files                | Co-located, `[name].test.ts`  | `crypto.test.ts` next to `crypto.ts`          |
| Component props interface | `{Name}Props`                 | `interface ButtonProps { ... }`               |
| Domain interfaces/types   | PascalCase                    | `Cookie`, `DomainGroup`, `RestoreResult`      |
| Functions / variables     | camelCase                     | `getAllCookies`, `formatNetscape`             |
| Constants / enums         | UPPER_SNAKE_CASE or camelCase | `NETSCAPE_HEADER`, `SCORE_LABELS`             |
| CSS custom properties     | kebab-case                    | `--primary-foreground`, `--radius`            |

---

## 4. Component Patterns

### Architecture

- **React functional components with hooks** (primary pattern).
- One class component exception: `ErrorBoundary` (must be a class per React API).
- **Forward-ref UI primitives** where DOM ref access is expected (`Button`, `Input`, `Label`).
- **Feature components** live in `src/components/` (e.g., `BackupFlow.tsx`).
- **Reusable UI primitives** live in `src/components/ui/` (e.g., `Button.tsx`, `Input.tsx`).

### Import Style

- UI primitives often use `import * as React from 'react'` (explicit namespace).
- Feature components use named hook imports (`import { useState } from 'react'`).
- Type-only imports are explicit: `import type { Cookie } from './crypto'`.

### Export Style

- **Named exports** for almost all modules (`export function BackupFlow() ...`).
- **Default export** reserved for `App.tsx` only.
- UI primitives expose `displayName` when wrapped with `forwardRef`.

### Props & Composition

- Props interfaces are declared adjacent to the component.
- Variants (e.g., `Button` variant/size) are modeled as inline record objects rather than external libraries.
- `className` is accepted on every UI primitive and merged via the `cn()` utility.

---

## 5. Tailwind CSS Usage

### Configuration (`tailwind.config.js`)

- **Content globs:** `index.html`, `./src/**/*.{js,ts,jsx,tsx}`.
- **Semantic tokens** mapped to CSS variables:
  - `background`, `foreground`, `primary`, `secondary`, `accent`, `destructive`, `muted`, `popover`, `card`, `border`, `input`, `ring`.
- **Border radius** derived from `--radius`: `lg`, `md`, `sm`.
- **Font family:** `Inter`, `sans-serif`.

### Theming Strategy

- Colors are **never hard-coded** as hex values in JSX (with rare exceptions such as green success states).
- Light/dark modes are driven by a `.dark` class on `:root` and CSS custom properties in `src/index.css`.
- Dark backgrounds avoid pure black (`#000`) to prevent halation — the design system uses `hsl(222 47% 6%)`.

### Utility Merge (`cn`)

```ts
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

All components use `cn()` to compose base styles, variant styles, and consumer-provided `className` overrides.

### Custom CSS Layers (`src/index.css`)

- `@layer base` — CSS variable definitions for light/dark, body resets, border color, focus-visible outline.
- `@layer components` — `tab-button`, `tab-button-active`, `tab-button-inactive`.
- `@layer utilities` — `transition-smooth`, `touch-target` (44×44), `touch-target-min` (28×28).
- Accessibility: `prefers-reduced-motion` disables animations globally.

### Inline vs. Extracted Styles

- Most styling is inline via Tailwind utility classes.
- Complex conditional class blocks use template literals inside JSX.
- Very few arbitrary values; when used, they are scoped (e.g., `max-w-[250px]`).

---

## 6. Established Conventions

### JSDoc

Exported public functions carry JSDoc blocks describing params, return type, and behavior. Example:

```ts
/**
 * Encrypts data using AES-GCM (Web Crypto API) with chunked processing
 * @param data The data to encrypt (object or string)
 * @param password The password to derive the key from
 * @param onProgress Optional progress callback (current, total)
 * @returns Blob containing the encrypted data
 */
```

### Chrome Extension Context Checks

Runtime detection of the extension environment is done with:

```ts
const isExtension = typeof chrome !== 'undefined' && !!chrome.cookies;
```

This allows the same code to run in a browser tab (dev/preview) and inside the extension popup.

### Error Handling Pattern

Async errors are normalized with:

```ts
catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Fallback error text';
}
```

This pattern appears consistently across flows (`BackupFlow`, `RestoreFlow`, `ExportTab`).

### Progress Callbacks

Long-running crypto and cookie operations accept an optional `(current: number, total: number) => void` callback for UI progress bars.

### File Organization

```
src/
  components/         # Feature-level React components
  components/ui/      # Reusable presentational primitives
  lib/                # Shared helpers (cn, etc.)
  utils/              # Domain utilities + co-located tests
  test/setup.ts       # Global test mocks (chrome API)
```

---

## 7. Dependencies & Tooling Constraints

- **Build:** Vite + `@crxjs/vite-plugin` for Chrome Extension manifest bundling.
- **Test:** Vitest (jsdom) + `@testing-library/react` + `@testing-library/jest-dom`.
- **No external UI component library** — primitives are hand-rolled.
- **Icons:** `lucide-react` exclusively.
- **Animation:** `framer-motion` available but used sparingly.

---

_Last updated: 2026-04-29_
