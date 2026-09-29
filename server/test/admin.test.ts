import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { issueAdminToken, issueMemberToken } from '../src/lib/tokens.js';
import { getDb } from '../src/db/index.js';

describe('T14 后台管理接口', () => {
  let app: FastifyInstance;
  let adminToken = '';
  let memberToken = '';

  beforeAll(async () => {
    app = await buildApp({ dbFile: ':memory:', logger: false });
    adminToken = issueAdminToken(1);
    // 创建会员用于列表测试
    const login = await app.inject({
      method: 'POST',
      url: '/api/member/login',
      payload: { phone: '13600007777', code: '123456' },
    });
    memberToken = login.json().data.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('会员列表手机号已脱敏', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/members',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const list = res.json().data;
    const m = list.find((x: { phone: string }) => x.phone.includes('7777'));
    expect(m).toBeTruthy();
    expect(m.phone).toBe('136****7777');
  });

  it('会员详情含订单与优惠券', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/api/admin/members',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const member = list.json().data[0];
    const res = await app.inject({
      method: 'GET',
      url: `/api/admin/members/${member.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const detail = res.json().data;
    expect(detail.phone).toBe('136****7777');
    expect(Array.isArray(detail.orders)).toBe(true);
    expect(Array.isArray(detail.coupons)).toBe(true);
  });

  it('创建满减优惠券模板', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/coupon-templates',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        name: '满50减10',
        type: 'full_reduction',
        threshold: 5000,
        discount_amount: 1000,
        valid_days: 30,
        total_stock: 100,
      },
    });
    expect(res.statusCode).toBe(200);
    const t = res.json().data;
    expect(t.name).toBe('满50减10');
    expect(t.type).toBe('full_reduction');
    expect(t.enabled).toBe(true);
  });

  it('创建折扣优惠券模板', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/coupon-templates',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: '8折券', type: 'discount', discount_rate: 80, valid_days: 7 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.discountRate).toBe(80);
  });

  it('停用优惠券模板', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/api/admin/coupon-templates',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const t = list.json().data[0];
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/admin/coupon-templates/${t.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { enabled: false },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.enabled).toBe(false);
  });

  it('编辑门店信息与营业状态', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/admin/stores/1',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: 'closed', address: '北京市朝阳区望京SOHO T1 座 201' },
    });
    expect(res.statusCode).toBe(200);
    const s = res.json().data;
    expect(s.status).toBe('closed');
    expect(s.address).toContain('201');
    // 恢复
    await app.inject({
      method: 'PATCH',
      url: '/api/admin/stores/1',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: 'open', address: '北京市朝阳区望京SOHO T1 座 101' },
    });
  });

  it('新增后台账号并分配角色', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/accounts',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { username: 'staff02', password: 'staff123', name: '店员小李', role: 'staff', store_id: 2 },
    });
    expect(res.statusCode).toBe(200);
    const a = res.json().data;
    expect(a.role).toBe('staff');
    expect(a.storeId).toBe(2);
    expect(a.enabled).toBe(true);

    // 该账号可登录
    const login = await app.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { username: 'staff02', password: 'staff123' },
    });
    expect(login.statusCode).toBe(200);
  });

  it('停用账号后无法登录', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/api/admin/accounts',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const staff02 = list.json().data.find((a: { username: string }) => a.username === 'staff02');
    const disable = await app.inject({
      method: 'PATCH',
      url: `/api/admin/accounts/${staff02.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { enabled: false },
    });
    expect(disable.statusCode).toBe(200);
    expect(disable.json().data.enabled).toBe(false);

    const login = await app.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { username: 'staff02', password: 'staff123' },
    });
    expect(login.statusCode).toBe(403);
  });

  it('重置密码后可登录', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/api/admin/accounts',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const staff02 = list.json().data.find((a: { username: string }) => a.username === 'staff02');
    await app.inject({
      method: 'PATCH',
      url: `/api/admin/accounts/${staff02.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { password: 'newpass123', enabled: true },
    });
    const login = await app.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { username: 'staff02', password: 'newpass123' },
    });
    expect(login.statusCode).toBe(200);
  });

    it('停用/重置密码后旧凭证失效', async () => {
    // 准备独立账号 staff04 及其 token
    await app.inject({
      method: 'POST',
      url: '/api/admin/accounts',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { username: 'staff04', password: 'staff123', name: '店员小赵', role: 'staff', store_id: 2 },
    });
    const login2 = await app.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { username: 'staff04', password: 'staff123' },
    });
    const staffToken2 = login2.json().data.token;
    const list = await app.inject({
      method: 'GET',
      url: '/api/admin/accounts',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const staff04 = list.json().data.find((a: { username: string }) => a.username === 'staff04');
    // 停用
    await app.inject({
      method: 'PATCH',
      url: `/api/admin/accounts/${staff04.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { enabled: false },
    });
    // 旧凭证失效
    const me = await app.inject({
      method: 'GET',
      url: '/api/admin/me',
      headers: { authorization: `Bearer ${staffToken2}` },
    });
    expect(me.statusCode).toBe(401);
    // 重新启用并重置密码
    await app.inject({
      method: 'PATCH',
      url: `/api/admin/accounts/${staff04.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { enabled: true, password: 'reset123' },
    });
    // 旧凭证仍失效
    const me2 = await app.inject({
      method: 'GET',
      url: '/api/admin/me',
      headers: { authorization: `Bearer ${staffToken2}` },
    });
    expect(me2.statusCode).toBe(401);
  });

  it('编辑账号保留绑定门店', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/api/admin/accounts',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const staff02 = list.json().data.find((a: { username: string }) => a.username === 'staff02');
    // 只重置密码，不改门店
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/admin/accounts/${staff02.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { password: 'another123' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.storeId).toBe(staff02.storeId);
  });

  it('不能停用自己的账号', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/admin/accounts/1',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { enabled: false },
    });
    expect(res.statusCode).toBe(403);
  });

  it('店员不能访问账号管理接口', async () => {
    const staffToken = issueAdminToken(2);
    const r1 = await app.inject({
      method: 'GET',
      url: '/api/admin/members',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    expect(r1.statusCode).toBe(403);
    const r2 = await app.inject({
      method: 'GET',
      url: '/api/admin/coupon-templates',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    expect(r2.statusCode).toBe(403);
    const r3 = await app.inject({
      method: 'PATCH',
      url: '/api/admin/stores/1',
      headers: { authorization: `Bearer ${staffToken}` },
      payload: { status: 'closed' },
    });
    expect(r3.statusCode).toBe(403);
  });
});
