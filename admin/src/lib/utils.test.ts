import { describe, expect, it } from 'vitest';
import { cn, formatYuan, maskPhone } from './utils';

describe('cn', () => {
  it('合并类名并去重', () => {
    expect(cn('a', 'b', false && 'c')).toBe('a b');
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('formatYuan', () => {
  it('分 → ¥xx.xx', () => {
    expect(formatYuan(0)).toBe('¥0.00');
    expect(formatYuan(100)).toBe('¥1.00');
    expect(formatYuan(2800)).toBe('¥28.00');
    expect(formatYuan(12345)).toBe('¥123.45');
  });
});

describe('maskPhone', () => {
  it('脱敏为 138****1234', () => {
    expect(maskPhone('13800001234')).toBe('138****1234');
    expect(maskPhone('13912345678')).toBe('139****5678');
  });
  it('空值返回 -', () => {
    expect(maskPhone(null)).toBe('-');
    expect(maskPhone(undefined)).toBe('-');
  });
});
