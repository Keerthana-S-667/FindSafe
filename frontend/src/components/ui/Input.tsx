import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, rightElement, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-surface-950 mb-1.5 tracking-tight">
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
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-surface-50 border text-surface-950 placeholder-surface-600 text-sm rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
              icon ? 'pl-9' : 'px-3'
            } ${rightElement ? 'pr-9' : 'pr-3'} py-2 ${
              error ? 'border-status-danger ring-1 ring-status-danger' : 'border-surface-400'
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center">{rightElement}</div>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs font-medium text-status-danger flex items-center gap-1">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-surface-700">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
