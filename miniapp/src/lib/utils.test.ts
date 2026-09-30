import { describe, expect, it } from 'vitest';
import { formatYuan, maskPhone, specText } from './utils';

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
