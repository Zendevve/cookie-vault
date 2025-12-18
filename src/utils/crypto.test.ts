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

  describe('V2 (WebCrypto) Encryption', () => {
    it('should encrypt and decrypt data correctly (round trip)', async () => {
      const encrypted = await encryptData(testData, password);
      expect(encrypted).toBeInstanceOf(Blob);

      const text = await blobToText(encrypted);
      const decrypted = await decryptData(text, password);

      expect(decrypted).toEqual(testData);
    });

    it('should fail with incorrect password', async () => {
      const encrypted = await encryptData(testData, password);
      const text = await blobToText(encrypted);

      await expect(decryptData(text, 'wrongPassword')).rejects.toThrow('Incorrect password');
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
