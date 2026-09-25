import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`border-b border-surface-300 flex items-center gap-1 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors duration-150 whitespace-nowrap focus:outline-none focus:text-brand-700 ${
              isActive
                ? 'border-brand-500 text-brand-700 font-extrabold'
                : 'border-transparent text-surface-700 hover:text-surface-950 hover:border-surface-400'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-brand-500/20 text-brand-800 font-bold' : 'bg-surface-300 text-surface-800'}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
