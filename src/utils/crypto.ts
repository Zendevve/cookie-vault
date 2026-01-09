import sjcl from 'sjcl';
import { generateChecksum, verifyChecksum } from './password';

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
  sameSite?: 'no_restriction' | 'lax' | 'strict' | 'unspecified';
  session?: boolean;
  hostOnly?: boolean;
}

/**
 * Encrypts data using AES-GCM (Web Crypto API) with chunked processing
 * @param data The data to encrypt (object or string)
 * @param password The password to derive the key from
 * @param onProgress Optional progress callback (current, total)
 * @returns Blob containing the encrypted data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic encryption function accepts any data
export async function encryptData(
  data: any,
  password: string,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const enc = new TextEncoder();
  const rawData = JSON.stringify(data);
  const dataBytes = enc.encode(rawData);
  const chunkSize = 1024 * 1024; // 1MB chunks

  // For small data, use single-pass encryption (faster, simpler)
  if (dataBytes.length <= chunkSize) {
    return encryptSinglePass(rawData, password, onProgress);
  }

  // For large data, use chunked encryption
  return encryptChunked(rawData, dataBytes, password, chunkSize, onProgress);
}

/**
 * Single-pass encryption for small datasets (backward compatible with v3)
 */
async function encryptSinglePass(
  rawData: string,
  password: string,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const enc = new TextEncoder();

  if (onProgress) onProgress(0, 3); // Starting

  // 1. Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 2. Import password
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  if (onProgress) onProgress(1, 3); // Key derived

  // 3. Derive key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // 4. Encrypt
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    enc.encode(rawData)
  );

  if (onProgress) onProgress(2, 3); // Encrypted

  // 5. Generate checksum of original data for integrity verification
  const checksum = await generateChecksum(rawData);

  // 6. Pack result
  const result = {
    version: 'v3', // Keep v3 for single-pass (backward compatible)
    salt: Array.from(salt),
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
    checksum: checksum,
  };

  if (onProgress) onProgress(3, 3); // Complete

  return new Blob([JSON.stringify(result)], { type: 'application/octet-stream' });
}

/**
 * Chunked encryption for large datasets
 */
async function encryptChunked(
  rawData: string,
  dataBytes: Uint8Array,
  password: string,
  chunkSize: number,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const enc = new TextEncoder();
  const totalBytes = dataBytes.length;
  const numChunks = Math.ceil(totalBytes / chunkSize);

  // Progress: key derivation is 10% of the work, then chunks are the remaining 90%
  const progressSteps = numChunks + 1;

  if (onProgress) onProgress(0, progressSteps);

  // 1. Generate salt (shared across all chunks)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 2. Import password and derive key (once)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  if (onProgress) onProgress(1, progressSteps); // Key derived

  // 3. Encrypt each chunk
  const encryptedChunks: { iv: number[]; data: number[] }[] = [];

  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalBytes);
    const chunk = dataBytes.slice(start, end);

    // Each chunk gets its own IV for security
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      chunk
    );

    encryptedChunks.push({
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted)),
    });

    if (onProgress) onProgress(i + 2, progressSteps); // +2 because we already counted key derivation
  }

  // 4. Generate checksum of original data
  const checksum = await generateChecksum(rawData);

  // 5. Pack result
  const result = {
    version: 'v4', // New version for chunked format
    salt: Array.from(salt),
    chunks: encryptedChunks,
    chunkSize: chunkSize,
    totalSize: totalBytes,
    checksum: checksum,
  };

  if (onProgress) onProgress(progressSteps, progressSteps); // Complete

  return new Blob([JSON.stringify(result)], { type: 'application/octet-stream' });
}


/**
 * Decrypts data. Supports v4 (chunked), v3/v2 (WebCrypto), and legacy SJCL (detected automatically).
 * @param fileContent The string content of the backup file
 * @param password The password
 * @param onProgress Optional progress callback (current, total)
 * @returns The decrypted data object (usually Cookie[])
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Returns parsed JSON of unknown structure
export async function decryptData(
  fileContent: string,
  password: string,
  onProgress?: (current: number, total: number) => void
): Promise<any> {
  try {
    const json = JSON.parse(fileContent);

    // Check for v4 format (chunked)
    if (json.version === 'v4' && json.salt && json.chunks && Array.isArray(json.chunks)) {
      return await decryptChunked(json, password, onProgress);
    }

    // Check for v2/v3 format (WebCrypto single-pass)
    if ((json.version === 'v2' || json.version === 'v3') && json.salt && json.iv && json.data) {
      return await decryptWebCrypto(json, password, onProgress);
    }

    // Check for legacy SJCL format
    // SJCL output usually has "iv", "v", "iter", "ks", "ts", "mode", "adata", "cipher", "salt", "ct"
    if (json.iv && json.v && json.iter && json.mode && json.ct) {
      return decryptLegacy(fileContent, password);
    }

    throw new Error('Unknown file format');
  } catch (e: unknown) {
    // If JSON parse fails, it might be legacy corrupted or just bad file
    if (e instanceof SyntaxError) {
      throw new Error('Invalid file format');
    }
    throw e;
  }
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Parsed JSON structures
async function decryptWebCrypto(
  json: any,
  password: string,
  onProgress?: (current: number, total: number) => void
): Promise<any> {
  const enc = new TextEncoder();
  const salt = new Uint8Array(json.salt);
  const iv = new Uint8Array(json.iv);
  const data = new Uint8Array(json.data);

  if (onProgress) onProgress(0, 2); // Starting

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  if (onProgress) onProgress(1, 2); // Key derived

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );
    const dec = new TextDecoder();
    const decryptedText = dec.decode(decrypted);

    // Verify checksum for v3 format
    if (json.version === 'v3' && json.checksum) {
      const isValid = await verifyChecksum(decryptedText, json.checksum);
      if (!isValid) {
        throw new Error('Backup file corrupted (checksum mismatch)');
      }
    }

    if (onProgress) onProgress(2, 2); // Complete

    return JSON.parse(decryptedText);
  } catch (err) {
    if (err instanceof Error && err.message.includes('checksum')) {
      throw err;
    }
    throw new Error('Incorrect password or corrupted file');
  }
}

/**
 * Decrypt v4 chunked format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function decryptChunked(
  json: any,
  password: string,
  onProgress?: (current: number, total: number) => void
): Promise<any> {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const salt = new Uint8Array(json.salt);
  const chunks = json.chunks;
  const numChunks = chunks.length;

  // Progress: key derivation + chunks
  const progressSteps = numChunks + 1;

  if (onProgress) onProgress(0, progressSteps);

  // 1. Import password and derive key (once)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  if (onProgress) onProgress(1, progressSteps); // Key derived

  // 2. Decrypt each chunk
  const decryptedChunks: Uint8Array[] = [];

  try {
    for (let i = 0; i < numChunks; i++) {
      const chunk = chunks[i];
      const iv = new Uint8Array(chunk.iv);
      const data = new Uint8Array(chunk.data);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        data
      );

      decryptedChunks.push(new Uint8Array(decrypted));

      if (onProgress) onProgress(i + 2, progressSteps);
    }

    // 3. Combine chunks
    const totalSize = json.totalSize;
    const combined = new Uint8Array(totalSize);
    let offset = 0;

    for (const chunk of decryptedChunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    const decryptedText = dec.decode(combined);

    // 4. Verify checksum
    if (json.checksum) {
      const isValid = await verifyChecksum(decryptedText, json.checksum);
      if (!isValid) {
        throw new Error('Backup file corrupted (checksum mismatch)');
      }
    }

    if (onProgress) onProgress(progressSteps, progressSteps); // Complete

    return JSON.parse(decryptedText);
  } catch (err) {
    if (err instanceof Error && err.message.includes('checksum')) {
      throw err;
    }
    throw new Error('Incorrect password or corrupted file');
  }
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Returns parsed JSON
function decryptLegacy(fileContent: string, password: string): any {
  try {
    const decrypted = sjcl.decrypt(password, fileContent);
    return JSON.parse(decrypted);
  } catch (e: unknown) {
    // SJCL throws specific exceptions, but we just want to bubble "Incorrect password"
    const error = e as Error;
    if (
      error.message &&
      (error.message.indexOf('corrupt') !== -1 || error.message.indexOf('invalid') !== -1)
    ) {
      throw new Error('Incorrect password or corrupted file');
    }
    throw e;
  }
}
