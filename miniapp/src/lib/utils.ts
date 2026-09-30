/** 分 → ¥xx.xx */
export function formatYuan(fen: number): string {
  return `¥${(fen / 100).toFixed(2)}`;
}

/** UTC ISO8601 → 北京时间 MM-DD HH:mm */
export function formatBeijing(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const bj = new Date(d.getTime() + 8 * 3600 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(bj.getUTCMonth() + 1)}-${pad(bj.getUTCDate())} ${pad(bj.getUTCHours())}:${pad(
    bj.getUTCMinutes(),
  )}`;
}

/** 手机号脱敏：138****1234 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

/**
 * 按所选规格匹配加价（分），未匹配返回 0。
 * 大杯 +300 分（3 元），其余规格不加价。
 */
export function specPriceAdjust(
  specs: { cup: string; temperature: string; sugar: string; priceAdjust: number }[],
  cup: string | null,
  temperature: string | null,
  sugar: string | null,
): number {
  const hit = specs.find(
    (s) => s.cup === cup && s.temperature === temperature && s.sugar === sugar,
  );
  return hit?.priceAdjust ?? 0;
}

/** 规格单价（分）：基础价 + 规格加价 */
export function unitPrice(basePrice: number, priceAdjust: number): number {
  return Math.max(0, basePrice) + Math.max(0, priceAdjust);
}

export interface AmountInput {
  /** 单价（含规格加价，分） */
  price: number;
  quantity: number;
}

export interface AmountDetail {
  originalAmount: number;
  discountAmount: number;
  payableAmount: number;
}

/**
 * 订单金额明细：与 server 的 computeOrderAmount 保持一致。
 * 原价 = Σ(单价 × 数量)；优惠 = min(优惠, 原价)，不为负；实付 = 原价 - 优惠。
 */
export function computeAmounts(items: AmountInput[], discount: number): AmountDetail {
  const originalAmount = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const discountAmount = Math.min(Math.max(discount, 0), originalAmount);
  const payableAmount = originalAmount - discountAmount;
  return { originalAmount, discountAmount, payableAmount };
}

export interface CouponTemplateLike {
  type: 'full_reduction' | 'discount';
  /** 满减门槛（分），折扣券为 0 */
  threshold: number;
  /** 满减金额（分），折扣券为 null */
  discountAmount: number | null;
  /** 折扣率（如 90 表示 9 折），满减券为 null */
  discountRate: number | null;
}

/**
 * 优惠券优惠金额（分）：与 server 的 computeDiscount 保持一致。
 * 满减券：原价 >= 门槛时减 discountAmount；
 * 折扣券：优惠 = 原价 × (100 - 折扣率) / 100，向下取整到分。
 */
export function couponDiscount(template: CouponTemplateLike, originalAmount: number): number {
  if (originalAmount <= 0) return 0;
  if (template.type === 'full_reduction') {
    if (originalAmount < template.threshold) return 0;
    return template.discountAmount ?? 0;
  }
  const rate = template.discountRate ?? 100;
  if (rate <= 0 || rate >= 100) return 0;
  return Math.floor((originalAmount * (100 - rate)) / 100);
}

/**
 * 按门店轮换推荐商品：过滤售罄后按门店偏移取前 count 个。
 * 不同门店得到不同的推荐列表，保证门店切换后推荐随之变化。
 */
export function selectRecommendations(
  products: { id: number; soldOut: boolean }[],
  storeId: number,
  count = 4,
): { id: number; soldOut: boolean }[] {
  const available = products.filter((p) => !p.soldOut);
  if (available.length === 0) return [];
  const offset = (Math.abs(storeId) - 1) % available.length;
  const rotated = available.slice(offset).concat(available.slice(0, offset));
  return rotated.slice(0, Math.min(count, rotated.length));
}

/** 规格中文描述 */
export function specText(spec: {
  cup: string | null;
  temperature: string | null;
  sugar: string | null;
}): string {
  const cup = spec.cup === 'large' ? '大杯' : '中杯';
  const temp = spec.temperature === 'ice' ? '冰' : '热';
  const sugar =
    spec.sugar === 'none' ? '无糖' : spec.sugar === 'less' ? '少糖' : '标准糖';
  return `${cup}/${temp}/${sugar}`;
}
