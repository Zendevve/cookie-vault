import type { Cookie } from './crypto';
import { downloadBlob } from './downloadBlob';
import { filterByDomain } from './filterByDomain';

/**
 * Serializes cookies into pretty-printed JSON string
 */
export function formatRawJson(cookies: Cookie[], selectedDomains?: Set<string>): string {
  const targetCookies = selectedDomains ? filterByDomain(cookies, selectedDomains) : cookies;
  return JSON.stringify(targetCookies, null, 2);
}

/**
 * Downloads cookies as an unencrypted .json file
 */
export async function downloadRawJson(
  cookies: Cookie[],
  filename = 'cookies.json',
  selectedDomains?: Set<string>
): Promise<void> {
  const content = formatRawJson(cookies, selectedDomains);
  const blob = new Blob([content], { type: 'application/json' });
  await downloadBlob(blob, filename);
}

/**
 * Formats cookies as an HTTP Cookie header string (name=value; name2=value2)
 */
export function formatCurlHeader(cookies: Cookie[], selectedDomains?: Set<string>): string {
  const targetCookies = selectedDomains ? filterByDomain(cookies, selectedDomains) : cookies;
  if (targetCookies.length === 0) return '';
  return targetCookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

/**
 * Copies the HTTP Cookie header string to the system clipboard
 */
export async function copyCurlHeaderToClipboard(
  cookies: Cookie[],
  selectedDomains?: Set<string>
): Promise<void> {
  const header = formatCurlHeader(cookies, selectedDomains);
  if (!header) {
    throw new Error('No cookies to copy');
  }
  await navigator.clipboard.writeText(header);
}

/**
 * Validates and parses raw JSON into an array of Cookie objects
 */
export function parseRawJsonCookies(jsonString: string): Cookie[] {
  try {
    const parsed = JSON.parse(jsonString) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid format: JSON payload must be an array of cookies');
    }

    const validCookies: Cookie[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === 'object' &&
        'name' in item &&
        'value' in item &&
        'domain' in item &&
        'path' in item
      ) {
        const candidate = item as Record<string, unknown>;
        validCookies.push({
          name: String(candidate.name),
          value: String(candidate.value),
          domain: String(candidate.domain),
          path: String(candidate.path),
          secure: Boolean(candidate.secure),
          httpOnly: Boolean(candidate.httpOnly),
          expirationDate:
            typeof candidate.expirationDate === 'number' ? candidate.expirationDate : undefined,
          storeId: typeof candidate.storeId === 'string' ? candidate.storeId : '0',
          sameSite:
            typeof candidate.sameSite === 'string'
              ? (candidate.sameSite as Cookie['sameSite'])
              : undefined,
          session: Boolean(candidate.session),
          hostOnly: Boolean(candidate.hostOnly),
        });
      }
    }

    if (validCookies.length === 0) {
      throw new Error('No valid cookie objects found in JSON');
    }

    return validCookies;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Failed to parse JSON cookie payload');
  }
}
