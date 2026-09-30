import { describe, expect, it } from 'vitest';
import {
  computeAmounts,
  couponDiscount,
  formatYuan,
  maskPhone,
  selectRecommendations,
  specPriceAdjust,
  specText,
  unitPrice,
} from './utils';

describe('formatYuan', () => {
  it('分 → ¥xx.xx', () => {
    expect(formatYuan(0)).toBe('¥0.00');
    expect(formatYuan(100)).toBe('¥1.00');
    expect(formatYuan(2800)).toBe('¥28.00');
  });
});

describe('maskPhone', () => {
  it('脱敏为 138****1234', () => {
    expect(maskPhone('13800001234')).toBe('138****1234');
  });
  it('空值返回 -', () => {
    expect(maskPhone(null)).toBe('-');
  });
});

describe('specText', () => {
  it('规格中文描述', () => {
    expect(specText({ cup: 'large', temperature: 'ice', sugar: 'less' })).toBe('大杯/冰/少糖');
  });
});

describe('selectRecommendations', () => {
  const products = [
    { id: 1, soldOut: false },
    { id: 2, soldOut: false },
    { id: 3, soldOut: true },
    { id: 4, soldOut: false },
    { id: 5, soldOut: false },
    { id: 6, soldOut: false },
  ];

  it('过滤售罄商品', () => {
    const ids = selectRecommendations(products, 1).map((p) => p.id);
    expect(ids).not.toContain(3);
  });

  it('门店切换后推荐列表随之变化', () => {
    const forStore1 = selectRecommendations(products, 1).map((p) => p.id);
    const forStore2 = selectRecommendations(products, 2).map((p) => p.id);
    expect(forStore1).not.toEqual(forStore2);
  });

  it('推荐数量不超过 count 与可用商品数', () => {
    expect(selectRecommendations(products, 1, 3)).toHaveLength(3);
    expect(selectRecommendations(products, 1, 99)).toHaveLength(5);
  });

  it('全部售罄时返回空', () => {
    const allOut = products.map((p) => ({ ...p, soldOut: true }));
    expect(selectRecommendations(allOut, 1)).toEqual([]);
  });
});

describe('specPriceAdjust', () => {
  const specs = [
    { cup: 'medium', temperature: 'ice', sugar: 'none', priceAdjust: 0 },
    { cup: 'large', temperature: 'ice', sugar: 'none', priceAdjust: 300 },
    { cup: 'large', temperature: 'hot', sugar: 'less', priceAdjust: 300 },
  ];

  it('中杯不加价', () => {
    expect(specPriceAdjust(specs, 'medium', 'ice', 'none')).toBe(0);
  });

  it('大杯加 300 分', () => {
    expect(specPriceAdjust(specs, 'large', 'ice', 'none')).toBe(300);
    expect(specPriceAdjust(specs, 'large', 'hot', 'less')).toBe(300);
  });

  it('未匹配的规格返回 0', () => {
    expect(specPriceAdjust(specs, 'medium', 'hot', 'standard')).toBe(0);
  });
});

describe('unitPrice', () => {
  it('规格加价正确计入单价', () => {
    expect(unitPrice(2800, 0)).toBe(2800);
    expect(unitPrice(2800, 300)).toBe(3100);
  });

  it('负数价格归零', () => {
    expect(unitPrice(-100, 0)).toBe(0);
    expect(unitPrice(2800, -50)).toBe(2800);
  });
});

describe('computeAmounts', () => {
  it('原价 = Σ(单价 × 数量)', () => {
    const r = computeAmounts(
      [
        { price: 2800, quantity: 2 },
        { price: 3100, quantity: 1 },
      ],
      0,
    );
    expect(r.originalAmount).toBe(8700);
    expect(r.discountAmount).toBe(0);
    expect(r.payableAmount).toBe(8700);
  });

  it('优惠不超过原价且不为负', () => {
    const r = computeAmounts([{ price: 2800, quantity: 1 }], 2000);
    expect(r.discountAmount).toBe(2000);
    expect(r.payableAmount).toBe(800);
    const r2 = computeAmounts([{ price: 2800, quantity: 1 }], 9999);
    expect(r2.discountAmount).toBe(2800);
    expect(r2.payableAmount).toBe(0);
    const r3 = computeAmounts([{ price: 2800, quantity: 1 }], -100);
    expect(r3.discountAmount).toBe(0);
  });
});

describe('couponDiscount', () => {
  it('满减券：满足门槛减固定金额', () => {
    const t = { type: 'full_reduction' as const, threshold: 10000, discountAmount: 2000, discountRate: null };
    expect(couponDiscount(t, 10000)).toBe(2000);
    expect(couponDiscount(t, 12000)).toBe(2000);
  });

  it('满减券：未达门槛优惠为 0', () => {
    const t = { type: 'full_reduction' as const, threshold: 10000, discountAmount: 2000, discountRate: null };
    expect(couponDiscount(t, 9999)).toBe(0);
  });

  it('折扣券：按折扣率向下取整到分', () => {
    const t = { type: 'discount' as const, threshold: 0, discountAmount: null, discountRate: 90 };
    expect(couponDiscount(t, 10000)).toBe(1000);
    expect(couponDiscount(t, 2800)).toBe(280);
    expect(couponDiscount(t, 99)).toBe(9);
  });

  it('折扣率非法时优惠为 0', () => {
    const t = { type: 'discount' as const, threshold: 0, discountAmount: null, discountRate: 100 };
    expect(couponDiscount(t, 10000)).toBe(0);
  });
});
