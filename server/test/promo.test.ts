import { describe, expect, it } from 'vitest';
import {
  activeSecondCupHalfPromotion,
  computePromoDiscount,
  isPromotionActive,
} from '../src/services/promo.js';

const applicable = new Set([1, 2]);

describe('第二杯半价计价', () => {
  it('单件不适用', () => {
    expect(computePromoDiscount([{ productId: 1, price: 2800, quantity: 1 }], applicable)).toBe(0);
  });

  it('第二杯半价：2 件优惠 = floor(单价 / 2)', () => {
    expect(computePromoDiscount([{ productId: 1, price: 2800, quantity: 2 }], applicable)).toBe(1400);
  });

  it('第 2、4 杯半价：4 件优惠 = 2 × floor(单价 / 2)', () => {
    expect(computePromoDiscount([{ productId: 1, price: 3100, quantity: 4 }], applicable)).toBe(3100);
  });

  it('3 件仅第 2 杯半价', () => {
    expect(computePromoDiscount([{ productId: 1, price: 2800, quantity: 3 }], applicable)).toBe(1400);
  });

  it('半价向下取整到分', () => {
    // 单价 2801 → 半价 1400（floor(2801 / 2) = 1400）
    expect(computePromoDiscount([{ productId: 1, price: 2801, quantity: 2 }], applicable)).toBe(1400);
  });

  it('不适用商品不参与', () => {
    expect(computePromoDiscount([{ productId: 99, price: 2800, quantity: 2 }], applicable)).toBe(0);
  });

  it('同商品多行合并计算', () => {
    const d = computePromoDiscount(
      [
        { productId: 1, price: 2800, quantity: 1 },
        { productId: 1, price: 2800, quantity: 1 },
      ],
      applicable,
    );
    expect(d).toBe(1400);
  });

  it('同商品不同规格也参与：中杯×1 + 大杯×1 → 大杯半价', () => {
    const d = computePromoDiscount(
      [
        { productId: 1, price: 2800, quantity: 1 },
        { productId: 1, price: 3100, quantity: 1 },
      ],
      applicable,
    );
    // 升序 [2800, 3100]，第 2 杯（3100）半价 → floor(3100/2) = 1550
    expect(d).toBe(1550);
  });

  it('同商品不同规格混买与顺序无关', () => {
    const items = [
      { productId: 1, price: 2800, quantity: 1 },
      { productId: 1, price: 3100, quantity: 3 },
    ];
    const forward = computePromoDiscount(items, applicable);
    const reverse = computePromoDiscount([...items].reverse(), applicable);
    // 升序 [2800, 3100, 3100, 3100]，第 2、4 杯半价 → 2 × 1550 = 3100
    expect(forward).toBe(3100);
    expect(reverse).toBe(3100);
  });

  it('同商品同价不同温度/糖度也参与', () => {
    const d = computePromoDiscount(
      [
        { productId: 1, price: 2800, quantity: 1 },
        { productId: 1, price: 2800, quantity: 1 },
      ],
      applicable,
    );
    expect(d).toBe(1400);
  });
});

describe('活动生效判断', () => {
  const base = {
    id: 1,
    name: '第二杯半价',
    type: 'second_cup_half' as const,
    startAt: '2026-09-01T00:00:00.000Z',
    endAt: '2026-09-30T23:59:59.999Z',
    enabled: true,
  };

  it('活动时间内生效', () => {
    expect(isPromotionActive(base, new Date('2026-09-15T12:00:00.000Z'))).toBe(true);
  });

  it('活动时间外不生效', () => {
    expect(isPromotionActive(base, new Date('2026-10-01T00:00:00.000Z'))).toBe(false);
    expect(isPromotionActive(base, new Date('2026-08-31T23:59:59.999Z'))).toBe(false);
  });

  it('停用后不生效', () => {
    expect(isPromotionActive({ ...base, enabled: false }, new Date('2026-09-15T12:00:00.000Z'))).toBe(
      false,
    );
  });

  it('选出当前生效的活动', () => {
    const active = activeSecondCupHalfPromotion(
      [base],
      new Date('2026-09-15T12:00:00.000Z'),
    );
    expect(active?.id).toBe(1);
    expect(
      activeSecondCupHalfPromotion([base], new Date('2026-10-01T00:00:00.000Z')),
    ).toBeNull();
  });
});
