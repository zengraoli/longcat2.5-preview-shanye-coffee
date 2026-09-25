import type { FastifyInstance } from 'fastify';
import { getDb } from '../db.js';
import { AppError, ErrorCode } from '../errors.js';
import { ok } from '../reply.js';
import { createToken } from '../utils/token.js';

const MEMBER_CAPTCHA = '123456';

export default async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/member/login', async (request, reply) => {
    const body = request.body as { phone?: string; code?: string };
    if (!body.phone || !/^1\d{10}$/.test(body.phone)) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, '手机号格式不正确');
    }
    if (!body.code || body.code !== MEMBER_CAPTCHA) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, '验证码错误');
    }

    const db = getDb();
    let member = db.prepare('SELECT id, phone, points FROM members WHERE phone = ?').get(body.phone) as
      | { id: number; phone: string; points: number }
      | undefined;
    if (!member) {
      const result = db.prepare('INSERT INTO members (phone, points, created_at) VALUES (?, 0, ?)').run(
        body.phone,
        new Date().toISOString(),
      );
      member = { id: Number(result.lastInsertRowid), phone: body.phone, points: 0 };
    }

    const token = createToken('member', member.id);
    ok(reply, { token, member: { id: member.id, phone: member.phone, points: member.points } });
  });

  app.post('/api/admin/login', async (request, reply) => {
    const body = request.body as { username?: string; password?: string };
    if (!body.username || !body.password) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, '用户名和密码不能为空');
    }

    const db = getDb();
    const user = db.prepare('SELECT id, username, name, role, store_id FROM admin_users WHERE username = ? AND password = ?').get(
      body.username,
      body.password,
    ) as { id: number; username: string; name: string; role: 'admin' | 'staff'; store_id: number | null } | undefined;
    if (!user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, '用户名或密码错误', 401);
    }

    const token = createToken('admin', user.id);
    ok(reply, {
      token,
      admin: { id: user.id, username: user.username, name: user.name, role: user.role, storeId: user.store_id },
    });
  });

  app.post('/api/auth/logout', async (request, reply) => {
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const { revokeToken } = await import('../utils/token.js');
      revokeToken(header.slice(7));
    }
    ok(reply, null);
  });
}
