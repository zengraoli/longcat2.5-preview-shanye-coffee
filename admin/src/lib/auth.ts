import type { AdminUser } from './types';
import { setToken } from './api';

const TOKEN_KEY = 'shanye_admin_token';
const USER_KEY = 'shanye_admin_user';

export interface Session {
  token: string;
  user: AdminUser;
}

export function saveSession(token: string, user: AdminUser) {
  setToken(token);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getSession(): Session | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  if (!token || !userRaw) return null;
  try {
    return { token, user: JSON.parse(userRaw) as AdminUser };
  } catch {
    return null;
  }
}

export function clearSession() {
  setToken(null);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
