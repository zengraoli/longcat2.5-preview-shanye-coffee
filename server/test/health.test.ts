import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

describe('T01 骨架：统一响应与全局错误处理', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ dbFile: ':memory:', logger: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health 返回统一格式', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.code).toBe(0);
    expect(body.message).toBe('ok');
    expect(body.data.status).toBe('ok');
    expect(typeof body.data.time).toBe('string');
  });

  it('未匹配路由返回统一错误格式', async () => {
    const res = await app.inject({ method: 'GET', url: '/no-such-api' });
    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.code).not.toBe(0);
    expect(body.data).toBeNull();
    expect(typeof body.message).toBe('string');
    expect(body.message.length).toBeGreaterThan(0);
  });
});
