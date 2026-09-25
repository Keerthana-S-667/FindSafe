import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  headerAction,
}) => {
  return (
    <div className={`bg-surface-200 border border-surface-400 rounded-xl p-5 shadow-sm transition-all duration-200 ${className}`}>
      {(title || headerAction) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-300">
          <div>
            {title && <h3 className="text-base font-extrabold text-surface-950 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-surface-700 font-medium mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
