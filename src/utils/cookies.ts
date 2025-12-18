import type { Cookie } from "./crypto";
import browser from "webextension-polyfill";

// Helper to check if we are in a browser extension environment
const isExtension = typeof chrome !== "undefined" && !!chrome.cookies;

export async function getAllCookies(): Promise<Cookie[]> {
  if (!isExtension) {
    console.warn("Not extensions environment, returning mock cookies");
    return [
      {
        name: "test_cookie",
        value: "test_value",
        domain: "example.com",
        path: "/",
        secure: true,
        httpOnly: true,
        storeId: "0",
      },
    ];
  }

  const cookies = await browser.cookies.getAll({});
  // Transform to match our strict interface if needed, but usually it matches
  return cookies as unknown as Cookie[];
}

export async function restoreCookies(
  cookies: Cookie[],
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  if (!isExtension) {
    console.warn("Not extension environment, skipping restore");
    return { success: cookies.length, failed: 0 };
  }

  let success = 0;
  let failed = 0;
  const total = cookies.length;

  for (let i = 0; i < total; i++) {
    const cookie = cookies[i];
    let setDetails: any = {};

    // 1. Skip expired cookies
    if (cookie.expirationDate && cookie.expirationDate < Date.now() / 1000) {
      continue;
    }

    const buildUrl = (secure: boolean, domain: string, path: string) => {
      return "http" + (secure ? "s" : "") + "://" + (domain.startsWith(".") ? domain.slice(1) : domain) + path;
    }

    // Attempt 1: As-is (with cleanup)
    let url = buildUrl(cookie.secure, cookie.domain, cookie.path);

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

    if (cookie.sameSite === "no_restriction" || cookie.sameSite === "lax" || cookie.sameSite === "strict") {
      setDetails.sameSite = cookie.sameSite;
    }

    if (cookie.hostOnly) { delete setDetails.domain; }
    if (cookie.session) { delete setDetails.expirationDate; }

    try {
      await browser.cookies.set(setDetails);
      success++;
    } catch (e) {
      // Retry Strategy: HSTS Upgrade
      // If the domain restricts HTTP (e.g. .app TLD), setting an insecure cookie fails.
      // We try to force it to HTTPS and Secure.
      try {
        if (!cookie.secure) {
          // console.log(`Retrying cookie ${cookie.name} with Secure upgrade...`);
          setDetails.secure = true;
          setDetails.url = buildUrl(true, cookie.domain, cookie.path);
          await browser.cookies.set(setDetails);
          success++;
          // console.log(`Retry success for ${cookie.name}`);
        } else {
          throw e; // Already secure, rethrow
        }
      } catch (retryError) {
        console.error(`Failed to restore cookie ${cookie.name} after retry:`, retryError);
        console.error("Details:", JSON.stringify(setDetails));
        failed++;
      }
    }

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return { success, failed };
}
