/** 门店营业状态判断。 */

/** 按北京时间计算门店当前是否营业（status 为 open 时按时间判断）。 */
export function isOpenNow(status: string, openTime: string, closeTime: string): boolean {
  if (status !== 'open') return false;
  const now = new Date(Date.now() + 8 * 3600 * 1000);
  const cur = now.getUTCHours() * 60 + now.getUTCMinutes();
  const parse = (t: string): number => {
    const [h, m] = t.split(':');
    return Number(h) * 60 + Number(m);
  };
  const open = parse(openTime);
  const close = parse(closeTime);
  if (close >= open) return cur >= open && cur < close;
  return cur >= open || cur < close;
}
