import type { Cookie } from './crypto';
import browser from 'webextension-polyfill';

// Helper to check if we are in a browser extension environment
const isExtension = typeof chrome !== 'undefined' && !!chrome.cookies;

/**
 * Result detail for a single cookie restoration attempt
 */
export interface CookieRestoreDetail {
  name: string;
  domain: string;
  status: 'success' | 'skipped' | 'failed';
  reason?: string;
}

/**
 * Result of restoreCookies operation with detailed information
 */
export interface RestoreResult {
  success: number;
  failed: number;
  skipped: number;
  details: CookieRestoreDetail[];
}

/**
 * Domain group for selective backup/restore preview
 */
export interface DomainGroup {
  domain: string;
  cookies: Cookie[];
  selected: boolean;
}

/**
 * Groups cookies by their base domain for preview UI
 * @param cookies Array of cookies to group
 * @returns Array of DomainGroup objects sorted by cookie count (descending)
 */
export function groupCookiesByDomain(cookies: Cookie[]): DomainGroup[] {
  const domainMap = new Map<string, Cookie[]>();

  for (const cookie of cookies) {
    // Normalize domain (remove leading dot)
    const domain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;

    const existing = domainMap.get(domain) || [];
    existing.push(cookie);
    domainMap.set(domain, existing);
  }

  // Convert to array and sort by cookie count (most cookies first)
  const groups: DomainGroup[] = Array.from(domainMap.entries())
    .map(([domain, cookies]) => ({
      domain,
      cookies,
      selected: true, // Default to selected
    }))
    .sort((a, b) => b.cookies.length - a.cookies.length);

  return groups;
}

/**
 * Filters cookies to only include those from selected domains
 * @param cookies All cookies
 * @param selectedDomains Set of domain names to include
 * @returns Filtered cookie array
 */
export function filterCookiesByDomains(cookies: Cookie[], selectedDomains: Set<string>): Cookie[] {
  return cookies.filter((cookie) => {
    const domain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
    return selectedDomains.has(domain);
  });
}

export async function getAllCookies(): Promise<Cookie[]> {
  if (!isExtension) {
    console.warn('Not extensions environment, returning mock cookies');
    return [
      {
        name: 'test_cookie',
        value: 'test_value',
        domain: 'example.com',
        path: '/',
        secure: true,
        httpOnly: true,
        storeId: '0',
      },
    ];
  }

  // Fetch standard (unpartitioned) cookies
  const unpartitioned = await browser.cookies.getAll({});

  // Fetch partitioned cookies (CHIPS - Cookies Having Independent Partitioned State)
  // This ensures we capture cookies set with the Partitioned attribute (Chrome 119+)
  let partitioned: typeof unpartitioned = [];
  try {
    // The partitionKey parameter with empty object fetches all partitioned cookies
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- partitionKey is not typed yet
    partitioned = await browser.cookies.getAll({ partitionKey: {} } as any);
  } catch {
    // Older browsers may not support partitionKey, silently ignore
    console.debug('Partitioned cookies not supported in this browser');
  }

  // Merge and deduplicate cookies
  // Use composite key of domain + name + path + partitionKey to identify unique cookies
  const allCookies = [...unpartitioned, ...partitioned];
  const seen = new Set<string>();
  const deduplicated = allCookies.filter((cookie) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- partitionKey is not typed
    const partitionKey = (cookie as any).partitionKey?.topLevelSite || '';
    const key = `${cookie.domain}|${cookie.name}|${cookie.path}|${partitionKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Transform to match our strict interface if needed, but usually it matches
  return deduplicated as unknown as Cookie[];
}

export async function restoreCookies(
  cookies: Cookie[],
  onProgress?: (current: number, total: number) => void
): Promise<RestoreResult> {
  const details: CookieRestoreDetail[] = [];

  if (!isExtension) {
    console.warn('Not extension environment, skipping restore');
    return {
      success: cookies.length,
      failed: 0,
      skipped: 0,
      details: cookies.map((c) => ({
        name: c.name,
        domain: c.domain,
        status: 'success' as const,
      })),
    };
  }

  let success = 0;
  let failed = 0;
  let skipped = 0;
  const total = cookies.length;

  for (let i = 0; i < total; i++) {
    const cookie = cookies[i];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Browser API types are loose
    let setDetails: any = {};

    // 1. Skip expired cookies
    if (cookie.expirationDate && cookie.expirationDate < Date.now() / 1000) {
      skipped++;
      details.push({
        name: cookie.name,
        domain: cookie.domain,
        status: 'skipped',
        reason: 'Cookie has expired',
      });
      if (onProgress) {
        onProgress(i + 1, total);
      }
      continue;
    }

    const buildUrl = (secure: boolean, domain: string, path: string) => {
      return (
        'http' +
        (secure ? 's' : '') +
        '://' +
        (domain.startsWith('.') ? domain.slice(1) : domain) +
        path
      );
    };

    // Attempt 1: As-is (with cleanup)
    const url = buildUrl(cookie.secure, cookie.domain, cookie.path);

    setDetails = {
      url: url,
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      expirationDate: cookie.expirationDate,
    };

    if (
      cookie.sameSite === 'no_restriction' ||
      cookie.sameSite === 'lax' ||
      cookie.sameSite === 'strict'
    ) {
      setDetails.sameSite = cookie.sameSite;
    }

    if (cookie.hostOnly) {
      delete setDetails.domain;
    }
    if (cookie.session) {
      delete setDetails.expirationDate;
    }

    try {
      await browser.cookies.set(setDetails);
      success++;
      details.push({
        name: cookie.name,
        domain: cookie.domain,
        status: 'success',
      });
    } catch (e) {
      // Retry Strategy: HSTS Upgrade
      // If the domain restricts HTTP (e.g. .app TLD), setting an insecure cookie fails.
      // We try to force it to HTTPS and Secure.
      try {
        if (!cookie.secure) {
          setDetails.secure = true;
          setDetails.url = buildUrl(true, cookie.domain, cookie.path);
          await browser.cookies.set(setDetails);
          success++;
          details.push({
            name: cookie.name,
            domain: cookie.domain,
            status: 'success',
            reason: 'Upgraded to HTTPS',
          });
        } else {
          throw e; // Already secure, rethrow
        }
      } catch (retryError) {
        const errorMessage = retryError instanceof Error ? retryError.message : 'Unknown error';
        console.error(`Failed to restore cookie ${cookie.name} after retry:`, retryError);
        failed++;
        details.push({
          name: cookie.name,
          domain: cookie.domain,
          status: 'failed',
          reason: errorMessage,
        });
      }
    }

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return { success, failed, skipped, details };
}
