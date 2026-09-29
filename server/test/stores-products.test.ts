import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { issueAdminToken } from '../src/lib/tokens.js';
import { getDb } from '../src/db/index.js';

describe('T04 门店与商品接口', () => {
  let app: FastifyInstance;
  let adminToken = '';
  let staffToken = '';

  beforeAll(async () => {
    app = await buildApp({ dbFile: ':memory:', logger: false });
    adminToken = issueAdminToken(1);
    staffToken = issueAdminToken(2);
  });

  afterAll(async () => {
    await app.close();
  });

  it('门店列表返回 3 家门店及营业状态', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stores' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.code).toBe(0);
    expect(body.data.length).toBe(3);
    const closed = body.data.find((s: { id: number }) => s.id === 3);
    expect(closed.status).toBe('closed');
    expect(closed.isOpen).toBe(false);
  });

  it('门店详情', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stores/1' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.name).toContain('望京');
  });

  it('分类列表返回 4 个分类', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/categories' });
    expect(res.json().data.length).toBe(4);
  });

  it('用户端商品列表仅含上架商品，售罄商品标记 soldOut', async () => {
    // 把商品 2 标记为售罄
    getDb().prepare('UPDATE products SET sold_out = 1 WHERE id = 2').run();
    const res = await app.inject({ method: 'GET', url: '/api/products' });
    const body = res.json();
    expect(body.code).toBe(0);
    const p2 = body.data.find((p: { id: number }) => p.id === 2);
    expect(p2.soldOut).toBe(true);
    getDb().prepare('UPDATE products SET sold_out = 0 WHERE id = 2').run();
  });

  it('下架商品不在用户端列表中，详情返回已下架', async () => {
    getDb().prepare("UPDATE products SET status = 'off' WHERE id = 3").run();
    const list = await app.inject({ method: 'GET', url: '/api/products' });
    const p3 = list.json().data.find((p: { id: number }) => p.id === 3);
    expect(p3).toBeUndefined();

    const detail = await app.inject({ method: 'GET', url: '/api/products/3' });
    expect(detail.statusCode).toBe(400);
    expect(detail.json().code).not.toBe(0);
    getDb().prepare("UPDATE products SET status = 'on' WHERE id = 3").run();
  });

  it('商品详情含规格（杯型/温度/糖度）', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/products/1' });
    const body = res.json();
    expect(body.data.specs.length).toBe(12);
    const large = body.data.specs.find((s: { cup: string }) => s.cup === 'large');
    expect(large.priceAdjust).toBe(300);
  });

  it('后台可下架商品，用户端不再返回', async () => {
    const patch = await app.inject({
      method: 'PATCH',
      url: '/api/admin/products/4/status',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: 'off' },
    });
    expect(patch.statusCode).toBe(200);
    const list = await app.inject({ method: 'GET', url: '/api/products' });
    expect(list.json().data.find((p: { id: number }) => p.id === 4)).toBeUndefined();
    // 恢复
    await app.inject({
      method: 'PATCH',
      url: '/api/admin/products/4/status',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: 'on' },
    });
  });

  it('店员可修改售罄状态，不可上下架', async () => {
    const soldOut = await app.inject({
      method: 'PATCH',
      url: '/api/admin/products/5/sold-out',
      headers: { authorization: `Bearer ${staffToken}` },
      payload: { sold_out: 1 },
    });
    expect(soldOut.statusCode).toBe(200);
    expect(soldOut.json().data.soldOut).toBe(true);

    const offShelf = await app.inject({
      method: 'PATCH',
      url: '/api/admin/products/5/status',
      headers: { authorization: `Bearer ${staffToken}` },
      payload: { status: 'off' },
    });
    expect(offShelf.statusCode).toBe(403);
    expect(offShelf.json().code).not.toBe(0);

    // 恢复
    await app.inject({
      method: 'PATCH',
      url: '/api/admin/products/5/sold-out',
      headers: { authorization: `Bearer ${staffToken}` },
      payload: { sold_out: 0 },
    });
  });

  it('未登录访问后台商品接口返回统一格式错误', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/admin/products' });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.code).not.toBe(0);
    expect(body.data).toBeNull();
  });
});
