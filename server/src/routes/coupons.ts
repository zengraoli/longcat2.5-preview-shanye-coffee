import type { FastifyInstance } from 'fastify';
import { getDb } from '../db.js';
import { AppError, ErrorCode } from '../errors.js';
import { ok } from '../reply.js';
import { authRequired } from '../plugins/auth.js';
import { isCouponValid, findBestCoupon } from '../utils/coupon.js';

export default async function couponRoutes(app: FastifyInstance): Promise<void> {
  await app.register(async (instance) => {
    authRequired(instance);

    instance.get('/api/coupons', async (_request, reply) => {
      const db = getDb();
      const rows = db.prepare('SELECT * FROM coupons').all() as Array<{
        id: number; name: string; type: string; threshold: number; discount: number;
        valid_from: string; valid_to: string; total_count: number;
      }>;
      ok(reply, rows.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        threshold: c.threshold,
        discount: c.discount,
        validFrom: c.valid_from,
        validTo: c.valid_to,
        valid: isCouponValid(c as any),
      })));
    });

    instance.post('/api/coupons/:id/claim', async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.currentUser!.userId;
      const db = getDb();
      const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(Number(id)) as any;
      if (!coupon) throw new AppError(ErrorCode.NOT_FOUND, '优惠券不存在', 404);

      const existing = db.prepare('SELECT id FROM user_coupons WHERE user_id = ? AND coupon_id = ?').get(userId, Number(id));
      if (existing) throw new AppError(ErrorCode.COUPON_ALREADY_CLAIMED, '优惠券已领取', 409);

      db.prepare('INSERT INTO user_coupons (user_id, coupon_id, status, claimed_at) VALUES (?, ?, ?, ?)').run(
        userId, Number(id), 'unused', new Date().toISOString(),
      );
      ok(reply, null);
    });

    instance.get('/api/my/coupons', async (request, reply) => {
      const userId = request.currentUser!.userId;
      const db = getDb();
      const rows = db.prepare(`
        SELECT uc.id, uc.status, uc.claimed_at, uc.used_at, uc.order_id,
               c.id AS coupon_id, c.name, c.type, c.threshold, c.discount, c.valid_from, c.valid_to
        FROM user_coupons uc JOIN coupons c ON uc.coupon_id = c.id
        WHERE uc.user_id = ? ORDER BY uc.claimed_at DESC
      `).all(userId) as Array<{
        id: number; status: string; claimed_at: string; used_at: string | null; order_id: number | null;
        coupon_id: number; name: string; type: string; threshold: number; discount: number;
        valid_from: string; valid_to: string;
      }>;
      ok(reply, rows.map((r) => ({
        id: r.id,
        status: r.status,
        claimedAt: r.claimed_at,
        usedAt: r.used_at,
        orderId: r.order_id,
        coupon: {
          id: r.coupon_id,
          name: r.name,
          type: r.type,
          threshold: r.threshold,
          discount: r.discount,
          validFrom: r.valid_from,
          validTo: r.valid_to,
          valid: isCouponValid(r as any),
        },
      })));
    });

    instance.post('/api/coupons/best', async (request, reply) => {
      const body = request.body as { amount?: number };
      if (!body.amount || body.amount < 0) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, 'amount 不能为空且不能为负数');
      }
      const userId = request.currentUser!.userId;
      const db = getDb();
      const rows = db.prepare(`
        SELECT uc.id, uc.status, uc.claimed_at, uc.used_at, uc.order_id,
               c.id AS coupon_id, c.name, c.type, c.threshold, c.discount, c.valid_from, c.valid_to
        FROM user_coupons uc JOIN coupons c ON uc.coupon_id = c.id
        WHERE uc.user_id = ? AND uc.status = 'unused'
      `).all(userId) as any[];
      const userCoupons = rows.map((r) => ({ ...r, coupon: { id: r.coupon_id, name: r.name, type: r.type, threshold: r.threshold, discount: r.discount, valid_from: r.valid_from, valid_to: r.valid_to } }));
      const best = findBestCoupon(userCoupons, body.amount);
      if (!best) {
        ok(reply, null);
        return;
      }
      ok(reply, {
        userCouponId: best.id,
        couponId: best.coupon.id,
        name: best.coupon.name,
        type: best.coupon.type,
        threshold: best.coupon.threshold,
        discount: best.coupon.discount,
      });
    });
  });
}
