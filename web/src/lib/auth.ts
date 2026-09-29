import type { Member } from './types';
import { setToken, clearToken, getToken } from './api';

const MEMBER_KEY = 'shanye_web_member';

export interface Session {
  token: string;
  member: Member;
}

export function saveSession(token: string, member: Member) {
  setToken(token);
  // 存储时对手机号脱敏，避免明文手机号长期留在本地
  const safe: Member = {
    ...member,
    phone: member.phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'),
  };
  localStorage.setItem(MEMBER_KEY, JSON.stringify(safe));
}

export function getSession(): Session | null {
  const token = getToken();
  const raw = localStorage.getItem(MEMBER_KEY);
  if (!token || !raw) return null;
  try {
    return { token, member: JSON.parse(raw) as Member };
  } catch {
    return null;
  }
}

export function clearSession() {
  clearToken();
  localStorage.removeItem(MEMBER_KEY);
}
