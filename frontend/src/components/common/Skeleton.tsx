import React from 'react';

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 1, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-surface-800 rounded animate-pulse w-full" />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-surface-800 border border-surface-700/80 rounded-xl p-5 space-y-3 ${className}`}>
      <div className="h-4 bg-surface-700 rounded animate-pulse w-1/3" />
      <div className="h-8 bg-surface-700 rounded animate-pulse w-2/3" />
      <div className="h-3 bg-surface-700 rounded animate-pulse w-1/2" />
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="w-full bg-surface-900 border border-surface-700 rounded-xl p-4 space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} className="h-4 bg-surface-800 rounded animate-pulse flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};
