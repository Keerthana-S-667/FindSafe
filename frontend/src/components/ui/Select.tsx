import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, icon, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-bold text-surface-950 mb-1.5 tracking-tight">
            {label}
            {props.required && <span className="text-brand-600 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-surface-700">
              {icon}
            </div>
          )}
          <select
            id={selectId}
            ref={ref}
            className={`w-full bg-surface-50 border text-surface-950 text-sm rounded-lg appearance-none transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
              icon ? 'pl-9' : 'px-3'
            } pr-9 py-2 cursor-pointer ${
              error ? 'border-status-danger ring-1 ring-status-danger' : 'border-surface-400'
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-surface-50 text-surface-950">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 pointer-events-none text-surface-700" />
        </div>
        {error ? (
          <p className="mt-1.5 text-xs font-medium text-status-danger">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-surface-700">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
