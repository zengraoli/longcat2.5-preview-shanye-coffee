import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { issueMemberToken } from '../src/lib/tokens.js';
import {
  bestCoupon,
  computeDiscount,
  isCouponUsable,
  type CouponTemplate,
  type MemberCoupon,
} from '../src/services/coupon.js';

const fullReduction: CouponTemplate = {
  id: 1,
  name: '满100减20券',
  type: 'full_reduction',
  threshold: 10000,
  discount_amount: 2000,
  discount_rate: null,
  valid_days: 30,
};

const discount90: CouponTemplate = {
  id: 2,
  name: '9折优惠券',
  type: 'discount',
  threshold: 0,
  discount_amount: null,
  discount_rate: 90,
  valid_days: 14,
};

function mc(over: Partial<MemberCoupon>): MemberCoupon {
  return {
    id: 1,
    member_id: 1,
    template_id: 1,
    status: 'unused',
    claimed_at: '2026-09-01T00:00:00.000Z',
    expires_at: '2026-10-01T00:00:00.000Z',
    ...over,
  };
}

describe('T05 优惠券服务（纯函数）', () => {
  it('满减券：达到门槛减固定金额', () => {
    expect(computeDiscount(fullReduction, 10000)).toBe(2000);
    expect(computeDiscount(fullReduction, 12000)).toBe(2000);
  });

  it('满减券：未达门槛优惠为 0', () => {
    expect(computeDiscount(fullReduction, 9999)).toBe(0);
  });

  it('折扣券：按折扣率计算并向下取整', () => {
    expect(computeDiscount(discount90, 2800)).toBe(280);
    expect(computeDiscount(discount90, 2200)).toBe(220);
    expect(computeDiscount(discount90, 1999)).toBe(199);
  });

  it('过期券不可用', () => {
    const expired = mc({ expires_at: '2020-01-01T00:00:00.000Z' });
    expect(isCouponUsable(expired, new Date('2026-09-29T00:00:00.000Z'))).toBe(false);
  });

  it('已使用券不可用', () => {
    expect(isCouponUsable(mc({ status: 'used' }))).toBe(false);
  });

  it('最优券：选优惠最大的一张', () => {
    const coupons = [
      mc({ id: 1, template_id: 1 }),
      mc({ id: 2, template_id: 2 }),
    ];
    const templates = new Map([
      [1, fullReduction],
      [2, discount90],
    ]);
    // 原价 10000：满减 2000 vs 折扣 1000 → 选满减
    const best = bestCoupon(coupons, templates, 10000, new Date('2026-09-29T00:00:00.000Z'));
    expect(best?.coupon.id).toBe(1);
    expect(best?.discount).toBe(2000);
  });

  it('最优券：未达满减门槛时选折扣券', () => {
    const coupons = [mc({ id: 1, template_id: 1 }), mc({ id: 2, template_id: 2 })];
    const templates = new Map([
      [1, fullReduction],
      [2, discount90],
    ]);
    const best = bestCoupon(coupons, templates, 5000, new Date('2026-09-29T00:00:00.000Z'));
    expect(best?.coupon.id).toBe(2);
    expect(best?.discount).toBe(500);
  });

  it('最优券：全部不可用时返回 null', () => {
    const coupons = [mc({ id: 1, template_id: 1, status: 'used' })];
    const templates = new Map([[1, fullReduction]]);
    expect(bestCoupon(coupons, templates, 10000)).toBeNull();
  });
});

describe('T05 优惠券接口', () => {
  let app: FastifyInstance;
  let token = '';

  beforeAll(async () => {
    app = await buildApp({ dbFile: ':memory:', logger: false });
    const login = await app.inject({
      method: 'POST',
      url: '/api/member/login',
      payload: { phone: '13700001111', code: '123456' },
    });
    token = login.json().data.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('领取优惠券成功', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/coupons/1/claim',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.code).toBe(0);
    expect(body.data.name).toBe('满100减20券');
    expect(body.data.status).toBe('unused');
    expect(body.data.usable).toBe(true);
  });

  it('重复领取返回已领取', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/coupons/1/claim',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).not.toBe(0);
  });

  it('我的优惠券列表', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/member/coupons',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.length).toBeGreaterThanOrEqual(1);
  });

  it('最优券预览：满减门槛之上选满减', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/member/coupons/best?amount=10000',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.coupon.name).toBe('满100减20券');
    expect(body.data.discount).toBe(2000);
    expect(body.data.payable).toBe(8000);
  });

  it('过期券不可用：构造过期券后最优券跳过它', async () => {
    // 领取 9 折券，再手动置为过期
    await app.inject({
      method: 'POST',
      url: '/api/coupons/2/claim',
      headers: { authorization: `Bearer ${token}` },
    });
    const { getDb } = await import('../src/db/index.js');
    getDb()
      .prepare("UPDATE member_coupons SET expires_at = '2020-01-01T00:00:00.000Z' WHERE template_id = 2 AND member_id = 1")
      .run();
    const res = await app.inject({
      method: 'GET',
      url: '/api/member/coupons/best?amount=10000',
      headers: { authorization: `Bearer ${token}` },
    });
    const body = res.json();
    // 过期券被跳过，仍选满减券
    expect(body.data.coupon.name).toBe('满100减20券');
    // 我的优惠券中该券标记为 expired 且 usable=false
    const mine = await app.inject({
      method: 'GET',
      url: '/api/member/coupons',
      headers: { authorization: `Bearer ${token}` },
    });
    const expired = mine.json().data.find((c: { name: string }) => c.name === '9折优惠券');
    expect(expired.status).toBe('expired');
    expect(expired.usable).toBe(false);
  });
});
