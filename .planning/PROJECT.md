# PROJECT.md — Cookie Vault

**Project Name:** Cookie Vault  
**Stack:** React 19, Vite, TypeScript, Tailwind CSS, Chrome Extension Manifest V3  
**Repository:** `D:\COMPROG\cookie vault`  
**Current Version:** 1.1.0 (manifest) / 1.0.0 (package.json — drift)  
**License:** GPL v3

---

## Purpose

Local-first browser extension for secure cookie backup, restore, and export. Zero-knowledge encryption (AES-256-GCM), no cloud dependency.

---

## Key Constraints

- Must support legacy `.ckz` / SJCL decryption indefinitely.
- Must remain local-only (no network requests).
- Must support both light and dark modes.
- Must meet Apple HIG accessibility standards.
- Must follow MCAF workflow.

---

## Active Decisions

- **No background service worker** — pure popup extension.
- **No external state library** — React hooks only.
- **No mocks for internal systems in tests** — real crypto, mocked browser APIs only.
- **webextension-polyfill** for cross-browser Promise-based APIs.

---

## Status

- Codebase map completed: `.planning/codebase/`
- Ready for phase planning.

_Last updated: 2026-04-29_
