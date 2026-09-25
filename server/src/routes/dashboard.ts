import type { FastifyInstance } from 'fastify';
import { getDb } from '../db.js';
import { ok } from '../reply.js';
import { authRequired, adminRequired } from '../plugins/auth.js';

function getBeijingToday(): string {
  const now = new Date();
  const bj = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return bj.toISOString().slice(0, 10);
}

export default async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  await app.register(async (instance) => {
    authRequired(instance);
    adminRequired(instance);

    instance.get('/api/admin/dashboard', async (_request, reply) => {
      const db = getDb();
      const today = getBeijingToday();

      const todayStats = db.prepare(`
        SELECT
          COALESCE(SUM(paid_amount), 0) AS revenue,
          COUNT(*) AS orderCount
        FROM orders
        WHERE status IN ('paid','making','ready','completed')
          AND created_at >= ?
      `).get(today) as { revenue: number; orderCount: number };

      const newMembers = db.prepare(`
        SELECT COUNT(*) AS c FROM members WHERE created_at >= ?
      `).get(today) as { c: number };

      const trend = db.prepare(`
        SELECT substr(created_at, 1, 10) AS day,
               SUM(paid_amount) AS revenue,
               COUNT(*) AS orderCount
        FROM orders
        WHERE status IN ('paid','making','ready','completed')
          AND created_at >= date(?, '-6 days')
        GROUP BY substr(created_at, 1, 10)
        ORDER BY day
      `).all(today) as Array<{ day: string; revenue: number; orderCount: number }>;

      const topProducts = db.prepare(`
        SELECT oi.product_name AS name, SUM(oi.quantity) AS totalQty, SUM(oi.unit_price * oi.quantity) AS totalRevenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('paid','making','ready','completed')
        GROUP BY oi.product_id
        ORDER BY totalQty DESC
        LIMIT 10
      `).all() as Array<{ name: string; totalQty: number; totalRevenue: number }>;

      const recentOrders = db.prepare(`
        SELECT o.id, o.order_no, o.pickup_code, o.type, o.status, o.paid_amount, o.created_at,
               s.name AS store_name
        FROM orders o JOIN stores s ON o.store_id = s.id
        ORDER BY o.created_at DESC
        LIMIT 10
      `).all();

      const avgOrderValue = todayStats.orderCount > 0
        ? Math.round(todayStats.revenue / todayStats.orderCount)
        : 0;

      ok(reply, {
        today: {
          revenue: todayStats.revenue,
          orderCount: todayStats.orderCount,
          avgOrderValue,
          newMembers: newMembers.c,
        },
        trend,
        topProducts,
        recentOrders,
      });
    });
  });
}
