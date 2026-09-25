import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from './IconButton';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 text-xs text-surface-200/60">
      <div>
        {totalItems !== undefined ? (
          <span>Showing page {currentPage} of {totalPages} ({totalItems} total items)</span>
        ) : (
          <span>Page {currentPage} of {totalPages}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <IconButton
          icon={<ChevronLeft className="w-4 h-4" />}
          ariaLabel="Previous page"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          variant="outline"
          size="sm"
        />
        <span className="px-3 py-1 bg-surface-800 border border-surface-700 rounded-md text-surface-50 font-mono text-xs">
          {currentPage}
        </span>
        <IconButton
          icon={<ChevronRight className="w-4 h-4" />}
          ariaLabel="Next page"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          variant="outline"
          size="sm"
        />
      </div>
    </div>
  );
};
