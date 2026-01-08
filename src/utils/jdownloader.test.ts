import { describe, it, expect } from 'vitest';
import { formatJDownloader, formatJDownloaderForDomain } from './jdownloader';
import type { Cookie } from './crypto';

describe('JDownloader Cookie Format', () => {
  const baseCookie: Cookie = {
    name: 'session_id',
    value: 'abc123',
    domain: '.example.com',
    path: '/',
    secure: true,
    httpOnly: true,
    storeId: '0',
    expirationDate: 1735689600,
    sameSite: 'lax',
  };

  describe('formatJDownloader', () => {
    it('should produce valid JSON', () => {
      const result = formatJDownloader([baseCookie]);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should produce a JSON array', () => {
      const result = formatJDownloader([baseCookie]);
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should include all required fields', () => {
      const result = formatJDownloader([baseCookie]);
      const parsed = JSON.parse(result);
      const cookie = parsed[0];

      expect(cookie).toHaveProperty('domain');
      expect(cookie).toHaveProperty('expirationDate');
      expect(cookie).toHaveProperty('hostOnly');
      expect(cookie).toHaveProperty('httpOnly');
      expect(cookie).toHaveProperty('name');
      expect(cookie).toHaveProperty('path');
      expect(cookie).toHaveProperty('sameSite');
      expect(cookie).toHaveProperty('secure');
      expect(cookie).toHaveProperty('session');
      expect(cookie).toHaveProperty('storeId');
      expect(cookie).toHaveProperty('value');
    });

    it('should preserve cookie values accurately', () => {
      const result = formatJDownloader([baseCookie]);
      const parsed = JSON.parse(result);
      const cookie = parsed[0];

      expect(cookie.name).toBe('session_id');
      expect(cookie.value).toBe('abc123');
      expect(cookie.domain).toBe('.example.com');
      expect(cookie.secure).toBe(true);
      expect(cookie.httpOnly).toBe(true);
      expect(cookie.expirationDate).toBe(1735689600);
    });

    it('should handle missing optional fields with defaults', () => {
      const minimalCookie: Cookie = {
        name: 'minimal',
        value: 'test',
        domain: 'example.com',
        path: '/',
        secure: false,
        httpOnly: false,
        storeId: '0',
      };

      const result = formatJDownloader([minimalCookie]);
      const parsed = JSON.parse(result);
      const cookie = parsed[0];

      // Should have defaults for missing optional fields
      expect(cookie.hostOnly).toBe(false);
      expect(cookie.session).toBe(false);
      expect(cookie.expirationDate).toBe(0);
      expect(cookie.sameSite).toBe('unspecified');
    });

    it('should format JSON with pretty printing', () => {
      const result = formatJDownloader([baseCookie]);
      // Pretty printed JSON has newlines
      expect(result).toContain('\n');
    });
  });

  describe('formatJDownloaderForDomain', () => {
    const cookies: Cookie[] = [
      { ...baseCookie, domain: '.youtube.com', name: 'yt_cookie' },
      { ...baseCookie, domain: '.google.com', name: 'g_cookie' },
      { ...baseCookie, domain: 'api.youtube.com', name: 'api_cookie' },
    ];

    it('should filter cookies by domain', () => {
      const result = formatJDownloaderForDomain(cookies, 'youtube.com');
      const parsed = JSON.parse(result);

      const names = parsed.map((c: { name: string }) => c.name);
      expect(names).toContain('yt_cookie');
      expect(names).toContain('api_cookie');
      expect(names).not.toContain('g_cookie');
    });

    it('should include parent domain cookies', () => {
      const result = formatJDownloaderForDomain(cookies, 'api.youtube.com');
      const parsed = JSON.parse(result);

      const names = parsed.map((c: { name: string }) => c.name);
      expect(names).toContain('yt_cookie'); // parent domain
      expect(names).toContain('api_cookie'); // exact match
    });
  });
});
