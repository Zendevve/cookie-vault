import { useMemo } from 'react';
import { getPasswordStrength } from '../../utils/password';

interface PasswordStrengthMeterProps {
  password: string;
}

const COLORS = [
  'bg-red-500', // 0 - Very Weak
  'bg-orange-500', // 1 - Weak
  'bg-yellow-500', // 2 - Fair
  'bg-green-500', // 3 - Strong
  'bg-emerald-500', // 4 - Very Strong
];

const TEXT_COLORS = [
  'text-red-500',
  'text-orange-500',
  'text-yellow-500',
  'text-green-500',
  'text-emerald-500',
];

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              level <= strength.score ? COLORS[strength.score] : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Label and Feedback */}
      <div className="flex justify-between items-start text-xs">
        <span className={`font-medium ${TEXT_COLORS[strength.score]}`}>{strength.label}</span>
        {strength.crackTime && (
          <span className="text-muted-foreground">~{strength.crackTime} to crack</span>
        )}
      </div>

      {/* Warning */}
      {strength.warning && <p className="text-xs text-destructive">{strength.warning}</p>}

      {/* Suggestions */}
      {strength.suggestions.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-0.5">
          {strength.suggestions.map((suggestion, idx) => (
            <li key={idx}>• {suggestion}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
