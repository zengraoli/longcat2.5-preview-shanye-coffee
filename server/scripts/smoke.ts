const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3300';

async function api(method: string, path: string, token?: string, body?: unknown): Promise<any> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(`${method} ${path} failed: code=${json.code} message=${json.message}`);
  }
  return json.data;
}

async function main(): Promise<void> {
  console.log('=== 冒烟测试开始 ===');

  console.log('1. 会员登录...');
  const loginData = await api('POST', '/api/member/login', undefined, { phone: '13900001111', code: '123456' });
  const memberToken = loginData.token;
  console.log(`   登录成功，token=${memberToken.slice(0, 8)}...`);

  console.log('2. 查询门店列表...');
  const stores = await api('GET', '/api/stores', memberToken);
  const storeId = stores[0].id;
  console.log(`   共 ${stores.length} 家门店，使用第 1 家 (id=${storeId})`);

  console.log('3. 查询商品列表...');
  const products = await api('GET', '/api/products', memberToken);
  const product = products.find((p: any) => !p.soldOut && p.price > 0);
  console.log(`   共 ${products.length} 个商品，选择「${product.name}」(id=${product.id})`);

  console.log('4. 查询最优优惠券...');
  const orderAmount = product.price * 2;
  const bestCoupon = await api('POST', '/api/coupons/best', memberToken, { amount: orderAmount });
  const userCouponId = bestCoupon?.userCouponId ?? null;
  console.log(userCouponId ? `   使用优惠券「${bestCoupon.name}」` : '   无可用优惠券');

  console.log('5. 创建订单...');
  const orderData = await api('POST', '/api/orders', memberToken, {
    storeId,
    type: 'pickup',
    items: [{ productId: product.id, quantity: 2, cupSize: 'medium', temperature: 'hot', sugar: 'standard' }],
    userCouponId,
  });
  console.log(`   订单创建成功: orderNo=${orderData.orderNo}, pickupCode=${orderData.pickupCode}`);
  console.log(`   原价=${orderData.originalAmount}分, 优惠=${orderData.discountAmount}分, 实付=${orderData.paidAmount}分`);

  console.log('6. 模拟支付...');
  const payData = await api('POST', `/api/orders/${orderData.id}/pay`, memberToken);
  console.log(`   支付成功: status=${payData.status}, 积分=${payData.pointsEarned}, 等级=${payData.level}`);

  console.log('7. 店员登录并推进订单状态...');
  const adminLogin = await api('POST', '/api/admin/login', undefined, { username: 'staff01', password: 'staff123' });
  const adminToken = adminLogin.token;
  for (const status of ['making', 'ready', 'completed']) {
    await api('POST', `/api/admin/orders/${orderData.id}/status`, adminToken, { status });
    console.log(`   状态推进到: ${status}`);
  }

  console.log('8. 验证积分到账...');
  const meData = await api('GET', '/api/member/me', memberToken);
  console.log(`   当前积分=${meData.points}, 手机号=${meData.phone}`);

  console.log('=== 冒烟测试全部通过 ===');
}

main().catch((err) => {
  console.error('冒烟测试失败:', err.message);
  process.exit(1);
});
