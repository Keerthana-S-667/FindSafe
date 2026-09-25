import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
  };

  const variantStyles = {
    default: 'bg-surface-800 text-surface-200 border-surface-700',
    brand: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
    success: 'bg-status-success-bg text-emerald-300 border-emerald-900/60',
    warning: 'bg-status-warning-bg text-amber-300 border-amber-900/60',
    danger: 'bg-status-danger-bg text-red-300 border-red-900/60',
    info: 'bg-status-info-bg text-blue-300 border-blue-900/60',
  };

  return (
    <span className={`inline-flex items-center rounded-md font-medium border ${sizeStyles[size]} ${variantStyles[variant]}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
