import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-4 lg:p-8 max-w-7xl mx-auto space-y-6 ${className}`}>
      {children}
    </div>
  );
};
