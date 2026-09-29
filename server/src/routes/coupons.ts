import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { err, ErrorCode } from '../lib/errors.js';
import { ok } from '../lib/reply.js';
import {
  bestCoupon,
  computeDiscount,
  isCouponUsable,
  type CouponTemplate,
  type MemberCoupon,
} from '../services/coupon.js';

interface TemplateRow {
  id: number;
  name: string;
  type: 'full_reduction' | 'discount';
  threshold: number;
  discount_amount: number | null;
  discount_rate: number | null;
  valid_days: number;
}

interface MemberCouponRow {
  id: number;
  member_id: number;
  template_id: number;
  status: 'unused' | 'used' | 'expired';
  claimed_at: string;
  expires_at: string;
}

function toTemplate(r: TemplateRow): CouponTemplate {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    threshold: r.threshold,
    discount_amount: r.discount_amount,
    discount_rate: r.discount_rate,
    valid_days: r.valid_days,
  };
}

function couponView(c: MemberCouponRow, t: TemplateRow, now: Date) {
  const usable = isCouponUsable(c, now);
  return {
    id: c.id,
    templateId: t.id,
    name: t.name,
    type: t.type,
    threshold: t.threshold,
    discountAmount: t.discount_amount,
    discountRate: t.discount_rate,
    status: c.status,
    claimedAt: c.claimed_at,
    expiresAt: c.expires_at,
    usable,
  };
}

/** 优惠券路由：领取、我的优惠券、最优券预览。 */
export default async function couponRoutes(app: FastifyInstance) {
  // 领取优惠券（会员）
  app.post<{ Params: { templateId: string } }>(
    '/api/coupons/:templateId/claim',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      if (req.user?.type !== 'member') {
        throw err(ErrorCode.FORBIDDEN, '无权限', 403);
      }
      const templateId = Number(req.params.templateId);
      if (!Number.isInteger(templateId) || templateId <= 0) {
        throw err(ErrorCode.VALIDATION, '优惠券 ID 非法');
      }
      const db = getDb();
      const template = db
        .prepare('SELECT * FROM coupon_templates WHERE id = ?')
        .get(templateId) as TemplateRow | undefined;
      if (!template) throw err(ErrorCode.COUPON_NOT_FOUND, '优惠券不存在', 404);

      const existing = db
        .prepare('SELECT id FROM member_coupons WHERE member_id = ? AND template_id = ?')
        .get(req.user.id, templateId);
      if (existing) {
        throw err(ErrorCode.COUPON_ALREADY_CLAIMED, '优惠券已领取', 409);
      }

      const now = new Date();
      const expires = new Date(now.getTime() + template.valid_days * 86400_000);
      const info = db
        .prepare(
          `INSERT INTO member_coupons (member_id, template_id, status, claimed_at, expires_at)
           VALUES (?, ?, 'unused', ?, ?)`,
        )
        .run(req.user.id, templateId, now.toISOString(), expires.toISOString());
      const row = db
        .prepare('SELECT * FROM member_coupons WHERE id = ?')
        .get(Number(info.lastInsertRowid)) as MemberCouponRow;
      ok(reply, couponView(row, template, now));
    },
  );

  // 我的优惠券（会员）
  app.get(
    '/api/member/coupons',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      if (req.user?.type !== 'member') {
        throw err(ErrorCode.FORBIDDEN, '无权限', 403);
      }
      const db = getDb();
      const now = new Date();
      const rows = db
        .prepare(
          `SELECT c.*, t.name, t.type, t.threshold, t.discount_amount, t.discount_rate, t.valid_days
           FROM member_coupons c JOIN coupon_templates t ON t.id = c.template_id
           WHERE c.member_id = ? ORDER BY c.claimed_at DESC`,
        )
        .all(req.user.id) as (MemberCouponRow & TemplateRow)[];

      // 惰性过期：未使用但已过期的券标记为 expired
      const markExpired = db.prepare(
        `UPDATE member_coupons SET status = 'expired'
         WHERE id = ? AND status = 'unused' AND expires_at <= ?`,
      );
      const views = rows.map((r) => {
        if (r.status === 'unused' && new Date(r.expires_at).getTime() <= now.getTime()) {
          markExpired.run(r.id, now.toISOString());
          return couponView({ ...r, status: 'expired' }, r, now);
        }
        return couponView(r, r, now);
      });
      ok(reply, views);
    },
  );

  // 最优券预览（会员）：给定金额，返回最优惠的可用券
  app.get<{ Querystring: { amount?: string } }>(
    '/api/member/coupons/best',
    {
      preHandler: [app.authenticate],
      schema: {
        querystring: {
          type: 'object',
          required: ['amount'],
          properties: { amount: { type: 'integer', minimum: 0 } },
        },
      },
    },
    async (req, reply) => {
      if (req.user?.type !== 'member') {
        throw err(ErrorCode.FORBIDDEN, '无权限', 403);
      }
      const amount = Number(req.query.amount);
      if (!Number.isInteger(amount) || amount < 0) {
        throw err(ErrorCode.VALIDATION, '金额非法');
      }
      const db = getDb();
      const now = new Date();
      const coupons = db
        .prepare(`SELECT * FROM member_coupons WHERE member_id = ?`)
        .all(req.user.id) as MemberCouponRow[];
      const templates = new Map<number, CouponTemplate>();
      for (const c of coupons) {
        if (!templates.has(c.template_id)) {
          const t = db
            .prepare('SELECT * FROM coupon_templates WHERE id = ?')
            .get(c.template_id) as TemplateRow;
          templates.set(c.template_id, toTemplate(t));
        }
      }
      const best = bestCoupon(coupons, templates, amount, now);
      if (!best) {
        ok(reply, { coupon: null, discount: 0, payable: amount });
        return;
      }
      ok(reply, {
        coupon: {
          id: best.coupon.id,
          name: best.template.name,
          type: best.template.type,
          threshold: best.template.threshold,
          discountAmount: best.template.discount_amount,
          discountRate: best.template.discount_rate,
        },
        discount: best.discount,
        payable: amount - best.discount,
      });
    },
  );

  // 供订单服务复用的内部函数：按 ID 取券并计算优惠
  app.decorate('computeCouponDiscount', (couponId: number, originalAmount: number) => {
    const db = getDb();
    const c = db
      .prepare('SELECT * FROM member_coupons WHERE id = ?')
      .get(couponId) as MemberCouponRow | undefined;
    if (!c) throw err(ErrorCode.COUPON_NOT_FOUND, '优惠券不存在', 404);
    const t = db
      .prepare('SELECT * FROM coupon_templates WHERE id = ?')
      .get(c.template_id) as TemplateRow | undefined;
    if (!t) throw err(ErrorCode.COUPON_NOT_FOUND, '优惠券不存在', 404);
    const template = toTemplate(t);
    if (!isCouponUsable(c)) {
      throw err(ErrorCode.COUPON_EXPIRED, '优惠券已过期或已使用', 400);
    }
    const discount = computeDiscount(template, originalAmount);
    if (discount <= 0) {
      throw err(ErrorCode.COUPON_NOT_USABLE, '优惠券不满足使用条件', 400);
    }
    return { coupon: c, template, discount };
  });
}
