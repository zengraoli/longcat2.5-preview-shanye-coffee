import type { Member } from './types';
import { setToken, clearToken, getToken } from './api';
import { storageGet, storageRemove, storageSet } from './storage';

const MEMBER_KEY = 'shanye_miniapp_member';

export interface Session {
  token: string;
  member: Member;
}

export function saveSession(token: string, member: Member) {
  setToken(token);
  const safe: Member = {
    ...member,
    phone: member.phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'),
  };
  storageSet(MEMBER_KEY, JSON.stringify(safe));
}

export function getSession(): Session | null {
  const token = getToken();
  const raw = storageGet(MEMBER_KEY);
  if (!token || !raw) return null;
  try {
    return { token, member: JSON.parse(raw) as Member };
  } catch {
    return null;
  }
}

export function clearSession() {
  clearToken();
  storageRemove(MEMBER_KEY);
}
