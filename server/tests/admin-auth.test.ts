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

async function loginAsAdmin(app: Fastify.FastifyInstance): Promise<string> {
  const res = await makeRequest(app, 'POST', '/api/admin/login', undefined, { username: 'admin', password: 'admin123' });
  assert.equal(res.statusCode, 200);
  return res.json().data.token;
}

async function loginAsStaff(app: Fastify.FastifyInstance): Promise<string> {
  const res = await makeRequest(app, 'POST', '/api/admin/login', undefined, { username: 'staff01', password: 'staff123' });
  assert.equal(res.statusCode, 200);
  return res.json().data.token;
}

test('未登录访问后台接口返回 401', async () => {
  const app = await createTestApp();
  const res = await makeRequest(app, 'GET', '/api/admin/orders');
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().code, 1002);
  await app.close();
});

test('店员 token 可访问后台订单接口', async () => {
  const app = await createTestApp();
  const staffToken = await loginAsStaff(app);
  const res = await makeRequest(app, 'GET', '/api/admin/orders', staffToken);
  assert.equal(res.statusCode, 200);
  await app.close();
});

test('管理员 token 可访问后台订单接口', async () => {
  const app = await createTestApp();
  const adminToken = await loginAsAdmin(app);
  const res = await makeRequest(app, 'GET', '/api/admin/orders', adminToken);
  assert.equal(res.statusCode, 200);
  await app.close();
});

test('店员只能看到本门店订单', async () => {
  const app = await createTestApp();
  const staffToken = await loginAsStaff(app);
  const res = await makeRequest(app, 'GET', '/api/admin/orders', staffToken);
  const orders = res.json().data;
  for (const order of orders) {
    assert.equal(order.store_id, 1, '店员只能看到门店 1 的订单');
  }
  await app.close();
});

test('错误密码登录返回 401', async () => {
  const app = await createTestApp();
  const res = await makeRequest(app, 'POST', '/api/admin/login', undefined, { username: 'admin', password: 'wrong' });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().code, 1002);
  await app.close();
});
