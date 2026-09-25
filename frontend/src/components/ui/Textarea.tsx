import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, rows = 3, ...props }, ref) => {
    const areaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={areaId} className="block text-xs font-bold text-surface-950 mb-1.5 tracking-tight">
            {label}
            {props.required && <span className="text-brand-600 ml-1">*</span>}
          </label>
        )}
        <textarea
          id={areaId}
          ref={ref}
          rows={rows}
          className={`w-full bg-surface-50 border text-surface-950 placeholder-surface-600 text-sm rounded-lg px-3 py-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
            error ? 'border-status-danger ring-1 ring-status-danger' : 'border-surface-400'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-xs font-medium text-status-danger">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-surface-700">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
