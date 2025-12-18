/* eslint-disable @typescript-eslint/no-explicit-any -- Mock types require any assertions */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import browser from 'webextension-polyfill';
import { restoreCookies } from './cookies';
import type { Cookie } from './crypto';

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({
  default: {
    cookies: {
      getAll: vi.fn(),
      set: vi.fn(),
    },
  },
}));

describe('Cookie Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('restoreCookies', () => {
    const baseCookie: Cookie = {
      name: 'test_cookie',
      value: 'test_value',
      domain: 'example.com',
      path: '/',
      secure: true,
      httpOnly: false,
      storeId: '0',
      expirationDate: Date.now() / 1000 + 3600, // 1 hour from now
    };

    it('should restore a valid cookie successfully', async () => {
      vi.mocked(browser.cookies.set).mockResolvedValue({} as any);

      const result = await restoreCookies([baseCookie]);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.details).toHaveLength(1);
      expect(result.details[0].status).toBe('success');
      expect(browser.cookies.set).toHaveBeenCalledTimes(1);
    });

    it('should skip expired cookies and include reason in details', async () => {
      const expiredCookie: Cookie = {
        ...baseCookie,
        expirationDate: Date.now() / 1000 - 3600, // 1 hour ago
      };

      const result = await restoreCookies([expiredCookie]);

      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.details).toHaveLength(1);
      expect(result.details[0].status).toBe('skipped');
      expect(result.details[0].reason).toBe('Cookie has expired');
      expect(browser.cookies.set).not.toHaveBeenCalled();
    });

    it('should retry with HTTPS upgrade when initial set fails for insecure cookie', async () => {
      const insecureCookie: Cookie = {
        ...baseCookie,
        secure: false,
        domain: '.example.app',
      };

      vi.mocked(browser.cookies.set)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({} as any);

      const result = await restoreCookies([insecureCookie]);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.details[0].status).toBe('success');
      expect(result.details[0].reason).toBe('Upgraded to HTTPS');
      expect(browser.cookies.set).toHaveBeenCalledTimes(2);
    });

    it('should count as failed when retry also fails and include error in details', async () => {
      const insecureCookie: Cookie = {
        ...baseCookie,
        secure: false,
      };

      vi.mocked(browser.cookies.set).mockRejectedValue(new Error('Permission denied'));

      const result = await restoreCookies([insecureCookie]);

      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.details[0].status).toBe('failed');
      expect(result.details[0].reason).toBe('Permission denied');
    });

    it('should call progress callback', async () => {
      vi.mocked(browser.cookies.set).mockResolvedValue({} as any);
      const onProgress = vi.fn();

      await restoreCookies([baseCookie, { ...baseCookie, name: 'cookie2' }], onProgress);

      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2);
      expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2);
    });

    it('should handle hostOnly cookies by removing domain', async () => {
      vi.mocked(browser.cookies.set).mockResolvedValue({} as any);
      const hostOnlyCookie: Cookie = {
        ...baseCookie,
        hostOnly: true,
      };

      await restoreCookies([hostOnlyCookie]);

      const calls = vi.mocked(browser.cookies.set).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const callArg = calls[0][0] as any;
      expect(callArg.domain).toBeUndefined();
    });

    it('should handle session cookies by removing expirationDate', async () => {
      vi.mocked(browser.cookies.set).mockResolvedValue({} as any);
      const sessionCookie: Cookie = {
        ...baseCookie,
        session: true,
      };

      await restoreCookies([sessionCookie]);

      const calls = vi.mocked(browser.cookies.set).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const callArg = calls[0][0] as any;
      expect(callArg.expirationDate).toBeUndefined();
    });

    it('should return correct counts for mixed results', async () => {
      const cookies: Cookie[] = [
        baseCookie, // will succeed
        { ...baseCookie, name: 'expired', expirationDate: Date.now() / 1000 - 100 }, // will skip
        { ...baseCookie, name: 'fail', secure: false }, // will fail
      ];

      vi.mocked(browser.cookies.set)
        .mockResolvedValueOnce({} as any) // first succeeds
        .mockRejectedValue(new Error('Failed')); // third fails (both attempts)

      const result = await restoreCookies(cookies);

      expect(result.success).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.details).toHaveLength(3);
    });
  });
});
