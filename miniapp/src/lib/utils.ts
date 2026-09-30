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
