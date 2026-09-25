import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Try again or check your connection.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-red-900/40 rounded-xl bg-red-950/20 text-center my-4">
      <div className="p-3 bg-red-950/60 rounded-full text-red-400 mb-3 border border-red-900/60">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-surface-50 mb-1">{title}</h4>
      <p className="text-xs text-surface-200/70 max-w-sm mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
};
