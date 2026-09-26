// 第二杯半价活动工具：金额单位为“分”

export interface PromoCartItem {
  productId: number
  quantity: number
  unitPrice: number
}

/**
 * 计算第二杯半价优惠金额，算法与 server 保持一致：
 * 同一活动商品数量按商品分组，每两件免单价较低一件的半价
 * （等价于 server：按单价从高到低，对 floor(总件数/2) 件各减 unitPrice/2 向下取整）。
 */
export function calcPromoDiscount(items: PromoCartItem[], promoProductIds: number[]): number {
  if (!promoProductIds.length) return 0
  const groups = new Map<number, PromoCartItem[]>()
  for (const item of items) {
    if (!promoProductIds.includes(item.productId)) continue
    const list = groups.get(item.productId) ?? []
    list.push(item)
    groups.set(item.productId, list)
  }
  let discount = 0
  for (const list of groups.values()) {
    const totalQty = list.reduce((sum, i) => sum + i.quantity, 0)
    let halfQty = Math.floor(totalQty / 2)
    if (halfQty <= 0) continue
    const sorted = [...list].sort((a, b) => b.unitPrice - a.unitPrice)
    for (const item of sorted) {
      if (halfQty <= 0) break
      const deduct = Math.min(item.quantity, halfQty)
      discount += Math.floor((item.unitPrice * deduct) / 2)
      halfQty -= deduct
    }
  }
  return discount
}

/** UTC ISO 时间转北京时间“M月D日 - M月D日” */
export function formatPromoRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso)
    const bj = new Date(d.getTime() + 8 * 3600 * 1000)
    return `${bj.getUTCMonth() + 1}月${bj.getUTCDate()}日`
  }
  return `${fmt(start)} - ${fmt(end)}`
}
