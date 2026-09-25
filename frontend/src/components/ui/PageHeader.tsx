import React from 'react';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  action,
}) => {
  return (
    <div className="space-y-2 pb-4 border-b border-surface-300">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-1">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-surface-950 tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-surface-700 font-medium mt-1 leading-relaxed">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
};
