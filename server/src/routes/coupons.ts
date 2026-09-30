import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { err, ErrorCode } from '../lib/errors.js';
import { ok } from '../lib/reply.js';
import {
  bestCoupon,
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
  enabled: number;
  total_stock: number;
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
    enabled: r.enabled === 1,
  };
}

function couponView(c: MemberCouponRow, t: TemplateRow & { enabled?: number }, now: Date) {
  // 可用 = 未使用 + 未过期 + 模板启用
  const usable = isCouponUsable(c, now) && (t.enabled === undefined || t.enabled === 1);
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
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['templateId'],
          properties: { templateId: { type: 'string' } },
        },
      },
    },
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
        .get(templateId) as (TemplateRow & { enabled: number; total_stock: number }) | undefined;
      if (!template) throw err(ErrorCode.COUPON_NOT_FOUND, '优惠券不存在', 404);
      if (template.enabled !== 1) {
        throw err(ErrorCode.COUPON_NOT_USABLE, '优惠券已停用', 400);
      }

      const existing = db
        .prepare('SELECT id FROM member_coupons WHERE member_id = ? AND template_id = ?')
        .get(req.user.id, templateId);
      if (existing) {
        throw err(ErrorCode.COUPON_ALREADY_CLAIMED, '优惠券已领取', 409);
      }

      // 校验发放总量
      if (template.total_stock > 0) {
        const claimed = (
          db
            .prepare('SELECT COUNT(*) AS n FROM member_coupons WHERE template_id = ?')
            .get(templateId) as { n: number }
        ).n;
        if (claimed >= template.total_stock) {
          throw err(ErrorCode.COUPON_NOT_USABLE, '优惠券已领完', 400);
        }
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
          `SELECT c.id AS coupon_id, c.member_id, c.template_id, c.status, c.claimed_at, c.expires_at, c.used_at, c.order_id,
                  t.id, t.name, t.type, t.threshold, t.discount_amount, t.discount_rate, t.valid_days, t.enabled
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
        // couponView 需要 c.id 为券 id，t.id 为模板 id
        const couponRow = { ...r, id: r.coupon_id } as MemberCouponRow & TemplateRow;
        if (r.status === 'unused' && new Date(r.expires_at).getTime() <= now.getTime()) {
          markExpired.run(r.coupon_id, now.toISOString());
          return couponView({ ...couponRow, status: 'expired' }, r, now);
        }
        return couponView(couponRow, r, now);
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
          properties: { amount: { type: 'string' } },
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
}
