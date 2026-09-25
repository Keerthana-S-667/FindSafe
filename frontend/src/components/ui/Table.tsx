import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyText?: string;
  isLoading?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyText = 'No data available',
  isLoading = false,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-surface-400 bg-surface-50 shadow-xs">
      <table className="w-full text-left text-xs text-surface-800 border-collapse">
        <thead className="bg-surface-200 border-b border-surface-300 text-[11px] font-bold text-surface-700 uppercase tracking-wider">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-300 font-sans">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-surface-700">
                Loading dataset...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-surface-700 font-medium">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={keyExtractor(row)} className="hover:bg-surface-200/60 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 align-middle text-surface-950 font-medium ${col.className || ''}`}>
                    {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
