import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  position?: 'left' | 'right';
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  position = 'right',
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionStyles = {
    left: 'left-0 translate-x-0',
    right: 'right-0 translate-x-0',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-amber-950/30 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 bottom-0 ${position === 'left' ? 'left-0' : 'right-0'} w-full max-w-md bg-surface-50 border-${
          position === 'left' ? 'r' : 'l'
        } border-surface-400 shadow-2xl flex flex-col z-50 transition-transform duration-200 ease-in-out`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-300">
          {title ? <h3 className="text-sm font-extrabold text-surface-950 tracking-tight">{title}</h3> : <div />}
          <IconButton icon={<X className="w-5 h-5" />} ariaLabel="Close drawer" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </aside>
    </div>
  );
};
