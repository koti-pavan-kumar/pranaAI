/**
 * Authentication System — Supabase with localStorage fallback
 * Uses Supabase Auth when configured, falls back to localStorage
 */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';

interface User {
  id?: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isSupabase: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ============ localStorage helpers ============

function getCurrentUser(): User | null {
  try {
    const data = localStorage.getItem('pranaai_session');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function saveSession(user: User) {
  localStorage.setItem('pranaai_session', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('pranaai_session');
}

// ============ Auth Provider ============

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getCurrentUser);
  const [isSupabase, setIsSupabase] = useState(false);

  // Check Supabase session on mount (no listener to avoid re-render issues)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    setIsSupabase(true);

    // Get initial session only
    supabase!.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u: User = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
        };
        setUser(u);
        saveSession(u);
      }
    });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Try Supabase first
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.user) {
          const u: User = {
            id: data.user.id,
            name: data.user.user_metadata?.name || email.split('@')[0],
            email: data.user.email || email,
          };
          setUser(u);
          saveSession(u);
          return true;
        }
      } catch (err) {
        console.warn('[Auth] Supabase login failed, trying localStorage:', err);
      }
    }

    // No fallback — require Supabase for real auth
    console.error('[Auth] Supabase not configured. Login requires Supabase backend.');
    return false;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    // Try Supabase first
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase!.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;

        if (data.user) {
          const u: User = {
            id: data.user.id,
            name,
            email: data.user.email || email,
          };
          setUser(u);
          saveSession(u);
          return true;
        }
      } catch (err) {
        console.warn('[Auth] Supabase register failed, trying localStorage:', err);
      }
    }

    // No fallback — require Supabase for real auth
    console.error('[Auth] Supabase not configured. Registration requires Supabase backend.');
    return false;
  }, []);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try { await supabase!.auth.signOut(); } catch { /* ignore */ }
    }
    setUser(null);
    clearSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, isSupabase }}>
      {children}
    </AuthContext.Provider>
  );
}
