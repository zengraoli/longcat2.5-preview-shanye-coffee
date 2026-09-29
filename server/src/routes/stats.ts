import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { ok } from '../lib/reply.js';

const ACTIVE_STATUSES = "('paid','making','ready','completed')";

/** 北京时间 YYYY-MM-DD → 对应的 UTC ISO 时间范围 [start, end)。 */
function bjDayRange(dateStr: string): { start: string; end: string } {
  const start = new Date(`${dateStr}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 86400_000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** 当前北京时间日期 YYYY-MM-DD。 */
function todayBj(): string {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

/** 近 7 天（含今天）北京时间日期列表，升序。 */
function last7BjDates(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000 + 8 * 3600 * 1000);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

interface OrderRow {
  id: number;
  order_no: string;
  member_id: number | null;
  store_id: number;
  type: 'pickup' | 'dine_in';
  status: string;
  pickup_code: string | null;
  original_amount: number;
  discount_amount: number;
  payable_amount: number;
  coupon_id: number | null;
  remark: string | null;
  created_at: string;
  paid_at: string | null;
  cancelled_at: string | null;
}

/** 数据看板统计接口（管理员或店员）。 */
export default async function statsRoutes(app: FastifyInstance) {
  app.get(
    '/api/admin/stats/dashboard',
    { preHandler: [app.requireAdminOrStaff] },
    async (_req, reply) => {
      const db = getDb();
      const today = todayBj();
      const range = bjDayRange(today);

      // 今日营业额与订单量
      const todayRow = db
        .prepare(
          `SELECT COALESCE(SUM(payable_amount), 0) AS revenue, COUNT(*) AS orders
           FROM orders
           WHERE created_at >= ? AND created_at < ? AND status IN ${ACTIVE_STATUSES}`,
        )
        .get(range.start, range.end) as { revenue: number; orders: number };

      // 今日新增会员
      const newMembers = db
        .prepare('SELECT COUNT(*) AS n FROM members WHERE created_at >= ? AND created_at < ?')
        .get(range.start, range.end) as { n: number };

      // 近 7 天营业额与订单量趋势
      const trend7d = last7BjDates().map((date) => {
        const r = bjDayRange(date);
        const row = db
          .prepare(
            `SELECT COALESCE(SUM(payable_amount), 0) AS revenue, COUNT(*) AS orders
             FROM orders
             WHERE created_at >= ? AND created_at < ? AND status IN ${ACTIVE_STATUSES}`,
          )
          .get(r.start, r.end) as { revenue: number; orders: number };
        return { date, revenue: row.revenue, orders: row.orders };
      });

      // 热销 Top10（近 7 天，按销量）
      const firstDay = last7BjDates()[0] as string;
      const topStart = bjDayRange(firstDay).start;
      const topProducts = db
        .prepare(
          `SELECT oi.product_name AS name, SUM(oi.quantity) AS quantity,
                  SUM(oi.price * oi.quantity) AS revenue
           FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           WHERE o.status IN ${ACTIVE_STATUSES} AND o.created_at >= ?
           GROUP BY oi.product_name
           ORDER BY quantity DESC
           LIMIT 10`,
        )
        .all(topStart) as { name: string; quantity: number; revenue: number }[];

      // 最新订单
      const recentOrders = db
        .prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT 10')
        .all() as OrderRow[];

      ok(reply, {
        todayRevenue: todayRow.revenue,
        todayOrders: todayRow.orders,
        avgOrderAmount:
          todayRow.orders > 0 ? Math.round(todayRow.revenue / todayRow.orders) : 0,
        newMembers: newMembers.n,
        trend7d,
        topProducts,
        recentOrders,
      });
    },
  );
}
