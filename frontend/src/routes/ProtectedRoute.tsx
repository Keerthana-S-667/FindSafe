import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, isConfigured } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center">
        <LoadingSpinner label="Authenticating session..." />
      </div>
    );
  }

  // If Supabase Auth is not configured in dev environment, allow access to evaluate application shell
  if (!isConfigured) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
