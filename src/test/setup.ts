import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Setup chrome mock globally for all tests
// This file runs BEFORE any tests, so isExtension will be true

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- globalThis typing for test mocks
(globalThis as any).chrome = {
  cookies: {
    getAll: () => Promise.resolve([]),
    set: () => Promise.resolve({}),
  },
  downloads: {
    download: () => Promise.resolve(1),
  },
};

// Mock webextension-polyfill globally so any module that imports it
// gets a stubbed browser API (prevents "This script should only be loaded
// in a browser extension" error in jsdom / Node test environments).
vi.mock('webextension-polyfill', () => ({
  default: {
    cookies: { getAll: vi.fn(), set: vi.fn() },
    downloads: { download: vi.fn() },
  },
}));
