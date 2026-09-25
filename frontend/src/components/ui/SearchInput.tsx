import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, onClear, className = '', placeholder = 'Search...', ...props }) => {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search className="w-4 h-4 absolute left-3 text-surface-700 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-surface-50 border border-surface-400 text-surface-950 placeholder-surface-600 text-xs rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium transition-colors"
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 text-surface-700 hover:text-surface-950 p-0.5 rounded font-bold"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
