/**
 * 优惠券纯函数服务：优惠金额计算、可用性判断、最优券选择。
 * 不依赖数据库，便于单元测试。
 */

export interface CouponTemplate {
  id: number;
  name: string;
  type: 'full_reduction' | 'discount';
  /** 满减门槛（分），折扣券为 0 */
  threshold: number;
  /** 满减金额（分），折扣券为 null */
  discount_amount: number | null;
  /** 折扣率（如 90 表示 9 折），满减券为 null */
  discount_rate: number | null;
  valid_days: number;
}

export interface MemberCoupon {
  id: number;
  member_id: number;
  template_id: number;
  status: 'unused' | 'used' | 'expired';
  claimed_at: string;
  expires_at: string;
}

/**
 * 计算某券对给定原价的优惠金额（分）。不满足使用条件返回 0。
 * - 满减券：原价 >= 门槛时减 discount_amount
 * - 折扣券：优惠 = 原价 × (100 - 折扣率) / 100，向下取整到分
 */
export function computeDiscount(template: CouponTemplate, originalAmount: number): number {
  if (originalAmount <= 0) return 0;
  if (template.type === 'full_reduction') {
    if (originalAmount < template.threshold) return 0;
    return template.discount_amount ?? 0;
  }
  const rate = template.discount_rate ?? 100;
  if (rate <= 0 || rate >= 100) return 0;
  return Math.floor((originalAmount * (100 - rate)) / 100);
}

/** 券当前是否可用：未使用且未过期。 */
export function isCouponUsable(
  coupon: MemberCoupon,
  now: Date = new Date(),
): boolean {
  if (coupon.status !== 'unused') return false;
  return new Date(coupon.expires_at).getTime() > now.getTime();
}

export interface BestCouponResult {
  coupon: MemberCoupon;
  template: CouponTemplate;
  discount: number;
}

/**
 * 从会员的券中选出优惠最大的一张；无可用券返回 null。
 * 并列时优先即将过期的券。
 */
export function bestCoupon(
  coupons: MemberCoupon[],
  templates: Map<number, CouponTemplate>,
  originalAmount: number,
  now: Date = new Date(),
): BestCouponResult | null {
  let best: BestCouponResult | null = null;
  for (const coupon of coupons) {
    if (!isCouponUsable(coupon, now)) continue;
    const template = templates.get(coupon.template_id);
    if (!template) continue;
    const discount = computeDiscount(template, originalAmount);
    if (discount <= 0) continue;
    if (
      !best ||
      discount > best.discount ||
      (discount === best.discount && coupon.expires_at < best.coupon.expires_at)
    ) {
      best = { coupon, template, discount };
    }
  }
  return best;
}
