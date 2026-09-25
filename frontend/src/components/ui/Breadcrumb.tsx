import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-surface-200/60">
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li className="flex items-center gap-1.5">
          <Link to="/dashboard" className="hover:text-surface-50 transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-surface-200/40" />
              {item.path && !isLast ? (
                <Link to={item.path} className="hover:text-surface-50 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={`font-medium ${isLast ? 'text-surface-50' : ''}`}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
