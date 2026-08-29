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
  count: number;
  cookies: Cookie[];
  selected: boolean;
}

/**
 * High-level security and storage statistics for cookie collection
 */
export interface CookieStats {
  totalCookies: number;
  totalDomains: number;
  secureCount: number;
  securePercentage: number;
  httpOnlyCount: number;
  httpOnlyPercentage: number;
  sessionCount: number;
  expiringSoonCount: number;
  totalSizeBytes: number;
}

/**
 * Constructs a fully qualified URL for a cookie
 */
export function buildCookieUrl(cookie: Pick<Cookie, 'secure' | 'domain' | 'path'>): string {
  const protocol = cookie.secure ? 'https:' : 'http:';
  const cleanDomain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
  const cleanPath = cookie.path.startsWith('/') ? cookie.path : `/${cookie.path}`;
  return `${protocol}//${cleanDomain}${cleanPath}`;
}

/**
 * Groups cookies by their base domain for preview UI
 * @param cookies Array of cookies to group
 * @returns Array of DomainGroup objects sorted by cookie count (descending)
 */
export function groupCookiesByDomain(cookies: Cookie[]): DomainGroup[] {
  const groups = new Map<string, Cookie[]>();

  for (const cookie of cookies) {
    const domain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
    if (!groups.has(domain)) {
      groups.set(domain, []);
    }
    groups.get(domain)!.push(cookie);
  }

  const result: DomainGroup[] = [];
  for (const [domain, domainCookies] of groups.entries()) {
    result.push({
      domain,
      count: domainCookies.length,
      cookies: domainCookies,
      selected: true,
    });
  }

  // Sort by count descending, then domain alphabetically
  result.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.domain.localeCompare(b.domain);
  });

  return result;
}

/**
 * Filters cookies to only include those from selected domains
 * @param cookies Array of all cookies
 * @param selectedDomains Set of domain names to include
 * @returns Filtered array of cookies
 */
export function filterCookiesByDomains(cookies: Cookie[], selectedDomains: Set<string>): Cookie[] {
  return cookies.filter((cookie) => {
    const domain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
    return selectedDomains.has(domain);
  });
}

/**
 * Computes security and volume statistics for a cookie collection
 */
export function calculateCookieStats(cookies: Cookie[]): CookieStats {
  const total = cookies.length;
  if (total === 0) {
    return {
      totalCookies: 0,
      totalDomains: 0,
      secureCount: 0,
      securePercentage: 0,
      httpOnlyCount: 0,
      httpOnlyPercentage: 0,
      sessionCount: 0,
      expiringSoonCount: 0,
      totalSizeBytes: 0,
    };
  }

  const domains = new Set<string>();
  let secureCount = 0;
  let httpOnlyCount = 0;
  let sessionCount = 0;
  let expiringSoonCount = 0;
  let totalSizeBytes = 0;

  const nowSeconds = Date.now() / 1000;
  const twentyFourHoursFromNow = nowSeconds + 24 * 60 * 60;

  for (const c of cookies) {
    const domain = c.domain.startsWith('.') ? c.domain.slice(1) : c.domain;
    domains.add(domain);

    if (c.secure) secureCount++;
    if (c.httpOnly) httpOnlyCount++;
    if (c.session || !c.expirationDate) sessionCount++;

    if (
      c.expirationDate &&
      c.expirationDate > nowSeconds &&
      c.expirationDate <= twentyFourHoursFromNow
    ) {
      expiringSoonCount++;
    }

    totalSizeBytes +=
      (c.name?.length || 0) +
      (c.value?.length || 0) +
      (c.domain?.length || 0) +
      (c.path?.length || 0);
  }

  return {
    totalCookies: total,
    totalDomains: domains.size,
    secureCount,
    securePercentage: Math.round((secureCount / total) * 100),
    httpOnlyCount,
    httpOnlyPercentage: Math.round((httpOnlyCount / total) * 100),
    sessionCount,
    expiringSoonCount,
    totalSizeBytes,
  };
}

/**
 * Retrieves the hostname of the currently active browser tab
 */
export async function getActiveTabDomain(): Promise<string | null> {
  if (typeof browser === 'undefined' || !browser.tabs?.query) {
    return null;
  }

  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    if (!activeTab?.url) return null;

    const url = new URL(activeTab.url);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.hostname;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Removes a single cookie from browser storage
 */
export async function deleteCookie(cookie: Cookie): Promise<boolean> {
  if (!isExtension || typeof browser === 'undefined' || !browser.cookies?.remove) {
    return true;
  }

  try {
    const url = buildCookieUrl(cookie);
    await browser.cookies.remove({
      url,
      name: cookie.name,
      storeId: cookie.storeId,
    });
    return true;
  } catch (err) {
    console.error(`Failed to delete cookie ${cookie.name}:`, err);
    return false;
  }
}

/**
 * Deletes all cookies belonging to a given domain
 */
export async function deleteCookiesForDomain(
  domain: string
): Promise<{ deleted: number; failed: number }> {
  const allCookies = await getAllCookies();
  const normalizedTarget = domain.startsWith('.') ? domain.slice(1) : domain;

  const targetCookies = allCookies.filter((c) => {
    const d = c.domain.startsWith('.') ? c.domain.slice(1) : c.domain;
    return d === normalizedTarget || d.endsWith(`.${normalizedTarget}`);
  });

  let deleted = 0;
  let failed = 0;

  for (const cookie of targetCookies) {
    const ok = await deleteCookie(cookie);
    if (ok) {
      deleted++;
    } else {
      failed++;
    }
  }

  return { deleted, failed };
}

export async function getAllCookies(): Promise<Cookie[]> {
  if (!isExtension) {
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
  let partitioned: typeof unpartitioned = [];
  try {
    interface PartitionQuery {
      partitionKey?: Record<string, unknown>;
    }
    const query: PartitionQuery = { partitionKey: {} };
    partitioned = await browser.cookies.getAll(
      query as unknown as Parameters<typeof browser.cookies.getAll>[0]
    );
  } catch {
    // Partitioned cookies not supported in older browser engines
  }

  // Merge and deduplicate cookies
  const allCookies = [...unpartitioned, ...partitioned];
  const seen = new Set<string>();
  const deduplicated = allCookies.filter((cookie) => {
    let partition = '';
    if (cookie && typeof cookie === 'object' && 'partitionKey' in cookie) {
      const pKey = cookie.partitionKey;
      if (pKey && typeof pKey === 'object' && 'topLevelSite' in pKey) {
        partition = String(pKey.topLevelSite || '');
      }
    }
    const key = `${cookie.domain}|${cookie.name}|${cookie.path}|${partition}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduplicated as unknown as Cookie[];
}

export async function restoreCookies(
  cookies: Cookie[],
  onProgress?: (current: number, total: number) => void
): Promise<RestoreResult> {
  const details: CookieRestoreDetail[] = [];

  if (!isExtension) {
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

    // Attempt 1: As-is (with cleanup)
    const url = buildCookieUrl(cookie);

    const setDetails: Record<string, unknown> = {
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
      await browser.cookies.set(setDetails as unknown as Parameters<typeof browser.cookies.set>[0]);
      success++;
      details.push({
        name: cookie.name,
        domain: cookie.domain,
        status: 'success',
      });
    } catch (e) {
      // Retry Strategy: HSTS Upgrade
      try {
        if (!cookie.secure) {
          setDetails.secure = true;
          setDetails.url = buildCookieUrl({
            secure: true,
            domain: cookie.domain,
            path: cookie.path,
          });
          await browser.cookies.set(
            setDetails as unknown as Parameters<typeof browser.cookies.set>[0]
          );
          success++;
          details.push({
            name: cookie.name,
            domain: cookie.domain,
            status: 'success',
            reason: 'Upgraded to HTTPS',
          });
        } else {
          throw e;
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
