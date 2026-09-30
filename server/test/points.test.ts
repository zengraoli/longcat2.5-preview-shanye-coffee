import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { issueMemberToken } from '../src/lib/tokens.js';
import { getDb } from '../src/db/index.js';
import { levelForPoints, pointsForAmount } from '../src/services/points.js';

describe('T07 积分与等级服务（纯函数）', () => {
  it('积分：每 1 元积 1 分，向下取整', () => {
    expect(pointsForAmount(100)).toBe(1);
    expect(pointsForAmount(250)).toBe(2);
    expect(pointsForAmount(999)).toBe(9);
    expect(pointsForAmount(0)).toBe(0);
  });

  it('等级：银卡 0、金卡 500、黑卡 2000', () => {
    expect(levelForPoints(0).level).toBe('silver');
    expect(levelForPoints(499).level).toBe('silver');
    expect(levelForPoints(500).level).toBe('gold');
    expect(levelForPoints(1999).level).toBe('gold');
    expect(levelForPoints(2000).level).toBe('black');
    expect(levelForPoints(5000).level).toBe('black');
  });

  it('等级：下一等级与差距', () => {
    const silver = levelForPoints(0);
    expect(silver.nextLevel).toBe('gold');
    expect(silver.pointsToNext).toBe(500);
    const gold = levelForPoints(500);
    expect(gold.nextLevel).toBe('black');
    expect(gold.pointsToNext).toBe(1500);
    const black = levelForPoints(2000);
    expect(black.nextLevel).toBeNull();
    expect(black.pointsToNext).toBeNull();
  });
});

describe('T07 积分与等级接口', () => {
  let app: FastifyInstance;
  let token = '';
  let memberId = 0;

  beforeAll(async () => {
    app = await buildApp({ dbFile: ':memory:', logger: false });
    const login = await app.inject({
      method: 'POST',
      url: '/api/member/login',
      payload: { phone: '13300005555', code: '123456' },
    });
    memberId = login.json().data.member.id;
    token = issueMemberToken(memberId);
  });

  afterAll(async () => {
    await app.close();
  });

  it('支付后按实付金额积分到账', async () => {
    // 创建订单：美式中杯 2200 × 3 = 6600
    // 第二杯半价：第 2 杯半价 → 活动优惠 1100，实付 5500 → 55 分
    const create = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        store_id: 1,
        type: 'pickup',
        items: [{ product_id: 1, cup: 'medium', temperature: 'hot', sugar: 'none', quantity: 3 }],
      },
    });
    const order = create.json().data;
    expect(order.promoDiscountAmount).toBe(1100);
    expect(order.payableAmount).toBe(5500);

    const pay = await app.inject({
      method: 'POST',
      url: `/api/orders/${order.id}/pay`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(pay.statusCode).toBe(200);

    const db = getDb();
    const member = db.prepare('SELECT points FROM members WHERE id = ?').get(memberId) as {
      points: number;
    };
    expect(member.points).toBe(55);

    const log = db
      .prepare('SELECT * FROM point_logs WHERE member_id = ? AND order_id = ?')
      .get(memberId, order.id) as { points: number; balance: number; remark: string };
    expect(log.points).toBe(55);
    expect(log.balance).toBe(55);
  });

  it('积分累计驱动等级自动升级', async () => {
    const db = getDb();
    // 直接构造积分跨越等级阈值
    db.prepare('UPDATE members SET points = 499 WHERE id = ?').run(memberId);
    let me = await app.inject({
      method: 'GET',
      url: '/api/member/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.json().data.level.level).toBe('silver');

    db.prepare('UPDATE members SET points = 500 WHERE id = ?').run(memberId);
    me = await app.inject({
      method: 'GET',
      url: '/api/member/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.json().data.level.level).toBe('gold');

    db.prepare('UPDATE members SET points = 2000 WHERE id = ?').run(memberId);
    me = await app.inject({
      method: 'GET',
      url: '/api/member/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.json().data.level.level).toBe('black');
    expect(me.json().data.level.nextLevel).toBeNull();
  });
});
