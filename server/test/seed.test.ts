import { describe, expect, it } from 'vitest';
import { initDb, getDb } from '../src/db/index.js';

describe('T02 数据模型与种子数据', () => {
  it('自动建表并写入种子数据，重复初始化不重复写入', async () => {
    const db = await initDb(':memory:');
    const count = (sql: string) => (db.prepare(sql).get() as { n: number }).n;

    expect(count('SELECT COUNT(*) AS n FROM stores')).toBe(3);
    expect(count('SELECT COUNT(*) AS n FROM categories')).toBe(4);
    expect(count('SELECT COUNT(*) AS n FROM products')).toBe(24);
    expect(count('SELECT COUNT(*) AS n FROM product_specs')).toBe(14 * 12);
    expect(count('SELECT COUNT(*) AS n FROM admins')).toBe(2);
    expect(count('SELECT COUNT(*) AS n FROM coupon_templates')).toBe(2);

    // 重复初始化：数量不变
    await initDb(':memory:');
    const db2 = getDb();
    const count2 = (sql: string) => (db2.prepare(sql).get() as { n: number }).n;
    expect(count2('SELECT COUNT(*) AS n FROM stores')).toBe(3);
    expect(count2('SELECT COUNT(*) AS n FROM products')).toBe(24);
  });

  it('金额字段全部为整数“分”', async () => {
    const db = await initDb(':memory:');
    const products = db.prepare('SELECT price FROM products').all() as { price: number }[];
    expect(products.length).toBeGreaterThanOrEqual(24);
    for (const p of products) {
      expect(Number.isInteger(p.price)).toBe(true);
      expect(p.price).toBeGreaterThan(0);
    }
    const specs = db.prepare('SELECT price_adjust FROM product_specs').all() as { price_adjust: number }[];
    for (const s of specs) {
      expect(Number.isInteger(s.price_adjust)).toBe(true);
    }
    const templates = db
      .prepare('SELECT threshold, discount_amount, discount_rate FROM coupon_templates')
      .all() as { threshold: number; discount_amount: number | null; discount_rate: number | null }[];
    for (const t of templates) {
      expect(Number.isInteger(t.threshold)).toBe(true);
      if (t.discount_amount !== null) expect(Number.isInteger(t.discount_amount)).toBe(true);
      if (t.discount_rate !== null) expect(Number.isInteger(t.discount_rate)).toBe(true);
    }
  });

  it('大杯加价为 3 元（300 分），中杯为 0', async () => {
    const db = await initDb(':memory:');
    const rows = db
      .prepare('SELECT cup, price_adjust FROM product_specs WHERE product_id = 1')
      .all() as { cup: string; price_adjust: number }[];
    const medium = rows.filter((r) => r.cup === 'medium');
    const large = rows.filter((r) => r.cup === 'large');
    expect(medium.length).toBe(6);
    expect(large.length).toBe(6);
    expect(medium.every((r) => r.price_adjust === 0)).toBe(true);
    expect(large.every((r) => r.price_adjust === 300)).toBe(true);
  });
});
