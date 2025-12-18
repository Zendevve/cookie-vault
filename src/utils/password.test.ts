import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPasswordStrength, generateChecksum, verifyChecksum } from './password';

// Mock zxcvbn for predictable test results
vi.mock('zxcvbn', () => ({
  default: vi.fn((password: string) => {
    if (password.length === 0) {
      return {
        score: 0,
        feedback: { suggestions: [], warning: '' },
        crack_times_display: { offline_slow_hashing_1e4_per_second: '' },
      };
    }
    if (password.length < 6) {
      return {
        score: 0,
        feedback: { suggestions: ['Add more characters'], warning: 'Too short' },
        crack_times_display: { offline_slow_hashing_1e4_per_second: 'instant' },
      };
    }
    if (password.length < 10) {
      return {
        score: 2,
        feedback: { suggestions: [], warning: '' },
        crack_times_display: { offline_slow_hashing_1e4_per_second: '1 hour' },
      };
    }
    return {
      score: 4,
      feedback: { suggestions: [], warning: '' },
      crack_times_display: { offline_slow_hashing_1e4_per_second: 'centuries' },
    };
  }),
}));

describe('password utilities', () => {
  describe('getPasswordStrength', () => {
    it('should return Very Weak for empty password', () => {
      const result = getPasswordStrength('');
      expect(result.score).toBe(0);
      expect(result.label).toBe('Very Weak');
      expect(result.suggestions).toContain('Enter a password');
    });

    it('should return Very Weak for short password', () => {
      const result = getPasswordStrength('abc');
      expect(result.score).toBe(0);
      expect(result.label).toBe('Very Weak');
      expect(result.warning).toBe('Too short');
    });

    it('should return Fair for medium password', () => {
      const result = getPasswordStrength('password');
      expect(result.score).toBe(2);
      expect(result.label).toBe('Fair');
    });

    it('should return Very Strong for long password', () => {
      const result = getPasswordStrength('myVeryLongAndSecurePassword123!');
      expect(result.score).toBe(4);
      expect(result.label).toBe('Very Strong');
    });

    it('should include crack time estimate', () => {
      const result = getPasswordStrength('password');
      expect(result.crackTime).toBe('1 hour');
    });
  });

  describe('generateChecksum', () => {
    it('should generate consistent checksums', async () => {
      const data = 'test data';
      const hash1 = await generateChecksum(data);
      const hash2 = await generateChecksum(data);
      expect(hash1).toBe(hash2);
    });

    it('should generate different checksums for different data', async () => {
      const hash1 = await generateChecksum('data1');
      const hash2 = await generateChecksum('data2');
      expect(hash1).not.toBe(hash2);
    });

    it('should return 64-character hex string', async () => {
      const hash = await generateChecksum('test');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('verifyChecksum', () => {
    it('should return true for valid checksum', async () => {
      const data = 'test data';
      const hash = await generateChecksum(data);
      const isValid = await verifyChecksum(data, hash);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid checksum', async () => {
      const isValid = await verifyChecksum('test data', 'invalid-hash');
      expect(isValid).toBe(false);
    });

    it('should detect data corruption', async () => {
      const originalData = 'original';
      const hash = await generateChecksum(originalData);
      const isValid = await verifyChecksum('corrupted', hash);
      expect(isValid).toBe(false);
    });
  });
});
