import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { buildApp } from '../src/app.js';

process.env.DB_PATH = ':memory:';

async function makeRequest(
  app: Fastify.FastifyInstance,
  method: string,
  url: string,
  token?: string,
  body?: unknown,
) {
  const headers: Record<string, string> = {};
  if (token) headers['authorization'] = `Bearer ${token}`;
  if (body) headers['content-type'] = 'application/json';
  return app.inject({ method, url, headers, payload: body });
}

async function createTestApp(): Promise<Fastify.FastifyInstance> {
  const app = Fastify({ logger: false });
  await buildApp(app);
  return app;
}

async function loginAsMember(app: Fastify.FastifyInstance): Promise<string> {
  const res = await makeRequest(app, 'POST', '/api/member/login', undefined, { phone: '13800001234', code: '123456' });
  return res.json().data.token;
}

test('第二杯半价：同一商品2杯时第二杯半价', async () => {
  const app = await createTestApp();
  const token = await loginAsMember(app);
  const order = await makeRequest(app, 'POST', '/api/orders', token, {
    storeId: 1,
    type: 'pickup',
    items: [{ productId: 1, quantity: 2, cupSize: 'medium', temperature: 'hot', sugar: 'standard' }],
  });
  assert.equal(order.statusCode, 200);
  const data = order.json().data;
  assert.equal(data.originalAmount, 4400);
  assert.equal(data.discountAmount, 1100);
  assert.equal(data.paidAmount, 3300);
  await app.close();
});

test('第二杯半价：3杯时只有1杯半价', async () => {
  const app = await createTestApp();
  const token = await loginAsMember(app);
  const order = await makeRequest(app, 'POST', '/api/orders', token, {
    storeId: 1,
    type: 'pickup',
    items: [{ productId: 1, quantity: 3, cupSize: 'medium', temperature: 'hot', sugar: 'standard' }],
  });
  assert.equal(order.statusCode, 200);
  const data = order.json().data;
  assert.equal(data.originalAmount, 6600);
  assert.equal(data.discountAmount, 1100);
  assert.equal(data.paidAmount, 5500);
  await app.close();
});

test('活动价与优惠券叠加：先算活动价再用券', async () => {
  const app = await createTestApp();
  const token = await loginAsMember(app);
  await makeRequest(app, 'POST', '/api/coupons/1/claim', token);
  const order = await makeRequest(app, 'POST', '/api/orders', token, {
    storeId: 1,
    type: 'pickup',
    items: [{ productId: 1, quantity: 2, cupSize: 'medium', temperature: 'hot', sugar: 'standard' }],
  });
  assert.equal(order.statusCode, 200);
  const data = order.json().data;
  assert.equal(data.originalAmount, 4400);
  assert.ok(data.discountAmount >= 1100);
  await app.close();
});

test('活动期外不享受半价', async () => {
  const app = await createTestApp();
  const token = await loginAsMember(app);
  const db = (await import('../src/db.js')).getDb();
  const original = db.prepare('SELECT end_time FROM promotions WHERE id = 1').get() as { end_time: string };
  db.prepare("UPDATE promotions SET end_time = '2020-01-01T00:00:00Z' WHERE id = 1").run();
  const order = await makeRequest(app, 'POST', '/api/orders', token, {
    storeId: 1,
    type: 'pickup',
    items: [{ productId: 1, quantity: 2, cupSize: 'medium', temperature: 'hot', sugar: 'standard' }],
  });
  assert.equal(order.statusCode, 200);
  const data = order.json().data;
  assert.equal(data.originalAmount, 4400);
  assert.equal(data.discountAmount, 0);
  assert.equal(data.paidAmount, 4400);
  db.prepare('UPDATE promotions SET end_time = ? WHERE id = 1').run(original.end_time);
  await app.close();
});

test('非活动商品不参与半价', async () => {
  const app = await createTestApp();
  const token = await loginAsMember(app);
  const order = await makeRequest(app, 'POST', '/api/orders', token, {
    storeId: 1,
    type: 'pickup',
    items: [{ productId: 13, quantity: 2, cupSize: 'medium', temperature: 'hot', sugar: 'standard' }],
  });
  assert.equal(order.statusCode, 200);
  const data = order.json().data;
  assert.equal(data.originalAmount, 4000);
  assert.equal(data.discountAmount, 0);
  await app.close();
});

test('订单详情返回 promo_discount 字段', async () => {
  const app = await createTestApp();
  const token = await loginAsMember(app);
  const orderRes = await makeRequest(app, 'POST', '/api/orders', token, {
    storeId: 1,
    type: 'pickup',
    items: [{ productId: 1, quantity: 2, cupSize: 'medium', temperature: 'hot', sugar: 'standard' }],
  });
  const orderId = orderRes.json().data.id;
  const detail = await makeRequest(app, 'GET', `/api/orders/${orderId}`, token);
  assert.equal(detail.statusCode, 200);
  const data = detail.json().data;
  assert.equal(data.promo_discount, 1100);
  await app.close();
});
