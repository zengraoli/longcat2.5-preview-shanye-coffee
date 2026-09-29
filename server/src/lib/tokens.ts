import { randomBytes } from 'node:crypto';
import { getDb } from '../db/index.js';
import { config } from '../config.js';

const TOKEN_TTL_MS = () => config.tokenTtlHours * 3600_000;

export interface MemberTokenRow {
  id: number;
  phone: string;
  nickname: string | null;
  points: number;
  expires_at: string;
}

export interface AdminTokenRow {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'staff';
  store_id: number | null;
  expires_at: string;
}

/** 签发会员 token，返回 token 字符串。 */
export function issueMemberToken(memberId: number): string {
  const token = randomBytes(24).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + TOKEN_TTL_MS()).toISOString();
  getDb()
    .prepare(
      'INSERT INTO member_tokens (token, member_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
    )
    .run(token, memberId, expires, now.toISOString());
  return token;
}

/** 签发后台 token，返回 token 字符串。 */
export function issueAdminToken(adminId: number): string {
  const token = randomBytes(24).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + TOKEN_TTL_MS()).toISOString();
  getDb()
    .prepare(
      'INSERT INTO admin_tokens (token, admin_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
    )
    .run(token, adminId, expires, now.toISOString());
  return token;
}

/** 按 token 查会员；过期则删除并返回 null。 */
export function findMemberByToken(token: string): MemberTokenRow | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT m.id, m.phone, m.nickname, m.points, t.expires_at
       FROM member_tokens t JOIN members m ON m.id = t.member_id
       WHERE t.token = ?`,
    )
    .get(token) as MemberTokenRow | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM member_tokens WHERE token = ?').run(token);
    return null;
  }
  return row;
}

/** 按 token 查后台账号；过期则删除并返回 null。 */
export function findAdminByToken(token: string): AdminTokenRow | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT a.id, a.username, a.name, a.role, a.store_id, t.expires_at
       FROM admin_tokens t JOIN admins a ON a.id = t.admin_id
       WHERE t.token = ?`,
    )
    .get(token) as AdminTokenRow | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM admin_tokens WHERE token = ?').run(token);
    return null;
  }
  return row;
}
