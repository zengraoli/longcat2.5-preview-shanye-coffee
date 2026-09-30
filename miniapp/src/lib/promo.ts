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
  const byProduct = new Map<number, number[]>();
  for (const it of items) {
    if (!applicableProductIds.has(it.productId)) continue;
    const prices = byProduct.get(it.productId) ?? [];
    for (let i = 0; i < it.quantity; i++) prices.push(it.price);
    byProduct.set(it.productId, prices);
  }
  for (const prices of byProduct.values()) {
    if (prices.length < 2) continue;
    prices.sort((a, b) => a - b);
    for (let i = 1; i < prices.length; i += 2) {
      discount += Math.floor(prices[i] / 2);
    }
  }
  return discount;
}
