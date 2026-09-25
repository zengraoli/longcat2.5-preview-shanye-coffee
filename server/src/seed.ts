import { getDb } from './db.js';

const stores = [
  { name: '山野咖啡 · 望京SOHO店', address: '朝阳区望京SOHO T1-1201', phone: '010-5551-0001', open_time: '07:30', close_time: '21:00' },
  { name: '山野咖啡 · 三里屯太古里店', address: '朝阳区三里屯路19号院', phone: '010-5551-0002', open_time: '08:00', close_time: '22:00' },
  { name: '山野咖啡 · 中关村创业大街店', address: '海淀区中关村创业大街6号楼', phone: '010-5551-0003', open_time: '07:00', close_time: '20:30' },
];

const categories = [
  { name: '咖啡', sort_order: 1 },
  { name: '茶饮', sort_order: 2 },
  { name: '轻食', sort_order: 3 },
  { name: '周边', sort_order: 4 },
];

type ProductSeed = {
  name: string;
  category: string;
  description: string;
  base_price: number;
  sold_out?: boolean;
};

const products: ProductSeed[] = [
  { name: '美式咖啡', category: '咖啡', description: '经典深烘焙，回甘醇厚', base_price: 2200 },
  { name: '拿铁', category: '咖啡', description: '意式浓缩配丝滑鲜奶', base_price: 2800 },
  { name: '燕麦拿铁', category: '咖啡', description: '植物奶基底，燕麦香气', base_price: 3200 },
  { name: '生椰拿铁', category: '咖啡', description: '冷榨生椰乳配浓缩', base_price: 3200 },
  { name: '澳白', category: '咖啡', description: '双份浓缩，奶泡更薄', base_price: 3000 },
  { name: '卡布奇诺', category: '咖啡', description: '厚实奶泡，经典意式', base_price: 2800 },
  { name: '焦糖玛奇朵', category: '咖啡', description: '香草糖浆配焦糖淋酱', base_price: 3400 },
  { name: '摩卡', category: '咖啡', description: '巧克力与浓缩的完美融合', base_price: 3400 },
  { name: '冷萃咖啡', category: '咖啡', description: '12 小时低温萃取', base_price: 3000 },
  { name: '手冲 · 耶加雪菲', category: '咖啡', description: '单品产地，花果香气', base_price: 3800 },
  { name: '手冲 · 瑰夏', category: '咖啡', description: '翡翠庄园，风味层次丰富', base_price: 4800 },
  { name: 'dirty', category: '咖啡', description: '冰博客奶配热浓缩', base_price: 3000 },
  { name: '茉莉花茶', category: '茶饮', description: '茉莉窨制绿茶', base_price: 2000 },
  { name: '四季春茶', category: '茶饮', description: '台湾乌龙，清香回甘', base_price: 2000 },
  { name: '柠檬茶', category: '茶饮', description: '手打柠檬配锡兰红茶', base_price: 2200 },
  { name: '葡萄乌龙', category: '茶饮', description: '鲜葡萄配乌龙茶底', base_price: 2600 },
  { name: '芝士莓莓', category: '茶饮', description: '草莓果茶配芝士奶盖', base_price: 2800 },
  { name: '抹茶拿铁', category: '茶饮', description: '宇治抹茶粉配鲜奶', base_price: 2800 },
  { name: '椰青美式', category: '茶饮', description: '椰子水配浓缩咖啡', base_price: 2600 },
  { name: '全麦牛油果三明治', category: '轻食', description: '牛油果、鸡蛋、全麦吐司', base_price: 2600 },
  { name: '鸡胸肉沙拉', category: '轻食', description: '低温鸡胸配混合生菜', base_price: 3200 },
  { name: '可颂', category: '轻食', description: '黄油层次分明', base_price: 1500 },
  { name: '肉桂卷', category: '轻食', description: '现烤肉桂卷配糖霜', base_price: 1800 },
  { name: '巴斯克芝士蛋糕', category: '轻食', description: '焦香表面，流心内馅', base_price: 2800 },
  { name: '山野随行杯', category: '周边', description: '316 不锈钢保温杯', base_price: 12900 },
  { name: '山野帆布袋', category: '周边', description: '棉麻材质，品牌印花', base_price: 5900 },
  { name: '咖啡豆 · 耶加雪菲 227g', category: '周边', description: '中度烘焙，花果香', base_price: 8800 },
];

const coupons = [
  {
    name: '新客立减券',
    type: 'fixed' as const,
    threshold: 2000,
    discount: 500,
    valid_from: '2026-09-01T00:00:00Z',
    valid_to: '2026-12-31T23:59:59Z',
    total_count: 1000,
  },
  {
    name: '周末八折券',
    type: 'percent' as const,
    threshold: 3000,
    discount: 20,
    valid_from: '2026-09-01T00:00:00Z',
    valid_to: '2026-10-31T23:59:59Z',
    total_count: 500,
  },
];

export function seedIfEmpty(): void {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) AS c FROM stores').get() as { c: number };
  if (row.c > 0) return;

  const insertStore = db.prepare('INSERT INTO stores (name, address, phone, open_time, close_time, status) VALUES (?, ?, ?, ?, ?, ?)');
  for (const s of stores) {
    insertStore.run(s.name, s.address, s.phone, s.open_time, s.close_time, 'open');
  }

  const insertCategory = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)');
  for (const c of categories) {
    insertCategory.run(c.name, c.sort_order);
  }

  const categoryRows = db.prepare('SELECT id, name FROM categories').all() as Array<{ id: number; name: string }>;
  const catId = new Map(categoryRows.map((r) => [r.name, r.id]));

  const insertProduct = db.prepare('INSERT INTO products (category_id, name, description, base_price, image, status, sold_out, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const insertSpec = db.prepare('INSERT INTO product_specs (product_id, cup_size, temperature, sugar, price_delta) VALUES (?, ?, ?, ?, ?)');

  products.forEach((p, idx) => {
    const cid = catId.get(p.category)!;
    const soldOut = p.sold_out ? 1 : 0;
    const result = insertProduct.run(cid, p.name, p.description, p.base_price, '', 'on', soldOut, idx + 1);
    const productId = Number(result.lastInsertRowid);
    if (p.category === '周边') {
      insertSpec.run(productId, 'medium', 'hot', 'standard', 0);
    } else {
      insertSpec.run(productId, 'medium', 'hot', 'standard', 0);
      insertSpec.run(productId, 'medium', 'hot', 'less', 0);
      insertSpec.run(productId, 'medium', 'hot', 'none', 0);
      insertSpec.run(productId, 'medium', 'iced', 'standard', 0);
      insertSpec.run(productId, 'medium', 'iced', 'less', 0);
      insertSpec.run(productId, 'medium', 'iced', 'none', 0);
      insertSpec.run(productId, 'large', 'hot', 'standard', 300);
      insertSpec.run(productId, 'large', 'hot', 'less', 300);
      insertSpec.run(productId, 'large', 'hot', 'none', 300);
      insertSpec.run(productId, 'large', 'iced', 'standard', 300);
      insertSpec.run(productId, 'large', 'iced', 'less', 300);
      insertSpec.run(productId, 'large', 'iced', 'none', 300);
    }
  });

  const insertAdmin = db.prepare('INSERT INTO admin_users (username, password, name, role, store_id) VALUES (?, ?, ?, ?, ?)');
  insertAdmin.run('admin', 'admin123', '超级管理员', 'admin', null);
  insertAdmin.run('staff01', 'staff123', '望京店员', 'staff', 1);

  const insertCoupon = db.prepare('INSERT INTO coupons (name, type, threshold, discount, valid_from, valid_to, total_count) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const c of coupons) {
    insertCoupon.run(c.name, c.type, c.threshold, c.discount, c.valid_from, c.valid_to, c.total_count);
  }

  const now = Date.now();
  const weekLater = now + 7 * 24 * 60 * 60 * 1000;
  const promoResult = db.prepare('INSERT INTO promotions (name, start_time, end_time, status) VALUES (?, ?, ?, ?)').run(
    '第二杯半价',
    new Date(now).toISOString(),
    new Date(weekLater).toISOString(),
    'active',
  );
  const promoId = Number(promoResult.lastInsertRowid);
  const insertPromoProduct = db.prepare('INSERT INTO promotion_products (promotion_id, product_id) VALUES (?, ?)');
  insertPromoProduct.run(promoId, 1);
  insertPromoProduct.run(promoId, 2);
  insertPromoProduct.run(promoId, 3);
}
