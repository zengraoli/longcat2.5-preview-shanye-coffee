import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

describe('T03 登录与鉴权', () => {
  let app: FastifyInstance;
  let memberToken = '';
  let adminToken = '';
  let staffToken = '';

  beforeAll(async () => {
    app = await buildApp({ dbFile: ':memory:', logger: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('会员登录：手机号 + 验证码成功', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/member/login',
      payload: { phone: '13800001234', code: '123456' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.code).toBe(0);
    expect(body.data.token).toBeTruthy();
    expect(body.data.member.phone).toBe('13800001234');
    memberToken = body.data.token;
  });

  it('会员登录：验证码错误返回统一格式错误', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/member/login',
      payload: { phone: '13800001234', code: '000000' },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.code).not.toBe(0);
    expect(body.data).toBeNull();
    expect(body.message).toContain('验证码');
  });

  it('会员登录：手机号格式错误', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/member/login',
      payload: { phone: '123', code: '123456' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).not.toBe(0);
  });

  it('后台登录：管理员成功', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { username: 'admin', password: 'admin123' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.code).toBe(0);
    expect(body.data.admin.role).toBe('admin');
    adminToken = body.data.token;
  });

  it('后台登录：店员成功', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { username: 'staff01', password: 'staff123' },
    });
    expect(res.statusCode).toBe(200);
    staffToken = res.json().data.token;
  });

  it('后台登录：密码错误返回统一格式错误', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { username: 'admin', password: 'wrong' },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.code).not.toBe(0);
    expect(body.message).toContain('账号或密码');
  });

  it('未登录访问受保护接口返回统一格式错误', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/member/me' });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.code).not.toBe(0);
    expect(body.data).toBeNull();
    expect(typeof body.message).toBe('string');
  });

  it('携带会员 token 可访问受保护接口', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/member/me',
      headers: { authorization: `Bearer ${memberToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().code).toBe(0);
    expect(res.json().data.phone).toBe('13800001234');
  });

  it('店员访问管理员接口被拒绝（403）', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/me',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    // /api/admin/me 允许后台任意角色；用 requireAdmin 的管理员接口验证 403
    expect(res.statusCode).toBe(200);
    // 直接验证 requireAdmin 装饰器：店员 token 访问管理员专属路由
    const res2 = await app.inject({
      method: 'GET',
      url: '/api/admin/only-admin',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    expect(res2.statusCode).toBe(403);
    expect(res2.json().code).not.toBe(0);
  });

  it('管理员可访问管理员专属接口', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/only-admin',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().code).toBe(0);
  });
});
