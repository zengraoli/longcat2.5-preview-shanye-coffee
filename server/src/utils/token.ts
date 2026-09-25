import { randomBytes } from 'node:crypto';
import { getDb } from '../db.js';

export function createToken(userType: 'member' | 'admin', userId: number): string {
  const token = randomBytes(24).toString('hex');
  const db = getDb();
  db.prepare('INSERT INTO auth_tokens (token, user_type, user_id, created_at) VALUES (?, ?, ?, ?)').run(
    token,
    userType,
    userId,
    new Date().toISOString(),
  );
  return token;
}

export function verifyToken(token: string): { userType: 'member' | 'admin'; userId: number } | null {
  const db = getDb();
  const row = db.prepare('SELECT user_type, user_id FROM auth_tokens WHERE token = ?').get(token) as
    | { user_type: 'member' | 'admin'; user_id: number }
    | undefined;
  return row ? { userType: row.user_type, userId: row.user_id } : null;
}

export function revokeToken(token: string): void {
  getDb().prepare('DELETE FROM auth_tokens WHERE token = ?').run(token);
}
