import { createContext, useContext, useState, type ReactNode } from 'react';
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

  // token 已在 api.ts 模块加载时恢复，此处无需再注入

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
