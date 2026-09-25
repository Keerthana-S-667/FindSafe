import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, AuthUser } from '../types';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType extends AuthState {
  login: (email: string, pass: string) => Promise<void>;
  loginAsDemoOperator: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isConfigured: isSupabaseConfigured,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function checkCurrentSession() {
      if (!isSupabaseConfigured) {
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            isConfigured: false,
            error: 'Supabase authentication is not configured in environment variables.',
          }));
        }
        return;
      }

      try {
        const user = await authService.getCurrentUser();
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            user,
            isAuthenticated: Boolean(user),
            isLoading: false,
            error: null,
          }));
        }
      } catch (err) {
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Authentication state check failed.',
          }));
        }
      }
    }

    checkCurrentSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authService.login(email, pass);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        isConfigured: true,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unable to sign in.',
      }));
      throw err;
    }
  };

  const loginAsDemoOperator = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authService.loginAsDemoOperator();
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        isConfigured: true,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Demo login failed.',
      }));
    }
  };

  const logout = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await authService.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isConfigured: isSupabaseConfigured,
      error: null,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, loginAsDemoOperator, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
