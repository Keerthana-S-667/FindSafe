import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface FilterBarProps {
  children: React.ReactNode;
  onReset?: () => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({ children, onReset, className = '' }) => {
  return (
    <div className={`p-3.5 bg-surface-50 border border-surface-400 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs ${className}`}>
      <div className="flex items-center gap-2 text-xs font-extrabold text-surface-950 shrink-0">
        <Filter className="w-4 h-4 text-brand-600" />
        <span>Filters</span>
      </div>
      <div className="flex flex-wrap items-center gap-3 flex-1">{children}</div>
      {onReset && (
        <Button variant="ghost" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={onReset}>
          Reset
        </Button>
      )}
    </div>
  );
};
