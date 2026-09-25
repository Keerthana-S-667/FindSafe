import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, User, LogOut, Bell, ShieldCheck, Server } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useHealth } from '../../hooks/useHealth';
import { Dropdown } from '../ui/Dropdown';
import { IconButton } from '../ui/IconButton';

interface TopBarProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, { title: string; category: string }> = {
  '/dashboard': { title: 'Command Center', category: 'Overview' },
  '/operations': { title: 'Operations Center', category: 'Overview' },
  '/cases': { title: 'Missing Person Cases', category: 'Case Management' },
  '/cases/new': { title: 'Create Missing Person Case', category: 'Case Management' },
  '/search/crowd': { title: 'Search the Crowd', category: 'Search' },
  '/search/records': { title: 'Search Records', category: 'Search' },
  '/search/everywhere': { title: 'Search Everywhere', category: 'Search' },
  '/reports': { title: 'Investigation Reports', category: 'Investigation' },
};

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { health } = useHealth();

  const currentPath = location.pathname;
  let pageInfo = pageTitles[currentPath];

  if (!pageInfo) {
    if (currentPath.startsWith('/cases/')) {
      pageInfo = { title: 'Case File Detail', category: 'Case Management' };
    } else {
      pageInfo = { title: 'FindSafe AI', category: 'Command Center' };
    }
  }

  const profileMenuItems = [
    {
      label: 'Sign Out',
      icon: <LogOut className="w-4 h-4" />,
      danger: true,
      onClick: () => logout(),
    },
  ];

  return (
    <header className="h-16 bg-surface-100 border-b border-surface-300 px-4 lg:px-6 flex items-center justify-between shrink-0 z-30">
      <div className="flex items-center gap-3">
        <IconButton
          icon={<Menu className="w-5 h-5" />}
          ariaLabel="Open navigation menu"
          onClick={onMenuClick}
          className="lg:hidden"
          variant="secondary"
          size="sm"
        />

        <div>
          <div className="text-[10px] text-surface-600 uppercase font-bold tracking-wider">
            {pageInfo.category}
          </div>
          <h2 className="text-base font-bold text-surface-950 tracking-tight leading-none mt-0.5">
            {pageInfo.title}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Subtle System Connection Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-surface-200 border border-surface-300 rounded-lg text-xs text-surface-800">
          <Server className="w-3.5 h-3.5 text-brand-600" />
          <span>Backend: <strong className="text-surface-950 font-bold">{health?.status || 'checking'}</strong></span>
        </div>

        {/* Notifications Icon */}
        <IconButton
          icon={<Bell className="w-4 h-4" />}
          ariaLabel="Notifications"
          variant="secondary"
          size="sm"
        />

        {/* Compact User Profile Dropdown */}
        <Dropdown
          align="right"
          trigger={
            <div className="flex items-center gap-2.5 pl-2 py-1 hover:opacity-90 transition-opacity cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-brand-500/15 border border-brand-500/40 flex items-center justify-center text-brand-700 font-bold text-xs">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'O'}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-xs font-bold text-surface-950 truncate max-w-[140px]">
                  {user?.email || 'Operator'}
                </div>
                <div className="text-[10px] text-surface-700 font-medium">
                  Authorized User
                </div>
              </div>
            </div>
          }
          items={profileMenuItems}
        />
      </div>
    </header>
  );
};
