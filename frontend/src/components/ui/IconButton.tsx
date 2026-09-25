import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  ariaLabel: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  ariaLabel,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-2.5 text-base',
  };

  const variantStyles = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-xs focus:ring-brand-500',
    secondary: 'bg-surface-800 hover:bg-surface-700 text-surface-50 border border-surface-700 focus:ring-surface-500',
    outline: 'border border-surface-700 hover:bg-surface-800 text-surface-200 hover:text-surface-50 focus:ring-brand-500',
    ghost: 'hover:bg-surface-800 text-surface-200 hover:text-surface-50 focus:ring-surface-500',
    danger: 'bg-status-danger hover:bg-red-700 text-white focus:ring-status-danger',
  };

  return (
    <button
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`inline-flex items-center justify-center rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-950 disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};
