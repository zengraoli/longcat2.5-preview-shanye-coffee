import type { FastifyInstance } from 'fastify';
import { getDb } from '../db.js';
import { AppError, ErrorCode } from '../errors.js';
import { ok } from '../reply.js';
import { authRequired, adminRequired } from '../plugins/auth.js';

export default async function productRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/categories', async (_request, reply) => {
    const db = getDb();
    const rows = db.prepare('SELECT id, name, sort_order FROM categories ORDER BY sort_order').all();
    ok(reply, rows);
  });

  app.get('/api/products', async (request, reply) => {
    const query = request.query as { categoryId?: string };
    const db = getDb();
    let sql = `SELECT p.id, p.category_id, p.name, p.description, p.base_price, p.status, p.sold_out,
      (SELECT price_delta FROM product_specs WHERE product_id = p.id AND cup_size = 'medium' AND temperature = 'hot' AND sugar = 'standard') AS base_delta
      FROM products p WHERE p.status = 'on'`;
    const params: number[] = [];
    if (query.categoryId) {
      sql += ' AND p.category_id = ?';
      params.push(Number(query.categoryId));
    }
    sql += ' ORDER BY p.sort_order';
    const rows = db.prepare(sql).all(...params) as Array<{
      id: number; category_id: number; name: string; description: string;
      base_price: number; status: string; sold_out: number; base_delta: number;
    }>;
    ok(reply, rows.map((r) => ({
      id: r.id,
      categoryId: r.category_id,
      name: r.name,
      description: r.description,
      price: r.base_price + (r.base_delta ?? 0),
      soldOut: r.sold_out === 1,
    })));
  });

  app.get('/api/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id)) as
      | { id: number; category_id: number; name: string; description: string; base_price: number; status: string; sold_out: number }
      | undefined;
    if (!p) throw new AppError(ErrorCode.NOT_FOUND, '商品不存在', 404);
    const specs = db.prepare('SELECT cup_size, temperature, sugar, price_delta FROM product_specs WHERE product_id = ?').all(p.id) as Array<{
      cup_size: string; temperature: string; sugar: string; price_delta: number;
    }>;
    const baseDelta = specs.find((s) => s.cup_size === 'medium' && s.temperature === 'hot' && s.sugar === 'standard')?.price_delta ?? 0;
    ok(reply, {
      id: p.id,
      categoryId: p.category_id,
      name: p.name,
      description: p.description,
      price: p.base_price + baseDelta,
      status: p.status,
      soldOut: p.sold_out === 1,
      specs,
    });
  });

  await app.register(async (instance) => {
    authRequired(instance);
    adminRequired(instance);

    instance.get('/api/admin/products', async (request, reply) => {
      const query = request.query as { categoryId?: string; keyword?: string };
      const db = getDb();
      let sql = `SELECT p.id, p.category_id, p.name, p.description, p.base_price, p.status, p.sold_out, p.sort_order,
        c.name AS category_name,
        (SELECT price_delta FROM product_specs WHERE product_id = p.id AND cup_size = 'medium' AND temperature = 'hot' AND sugar = 'standard') AS base_delta
        FROM products p JOIN categories c ON p.category_id = c.id WHERE 1=1`;
      const params: (number | string)[] = [];
      if (query.categoryId) {
        sql += ' AND p.category_id = ?';
        params.push(Number(query.categoryId));
      }
      if (query.keyword) {
        sql += ' AND p.name LIKE ?';
        params.push(`%${query.keyword}%`);
      }
      sql += ' ORDER BY p.sort_order';
      const rows = db.prepare(sql).all(...params) as Array<{
        id: number; category_id: number; name: string; description: string;
        base_price: number; status: string; sold_out: number; sort_order: number;
        category_name: string; base_delta: number;
      }>;
      ok(reply, rows.map((r) => ({
        id: r.id,
        categoryId: r.category_id,
        categoryName: r.category_name,
        name: r.name,
        description: r.description,
        basePrice: r.base_price,
        price: r.base_price + (r.base_delta ?? 0),
        status: r.status,
        soldOut: r.sold_out === 1,
        sortOrder: r.sort_order,
      })));
    });

    instance.post('/api/admin/products', async (request, reply) => {
      const body = request.body as {
        categoryId?: number; name?: string; description?: string;
        basePrice?: number; specs?: Array<{ cupSize: string; temperature: string; sugar: string; priceDelta: number }>;
      };
      if (!body.categoryId || !body.name || !body.basePrice) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, '分类、名称、价格为必填项');
      }
      const db = getDb();
      const maxOrder = (db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM products').get() as { m: number }).m;
      const result = db.prepare('INSERT INTO products (category_id, name, description, base_price, image, status, sold_out, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        body.categoryId, body.name, body.description || '', body.basePrice, '', 'on', 0, maxOrder + 1,
      );
      const productId = Number(result.lastInsertRowid);
      const specs = body.specs && body.specs.length > 0
        ? body.specs
        : [
            { cupSize: 'medium', temperature: 'hot', sugar: 'standard', priceDelta: 0 },
            { cupSize: 'medium', temperature: 'hot', sugar: 'less', priceDelta: 0 },
            { cupSize: 'medium', temperature: 'hot', sugar: 'none', priceDelta: 0 },
            { cupSize: 'medium', temperature: 'iced', sugar: 'standard', priceDelta: 0 },
            { cupSize: 'medium', temperature: 'iced', sugar: 'less', priceDelta: 0 },
            { cupSize: 'medium', temperature: 'iced', sugar: 'none', priceDelta: 0 },
            { cupSize: 'large', temperature: 'hot', sugar: 'standard', priceDelta: 300 },
            { cupSize: 'large', temperature: 'hot', sugar: 'less', priceDelta: 300 },
            { cupSize: 'large', temperature: 'hot', sugar: 'none', priceDelta: 300 },
            { cupSize: 'large', temperature: 'iced', sugar: 'standard', priceDelta: 300 },
            { cupSize: 'large', temperature: 'iced', sugar: 'less', priceDelta: 300 },
            { cupSize: 'large', temperature: 'iced', sugar: 'none', priceDelta: 300 },
          ];
      const insertSpec = db.prepare('INSERT INTO product_specs (product_id, cup_size, temperature, sugar, price_delta) VALUES (?, ?, ?, ?, ?)');
      for (const s of specs) {
        insertSpec.run(productId, s.cupSize, s.temperature, s.sugar, s.priceDelta);
      }
      ok(reply, { id: productId });
    });

    instance.put('/api/admin/products/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        categoryId?: number; name?: string; description?: string; basePrice?: number;
        specs?: Array<{ cupSize: string; temperature: string; sugar: string; priceDelta: number }>;
      };
      const db = getDb();
      const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(Number(id));
      if (!existing) throw new AppError(ErrorCode.NOT_FOUND, '商品不存在', 404);
      db.prepare('UPDATE products SET category_id = ?, name = ?, description = ?, base_price = ? WHERE id = ?').run(
        body.categoryId ?? 0, body.name || '', body.description || '', body.basePrice ?? 0, Number(id),
      );
      if (body.specs) {
        db.prepare('DELETE FROM product_specs WHERE product_id = ?').run(Number(id));
        const insertSpec = db.prepare('INSERT INTO product_specs (product_id, cup_size, temperature, sugar, price_delta) VALUES (?, ?, ?, ?, ?)');
        for (const s of body.specs) {
          insertSpec.run(Number(id), s.cupSize, s.temperature, s.sugar, s.priceDelta);
        }
      }
      ok(reply, null);
    });

    instance.delete('/api/admin/products/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = getDb();
      db.prepare('DELETE FROM product_specs WHERE product_id = ?').run(Number(id));
      const result = db.prepare('DELETE FROM products WHERE id = ?').run(Number(id));
      if (result.changes === 0) throw new AppError(ErrorCode.NOT_FOUND, '商品不存在', 404);
      ok(reply, null);
    });

    instance.patch('/api/admin/products/:id/status', async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { status?: string };
      if (!body.status || !['on', 'off'].includes(body.status)) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, 'status 必须为 on 或 off');
      }
      const db = getDb();
      const result = db.prepare('UPDATE products SET status = ? WHERE id = ?').run(body.status, Number(id));
      if (result.changes === 0) throw new AppError(ErrorCode.NOT_FOUND, '商品不存在', 404);
      ok(reply, null);
    });

    instance.patch('/api/admin/products/:id/sold-out', async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { soldOut?: boolean };
      if (typeof body.soldOut !== 'boolean') {
        throw new AppError(ErrorCode.VALIDATION_FAILED, 'soldOut 必须为布尔值');
      }
      const db = getDb();
      const result = db.prepare('UPDATE products SET sold_out = ? WHERE id = ?').run(body.soldOut ? 1 : 0, Number(id));
      if (result.changes === 0) throw new AppError(ErrorCode.NOT_FOUND, '商品不存在', 404);
      ok(reply, null);
    });
  });
}
