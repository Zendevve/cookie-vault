import type { Cookie } from './crypto';

/**
 * Filters cookies by a single domain using exact, subdomain, and parent matching.
 */
export function filterByDomain(cookies: Cookie[], domain: string): Cookie[] {
  const normalizedTarget = domain.toLowerCase().replace(/^\./, '');

  return cookies.filter((cookie) => {
    const cookieDomain = cookie.domain.toLowerCase().replace(/^\./, '');

    // Exact match
    if (cookieDomain === normalizedTarget) {
      return true;
    }

    // Subdomain match (cookie domain is parent of target)
    if (normalizedTarget.endsWith(`.${cookieDomain}`)) {
      return true;
    }

    // Parent match (target is parent of cookie domain)
    if (cookieDomain.endsWith(`.${normalizedTarget}`)) {
      return true;
    }

    return false;
  });
}
