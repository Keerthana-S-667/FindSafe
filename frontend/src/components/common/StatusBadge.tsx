import React from 'react';
import { formatStatusLabel } from '../../utils/formatters';

interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'priority';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getColors = (s: string) => {
    switch (s.toUpperCase()) {
      case 'ACTIVE':
      case 'HIGH':
      case 'CRITICAL':
        return 'bg-status-danger-bg text-red-300 border-red-900/60';
      case 'RESOLVED':
      case 'CONFIRMED':
        return 'bg-status-success-bg text-emerald-300 border-emerald-900/60';
      case 'PENDING_REVIEW':
      case 'UNDER_REVIEW':
      case 'MEDIUM':
        return 'bg-status-warning-bg text-amber-300 border-amber-900/60';
      default:
        return 'bg-surface-800 text-surface-200 border-surface-700';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getColors(status)}`}>
      {formatStatusLabel(status)}
    </span>
  );
};
