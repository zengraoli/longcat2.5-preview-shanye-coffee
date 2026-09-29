import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, canAccess } from './nav';

describe('菜单权限', () => {
  it('管理员可见全部菜单', () => {
    const visible = NAV_ITEMS.filter((i) => canAccess('admin', i));
    expect(visible.length).toBe(NAV_ITEMS.length);
  });

  it('店员仅可见看板、商品、订单', () => {
    const visible = NAV_ITEMS.filter((i) => canAccess('staff', i));
    const keys = visible.map((i) => i.key);
    expect(keys).toEqual(['dashboard', 'products', 'orders']);
  });

  it('未登录不可见任何菜单', () => {
    const visible = NAV_ITEMS.filter((i) => canAccess(undefined, i));
    expect(visible.length).toBe(0);
  });

  it('店员不可见门店/会员/优惠券/账号', () => {
    const staffKeys = NAV_ITEMS.filter((i) => canAccess('staff', i)).map((i) => i.key);
    for (const k of ['stores', 'members', 'coupons', 'accounts']) {
      expect(staffKeys).not.toContain(k);
    }
  });
});
