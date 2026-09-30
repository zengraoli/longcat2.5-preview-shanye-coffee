import { describe, expect, it } from 'vitest';
import { formatYuan, maskPhone, selectRecommendations, specText } from './utils';

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
