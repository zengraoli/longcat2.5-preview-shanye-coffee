import { createHash } from 'node:crypto';
import type { Database } from 'better-sqlite3';

/** 密码哈希（sha256，仅用于示例账号）。 */
export function hashPassword(password: string): string {
  return createHash('sha256').update(`shanye:${password}`).digest('hex');
}

const now = () => new Date().toISOString();

interface SeedProduct {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  price: number;
  image: string;
  sort: number;
  drink: boolean;
}

const STORES = [
  { id: 1, name: '山野咖啡·望京店', address: '北京市朝阳区望京SOHO T1 座 101', phone: '010-64700001', open_time: '08:00', close_time: '21:00', status: 'open', sort: 1 },
  { id: 2, name: '山野咖啡·三里屯店', address: '北京市朝阳区三里屯太古里南区 N4-30', phone: '010-64700002', open_time: '08:30', close_time: '22:00', status: 'open', sort: 2 },
  { id: 3, name: '山野咖啡·国贸店', address: '北京市朝阳区建国门外大街 1 号国贸商城 B1 层', phone: '010-64700003', open_time: '09:00', close_time: '21:30', status: 'closed', sort: 3 },
];

const CATEGORIES = [
  { id: 1, name: '咖啡', sort: 1 },
  { id: 2, name: '茶饮', sort: 2 },
  { id: 3, name: '轻食', sort: 3 },
  { id: 4, name: '周边', sort: 4 },
];

const PRODUCTS: SeedProduct[] = [
  // 咖啡
  { id: 1, categoryId: 1, name: '美式咖啡', description: '经典美式，双份浓缩配纯净水', price: 2200, image: 'americano', sort: 1, drink: true },
  { id: 2, categoryId: 1, name: '拿铁', description: '浓缩咖啡与丝滑鲜奶的经典融合', price: 2800, image: 'latte', sort: 2, drink: true },
  { id: 3, categoryId: 1, name: '卡布奇诺', description: '浓郁奶泡覆盖的意式经典', price: 2800, image: 'cappuccino', sort: 3, drink: true },
  { id: 4, categoryId: 1, name: '焦糖玛奇朵', description: '香草奶底、浓缩与焦糖酱的层次', price: 3200, image: 'caramel-macchiato', sort: 4, drink: true },
  { id: 5, categoryId: 1, name: '摩卡', description: '浓缩、巧克力酱与鲜奶的温暖组合', price: 3200, image: 'mocha', sort: 5, drink: true },
  { id: 6, categoryId: 1, name: '冷萃咖啡', description: '18 小时低温慢萃，低酸回甘', price: 3000, image: 'cold-brew', sort: 6, drink: true },
  { id: 7, categoryId: 1, name: '燕麦拿铁', description: '燕麦奶替代鲜奶，谷物香气', price: 3000, image: 'oat-latte', sort: 7, drink: true },
  { id: 8, categoryId: 1, name: '手冲·耶加雪菲', description: '埃塞俄比亚日晒豆，柑橘与花香', price: 3800, image: 'pour-over', sort: 8, drink: true },
  // 茶饮
  { id: 9, categoryId: 2, name: '茉莉绿茶', description: '茉莉窨制绿茶，清香回甘', price: 1800, image: 'jasmine-tea', sort: 1, drink: true },
  { id: 10, categoryId: 2, name: '四季春茶', description: '台湾乌龙，花香与奶香交织', price: 1600, image: 'four-seasons', sort: 2, drink: true },
  { id: 11, categoryId: 2, name: '蜜桃乌龙', description: '蜜桃果香配乌龙茶底', price: 2200, image: 'peach-oolong', sort: 3, drink: true },
  { id: 12, categoryId: 2, name: '柠檬红茶', description: '锡兰红茶配鲜切柠檬', price: 2000, image: 'lemon-tea', sort: 4, drink: true },
  { id: 13, categoryId: 2, name: '抹茶拿铁', description: '宇治抹茶粉与鲜奶', price: 2800, image: 'matcha-latte', sort: 5, drink: true },
  { id: 14, categoryId: 2, name: '桂花乌龙', description: '桂花窨制乌龙，秋日限定', price: 2200, image: 'osmanthus-oolong', sort: 6, drink: true },
  // 轻食
  { id: 15, categoryId: 3, name: '可颂', description: '法式黄油可颂，外酥内软', price: 1500, image: 'croissant', sort: 1, drink: false },
  { id: 16, categoryId: 3, name: '贝果', description: '全麦贝果，低糖健康', price: 1600, image: 'bagel', sort: 2, drink: false },
  { id: 17, categoryId: 3, name: '火腿芝士三明治', description: '火腿、芝士与全麦面包', price: 2600, image: 'sandwich', sort: 3, drink: false },
  { id: 18, categoryId: 3, name: '鸡肉卷', description: '鸡胸肉、生菜与全麦饼皮', price: 2800, image: 'wrap', sort: 4, drink: false },
  { id: 19, categoryId: 3, name: '提拉米苏', description: '马斯卡彭芝士与咖啡酒', price: 3200, image: 'tiramisu', sort: 5, drink: false },
  { id: 20, categoryId: 3, name: '巴斯克芝士蛋糕', description: '焦香表面，流心内馅', price: 3400, image: 'basque', sort: 6, drink: false },
  // 周边
  { id: 21, categoryId: 4, name: '山野随行杯', description: '316 不锈钢保温杯，山野绿', price: 12900, image: 'tumbler', sort: 1, drink: false },
  { id: 22, categoryId: 4, name: '山野帆布袋', description: '加厚帆布，山野咖啡 logo 印花', price: 6900, image: 'canvas-bag', sort: 2, drink: false },
  { id: 23, categoryId: 4, name: '咖啡豆·耶加雪菲 250g', description: '日晒处理，柑橘花香，中浅烘', price: 8900, image: 'beans-yirgacheffe', sort: 3, drink: false },
  { id: 24, categoryId: 4, name: '咖啡豆·曼特宁 250g', description: '湿刨法，草本与黑巧，中深烘', price: 7900, image: 'beans-mandheling', sort: 4, drink: false },
];

const ADMINS = [
  { id: 1, username: 'admin', password: 'admin123', name: '系统管理员', role: 'admin', store_id: null },
  { id: 2, username: 'staff01', password: 'staff123', name: '店员小王', role: 'staff', store_id: 1 },
];

const COUPON_TEMPLATES = [
  { id: 1, name: '满100减20券', type: 'full_reduction', threshold: 10000, discount_amount: 2000, discount_rate: null, valid_days: 30, total_stock: 1000, sort: 1 },
  { id: 2, name: '9折优惠券', type: 'discount', threshold: 0, discount_amount: null, discount_rate: 90, valid_days: 14, total_stock: 1000, sort: 2 },
];

// 第二杯半价活动：默认停用，由后台按需启用（适用全部饮品）
const PROMOTIONS = [
  { id: 1, name: '第二杯半价', type: 'second_cup_half', start_at: '2020-01-01T00:00:00.000Z', end_at: '2099-12-31T23:59:59.999Z', enabled: 0, sort: 1 },
];

/** 写入种子数据（幂等：固定主键 + INSERT OR IGNORE，重复启动不会重复写入）。 */
export function seed(db: Database) {
  const insertStore = db.prepare(
    `INSERT OR IGNORE INTO stores (id, name, address, phone, open_time, close_time, status, sort)
     VALUES (@id, @name, @address, @phone, @open_time, @close_time, @status, @sort)`,
  );
  const insertCategory = db.prepare(
    'INSERT OR IGNORE INTO categories (id, name, sort) VALUES (@id, @name, @sort)',
  );
  const insertProduct = db.prepare(
    `INSERT OR IGNORE INTO products (id, category_id, name, description, price, image, status, sold_out, drink, sort)
     VALUES (@id, @categoryId, @name, @description, @price, @image, 'on', 0, @drink, @sort)`,
  );
  const insertSpec = db.prepare(
    `INSERT OR IGNORE INTO product_specs (product_id, cup, temperature, sugar, price_adjust)
     VALUES (@productId, @cup, @temperature, @sugar, @priceAdjust)`,
  );
  const insertAdmin = db.prepare(
    `INSERT OR IGNORE INTO admins (id, username, password_hash, name, role, store_id)
     VALUES (@id, @username, @passwordHash, @name, @role, @storeId)`,
  );
  const insertTemplate = db.prepare(
    `INSERT OR IGNORE INTO coupon_templates
       (id, name, type, threshold, discount_amount, discount_rate, valid_days, total_stock, sort)
     VALUES (@id, @name, @type, @threshold, @discountAmount, @discountRate, @validDays, @totalStock, @sort)`,
  );
  const insertPromotion = db.prepare(
    `INSERT OR IGNORE INTO promotions (id, name, type, start_at, end_at, enabled, sort)
     VALUES (@id, @name, @type, @startAt, @endAt, @enabled, @sort)`,
  );
  const insertPromotionProduct = db.prepare(
    'INSERT OR IGNORE INTO promotion_products (promotion_id, product_id) VALUES (?, ?)',
  );

  const tx = db.transaction(() => {
    for (const s of STORES) insertStore.run(s);
    for (const c of CATEGORIES) insertCategory.run(c);
    for (const p of PRODUCTS) {
      insertProduct.run({
        id: p.id,
        categoryId: p.categoryId,
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        drink: p.drink ? 1 : 0,
        sort: p.sort,
      });
      if (p.drink) {
        // 饮品规格：杯型（中/大，大杯 +3 元）× 温度（冰/热）× 糖度（无/少/标准）
        for (const cup of ['medium', 'large'] as const) {
          for (const temperature of ['ice', 'hot'] as const) {
            for (const sugar of ['none', 'less', 'standard'] as const) {
              insertSpec.run({
                productId: p.id,
                cup,
                temperature,
                sugar,
                priceAdjust: cup === 'large' ? 300 : 0,
              });
            }
          }
        }
      }
    }
    for (const a of ADMINS) {
      insertAdmin.run({
        id: a.id,
        username: a.username,
        passwordHash: hashPassword(a.password),
        name: a.name,
        role: a.role,
        storeId: a.store_id,
      });
    }
    for (const t of COUPON_TEMPLATES) {
      insertTemplate.run({
        id: t.id,
        name: t.name,
        type: t.type,
        threshold: t.threshold,
        discountAmount: t.discount_amount,
        discountRate: t.discount_rate,
        validDays: t.valid_days,
        totalStock: t.total_stock,
        sort: t.sort,
      });
    }
    for (const p of PROMOTIONS) {
      insertPromotion.run({
        id: p.id,
        name: p.name,
        type: p.type,
        startAt: p.start_at,
        endAt: p.end_at,
        enabled: p.enabled,
        sort: p.sort,
      });
      // 适用商品：全部饮品
      for (const prod of PRODUCTS) {
        if (prod.drink) insertPromotionProduct.run(p.id, prod.id);
      }
    }
  });
  tx();
}

export { now };
