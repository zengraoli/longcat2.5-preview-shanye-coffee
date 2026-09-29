import type { AdminUser } from './types';
import { setToken, clearToken, getToken } from './api';

const USER_KEY = 'shanye_admin_user';

export interface Session {
  token: string;
  user: AdminUser;
}

export function saveSession(token: string, user: AdminUser) {
  setToken(token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getSession(): Session | null {
  const token = getToken();
  const userRaw = localStorage.getItem(USER_KEY);
  if (!token || !userRaw) return null;
  try {
    return { token, user: JSON.parse(userRaw) as AdminUser };
  } catch {
    return null;
  }
}

export function clearSession() {
  clearToken();
  localStorage.removeItem(USER_KEY);
}
