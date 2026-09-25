import type { FastifyInstance } from 'fastify';
import { getDb } from '../db.js';
import { AppError, ErrorCode } from '../errors.js';
import { ok } from '../reply.js';
import { authRequired, adminRequired } from '../plugins/auth.js';
import { maskPhone } from '../utils/format.js';

export default async function adminManageRoutes(app: FastifyInstance): Promise<void> {
  await app.register(async (instance) => {
    authRequired(instance);
    adminRequired(instance);

    instance.get('/api/admin/stores', async (_request, reply) => {
      const db = getDb();
      const rows = db.prepare('SELECT * FROM stores ORDER BY id').all() as Array<{
        id: number; name: string; address: string; phone: string;
        open_time: string; close_time: string; status: string;
      }>;
      ok(reply, rows.map((s) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        phone: maskPhone(s.phone),
        openTime: s.open_time,
        closeTime: s.close_time,
        status: s.status,
      })));
    });

    instance.put('/api/admin/stores/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string; address?: string; openTime?: string; closeTime?: string; status?: string;
      };
      const db = getDb();
      const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(Number(id)) as any;
      if (!store) throw new AppError(ErrorCode.NOT_FOUND, '门店不存在', 404);
      db.prepare('UPDATE stores SET name = ?, address = ?, open_time = ?, close_time = ?, status = ? WHERE id = ?').run(
        body.name ?? store.name,
        body.address ?? store.address,
        body.openTime ?? store.open_time,
        body.closeTime ?? store.close_time,
        body.status ?? store.status,
        Number(id),
      );
      ok(reply, null);
    });

    instance.get('/api/admin/members', async (request, reply) => {
      const db = getDb();
      const rows = db.prepare(`
        SELECT m.id, m.phone, m.points, m.created_at,
          (SELECT COUNT(*) FROM orders o WHERE o.user_id = m.id) AS orderCount
        FROM members m ORDER BY m.created_at DESC LIMIT 200
      `).all() as Array<{
        id: number; phone: string; points: number; created_at: string; orderCount: number;
      }>;
      ok(reply, rows.map((m) => ({
        id: m.id,
        phone: maskPhone(m.phone),
        points: m.points,
        createdAt: m.created_at,
        orderCount: m.orderCount,
      })));
    });

    instance.get('/api/admin/members/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = getDb();
      const member = db.prepare('SELECT * FROM members WHERE id = ?').get(Number(id)) as
        | { id: number; phone: string; points: number; created_at: string }
        | undefined;
      if (!member) throw new AppError(ErrorCode.NOT_FOUND, '会员不存在', 404);
      const orders = db.prepare(`
        SELECT o.id, o.order_no, o.pickup_code, o.type, o.status, o.paid_amount, o.created_at,
               s.name AS store_name
        FROM orders o JOIN stores s ON o.store_id = s.id
        WHERE o.user_id = ? ORDER BY o.created_at DESC LIMIT 20
      `).all(member.id);
      const coupons = db.prepare(`
        SELECT uc.id, uc.status, uc.claimed_at, c.name, c.type, c.threshold, c.discount, c.valid_from, c.valid_to
        FROM user_coupons uc JOIN coupons c ON uc.coupon_id = c.id
        WHERE uc.user_id = ? ORDER BY uc.claimed_at DESC
      `).all(member.id);
      ok(reply, {
        id: member.id,
        phone: maskPhone(member.phone),
        points: member.points,
        createdAt: member.created_at,
        orders,
        coupons,
      });
    });

    instance.get('/api/admin/coupons', async (_request, reply) => {
      const db = getDb();
      const rows = db.prepare('SELECT * FROM coupons ORDER BY id').all();
      ok(reply, rows);
    });

    instance.post('/api/admin/coupons', async (request, reply) => {
      const body = request.body as {
        name?: string; type?: string; threshold?: number; discount?: number;
        validFrom?: string; validTo?: string; totalCount?: number;
      };
      if (!body.name || !body.type || !body.threshold || !body.discount || !body.validFrom || !body.validTo) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, '缺少必填字段');
      }
      const db = getDb();
      const result = db.prepare(
        'INSERT INTO coupons (name, type, threshold, discount, valid_from, valid_to, total_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).run(body.name, body.type, body.threshold, body.discount, body.validFrom, body.validTo, body.totalCount ?? 100);
      ok(reply, { id: Number(result.lastInsertRowid) });
    });

    instance.put('/api/admin/coupons/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string; type?: string; threshold?: number; discount?: number;
        validFrom?: string; validTo?: string; totalCount?: number;
      };
      const db = getDb();
      const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(Number(id)) as any;
      if (!coupon) throw new AppError(ErrorCode.NOT_FOUND, '优惠券不存在', 404);
      db.prepare('UPDATE coupons SET name = ?, type = ?, threshold = ?, discount = ?, valid_from = ?, valid_to = ?, total_count = ? WHERE id = ?').run(
        body.name ?? coupon.name,
        body.type ?? coupon.type,
        body.threshold ?? coupon.threshold,
        body.discount ?? coupon.discount,
        body.validFrom ?? coupon.valid_from,
        body.validTo ?? coupon.valid_to,
        body.totalCount ?? coupon.total_count,
        Number(id),
      );
      ok(reply, null);
    });

    instance.delete('/api/admin/coupons/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = getDb();
      db.prepare('DELETE FROM user_coupons WHERE coupon_id = ?').run(Number(id));
      const result = db.prepare('DELETE FROM coupons WHERE id = ?').run(Number(id));
      if (result.changes === 0) throw new AppError(ErrorCode.NOT_FOUND, '优惠券不存在', 404);
      ok(reply, null);
    });
  });
}
