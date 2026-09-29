import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { err, ErrorCode } from '../lib/errors.js';
import {
  computeDiscount,
  isCouponUsable,
  type CouponTemplate,
  type MemberCoupon,
} from '../services/coupon.js';

/**
 * 在根实例上注册 computeCouponDiscount 装饰器，供订单服务复用。
 * 必须以普通函数调用（而非 app.register），否则装饰器只作用于子上下文。
 */
export async function registerCouponDecorator(app: FastifyInstance) {
  app.decorate('computeCouponDiscount', (couponId: number, originalAmount: number) => {
    const db = getDb();
    const c = db
      .prepare('SELECT * FROM member_coupons WHERE id = ?')
      .get(couponId) as MemberCoupon | undefined;
    if (!c) throw err(ErrorCode.COUPON_NOT_FOUND, '优惠券不存在', 404);
    const t = db
      .prepare('SELECT * FROM coupon_templates WHERE id = ?')
      .get(c.template_id) as CouponTemplate | undefined;
    if (!t) throw err(ErrorCode.COUPON_NOT_FOUND, '优惠券不存在', 404);
    if (!isCouponUsable(c)) {
      throw err(ErrorCode.COUPON_EXPIRED, '优惠券已过期或已使用', 400);
    }
    const discount = computeDiscount(t, originalAmount);
    if (discount <= 0) {
      throw err(ErrorCode.COUPON_NOT_USABLE, '优惠券不满足使用条件', 400);
    }
    return { coupon: c, template: t, discount };
  });
}
