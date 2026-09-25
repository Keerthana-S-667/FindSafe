import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileSearch,
  Globe,
  FileText,
  Shield,
  Activity,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navSections = [
  {
    title: 'COMMAND CENTER',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Operations Center', path: '/operations', icon: Activity },
      { name: 'Cases', path: '/cases', icon: FolderKanban },
    ],
  },
  {
    title: 'SEARCH',
    items: [
      { name: 'Search the Crowd', path: '/search/crowd', icon: Users },
      { name: 'Search Records', path: '/search/records', icon: FileSearch },
      { name: 'Search Everywhere', path: '/search/everywhere', icon: Globe },
    ],
  },
  {
    title: 'INVESTIGATION',
    items: [
      { name: 'Reports', path: '/reports', icon: FileText },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  // Lock body scroll and attach Escape key listener when mobile drawer is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-amber-950/30 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container (240–260px width => w-64) */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-surface-100 border-r border-surface-300 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header Branding */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-surface-300 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-500/15 border border-brand-500/40 flex items-center justify-center text-brand-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-surface-950 tracking-wider leading-none">FindSafe AI</h1>
              <span className="text-[10px] text-surface-700 font-medium tracking-tight block mt-1">
                Public Safety Intelligence
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-surface-700 hover:text-surface-950 p-1 rounded-md"
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-surface-600 uppercase">
                {section.title}
              </div>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => onClose()}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 ${
                          isActive
                            ? 'bg-brand-500/15 text-brand-700 border-l-2 border-brand-500 font-bold'
                            : 'text-surface-800 hover:bg-surface-200 hover:text-surface-950'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* System Status Footer */}
        <div className="p-4 border-t border-surface-300 bg-surface-200/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <div className="text-xs">
              <div className="text-surface-900 font-semibold">Command Active</div>
              <div className="text-[10px] text-surface-700">Phase 2 Architecture Shell</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
