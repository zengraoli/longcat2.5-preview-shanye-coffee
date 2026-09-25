import type { FastifyInstance } from 'fastify';
import { getDb } from '../db.js';
import { AppError, ErrorCode } from '../errors.js';
import { ok } from '../reply.js';
import { authRequired, requireAdminRole } from '../plugins/auth.js';

export default async function accountRoutes(app: FastifyInstance): Promise<void> {
  await app.register(async (instance) => {
    authRequired(instance);
    requireAdminRole(instance);

    instance.get('/api/admin/accounts', async (_request, reply) => {
      const db = getDb();
      const rows = db.prepare(`
        SELECT a.id, a.username, a.name, a.role, a.store_id, a.status, s.name AS store_name
        FROM admin_users a LEFT JOIN stores s ON a.store_id = s.id
        ORDER BY a.id
      `).all();
      ok(reply, rows);
    });

    instance.post('/api/admin/accounts', async (request, reply) => {
      const body = request.body as {
        username?: string; password?: string; name?: string; role?: string; storeId?: number | null;
      };
      if (!body.username || !body.password || !body.name || !body.role) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, '缺少必填字段');
      }
      if (!['admin', 'staff'].includes(body.role)) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, '角色必须为 admin 或 staff');
      }
      const db = getDb();
      const existing = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(body.username);
      if (existing) throw new AppError(ErrorCode.ALREADY_EXISTS, '用户名已存在', 409);
      const result = db.prepare(
        'INSERT INTO admin_users (username, password, name, role, store_id, status) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(body.username, body.password, body.name, body.role, body.storeId ?? null, 'active');
      ok(reply, { id: Number(result.lastInsertRowid) });
    });

    instance.put('/api/admin/accounts/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string; role?: string; storeId?: number | null; status?: string;
      };
      const db = getDb();
      const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(Number(id)) as any;
      if (!user) throw new AppError(ErrorCode.NOT_FOUND, '账号不存在', 404);
      if (body.role && !['admin', 'staff'].includes(body.role)) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, '角色必须为 admin 或 staff');
      }
      if (body.status && !['active', 'disabled'].includes(body.status)) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, '状态必须为 active 或 disabled');
      }
      db.prepare('UPDATE admin_users SET name = ?, role = ?, store_id = ?, status = ? WHERE id = ?').run(
        body.name ?? user.name,
        body.role ?? user.role,
        body.storeId !== undefined ? body.storeId : user.store_id,
        body.status ?? user.status,
        Number(id),
      );
      ok(reply, null);
    });

    instance.post('/api/admin/accounts/:id/reset-password', async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { password?: string };
      if (!body.password || body.password.length < 6) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, '密码至少 6 位');
      }
      const db = getDb();
      const result = db.prepare('UPDATE admin_users SET password = ? WHERE id = ?').run(body.password, Number(id));
      if (result.changes === 0) throw new AppError(ErrorCode.NOT_FOUND, '账号不存在', 404);
      ok(reply, null);
    });

    instance.post('/api/admin/accounts/:id/toggle-status', async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = getDb();
      const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(Number(id)) as any;
      if (!user) throw new AppError(ErrorCode.NOT_FOUND, '账号不存在', 404);
      if (user.role === 'admin') {
        throw new AppError(ErrorCode.FORBIDDEN, '不能停用管理员账号', 403);
      }
      const newStatus = user.status === 'active' ? 'disabled' : 'active';
      db.prepare('UPDATE admin_users SET status = ? WHERE id = ?').run(newStatus, Number(id));
      ok(reply, { status: newStatus });
    });
  });
}
