import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { err, ErrorCode } from '../lib/errors.js';
import { ok } from '../lib/reply.js';

interface ProductRow {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  status: 'on' | 'off';
  sold_out: number;
  sort: number;
}

interface SpecRow {
  cup: 'medium' | 'large';
  temperature: 'ice' | 'hot';
  sugar: 'none' | 'less' | 'standard';
  price_adjust: number;
}

function getProductWithSpecs(id: number) {
  const db = getDb();
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow | undefined;
  if (!p) return null;
  const specs = db
    .prepare('SELECT cup, temperature, sugar, price_adjust FROM product_specs WHERE product_id = ?')
    .all(id) as SpecRow[];
  return {
    id: p.id,
    categoryId: p.category_id,
    name: p.name,
    description: p.description,
    price: p.price,
    image: p.image,
    status: p.status,
    soldOut: p.sold_out === 1,
    specs: specs.map((s) => ({
      cup: s.cup,
      temperature: s.temperature,
      sugar: s.sugar,
      priceAdjust: s.price_adjust,
    })),
  };
}

/** 商品路由：分类、商品列表/详情（用户端），后台上下架与售罄。 */
export default async function productRoutes(app: FastifyInstance) {
  // 分类列表
  app.get(
    '/api/categories',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              code: { type: 'integer' },
              message: { type: 'string' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { id: { type: 'integer' }, name: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
    async (_req, reply) => {
    const rows = getDb()
      .prepare('SELECT id, name, sort FROM categories ORDER BY sort, id')
      .all() as { id: number; name: string; sort: number }[];
    ok(reply, rows.map((c) => ({ id: c.id, name: c.name })));
  });

  // 用户端商品列表：仅上架商品；售罄商品保留并标记 soldOut
  app.get<{ Querystring: { category_id?: string } }>(
    '/api/products',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: { category_id: { type: 'integer' } },
        },
      },
    },
    async (req, reply) => {
      const db = getDb();
      const categoryId = req.query.category_id;
      let rows: ProductRow[];
      if (categoryId !== undefined) {
        const cid = Number(categoryId);
        if (!Number.isInteger(cid) || cid <= 0) {
          throw err(ErrorCode.VALIDATION, '分类 ID 非法');
        }
        rows = db
          .prepare("SELECT * FROM products WHERE category_id = ? AND status = 'on' ORDER BY sort, id")
          .all(cid) as ProductRow[];
      } else {
        rows = db
          .prepare("SELECT * FROM products WHERE status = 'on' ORDER BY sort, id")
          .all() as ProductRow[];
      }
      ok(
        reply,
        rows.map((p) => ({
          id: p.id,
          categoryId: p.category_id,
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image,
          soldOut: p.sold_out === 1,
        })),
      );
    },
  );

  // 用户端商品详情：仅上架商品
  app.get<{ Params: { id: string } }>(
    '/api/products/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'integer' } },
        },
      },
    },
    async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw err(ErrorCode.VALIDATION, '商品 ID 非法');
    }
    const full = getProductWithSpecs(id);
    if (!full) throw err(ErrorCode.PRODUCT_NOT_FOUND, '商品不存在', 404);
    if (full.status !== 'on') {
      throw err(ErrorCode.PRODUCT_OFF_SHELF, '商品已下架', 400);
    }
    ok(reply, full);
  });

  // 后台商品列表：含下架商品，可按分类/状态筛选
  app.get<{ Querystring: { category_id?: string; status?: string } }>(
    '/api/admin/products',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const db = getDb();
      const { category_id, status } = req.query;
      const conds: string[] = [];
      const params: unknown[] = [];
      if (category_id !== undefined) {
        conds.push('category_id = ?');
        params.push(Number(category_id));
      }
      if (status !== undefined) {
        if (status !== 'on' && status !== 'off') {
          throw err(ErrorCode.VALIDATION, '状态非法');
        }
        conds.push('status = ?');
        params.push(status);
      }
      const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
      const rows = db
        .prepare(`SELECT * FROM products ${where} ORDER BY sort, id`)
        .all(...params) as ProductRow[];
      ok(
        reply,
        rows.map((p) => ({
          id: p.id,
          categoryId: p.category_id,
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image,
          status: p.status,
          soldOut: p.sold_out === 1,
        })),
      );
    },
  );

  // 后台上下架（仅管理员）
  app.patch<{ Params: { id: string }; Body: { status?: string } }>(
    '/api/admin/products/:id/status',
    {
      preHandler: [app.requireAdmin],
      schema: {
        body: {
          type: 'object',
          required: ['status'],
          properties: { status: { type: 'string', enum: ['on', 'off'] } },
        },
      },
    },
    async (req, reply) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw err(ErrorCode.VALIDATION, '商品 ID 非法');
      }
      const { status } = req.body ?? {};
      const info = getDb()
        .prepare('UPDATE products SET status = ? WHERE id = ?')
        .run(status, id);
      if (info.changes === 0) throw err(ErrorCode.PRODUCT_NOT_FOUND, '商品不存在', 404);
      ok(reply, { id, status });
    },
  );

  // 后台售罄标记（管理员或店员）
  app.patch<{ Params: { id: string }; Body: { sold_out?: number } }>(
    '/api/admin/products/:id/sold-out',
    {
      preHandler: [app.requireAdminOrStaff],
      schema: {
        body: {
          type: 'object',
          required: ['sold_out'],
          properties: { sold_out: { type: 'integer', enum: [0, 1] } },
        },
      },
    },
    async (req, reply) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw err(ErrorCode.VALIDATION, '商品 ID 非法');
      }
      const { sold_out } = req.body ?? {};
      const info = getDb()
        .prepare('UPDATE products SET sold_out = ? WHERE id = ?')
        .run(sold_out, id);
      if (info.changes === 0) throw err(ErrorCode.PRODUCT_NOT_FOUND, '商品不存在', 404);
      ok(reply, { id, soldOut: sold_out === 1 });
    },
  );
}
