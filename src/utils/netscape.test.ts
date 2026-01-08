import { describe, it, expect } from 'vitest';
import { formatNetscape, formatNetscapeForDomain } from './netscape';
import type { Cookie } from './crypto';

describe('Netscape Cookie Format', () => {
  const baseCookie: Cookie = {
    name: 'session_id',
    value: 'abc123',
    domain: '.example.com',
    path: '/',
    secure: true,
    httpOnly: true,
    storeId: '0',
  };

  describe('formatNetscape', () => {
    it('should include the required Netscape header', () => {
      const result = formatNetscape([baseCookie]);
      expect(result).toContain('# Netscape HTTP Cookie File');
    });

    it('should use uppercase TRUE/FALSE for booleans (wget compatibility)', () => {
      const secureCookie: Cookie = { ...baseCookie, secure: true };
      const insecureCookie: Cookie = { ...baseCookie, secure: false, name: 'insecure' };

      const result = formatNetscape([secureCookie, insecureCookie]);

      // Check that TRUE and FALSE are uppercase
      const lines = result.split('\n').filter((l) => l && !l.startsWith('#'));
      const secureLine = lines.find((l) => l.includes('session_id'));
      const insecureLine = lines.find((l) => l.includes('insecure'));

      expect(secureLine).toContain('\tTRUE\t'); // secure column
      expect(insecureLine).toContain('\tFALSE\t'); // secure column
    });

    it('should convert millisecond timestamps to seconds', () => {
      // Chrome times are in seconds, but test both cases
      const msTimestamp = 1735689600000; // milliseconds
      const sTimestamp = 1735689600; // seconds

      const msCookie: Cookie = { ...baseCookie, expirationDate: msTimestamp };
      const sCookie: Cookie = { ...baseCookie, expirationDate: sTimestamp, name: 'seconds' };

      const result = formatNetscape([msCookie, sCookie]);
      const lines = result.split('\n').filter((l) => l && !l.startsWith('#'));

      // Both should produce 10-digit (seconds) timestamp
      for (const line of lines) {
        const parts = line.split('\t');
        const expiration = parts[4];
        expect(expiration.length).toBeLessThanOrEqual(10);
        expect(parseInt(expiration)).toBeLessThan(9999999999); // seconds range
      }
    });

    it('should use 0 for session cookies', () => {
      const sessionCookie: Cookie = { ...baseCookie, session: true };
      const result = formatNetscape([sessionCookie]);

      const lines = result.split('\n').filter((l) => l && !l.startsWith('#'));
      const parts = lines[0].split('\t');
      expect(parts[4]).toBe('0');
    });

    it('should handle hostOnly cookies correctly', () => {
      // hostOnly=true means exact domain match (no leading dot)
      const hostOnlyCookie: Cookie = {
        ...baseCookie,
        domain: 'exact.example.com',
        hostOnly: true,
      };

      const result = formatNetscape([hostOnlyCookie]);
      const lines = result.split('\n').filter((l) => l && !l.startsWith('#'));
      const parts = lines[0].split('\t');

      // Domain should not have leading dot for hostOnly
      expect(parts[0]).toBe('exact.example.com');
      // Flag should be FALSE (no subdomain inclusion)
      expect(parts[1]).toBe('FALSE');
    });

    it('should add leading dot for non-hostOnly cookies', () => {
      const subdomainCookie: Cookie = {
        ...baseCookie,
        domain: 'example.com', // no dot
        hostOnly: false,
      };

      const result = formatNetscape([subdomainCookie]);
      const lines = result.split('\n').filter((l) => l && !l.startsWith('#'));
      const parts = lines[0].split('\t');

      // Domain should have leading dot for subdomain inclusion
      expect(parts[0]).toBe('.example.com');
      // Flag should be TRUE
      expect(parts[1]).toBe('TRUE');
    });

    it('should produce tab-separated values with 7 columns', () => {
      const result = formatNetscape([baseCookie]);
      const lines = result.split('\n').filter((l) => l && !l.startsWith('#'));

      for (const line of lines) {
        const parts = line.split('\t');
        expect(parts).toHaveLength(7);
      }
    });
  });

  describe('formatNetscapeForDomain', () => {
    const cookies: Cookie[] = [
      { ...baseCookie, domain: '.youtube.com', name: 'yt_cookie' },
      { ...baseCookie, domain: '.google.com', name: 'g_cookie' },
      { ...baseCookie, domain: 'accounts.google.com', name: 'accounts_cookie' },
    ];

    it('should filter cookies by exact domain match', () => {
      const result = formatNetscapeForDomain(cookies, 'youtube.com');
      expect(result).toContain('yt_cookie');
      expect(result).not.toContain('g_cookie');
    });

    it('should include parent domain cookies for subdomains', () => {
      const result = formatNetscapeForDomain(cookies, 'accounts.google.com');
      expect(result).toContain('accounts_cookie');
      expect(result).toContain('g_cookie'); // parent domain should match
    });

    it('should handle domains with leading dots', () => {
      const result = formatNetscapeForDomain(cookies, '.youtube.com');
      expect(result).toContain('yt_cookie');
    });

    it('should be case-insensitive', () => {
      const result = formatNetscapeForDomain(cookies, 'YOUTUBE.COM');
      expect(result).toContain('yt_cookie');
    });
  });
});
