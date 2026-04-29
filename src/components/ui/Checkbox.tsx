import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export function Checkbox({
  checked,
  onChange,
  className = '',
  id,
  'aria-label': ariaLabel,
}: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center justify-center cursor-pointer touch-target ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
        aria-label={ariaLabel}
      />
      <span
        className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 flex-shrink-0 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2"
        aria-hidden="true"
      >
        {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </span>
    </label>
  );
}
