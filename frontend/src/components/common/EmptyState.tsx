import React from 'react';
import { LucideIcon, FolderOpen } from 'lucide-react';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = FolderOpen,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-surface-400 rounded-xl bg-surface-200 text-center my-4">
      <div className="p-3 bg-surface-50 rounded-full text-surface-900 mb-3 border border-surface-300 shadow-xs">
        <Icon className="w-6 h-6 text-brand-600" />
      </div>
      <h4 className="text-sm font-extrabold text-surface-950 mb-1">{title}</h4>
      <p className="text-xs text-surface-700 font-medium max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
