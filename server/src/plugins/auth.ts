import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ErrorCode, AppError } from '../errors.js';
import { verifyToken } from '../utils/token.js';

export interface AuthUser {
  userType: 'member' | 'admin';
  userId: number;
  role?: 'admin' | 'staff';
  storeId?: number | null;
}

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: AuthUser;
  }
}

function extractToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

async function resolveUser(token: string): Promise<AuthUser | null> {
  const payload = verifyToken(token);
  if (!payload) return null;

  const db = (await import('../db.js')).getDb();
  if (payload.userType === 'admin') {
    const row = db.prepare('SELECT id, role, store_id FROM admin_users WHERE id = ?').get(payload.userId) as
      | { id: number; role: 'admin' | 'staff'; store_id: number | null }
      | undefined;
    if (!row) return null;
    return { userType: 'admin', userId: row.id, role: row.role, storeId: row.store_id };
  }
  const row = db.prepare('SELECT id FROM members WHERE id = ?').get(payload.userId) as { id: number } | undefined;
  if (!row) return null;
  return { userType: 'member', userId: row.id };
}

export function authRequired(app: FastifyInstance): void {
  app.decorateRequest('currentUser', undefined);
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = extractToken(request);
    if (!token) {
      throw new AppError(ErrorCode.UNAUTHORIZED, '未登录或登录已过期', 401);
    }
    const user = await resolveUser(token);
    if (!user) {
      throw new AppError(ErrorCode.TOKEN_EXPIRED, '登录已过期，请重新登录', 401);
    }
    request.currentUser = user;
  });
}

export function adminRequired(app: FastifyInstance): void {
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.currentUser || request.currentUser.userType !== 'admin') {
      throw new AppError(ErrorCode.FORBIDDEN, '需要管理员权限', 403);
    }
  });
}

export function requireAdminRole(app: FastifyInstance): void {
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.currentUser?.userType !== 'admin' || request.currentUser.role !== 'admin') {
      throw new AppError(ErrorCode.FORBIDDEN, '没有权限执行此操作', 403);
    }
  });
}
