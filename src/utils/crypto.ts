import sjcl from 'sjcl';

/**
 * Interface for Cookie Object (matching Chrome API)
 */
export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  expirationDate?: number;
  storeId: string;
  sameSite?: "no_restriction" | "lax" | "strict" | "unspecified";
  session?: boolean;
  hostOnly?: boolean;
}

/**
 * Encrypts data using AES-GCM (Web Crypto API)
 * @param data The data to encrypt (object or string)
 * @param password The password to derive the key from
 * @returns Blob containing the encrypted data (JSON format with salt, iv, data)
 */
export async function encryptData(data: any, password: string): Promise<Blob> {
  const enc = new TextEncoder();
  const rawData = JSON.stringify(data);

  // 1. Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 2. Import password
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // 3. Derive key
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  // 4. Encrypt
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    enc.encode(rawData)
  );

  // 5. Pack result
  const result = {
    version: "v2", // v2 = WebCrypto
    salt: Array.from(salt),
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  };

  return new Blob([JSON.stringify(result)], { type: "application/octet-stream" });
}

/**
 * Decrypts data. Supports v2 (WebCrypto) and legacy SJCL (detected automatically).
 * @param fileContent The string content of the backup file
 * @param password The password
 * @returns The decrypted data object (usually Cookie[])
 */
export async function decryptData(fileContent: string, password: string): Promise<any> {
  try {
    const json = JSON.parse(fileContent);

    // Check for v2 format
    if (json.version === "v2" && json.salt && json.iv && json.data) {
      return await decryptV2(json, password);
    }

    // Check for legacy SJCL format
    // SJCL output usually has "iv", "v", "iter", "ks", "ts", "mode", "adata", "cipher", "salt", "ct"
    if (json.iv && json.v && json.iter && json.mode && json.ct) {
      return decryptLegacy(fileContent, password);
    }

    throw new Error("Unknown file format");

  } catch (e: any) {
    // If JSON parse fails, it might be legacy corrupted or just bad file
    if (e instanceof SyntaxError) {
      throw new Error("Invalid file format");
    }
    throw e;
  }
}

async function decryptV2(json: any, password: string): Promise<any> {
  const enc = new TextEncoder();
  const salt = new Uint8Array(json.salt);
  const iv = new Uint8Array(json.iv);
  const data = new Uint8Array(json.data);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      data
    );
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted));
  } catch (e) {
    throw new Error("Incorrect password or corrupted file");
  }
}

function decryptLegacy(fileContent: string, password: string): any {
  try {
    const decrypted = sjcl.decrypt(password, fileContent);
    return JSON.parse(decrypted);
  } catch (e: any) {
    // SJCL throws specific exceptions, but we just want to bubble "Incorrect password"
    if (e.message && (e.message.indexOf("corrupt") !== -1 || e.message.indexOf("invalid") !== -1)) {
      throw new Error("Incorrect password or corrupted file");
    }
    throw e;
  }
}
