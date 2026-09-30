import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { issueAdminToken, issueMemberToken } from '../src/lib/tokens.js';
import { canAdvance, computeOrderAmount } from '../src/services/order.js';

describe('T06 订单服务（纯函数）', () => {
  it('金额明细：原价、优惠、实付正确', () => {
    const r = computeOrderAmount(
      [
        { price: 2800, quantity: 2 },
        { price: 1500, quantity: 1 },
      ],
      500,
    );
    expect(r.originalAmount).toBe(7100);
    expect(r.discountAmount).toBe(500);
    expect(r.payableAmount).toBe(6600);
  });

  it('优惠不超过原价', () => {
    const r = computeOrderAmount([{ price: 1000, quantity: 1 }], 2000);
    expect(r.discountAmount).toBe(1000);
    expect(r.payableAmount).toBe(0);
  });

  it('状态流转：已支付→制作中→待取餐→已完成', () => {
    expect(canAdvance('paid', 'making')).toBe(true);
    expect(canAdvance('making', 'ready')).toBe(true);
    expect(canAdvance('ready', 'completed')).toBe(true);
    expect(canAdvance('pending_payment', 'making')).toBe(false);
    expect(canAdvance('completed', 'ready')).toBe(false);
    expect(canAdvance('cancelled', 'paid')).toBe(false);
  });
});

describe('T06 订单接口', () => {
  let app: FastifyInstance;
  let token = '';
  let adminToken = '';
  let staffToken = '';
  let orderId = 0;

  beforeAll(async () => {
    app = await buildApp({ dbFile: ':memory:', logger: false });
    // 启用种子第二杯半价活动（默认停用）
    const { getDb } = await import('../src/db/index.js');
    getDb().prepare('UPDATE promotions SET enabled = 1').run();
    // 先登录创建会员，再签发 token
    const login = await app.inject({
      method: 'POST',
      url: '/api/member/login',
      payload: { phone: '13500003333', code: '123456' },
    });
    const memberId = login.json().data.member.id;
    token = issueMemberToken(memberId);
    adminToken = issueAdminToken(1);
    staffToken = issueAdminToken(2);
  });

  afterAll(async () => {
    await app.close();
  });

  it('创建订单（自提，含规格与自动最优券）', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        store_id: 1,
        type: 'pickup',
        items: [
          { product_id: 2, cup: 'large', temperature: 'ice', sugar: 'standard', quantity: 1 },
          { product_id: 15, quantity: 1 },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.code).toBe(0);
    const o = body.data;
    // 拿铁大杯 2800+300=3100，可颂 1500 → 原价 4600
    expect(o.originalAmount).toBe(4600);
    expect(o.status).toBe('pending_payment');
    expect(o.pickupCode).toMatch(/^\d{6}$/);
    // 自动最优券：4600 未达满 100 门槛，无可用券 → 优惠 0
    expect(o.discountAmount).toBe(0);
    expect(o.payableAmount).toBe(4600);
    orderId = o.id;
  });

  it('创建订单（手动选券，金额明细正确）', async () => {
    // 先领券
    await app.inject({
      method: 'POST',
      url: '/api/coupons/1/claim',
      headers: { authorization: `Bearer ${token}` },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        store_id: 1,
        type: 'dine_in',
        items: [{ product_id: 1, cup: 'medium', temperature: 'hot', sugar: 'none', quantity: 7 }],
        coupon_id: 1,
      },
    });
    expect(res.statusCode).toBe(200);
    const o = res.json().data;
    // 美式中杯 2200 × 7 = 15400
    // 第二杯半价：第 2/4/6 杯半价 → 活动优惠 3 × 1100 = 3300
    // 活动后金额 12100 满足满 100 减 20 → 券优惠 2000，实付 10100
    expect(o.originalAmount).toBe(15400);
    expect(o.promoDiscountAmount).toBe(3300);
    expect(o.discountAmount).toBe(2000);
    expect(o.payableAmount).toBe(10100);
  });

  it('手动选券未达门槛返回错误', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        store_id: 1,
        type: 'pickup',
        items: [{ product_id: 1, cup: 'medium', temperature: 'hot', sugar: 'none', quantity: 1 }],
        coupon_id: 1,
      },
    });
    // 券 1 已在上一步使用，且金额 2200 未达满 100 门槛
    expect(res.statusCode).toBe(400);
    expect(res.json().code).not.toBe(0);
  });

  it('购买下架/售罄商品返回错误', async () => {
    const { getDb } = await import('../src/db/index.js');
    getDb().prepare("UPDATE products SET status = 'off' WHERE id = 5").run();
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${token}` },
      payload: { store_id: 1, type: 'pickup', items: [{ product_id: 5, quantity: 1 }] },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).not.toBe(0);
    getDb().prepare("UPDATE products SET status = 'on' WHERE id = 5").run();

    getDb().prepare('UPDATE products SET sold_out = 1 WHERE id = 6').run();
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${token}` },
      payload: { store_id: 1, type: 'pickup', items: [{ product_id: 6, quantity: 1 }] },
    });
    expect(res2.statusCode).toBe(400);
    getDb().prepare('UPDATE products SET sold_out = 0 WHERE id = 6').run();
  });

  it('模拟支付成功，状态变为已支付', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/orders/${orderId}/pay`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const o = res.json().data;
    expect(o.status).toBe('paid');
    expect(o.paidAt).toBeTruthy();
  });

  it('重复支付返回状态错误', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/orders/${orderId}/pay`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).not.toBe(0);
  });

  it('支付后不可取消', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/orders/${orderId}/cancel`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it('店员可推进本门店订单状态', async () => {
    // staff01 绑定门店 1，orderId 属于门店 1
    const r1 = await app.inject({
      method: 'POST',
      url: `/api/admin/orders/${orderId}/advance`,
      headers: { authorization: `Bearer ${staffToken}` },
      payload: { target: 'making' },
    });
    expect(r1.statusCode).toBe(200);
    expect(r1.json().data.status).toBe('making');
  });

  it('非法状态流转返回错误', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/admin/orders/${orderId}/advance`,
      headers: { authorization: `Bearer ${staffToken}` },
      payload: { target: 'completed' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).not.toBe(0);
  });

  it('店员不能操作他店订单', async () => {
    // 创建一个门店 2 的订单
    const create = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${token}` },
      payload: { store_id: 2, type: 'pickup', items: [{ product_id: 15, quantity: 1 }] },
    });
    const otherOrderId = create.json().data.id;
    const res = await app.inject({
      method: 'POST',
      url: `/api/admin/orders/${otherOrderId}/advance`,
      headers: { authorization: `Bearer ${staffToken}` },
      payload: { target: 'making' },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).not.toBe(0);
  });

  it('店员订单列表仅含本门店，且手机号脱敏', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/orders',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    expect(res.statusCode).toBe(200);
    const list = res.json().data.list;
    expect(list.length).toBeGreaterThan(0);
    for (const o of list) {
      expect(o.storeId).toBe(1);
      expect(o.memberPhone).toMatch(/^\d{3}\*{4}\d{4}$/);
    }
  });

  it('管理员可推进完整状态流至已完成', async () => {
    for (const target of ['ready', 'completed']) {
      const res = await app.inject({
        method: 'POST',
        url: `/api/admin/orders/${orderId}/advance`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { target },
      });
      expect(res.statusCode).toBe(200);
    }
    const detail = await app.inject({
      method: 'GET',
      url: `/api/orders/${orderId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(detail.json().data.status).toBe('completed');
  });

  it('优惠券所有权：不能使用他人的券', async () => {
    // 会员2 领券
    const login2 = await app.inject({
      method: 'POST',
      url: '/api/member/login',
      payload: { phone: '13500009999', code: '123456' },
    });
    const token2 = login2.json().data.token;
    await app.inject({
      method: 'POST',
      url: '/api/coupons/1/claim',
      headers: { authorization: `Bearer ${token2}` },
    });
    // 会员1 用会员2 的券下单
    const list2 = await app.inject({
      method: 'GET',
      url: '/api/member/coupons',
      headers: { authorization: `Bearer ${token2}` },
    });
    const coupon2 = list2.json().data[0];
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        store_id: 1,
        type: 'pickup',
        items: [{ product_id: 1, cup: 'medium', temperature: 'hot', sugar: 'none', quantity: 5 }],
        coupon_id: coupon2.id,
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it('同一张券不能同时用于多笔订单', async () => {
    // 会员1 领券
    await app.inject({
      method: 'POST',
      url: '/api/coupons/1/claim',
      headers: { authorization: `Bearer ${token}` },
    });
    const mk = () => ({
      store_id: 1,
      type: 'pickup',
      items: [{ product_id: 1, cup: 'medium', temperature: 'hot', sugar: 'none', quantity: 5 }],
    });
    const o1 = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${token}` },
      payload: mk(),
    });
    expect(o1.statusCode).toBe(200);
    // 第二笔订单自动推荐不应再选中已核销的券
    const o2 = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${token}` },
      payload: mk(),
    });
    expect(o2.statusCode).toBe(200);
    expect(o2.json().data.discountAmount).toBe(0);
  });

  it('第二杯半价：适用商品第 2、4… 杯半价', async () => {
    // 美式中杯 2200 × 4 = 8800，第 2/4 杯半价 → 活动优惠 2 × 1100 = 2200
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        store_id: 1,
        type: 'pickup',
        items: [{ product_id: 1, cup: 'medium', temperature: 'hot', sugar: 'none', quantity: 4 }],
      },
    });
    expect(res.statusCode).toBe(200);
    const o = res.json().data;
    expect(o.originalAmount).toBe(8800);
    expect(o.promoDiscountAmount).toBe(2200);
    expect(o.payableAmount).toBe(6600);
  });

  it('第二杯半价与优惠券叠加：先活动后券', async () => {
    // 会员1 领 9 折券（无门槛）
    await app.inject({
      method: 'POST',
      url: '/api/coupons/2/claim',
      headers: { authorization: `Bearer ${token}` },
    });
    // 拿铁大杯 3100 × 2 = 6200，第 2 杯半价 → 活动优惠 1550
    // 活动后金额 4650，9 折优惠 floor(4650 × 10/100) = 465，实付 4185
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        store_id: 1,
        type: 'pickup',
        items: [
          { product_id: 2, cup: 'large', temperature: 'ice', sugar: 'standard', quantity: 2 },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    const o = res.json().data;
    expect(o.originalAmount).toBe(6200);
    expect(o.promoDiscountAmount).toBe(1550);
    expect(o.discountAmount).toBe(465);
    expect(o.payableAmount).toBe(4185);
  });

  it('非适用商品不参与活动', async () => {
    // 可颂（非饮品）不在活动中：1500 × 2 无活动优惠
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        store_id: 1,
        type: 'pickup',
        items: [{ product_id: 15, quantity: 2 }],
      },
    });
    expect(res.statusCode).toBe(200);
    const o = res.json().data;
    expect(o.originalAmount).toBe(3000);
    expect(o.promoDiscountAmount).toBe(0);
    expect(o.payableAmount).toBe(3000);
  });

  it('休息中的门店不可下单', async () => {
    const { getDb } = await import('../src/db/index.js');
    getDb().prepare("UPDATE stores SET status = 'closed' WHERE id = 1").run();
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${token}` },
      payload: { store_id: 1, type: 'pickup', items: [{ product_id: 1, quantity: 1 }] },
    });
    expect(res.statusCode).toBe(400);
    getDb().prepare("UPDATE stores SET status = 'open' WHERE id = 1").run();
  });

  it('显式不使用优惠券（coupon_id=0）', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/coupons/1/claim',
      headers: { authorization: `Bearer ${token}` },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        store_id: 1,
        type: 'pickup',
        items: [{ product_id: 1, cup: 'medium', temperature: 'hot', sugar: 'none', quantity: 5 }],
        coupon_id: 0,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.discountAmount).toBe(0);
  });

  it('取消待支付订单成功并释放优惠券', async () => {
    // 使用独立会员，避免与其他测试的券领取冲突
    const login3 = await app.inject({
      method: 'POST',
      url: '/api/member/login',
      payload: { phone: '13500007777', code: '123456' },
    });
    const token3 = login3.json().data.token;
    // 领券后创建订单（不支付），再取消
    const claim = await app.inject({
      method: 'POST',
      url: '/api/coupons/2/claim',
      headers: { authorization: `Bearer ${token3}` },
    });
    const couponId = claim.json().data.id;
    const create = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${token3}` },
      payload: {
        store_id: 1,
        type: 'pickup',
        items: [{ product_id: 1, cup: 'medium', temperature: 'hot', sugar: 'none', quantity: 1 }],
        coupon_id: couponId,
      },
    });
    const oid = create.json().data.id;
    const cancel = await app.inject({
      method: 'POST',
      url: `/api/orders/${oid}/cancel`,
      headers: { authorization: `Bearer ${token3}` },
    });
    expect(cancel.statusCode).toBe(200);
    expect(cancel.json().data.status).toBe('cancelled');
    // 券已释放：状态回到 unused
    const list = await app.inject({
      method: 'GET',
      url: '/api/member/coupons',
      headers: { authorization: `Bearer ${token3}` },
    });
    const released = list.json().data.find((c: { id: number }) => c.id === couponId);
    expect(released.status).toBe('unused');
  });
});
