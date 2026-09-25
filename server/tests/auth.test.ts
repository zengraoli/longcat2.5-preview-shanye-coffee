import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

async function createTestApp(): Promise<FastifyInstance> {
  const app = (await import('fastify')).default({ logger: false });
  await buildApp(app);
  return app;
}

test('未登录访问受保护接口返回 401 统一格式', async () => {
  process.env.DB_PATH = ':memory:';
  const app = await createTestApp();
  const res = await app.inject({ method: 'GET', url: '/api/member/me' });
  const body = res.json();
  assert.equal(res.statusCode, 401);
  assert.equal(body.code, 1002);
  assert.equal(body.message, '未登录或登录已过期');
  await app.close();
});

test('会员手机号 + 验证码登录成功返回 token', async () => {
  process.env.DB_PATH = ':memory:';
  const app = await createTestApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/member/login',
    payload: { phone: '13800001234', code: '123456' },
  });
  const body = res.json();
  assert.equal(res.statusCode, 200);
  assert.equal(body.code, 0);
  assert.ok(body.data.token);
  assert.equal(body.data.member.phone, '13800001234');
  await app.close();
});

test('错误验证码登录失败', async () => {
  process.env.DB_PATH = ':memory:';
  const app = await createTestApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/member/login',
    payload: { phone: '13800001234', code: '000000' },
  });
  const body = res.json();
  assert.equal(res.statusCode, 400);
  assert.equal(body.code, 1001);
  await app.close();
});

test('后台账号密码登录成功', async () => {
  process.env.DB_PATH = ':memory:';
  const app = await createTestApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/admin/login',
    payload: { username: 'admin', password: 'admin123' },
  });
  const body = res.json();
  assert.equal(res.statusCode, 200);
  assert.equal(body.code, 0);
  assert.equal(body.data.admin.role, 'admin');
  await app.close();
});

test('错误密码登录失败', async () => {
  process.env.DB_PATH = ':memory:';
  const app = await createTestApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/admin/login',
    payload: { username: 'admin', password: 'wrong' },
  });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().code, 1002);
  await app.close();
});
