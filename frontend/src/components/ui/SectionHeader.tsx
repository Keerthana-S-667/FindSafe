import React from 'react';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between pb-3 mb-4 border-b border-surface-300 ${className}`}>
      <div>
        <h3 className="text-sm font-extrabold text-surface-950 tracking-wider uppercase">{title}</h3>
        {subtitle && <p className="text-[11px] text-surface-700 font-medium mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
