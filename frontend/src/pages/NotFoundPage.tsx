import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 bg-surface-200 border border-surface-400 rounded-full flex items-center justify-center text-amber-700 mb-4 shadow-sm">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h1 className="text-2xl font-extrabold text-surface-950 mb-1 font-mono">404 - Resource Not Found</h1>
      <p className="text-xs text-surface-800 font-medium max-w-sm mb-6">
        The requested route or investigation document does not exist within the system directory.
      </p>
      <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/dashboard')}>
        Return to Command Center
      </Button>
    </div>
  );
};
