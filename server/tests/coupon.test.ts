import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDiscount, findBestCoupon, isCouponValid } from '../src/utils/coupon.js';
import type { Coupon, UserCoupon } from '../src/utils/coupon.js';

const baseCoupon: Coupon = {
  id: 1,
  name: '测试券',
  type: 'fixed',
  threshold: 2000,
  discount: 500,
  valid_from: '2026-09-01T00:00:00Z',
  valid_to: '2026-12-31T23:59:59Z',
};

test('满减券：未达到门槛时优惠为 0', () => {
  assert.equal(calculateDiscount(baseCoupon, 1500), 0);
});

test('满减券：达到门槛时优惠为 discount', () => {
  assert.equal(calculateDiscount(baseCoupon, 2500), 500);
});

test('折扣券：按比例计算', () => {
  const percentCoupon: Coupon = { ...baseCoupon, type: 'percent', threshold: 3000, discount: 20 };
  assert.equal(calculateDiscount(percentCoupon, 5000), 1000);
});

test('折扣券：未达到门槛时优惠为 0', () => {
  const percentCoupon: Coupon = { ...baseCoupon, type: 'percent', threshold: 3000, discount: 20 };
  assert.equal(calculateDiscount(percentCoupon, 2500), 0);
});

test('过期券 isCouponValid 返回 false', () => {
  const expired = { ...baseCoupon, valid_to: '2026-01-01T00:00:00Z' };
  assert.equal(isCouponValid(expired, new Date('2026-09-26T00:00:00Z')), false);
});

test('未过期券 isCouponValid 返回 true', () => {
  assert.equal(isCouponValid(baseCoupon, new Date('2026-09-26T00:00:00Z')), true);
});

test('findBestCoupon 返回优惠最大的券', () => {
  const makeUc = (id: number, coupon: Coupon): UserCoupon => ({
    id,
    user_id: 1,
    coupon_id: coupon.id,
    status: 'unused',
    claimed_at: '2026-09-01T00:00:00Z',
    used_at: null,
    order_id: null,
    coupon,
  });
  const coupons = [
    makeUc(1, { ...baseCoupon, id: 1, discount: 300 }),
    makeUc(2, { ...baseCoupon, id: 2, discount: 800 }),
    makeUc(3, { ...baseCoupon, id: 3, discount: 500 }),
  ];
  const best = findBestCoupon(coupons, 3000);
  assert.equal(best?.coupon.id, 2);
});

test('findBestCoupon 跳过已使用和已过期的券', () => {
  const makeUc = (id: number, coupon: Coupon, status: 'unused' | 'used' | 'expired' = 'unused'): UserCoupon => ({
    id,
    user_id: 1,
    coupon_id: coupon.id,
    status,
    claimed_at: '2026-09-01T00:00:00Z',
    used_at: null,
    order_id: null,
    coupon,
  });
  const expiredCoupon: Coupon = { ...baseCoupon, id: 1, valid_to: '2026-01-01T00:00:00Z' };
  const usedCoupon: Coupon = { ...baseCoupon, id: 2, discount: 1000 };
  const validCoupon: Coupon = { ...baseCoupon, id: 3, discount: 200 };
  const coupons = [
    makeUc(1, expiredCoupon),
    makeUc(2, usedCoupon, 'used'),
    makeUc(3, validCoupon),
  ];
  const best = findBestCoupon(coupons, 3000);
  assert.equal(best?.coupon.id, 3);
});

test('findBestCoupon 无可用券时返回 null', () => {
  const makeUc = (id: number, coupon: Coupon): UserCoupon => ({
    id,
    user_id: 1,
    coupon_id: coupon.id,
    status: 'unused',
    claimed_at: '2026-09-01T00:00:00Z',
    used_at: null,
    order_id: null,
    coupon,
  });
  const expiredCoupon: Coupon = { ...baseCoupon, id: 1, valid_to: '2026-01-01T00:00:00Z' };
  const coupons = [makeUc(1, expiredCoupon)];
  const best = findBestCoupon(coupons, 3000);
  assert.equal(best, null);
});
