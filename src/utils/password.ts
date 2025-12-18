import zxcvbn from 'zxcvbn';

/**
 * Password strength result
 */
export interface PasswordStrength {
  /** Score from 0-4 (0=weak, 4=very strong) */
  score: 0 | 1 | 2 | 3 | 4;
  /** Human-readable label */
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  /** Feedback suggestions */
  suggestions: string[];
  /** Warning message if any */
  warning: string;
  /** Estimated crack time display */
  crackTime: string;
}

const SCORE_LABELS: Record<number, PasswordStrength['label']> = {
  0: 'Very Weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Strong',
  4: 'Very Strong',
};

/**
 * Analyze password strength using zxcvbn
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'Very Weak',
      suggestions: ['Enter a password'],
      warning: '',
      crackTime: '',
    };
  }

  const result = zxcvbn(password);

  return {
    score: result.score as PasswordStrength['score'],
    label: SCORE_LABELS[result.score],
    suggestions: result.feedback.suggestions,
    warning: result.feedback.warning,
    crackTime: String(result.crack_times_display.offline_slow_hashing_1e4_per_second),
  };
}

/**
 * Generate SHA-256 checksum of data
 */
export async function generateChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify data against a checksum
 */
export async function verifyChecksum(data: string, expectedHash: string): Promise<boolean> {
  const actualHash = await generateChecksum(data);
  return actualHash === expectedHash;
}
