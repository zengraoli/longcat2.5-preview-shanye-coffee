import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AdminUser } from '../lib/types';
import { getSession, saveSession, clearSession } from '../lib/auth';
import { setToken } from '../lib/api';

interface AuthContextValue {
  user: AdminUser | null;
  isAuthenticated: boolean;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => getSession()?.user ?? null);

  // 启动时恢复会话并注入 token
  useEffect(() => {
    const session = getSession();
    if (session) setToken(session.token);
  }, []);

  const login = (token: string, newUser: AdminUser) => {
    saveSession(token, newUser);
    setToken(token);
    setUser(newUser);
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用');
  return ctx;
}
