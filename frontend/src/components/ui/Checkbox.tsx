import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = '', id, checked, onChange, disabled, ...props }, ref) => {
    const checkId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <label htmlFor={checkId} className={`flex items-start gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
        <div className="relative flex items-center mt-0.5">
          <input
            type="checkbox"
            id={checkId}
            ref={ref}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <div className="w-4 h-4 bg-surface-900 border border-surface-700 rounded peer-checked:bg-brand-500 peer-checked:border-brand-500 peer-focus:ring-2 peer-focus:ring-brand-500 peer-focus:ring-offset-2 peer-focus:ring-offset-surface-950 transition-colors flex items-center justify-center text-white">
            {checked && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-surface-200">{label}</span>
          {description && <p className="text-[11px] text-surface-200/50 mt-0.5">{description}</p>}
        </div>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
