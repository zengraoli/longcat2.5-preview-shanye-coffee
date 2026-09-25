import type { FastifyInstance } from 'fastify';
import { getDb } from '../db.js';
import { AppError, ErrorCode } from '../errors.js';
import { ok } from '../reply.js';
import { authRequired } from '../plugins/auth.js';

export default async function memberRoutes(app: FastifyInstance): Promise<void> {
  await app.register(async (instance) => {
    authRequired(instance);

    instance.get('/api/member/me', async (request, reply) => {
      const db = getDb();
      const member = db.prepare('SELECT id, phone, points FROM members WHERE id = ?').get(
        request.currentUser!.userId,
      ) as { id: number; phone: string; points: number } | undefined;
      if (!member) {
        throw new AppError(ErrorCode.NOT_FOUND, '会员不存在', 404);
      }
      const maskedPhone = member.phone.slice(0, 3) + '****' + member.phone.slice(-4);
      ok(reply, { id: member.id, phone: maskedPhone, points: member.points });
    });

    instance.get('/api/member/points-logs', async (request, reply) => {
      const db = getDb();
      const logs = db
        .prepare('SELECT id, points, balance_after, reason, created_at FROM points_logs WHERE user_id = ? ORDER BY id DESC LIMIT 50')
        .all(request.currentUser!.userId);
      ok(reply, logs);
    });
  });
}
