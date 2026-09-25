import React from 'react';

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      <span className="text-xs font-medium text-surface-200/70">{label}</span>
    </div>
  );
};
