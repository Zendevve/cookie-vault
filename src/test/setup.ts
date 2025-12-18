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
