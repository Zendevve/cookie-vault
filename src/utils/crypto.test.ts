import { describe, it, expect } from 'vitest';
import { encryptData, decryptData } from './crypto';
import sjcl from 'sjcl';

// Helper to read Blob as text (jsdom compatible)
async function blobToText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe('Crypto Utils', () => {
  const password = 'mySecurePassword123!';
  const testData = [
    { name: 'cookie1', value: 'val1' },
    { name: 'cookie2', value: 'val2' },
  ];

  describe('V3 (Single Pass) Encryption', () => {
    it('should use v3 format for small data', async () => {
      const encrypted = await encryptData(testData, password);
      const text = await blobToText(encrypted);
      const json = JSON.parse(text);

      expect(json.version).toBe('v3');
      expect(json.checksum).toBeDefined();
      expect(json.data).toBeDefined();
    });

    it('should encrypt and decrypt correctly', async () => {
      const encrypted = await encryptData(testData, password);
      const text = await blobToText(encrypted);
      const decrypted = await decryptData(text, password);

      expect(decrypted).toEqual(testData);
    });

    it('should fail with incorrect checksum (tampered data)', async () => {
      const encrypted = await encryptData(testData, password);
      const text = await blobToText(encrypted);
      const json = JSON.parse(text);

      // Tamper with the checksum
      json.checksum = 'deadbeefdeadbeef'; // Invalid checksum

      await expect(decryptData(JSON.stringify(json), password)).rejects.toThrow(
        'checksum mismatch'
      );
    });
  });

  describe('V4 (Chunked) Encryption', () => {
    it('should use v4 format for large data (>1MB)', async () => {
      // Create data larger than 1MB
      const hugeString = 'x'.repeat(1024 * 1024 + 100);
      const encrypted = await encryptData(hugeString, password);
      const text = await blobToText(encrypted);
      const json = JSON.parse(text);

      expect(json.version).toBe('v4');
      expect(json.chunks).toBeDefined();
      expect(Array.isArray(json.chunks)).toBe(true);
      expect(json.chunks.length).toBeGreaterThan(1); // Should be at least 2 chunks
    });

    it('should decrypt chunked data correctly', async () => {
      const hugeString = 'x'.repeat(1024 * 1024 + 100);
      const encrypted = await encryptData(hugeString, password);
      const text = await blobToText(encrypted);

      const decrypted = await decryptData(text, password);
      expect(decrypted).toBe(hugeString);
    });
  });

  describe('V2 (Legacy WebCrypto) Compatibility', () => {
    it('should decrypt v2 format (no checksum)', async () => {
      // Create v3 data first using standard encryptData
      const encrypted = await encryptData(testData, password);
      const text = await blobToText(encrypted);
      const json = JSON.parse(text);

      // Manually downgrade to v2 format: change version and remove checksum
      json.version = 'v2';
      delete json.checksum;

      const v2Payload = JSON.stringify(json);
      const decrypted = await decryptData(v2Payload, password);

      expect(decrypted).toEqual(testData);
    });
  });

  describe('Legacy (SJCL) Decryption', () => {
    it('should decrypt legacy SJCL encrypted data', async () => {
      // Emulate how the old extension encrypted data
      const rawJson = JSON.stringify(testData);
      const encryptedLegacy = sjcl.encrypt(password, rawJson) as unknown as string;

      // Should be a string (SJCL default output)
      expect(typeof encryptedLegacy).toBe('string');

      const decrypted = await decryptData(encryptedLegacy, password);
      expect(decrypted).toEqual(testData);
    });

    it('should fail on corrupted legacy data', async () => {
      const rawJson = JSON.stringify(testData);
      const encryptedLegacy = sjcl.encrypt(password, rawJson) as unknown as string;
      // Corrupt it
      const obj = JSON.parse(encryptedLegacy);
      obj.ct = 'SGVsbG8='; // "Hello" in base64, not valid ciphertext

      await expect(decryptData(JSON.stringify(obj), password)).rejects.toThrow();
    });
  });
});
