/**
 * 端到端冒烟脚本：会员登录 → 下单 → 支付 → 状态推进 → 积分到账。
 * 启动临时实例（随机端口、内存数据库），全部通过则退出码 0，否则 1。
 */
import { buildApp } from '../src/app.js';

const app = await buildApp({ dbFile: ':memory:', logger: false });
await app.listen({ port: 0, host: '127.0.0.1' });
const addr = app.server.address();
const port = typeof addr === 'object' && addr ? addr.port : 0;
const base = `http://127.0.0.1:${port}`;

let failed = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  PASS ${name}`);
  } else {
    console.error(`  FAIL ${name}`, detail ?? '');
    failed++;
  }
}

async function post(path: string, payload: unknown, token?: string) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: (await res.json()) as { code: number; data: any } };
}

async function get(path: string, token?: string) {
  const res = await fetch(`${base}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: res.status, body: (await res.json()) as { code: number; data: any } };
}

console.log('冒烟测试：会员登录 → 下单 → 支付 → 状态推进 → 积分到账\n');

// 1. 会员登录
const login = await post('/api/member/login', { phone: '13800000000', code: '123456' });
check('会员登录', login.body.code === 0 && !!login.body.data.token, login.body);
const token = login.body.data.token as string;

// 2. 下单（拿铁大杯 ×2：2800+300=3100 ×2 = 6200）
const create = await post(
  '/api/orders',
  {
    store_id: 1,
    type: 'pickup',
    items: [{ product_id: 2, cup: 'large', temperature: 'ice', sugar: 'standard', quantity: 2 }],
  },
  token,
);
check('下单', create.body.code === 0 && !!create.body.data.id, create.body);
const order = create.body.data;
check(
  '订单金额明细',
  order.originalAmount === 6200 && order.discountAmount === 0 && order.payableAmount === 6200,
  order,
);
check('取餐码为 4 位', /^\d{4}$/.test(order.pickupCode ?? ''), order.pickupCode);

// 3. 支付
const pay = await post(`/api/orders/${order.id}/pay`, {}, token);
check('支付', pay.body.code === 0 && pay.body.data.status === 'paid', pay.body);

// 4. 状态推进（管理员）：已支付 → 制作中 → 待取餐 → 已完成
const adminLogin = await post('/api/admin/login', { username: 'admin', password: 'admin123' });
check('管理员登录', adminLogin.body.code === 0 && !!adminLogin.body.data.token, adminLogin.body);
const adminToken = adminLogin.body.data.token as string;
for (const target of ['making', 'ready', 'completed'] as const) {
  const r = await post(`/api/admin/orders/${order.id}/advance`, { target }, adminToken);
  check(`状态推进→${target}`, r.body.code === 0 && r.body.data.status === target, r.body);
}

// 5. 积分到账（实付 6200 分 = 62 元 → 62 分）
const me = await get('/api/member/me', token);
check('积分到账', me.body.code === 0 && me.body.data.points === 62, me.body);

await app.close();
if (failed > 0) {
  console.error(`\n${failed} 项失败`);
  process.exit(1);
}
console.log('\n冒烟全部通过');
