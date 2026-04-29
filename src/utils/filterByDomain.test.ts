import { describe, it, expect } from 'vitest';
import { filterByDomain } from './filterByDomain';
import type { Cookie } from './crypto';

const baseCookie: Cookie = {
  name: 'session',
  value: 'abc',
  domain: 'example.com',
  path: '/',
  secure: true,
  httpOnly: true,
  storeId: '0',
};

describe('filterByDomain', () => {
  it('should return exact domain matches', () => {
    const cookies = [
      { ...baseCookie, domain: 'example.com' },
      { ...baseCookie, domain: 'other.com' },
    ];
    const result = filterByDomain(cookies, 'example.com');
    expect(result).toHaveLength(1);
    expect(result[0].domain).toBe('example.com');
  });

  it('should match subdomain when cookie domain is parent', () => {
    const cookies = [{ ...baseCookie, domain: 'example.com' }];
    const result = filterByDomain(cookies, 'sub.example.com');
    expect(result).toHaveLength(1);
  });

  it('should match parent when cookie domain is subdomain', () => {
    const cookies = [{ ...baseCookie, domain: 'sub.example.com' }];
    const result = filterByDomain(cookies, 'example.com');
    expect(result).toHaveLength(1);
  });

  it('should ignore leading dots', () => {
    const cookies = [{ ...baseCookie, domain: '.example.com' }];
    const result = filterByDomain(cookies, 'example.com');
    expect(result).toHaveLength(1);
  });

  it('should be case-insensitive', () => {
    const cookies = [{ ...baseCookie, domain: 'Example.COM' }];
    const result = filterByDomain(cookies, 'example.com');
    expect(result).toHaveLength(1);
  });

  it('should return empty array when no matches', () => {
    const cookies = [{ ...baseCookie, domain: 'a.com' }];
    const result = filterByDomain(cookies, 'b.com');
    expect(result).toHaveLength(0);
  });
});
