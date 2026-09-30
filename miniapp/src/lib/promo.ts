/**
 * 第二杯半价活动：客户端计价与展示。
 * 规则与 server 的 services/promo.ts 保持一致：
 * 同一订单中同一适用商品的第 2、4、6… 杯按半价，半价 = floor(单价 / 2)。
 */

/** 计算活动优惠金额（分）。applicableProductIds 为适用商品集合。 */
export function computePromoDiscount(
  items: { productId: number; price: number; quantity: number }[],
  applicableProductIds: Set<number>,
): number {
  let discount = 0;
  const byProduct = new Map<number, { price: number; quantity: number }>();
  for (const it of items) {
    if (!applicableProductIds.has(it.productId)) continue;
    const group = byProduct.get(it.productId) ?? { price: it.price, quantity: 0 };
    group.quantity += it.quantity;
    byProduct.set(it.productId, group);
  }
  for (const { price, quantity } of byProduct.values()) {
    if (quantity < 2) continue;
    const halfCount = Math.floor(quantity / 2);
    discount += halfCount * Math.floor(price / 2);
  }
  return discount;
}
