import type { FastifyInstance } from 'fastify';
import { getDb } from '../db.js';
import { AppError, ErrorCode } from '../errors.js';
import { ok } from '../reply.js';
import { authRequired, requireAdminRole } from '../plugins/auth.js';

export default async function promotionRoutes(app: FastifyInstance): Promise<void> {
  await app.register(async (instance) => {
    authRequired(instance);
    requireAdminRole(instance);

    instance.get('/api/admin/promotions', async (_request, reply) => {
      const db = getDb();
      const promos = db.prepare('SELECT * FROM promotions ORDER BY id').all() as Array<{
        id: number; name: string; start_time: string; end_time: string; status: string;
      }>;
      const productsStmt = db.prepare('SELECT product_id FROM promotion_products WHERE promotion_id = ?');
      ok(reply, promos.map((p) => ({
        id: p.id,
        name: p.name,
        startTime: p.start_time,
        endTime: p.end_time,
        status: p.status,
        products: (productsStmt.all(p.id) as Array<{ product_id: number }>).map((r) => r.product_id),
      })));
    });

    instance.post('/api/admin/promotions', async (request, reply) => {
      const body = request.body as {
        name?: string; startTime?: string; endTime?: string; productIds?: number[];
      };
      if (!body.name || !body.startTime || !body.endTime || !body.productIds || body.productIds.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, '缺少必填字段');
      }
      const db = getDb();
      const result = db.prepare(
        'INSERT INTO promotions (name, start_time, end_time, status) VALUES (?, ?, ?, ?)',
      ).run(body.name, body.startTime, body.endTime, 'active');
      const promoId = Number(result.lastInsertRowid);
      const insertProduct = db.prepare('INSERT INTO promotion_products (promotion_id, product_id) VALUES (?, ?)');
      for (const pid of body.productIds) {
        insertProduct.run(promoId, pid);
      }
      ok(reply, { id: promoId });
    });

    instance.put('/api/admin/promotions/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string; startTime?: string; endTime?: string; productIds?: number[]; status?: string;
      };
      const db = getDb();
      const promo = db.prepare('SELECT * FROM promotions WHERE id = ?').get(Number(id)) as any;
      if (!promo) throw new AppError(ErrorCode.NOT_FOUND, '活动不存在', 404);
      db.prepare('UPDATE promotions SET name = ?, start_time = ?, end_time = ?, status = ? WHERE id = ?').run(
        body.name ?? promo.name,
        body.startTime ?? promo.start_time,
        body.endTime ?? promo.end_time,
        body.status ?? promo.status,
        Number(id),
      );
      if (body.productIds) {
        db.prepare('DELETE FROM promotion_products WHERE promotion_id = ?').run(Number(id));
        const insertProduct = db.prepare('INSERT INTO promotion_products (promotion_id, product_id) VALUES (?, ?)');
        for (const pid of body.productIds) {
          insertProduct.run(Number(id), pid);
        }
      }
      ok(reply, null);
    });

    instance.post('/api/admin/promotions/:id/toggle', async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = getDb();
      const promo = db.prepare('SELECT * FROM promotions WHERE id = ?').get(Number(id)) as any;
      if (!promo) throw new AppError(ErrorCode.NOT_FOUND, '活动不存在', 404);
      const newStatus = promo.status === 'active' ? 'inactive' : 'active';
      db.prepare('UPDATE promotions SET status = ? WHERE id = ?').run(newStatus, Number(id));
      ok(reply, { status: newStatus });
    });

    instance.delete('/api/admin/promotions/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = getDb();
      db.prepare('DELETE FROM promotion_products WHERE promotion_id = ?').run(Number(id));
      const result = db.prepare('DELETE FROM promotions WHERE id = ?').run(Number(id));
      if (result.changes === 0) throw new AppError(ErrorCode.NOT_FOUND, '活动不存在', 404);
      ok(reply, null);
    });
  });
}
