export interface Coupon {
  id: number;
  name: string;
  type: 'fixed' | 'percent';
  threshold: number;
  discount: number;
  valid_from: string;
  valid_to: string;
}

export interface UserCoupon {
  id: number;
  user_id: number;
  coupon_id: number;
  status: 'unused' | 'used' | 'expired';
  claimed_at: string;
  used_at: string | null;
  order_id: number | null;
  coupon: Coupon;
}

export function isCouponValid(coupon: Coupon, now: Date = new Date()): boolean {
  return now >= new Date(coupon.valid_from) && now <= new Date(coupon.valid_to);
}

export function calculateDiscount(coupon: Coupon, amount: number): number {
  if (amount < coupon.threshold) return 0;
  if (coupon.type === 'fixed') {
    return Math.min(coupon.discount, amount);
  }
  const discount = Math.floor((amount * coupon.discount) / 100);
  return Math.min(discount, amount);
}

export function findBestCoupon(coupons: UserCoupon[], amount: number): UserCoupon | null {
  let best: UserCoupon | null = null;
  let bestDiscount = 0;
  const now = new Date();

  for (const uc of coupons) {
    if (uc.status !== 'unused') continue;
    if (!isCouponValid(uc.coupon, now)) continue;
    const discount = calculateDiscount(uc.coupon, amount);
    if (discount > bestDiscount) {
      bestDiscount = discount;
      best = uc;
    }
  }
  return best;
}
