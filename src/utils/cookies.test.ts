/* eslint-disable @typescript-eslint/no-explicit-any -- Mock types require any assertions */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import browser from 'webextension-polyfill';
import { restoreCookies, groupCookiesByDomain, filterCookiesByDomains } from './cookies';
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

  describe('groupCookiesByDomain', () => {
    const baseCookie: Cookie = {
      name: 'test',
      value: 'value',
      domain: 'example.com',
      path: '/',
      secure: true,
      httpOnly: false,
      storeId: '0',
    };

    it('should group cookies by domain', () => {
      const cookies: Cookie[] = [
        { ...baseCookie, name: 'a', domain: 'example.com' },
        { ...baseCookie, name: 'b', domain: 'example.com' },
        { ...baseCookie, name: 'c', domain: 'other.com' },
      ];

      const groups = groupCookiesByDomain(cookies);

      expect(groups).toHaveLength(2);
      expect(groups[0].domain).toBe('example.com');
      expect(groups[0].cookies).toHaveLength(2);
      expect(groups[1].domain).toBe('other.com');
      expect(groups[1].cookies).toHaveLength(1);
    });

    it('should normalize domains with leading dots', () => {
      const cookies: Cookie[] = [
        { ...baseCookie, name: 'a', domain: '.example.com' },
        { ...baseCookie, name: 'b', domain: 'example.com' },
      ];

      const groups = groupCookiesByDomain(cookies);

      expect(groups).toHaveLength(1);
      expect(groups[0].domain).toBe('example.com');
      expect(groups[0].cookies).toHaveLength(2);
    });

    it('should sort by cookie count descending', () => {
      const cookies: Cookie[] = [
        { ...baseCookie, name: 'a', domain: 'small.com' },
        { ...baseCookie, name: 'b', domain: 'big.com' },
        { ...baseCookie, name: 'c', domain: 'big.com' },
        { ...baseCookie, name: 'd', domain: 'big.com' },
      ];

      const groups = groupCookiesByDomain(cookies);

      expect(groups[0].domain).toBe('big.com');
      expect(groups[0].cookies).toHaveLength(3);
    });

    it('should default selected to true', () => {
      const cookies: Cookie[] = [{ ...baseCookie }];

      const groups = groupCookiesByDomain(cookies);

      expect(groups[0].selected).toBe(true);
    });
  });

  describe('filterCookiesByDomains', () => {
    const baseCookie: Cookie = {
      name: 'test',
      value: 'value',
      domain: 'example.com',
      path: '/',
      secure: true,
      httpOnly: false,
      storeId: '0',
    };

    it('should filter cookies by selected domains', () => {
      const cookies: Cookie[] = [
        { ...baseCookie, name: 'a', domain: 'keep.com' },
        { ...baseCookie, name: 'b', domain: 'remove.com' },
        { ...baseCookie, name: 'c', domain: 'keep.com' },
      ];

      const selected = new Set(['keep.com']);
      const filtered = filterCookiesByDomains(cookies, selected);

      expect(filtered).toHaveLength(2);
      expect(filtered.every((c: Cookie) => c.domain === 'keep.com')).toBe(true);
    });

    it('should handle domains with leading dots', () => {
      const cookies: Cookie[] = [
        { ...baseCookie, name: 'a', domain: '.keep.com' },
        { ...baseCookie, name: 'b', domain: 'keep.com' },
      ];

      const selected = new Set(['keep.com']);
      const filtered = filterCookiesByDomains(cookies, selected);

      expect(filtered).toHaveLength(2);
    });

    it('should return empty array when no domains selected', () => {
      const cookies: Cookie[] = [{ ...baseCookie }];

      const selected = new Set<string>();
      const filtered = filterCookiesByDomains(cookies, selected);

      expect(filtered).toHaveLength(0);
    });
  });
});
