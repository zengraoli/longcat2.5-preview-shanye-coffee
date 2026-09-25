import type { FastifyInstance } from 'fastify';
import { getDb } from '../db.js';
import { AppError, ErrorCode } from '../errors.js';
import { ok } from '../reply.js';

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

  app.patch('/api/admin/products/:id/status', async (request, reply) => {
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

  app.patch('/api/admin/products/:id/sold-out', async (request, reply) => {
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
}
