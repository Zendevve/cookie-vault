import type { Cookie } from './crypto';

/**
 * JDownloader Cookie Format
 *
 * JDownloader 2 accepts cookies in a JSON format compatible with
 * the "Flag Cookies" browser extension structure.
 *
 * This format can be:
 * - Copied to clipboard and pasted into JDownloader
 * - Saved as a .json file and imported
 */

/**
 * JDownloader-compatible cookie structure.
 * Matches the "Flag Cookies" export format.
 */
export interface JDownloaderCookie {
  domain: string;
  expirationDate: number;
  hostOnly: boolean;
  httpOnly: boolean;
  name: string;
  path: string;
  sameSite: string;
  secure: boolean;
  session: boolean;
  storeId: string;
  value: string;
}

/**
 * Converts a Cookie to JDownloader format.
 */
function toJDownloaderFormat(cookie: Cookie): JDownloaderCookie {
  return {
    domain: cookie.domain,
    expirationDate: cookie.expirationDate ?? 0,
    hostOnly: cookie.hostOnly ?? false,
    httpOnly: cookie.httpOnly,
    name: cookie.name,
    path: cookie.path || '/',
    sameSite: cookie.sameSite ?? 'unspecified',
    secure: cookie.secure,
    session: cookie.session ?? false,
    storeId: cookie.storeId || '0',
    value: cookie.value,
  };
}

/**
 * Formats cookies as JDownloader-compatible JSON.
 *
 * @param cookies - Array of cookies to format
 * @returns JSON string for JDownloader import
 */
export function formatJDownloader(cookies: Cookie[]): string {
  const jdCookies = cookies.map(toJDownloaderFormat);
  return JSON.stringify(jdCookies, null, 2);
}

/**
 * Formats cookies for a specific domain in JDownloader format.
 *
 * @param cookies - Array of all cookies
 * @param domain - Target domain to filter
 * @returns JSON string for matching cookies
 */
export function formatJDownloaderForDomain(cookies: Cookie[], domain: string): string {
  const normalizedTarget = domain.toLowerCase().replace(/^\./, '');

  const filtered = cookies.filter((cookie) => {
    const cookieDomain = cookie.domain.toLowerCase().replace(/^\./, '');

    if (cookieDomain === normalizedTarget) return true;
    if (normalizedTarget.endsWith(`.${cookieDomain}`)) return true;
    if (cookieDomain.endsWith(`.${normalizedTarget}`)) return true;

    return false;
  });

  return formatJDownloader(filtered);
}

/**
 * Copies JDownloader format to clipboard.
 *
 * @param cookies - Cookies to export
 * @returns Promise that resolves when copied
 */
export async function copyJDownloaderToClipboard(cookies: Cookie[]): Promise<void> {
  const content = formatJDownloader(cookies);
  await navigator.clipboard.writeText(content);
}

/**
 * Downloads a JDownloader cookie file.
 *
 * @param cookies - Cookies to export
 * @param filename - Optional filename (defaults to cookies.json)
 */
export async function downloadJDownloader(
  cookies: Cookie[],
  filename: string = 'cookies.json'
): Promise<void> {
  const content = formatJDownloader(cookies);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  if (typeof chrome !== 'undefined' && chrome.downloads) {
    await chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true,
    });
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }

  URL.revokeObjectURL(url);
}
