/**
 * Authentication System — IndexedDB for offline support
 * No server dependency, works completely offline
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { createUser, loginUser } from './lib/db';

interface User {
  id?: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ============ Session helpers ============

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

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = await loginUser(email, password);
    if (result.success && result.user) {
      const u: User = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      };
      setUser(u);
      saveSession(u);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = await createUser(name, email, password);
    if (result.success) {
      // Auto-login after registration
      const loginResult = await loginUser(email, password);
      if (loginResult.success && loginResult.user) {
        const u: User = {
          id: loginResult.user.id,
          name: loginResult.user.name,
          email: loginResult.user.email,
        };
        setUser(u);
        saveSession(u);
        return { success: true };
      }
    }
    return { success: false, error: result.error };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
