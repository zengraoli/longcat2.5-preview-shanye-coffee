/**
 * 活动纯函数服务：第二杯半价计价、活动匹配。
 * 不依赖数据库，便于单元测试。
 *
 * 规则：同一订单中同一适用商品的第 2、4、6… 杯按半价计算，
 * 半价金额 = floor(单价 / 2)（向下取整到分）。
 * 与优惠券叠加时先算活动价再用券：券的门槛判断与优惠金额基于活动后金额。
 */

export interface PromoItemInput {
  productId: number;
  /** 单价（含规格加价，分） */
  price: number;
  quantity: number;
}

/**
 * 计算第二杯半价优惠金额（分）。
 * 仅统计适用商品；同一商品每两件为一组，每组第二件（价高者）半价。
 * 按商品分组后按单价升序排序，与商品顺序无关。
 */
export function computePromoDiscount(
  items: PromoItemInput[],
  applicableProductIds: Set<number>,
): number {
  let discount = 0;
  // 按商品分组，收集每件的单价
  const byProduct = new Map<number, number[]>();
  for (const it of items) {
    if (!applicableProductIds.has(it.productId)) continue;
    const prices = byProduct.get(it.productId) ?? [];
    for (let i = 0; i < it.quantity; i++) prices.push(it.price);
    byProduct.set(it.productId, prices);
  }
  for (const prices of byProduct.values()) {
    if (prices.length < 2) continue;
    // 升序排序：每两件中价高者半价，与顺序无关
    prices.sort((a, b) => a - b);
    for (let i = 1; i < prices.length; i += 2) {
      const price = prices[i];
      if (price !== undefined) discount += Math.floor(price / 2);
    }
  }
  return discount;
}

export interface PromotionLike {
  id: number;
  name: string;
  type: 'second_cup_half';
  startAt: string;
  endAt: string;
  enabled: boolean;
}

/** 活动是否在指定时刻生效（UTC ISO8601 比较）。 */
export function isPromotionActive(p: PromotionLike, now: Date = new Date()): boolean {
  if (!p.enabled) return false;
  const t = now.getTime();
  return t >= new Date(p.startAt).getTime() && t <= new Date(p.endAt).getTime();
}

/** 从活动列表中选出当前生效的第二杯半价活动（无则 null）。 */
export function activeSecondCupHalfPromotion(
  promotions: PromotionLike[],
  now: Date = new Date(),
): PromotionLike | null {
  return promotions.find((p) => p.type === 'second_cup_half' && isPromotionActive(p, now)) ?? null;
}
