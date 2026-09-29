import type { Member } from './types';
import { setToken } from './api';

const TOKEN_KEY = 'shanye_web_token';
const MEMBER_KEY = 'shanye_web_member';

export interface Session {
  token: string;
  member: Member;
}

export function saveSession(token: string, member: Member) {
  setToken(token);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
}

export function getSession(): Session | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const raw = localStorage.getItem(MEMBER_KEY);
  if (!token || !raw) return null;
  try {
    return { token, member: JSON.parse(raw) as Member };
  } catch {
    return null;
  }
}

export function clearSession() {
  setToken(null);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(MEMBER_KEY);
}
