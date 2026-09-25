import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  color?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  color = 'text-brand-700',
}) => {
  return (
    <div className="bg-surface-50 border border-surface-400 rounded-xl p-5 shadow-xs transition-all duration-150">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-surface-700 tracking-tight">{title}</span>
        <div className={`p-2 rounded-lg bg-surface-200 border border-surface-300 ${color}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold text-surface-950 font-mono tracking-tight">{value}</span>
        {subtitle && <span className="text-[11px] text-surface-700 font-medium">{subtitle}</span>}
      </div>
    </div>
  );
};
