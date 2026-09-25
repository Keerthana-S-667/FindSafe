import React from 'react';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className = '', id, checked, onChange, disabled, ...props }, ref) => {
    const radioId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <label htmlFor={radioId} className={`flex items-start gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
        <div className="relative flex items-center mt-0.5">
          <input
            type="radio"
            id={radioId}
            ref={ref}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <div className="w-4 h-4 bg-surface-900 border border-surface-700 rounded-full peer-checked:border-brand-500 peer-focus:ring-2 peer-focus:ring-brand-500 peer-focus:ring-offset-2 peer-focus:ring-offset-surface-950 transition-colors flex items-center justify-center">
            {checked && <div className="w-2 h-2 bg-brand-500 rounded-full" />}
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

Radio.displayName = 'Radio';
