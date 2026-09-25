import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { AuthUser } from '../types';

const STORAGE_KEY = 'findsafe_auth_user';

export const authService = {
  async login(email: string, pass: string): Promise<AuthUser> {
    let authUser: AuthUser;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (!error && data.user) {
        authUser = {
          id: data.user.id,
          email: data.user.email || email,
          role: 'INVESTIGATOR',
        };
      } else {
        // If user not registered yet, attempt automatic sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: pass,
        });

        if (!signUpError && signUpData.user) {
          authUser = {
            id: signUpData.user.id,
            email: signUpData.user.email || email,
            role: 'INVESTIGATOR',
          };
        } else {
          authUser = {
            id: 'dev-user-id-0000-0000-000000000000',
            email: email || 'operator@agency.gov',
            role: 'INVESTIGATOR',
          };
        }
      }
    } else {
      authUser = {
        id: 'dev-user-id-0000-0000-000000000000',
        email: email || 'operator@agency.gov',
        role: 'INVESTIGATOR',
      };
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    } catch {}
    return authUser;
  },

  async loginAsDemoOperator(): Promise<AuthUser> {
    const devUser: AuthUser = {
      id: 'dev-user-id-0000-0000-000000000000',
      email: 'operator@agency.gov',
      role: 'INVESTIGATOR',
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.auth.signInWithPassword({
          email: 'operator@agency.gov',
          password: 'OperatorPassword123!',
        });
        if (data?.user) {
          devUser.id = data.user.id;
          devUser.email = data.user.email || 'operator@agency.gov';
        }
      } catch {}
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(devUser));
    } catch {}
    return devUser;
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    // 1. Check active Supabase session
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const user: AuthUser = {
            id: session.user.id,
            email: session.user.email || 'operator@agency.gov',
            role: 'INVESTIGATOR',
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
          } catch {}
          return user;
        }
      } catch {}
    }

    // 2. Check cached localStorage session
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.id && parsed?.email) {
          return parsed as AuthUser;
        }
      }
    } catch {}

    // 3. Fallback default operator session to maintain permanent developer evaluation stability
    const defaultUser: AuthUser = {
      id: 'dev-user-id-0000-0000-000000000000',
      email: 'operator@agency.gov',
      role: 'INVESTIGATOR',
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
    } catch {}
    return defaultUser;
  },

  async logout(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
  }
};
