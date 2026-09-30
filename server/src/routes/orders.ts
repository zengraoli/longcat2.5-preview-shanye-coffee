import type { FastifyInstance } from 'fastify';
import { randomInt } from 'node:crypto';
import { getDb } from '../db/index.js';
import { err, ErrorCode } from '../lib/errors.js';
import { ok } from '../lib/reply.js';
import { maskPhone } from '../lib/mask.js';
import { bestCoupon, isCouponUsable, type CouponTemplate, type MemberCoupon } from '../services/coupon.js';
import { canAdvance, isBeforePayment, type OrderStatus } from '../services/order.js';
import { computePromoDiscount } from '../services/promo.js';
import { pointsForAmount } from '../services/points.js';
import { isOpenNow } from '../services/store.js';

interface ProductRow {
  id: number;
  name: string;
  price: number;
  status: 'on' | 'off';
  sold_out: number;
}

interface OrderItemBody {
  product_id?: number;
  temperature?: string;
  sugar?: string;
  cup?: string;
  quantity?: number;
}

interface CreateOrderBody {
  store_id?: number;
  type?: string;
  items?: OrderItemBody[];
  coupon_id?: number;
  remark?: string;
}

interface OrderRow {
  id: number;
  order_no: string;
  member_id: number | null;
  store_id: number;
  type: 'pickup' | 'dine_in';
  status: OrderStatus;
  pickup_code: string | null;
  original_amount: number;
  promo_discount_amount: number;
  discount_amount: number;
  payable_amount: number;
  coupon_id: number | null;
  remark: string | null;
  created_at: string;
  paid_at: string | null;
  cancelled_at: string | null;
}

interface OrderItemRow {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  cup: string | null;
  temperature: string | null;
  sugar: string | null;
  price: number;
  quantity: number;
}

interface TemplateRow {
  id: number;
  name: string;
  type: 'full_reduction' | 'discount';
  threshold: number;
  discount_amount: number | null;
  discount_rate: number | null;
  valid_days: number;
  enabled: number;
}

function toTemplate(r: TemplateRow): CouponTemplate {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    threshold: r.threshold,
    discount_amount: r.discount_amount,
    discount_rate: r.discount_rate,
    valid_days: r.valid_days,
    enabled: r.enabled === 1,
  };
}

/** 解析订单商品行（含规格校验），返回单价与规格快照。 */
function resolveItem(item: OrderItemBody) {
  if (typeof item.product_id !== 'number' || !Number.isInteger(item.product_id) || item.product_id <= 0) {
    throw err(ErrorCode.ORDER_ITEMS_INVALID, '订单商品 ID 非法');
  }
  if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 99) {
    throw err(ErrorCode.ORDER_ITEMS_INVALID, '商品数量非法');
  }
  const db = getDb();
  const product = db
    .prepare('SELECT * FROM products WHERE id = ?')
    .get(item.product_id) as ProductRow | undefined;
  if (!product) throw err(ErrorCode.PRODUCT_NOT_FOUND, '商品不存在', 404);
  if (product.status !== 'on') {
    throw err(ErrorCode.PRODUCT_OFF_SHELF, `商品「${product.name}」已下架`);
  }
  if (product.sold_out === 1) {
    throw err(ErrorCode.PRODUCT_SOLD_OUT, `商品「${product.name}」已售罄`);
  }

  let cup: string | null = null;
  let temperature: string | null = null;
  let sugar: string | null = null;
  let priceAdjust = 0;
  const hasSpecs = db
    .prepare('SELECT id FROM product_specs WHERE product_id = ? LIMIT 1')
    .get(item.product_id);
  if (hasSpecs) {
    // 饮品：必须选择杯型/温度/糖度
    if (!item.cup || !item.temperature || !item.sugar) {
      throw err(ErrorCode.ORDER_ITEMS_INVALID, `商品「${product.name}」需选择杯型、温度、糖度`);
    }
    const specRow = db
      .prepare(
        'SELECT * FROM product_specs WHERE product_id = ? AND cup = ? AND temperature = ? AND sugar = ?',
      )
      .get(item.product_id, item.cup, item.temperature, item.sugar) as
      | { price_adjust: number }
      | undefined;
    if (!specRow) {
      throw err(ErrorCode.ORDER_ITEMS_INVALID, `商品「${product.name}」规格不存在`);
    }
    cup = item.cup;
    temperature = item.temperature;
    sugar = item.sugar;
    priceAdjust = specRow.price_adjust;
  } else {
    // 非饮品：不应传规格
    if (item.cup || item.temperature || item.sugar) {
      throw err(ErrorCode.ORDER_ITEMS_INVALID, `商品「${product.name}」无规格选项`);
    }
  }
  return {
    product,
    item: {
      product_id: product.id,
      product_name: product.name,
      cup,
      temperature,
      sugar,
      price: product.price + priceAdjust,
      quantity: item.quantity,
    },
  };
}

function genOrderNo(): string {
  return `YC${Date.now().toString(36).toUpperCase()}${randomInt(10, 99)}`;
}

/** 生成 4 位取餐码，确保与在制订单不重复。 */
/** 生成 4 位取餐码，确保与在制订单不重复。 */
function genPickupCode(db: ReturnType<typeof getDb>): string {
  for (let i = 0; i < 50; i++) {
    const code = String(randomInt(0, 10000)).padStart(4, '0');
    const exists = db
      .prepare(
        "SELECT id FROM orders WHERE pickup_code = ? AND status IN ('paid','making','ready')",
      )
      .get(code);
    if (!exists) return code;
  }
  // 极端情况下回退到时间戳后缀，保证唯一
  return `${Date.now().toString(36).toUpperCase()}${randomInt(10, 99)}`.slice(-4);
}

/** 加载当前生效的所有第二杯半价活动适用商品集合；无活动返回 null。 */
function activePromoProductIds(db: ReturnType<typeof getDb>): Set<number> | null {
  const promo = db
    .prepare(
      "SELECT id, start_at, end_at FROM promotions WHERE type = 'second_cup_half' AND enabled = 1",
    )
    .all() as { id: number; start_at: string; end_at: string }[];
  const now = new Date().getTime();
  const activeIds = promo
    .filter((p) => now >= new Date(p.start_at).getTime() && now <= new Date(p.end_at).getTime())
    .map((p) => p.id);
  if (activeIds.length === 0) return null;
  const placeholders = activeIds.map(() => '?').join(',');
  const rows = db
    .prepare(`SELECT product_id FROM promotion_products WHERE promotion_id IN (${placeholders})`)
    .all(...activeIds) as { product_id: number }[];
  return new Set(rows.map((r) => r.product_id));
}

function orderView(o: OrderRow, items: OrderItemRow[]) {
  return {
    id: o.id,
    orderNo: o.order_no,
    storeId: o.store_id,
    type: o.type,
    status: o.status,
    pickupCode: o.pickup_code,
    originalAmount: o.original_amount,
    promoDiscountAmount: o.promo_discount_amount,
    discountAmount: o.discount_amount,
    payableAmount: o.payable_amount,
    couponId: o.coupon_id,
    remark: o.remark,
    createdAt: o.created_at,
    paidAt: o.paid_at,
    cancelledAt: o.cancelled_at,
    items: items.map((it) => ({
      id: it.id,
      productId: it.product_id,
      productName: it.product_name,
      cup: it.cup,
      temperature: it.temperature,
      sugar: it.sugar,
      price: it.price,
      quantity: it.quantity,
    })),
  };
}

/** 北京时间日期（YYYY-MM-DD）→ UTC ISO 范围起点。 */
/** 校验北京时间日期（YYYY-MM-DD），非法时抛参数错误。 */
function parseBjDay(dateStr: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw err(ErrorCode.VALIDATION, '日期格式非法，应为 YYYY-MM-DD');
  }
  const d = new Date(`${dateStr}T00:00:00+08:00`);
  if (Number.isNaN(d.getTime())) {
    throw err(ErrorCode.VALIDATION, '日期非法');
  }
  return d;
}

function bjDayStart(dateStr: string): string {
  return parseBjDay(dateStr).toISOString();
}

/** 北京时间日期（YYYY-MM-DD）→ UTC ISO 范围终点（含全天）。 */
function bjDayEnd(dateStr: string): string {
  const d = parseBjDay(dateStr);
  return new Date(d.getTime() + 86400_000 - 1).toISOString();
}

/** 订单路由：创建、支付、取消、查询、店员状态推进。 */
export default async function orderRoutes(app: FastifyInstance) {
  // 创建订单（会员）
  app.post<{ Body: CreateOrderBody }>(
    '/api/orders',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['store_id', 'type', 'items'],
          properties: {
            store_id: { type: 'integer' },
            type: { type: 'string', enum: ['pickup', 'dine_in'] },
            items: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['product_id'],
                properties: {
                  product_id: { type: 'integer' },
                  cup: { type: 'string' },
                  temperature: { type: 'string' },
                  sugar: { type: 'string' },
                  quantity: { type: 'integer', minimum: 1 },
                },
              },
            },
            coupon_id: { type: 'integer' },
            remark: { type: 'string', maxLength: 200 },
          },
        },
      },
    },
    async (req, reply) => {
      if (req.user?.type !== 'member') {
        throw err(ErrorCode.FORBIDDEN, '无权限', 403);
      }
      const { store_id, type, items, coupon_id, remark } = req.body ?? {};
      if (typeof store_id !== 'number' || !Number.isInteger(store_id)) {
        throw err(ErrorCode.VALIDATION, '门店 ID 非法');
      }
      if (type !== 'pickup' && type !== 'dine_in') {
        throw err(ErrorCode.VALIDATION, '订单类型非法');
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw err(ErrorCode.ORDER_ITEMS_INVALID, '订单商品不能为空');
      }
      const db = getDb();
      const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(store_id) as
        | { id: number; status: string; open_time: string; close_time: string }
        | undefined;
      if (!store) throw err(ErrorCode.STORE_NOT_FOUND, '门店不存在', 404);
      // 营业状态综合考虑手动状态与营业时间（isOpen）
      if (!isOpenNow(store.status, store.open_time, store.close_time)) {
        throw err(ErrorCode.STORE_CLOSED, '门店休息中，暂不可下单', 400);
      }

      // 解析商品与规格，计算原价
      const resolved = items.map(resolveItem);
      const originalAmount = resolved.reduce((s, r) => s + r.item.price * r.item.quantity, 0);

      // 第二杯半价：先算活动价（同一适用商品第 2、4… 杯半价）
      const promoProductIds = activePromoProductIds(db);
      const promoDiscount = promoProductIds
        ? computePromoDiscount(
            resolved.map((r) => ({
              productId: r.item.product_id,
              price: r.item.price,
              quantity: r.item.quantity,
            })),
            promoProductIds,
          )
        : 0;
      // 活动后金额：优惠券的门槛判断与优惠金额基于此
      const afterPromoAmount = originalAmount - promoDiscount;

      // 优惠券：coupon_id 传 0 表示不使用；不传则自动推荐最优券
      let discount = 0;
      let usedCouponId: number | null = null;
      if (coupon_id === 0) {
        // 显式不使用优惠券
      } else if (coupon_id) {
        const { discount: d } = app.computeCouponDiscount(req.user.id, coupon_id, afterPromoAmount);
        discount = d;
        usedCouponId = coupon_id;
      } else {
        const coupons = db
          .prepare('SELECT * FROM member_coupons WHERE member_id = ?')
          .all(req.user.id) as MemberCoupon[];
        const templates = new Map<number, CouponTemplate>();
        for (const c of coupons) {
          if (!templates.has(c.template_id)) {
            const t = db
              .prepare('SELECT * FROM coupon_templates WHERE id = ?')
              .get(c.template_id) as TemplateRow;
            templates.set(c.template_id, toTemplate(t));
          }
        }
        const best = bestCoupon(coupons, templates, afterPromoAmount);
        if (best) {
          discount = best.discount;
          usedCouponId = best.coupon.id;
        }
      }

      // 实付 = 原价 - 活动优惠 - 券优惠
      // （活动优惠 ≤ 原价/2，券优惠 ≤ 活动后金额，均天然不为负；兜底不为负）
      const payableAmount = Math.max(0, afterPromoAmount - discount);

      // 生成订单号与取餐码（唯一冲突时重试）
      let orderNo = '';
      let pickupCode = '';
      let orderId = 0;
      const now = new Date().toISOString();
      for (let attempt = 0; attempt < 5; attempt++) {
        orderNo = genOrderNo();
        pickupCode = genPickupCode(db);
        try {
          const tx = db.transaction(() => {
            const info = db
              .prepare(
                `INSERT INTO orders
                  (order_no, member_id, store_id, type, status, pickup_code,
                   original_amount, promo_discount_amount, discount_amount, payable_amount, coupon_id, remark, created_at)
                 VALUES (?, ?, ?, ?, 'pending_payment', ?, ?, ?, ?, ?, ?, ?, ?)`,
              )
              .run(
                orderNo,
                req.user!.id,
                store_id,
                type,
                pickupCode,
                originalAmount,
                promoDiscount,
                discount,
                payableAmount,
                usedCouponId,
                remark ?? null,
                now,
              );
            orderId = Number(info.lastInsertRowid);
            const insertItem = db.prepare(
              `INSERT INTO order_items (order_id, product_id, product_name, cup, temperature, sugar, price, quantity)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            );
            for (const r of resolved) {
              insertItem.run(
                orderId,
                r.item.product_id,
                r.item.product_name,
                r.item.cup,
                r.item.temperature,
                r.item.sugar,
                r.item.price,
                r.item.quantity,
              );
            }
            // 下单即核销优惠券，防止同一张券被多笔订单复用
            if (usedCouponId) {
              db.prepare(
                "UPDATE member_coupons SET status = 'used', used_at = ?, order_id = ? WHERE id = ?",
              ).run(now, orderId, usedCouponId);
            }
          });
          tx();
          break;
        } catch (e) {
          const msg = e instanceof Error ? e.message : '';
          if (msg.includes('UNIQUE') && attempt < 4) continue;
          throw e;
        }
      }

      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderRow;
      const orderItems = db
        .prepare('SELECT * FROM order_items WHERE order_id = ?')
        .all(orderId) as OrderItemRow[];
      ok(reply, orderView(order, orderItems));
    },
  );

  // 我的订单列表（会员，含商品明细）
  app.get(
    '/api/orders',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      if (req.user?.type !== 'member') {
        throw err(ErrorCode.FORBIDDEN, '无权限', 403);
      }
      const db = getDb();
      const rows = db
        .prepare('SELECT * FROM orders WHERE member_id = ? ORDER BY created_at DESC, id DESC')
        .all(req.user.id) as OrderRow[];
      if (rows.length === 0) {
        ok(reply, []);
        return;
      }
      const ids = rows.map((r) => r.id);
      const placeholders = ids.map(() => '?').join(',');
      const items = db
        .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`)
        .all(...ids) as OrderItemRow[];
      const byOrder = new Map<number, OrderItemRow[]>();
      for (const it of items) {
        const list = byOrder.get(it.order_id) ?? [];
        list.push(it);
        byOrder.set(it.order_id, list);
      }
      ok(reply, rows.map((o) => orderView(o, byOrder.get(o.id) ?? [])));
    },
  );

  // 订单详情（会员，仅本人）
  app.get<{ Params: { id: string } }>(
    '/api/orders/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
      },
    },
    async (req, reply) => {
      if (req.user?.type !== 'member') {
        throw err(ErrorCode.FORBIDDEN, '无权限', 403);
      }
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw err(ErrorCode.VALIDATION, '订单 ID 非法');
      }
      const db = getDb();
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
      if (!order) throw err(ErrorCode.ORDER_NOT_FOUND, '订单不存在', 404);
      if (order.member_id !== req.user.id) {
        throw err(ErrorCode.FORBIDDEN, '无权限：仅可查看本人订单', 403);
      }
      const items = db
        .prepare('SELECT * FROM order_items WHERE order_id = ?')
        .all(id) as OrderItemRow[];
      ok(reply, orderView(order, items));
    },
  );

  // 模拟支付（会员，仅本人，待支付状态）
  app.post<{ Params: { id: string } }>(
    '/api/orders/:id/pay',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      if (req.user?.type !== 'member') {
        throw err(ErrorCode.FORBIDDEN, '无权限', 403);
      }
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw err(ErrorCode.VALIDATION, '订单 ID 非法');
      }
      const db = getDb();
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
      if (!order) throw err(ErrorCode.ORDER_NOT_FOUND, '订单不存在', 404);
      if (order.member_id !== req.user.id) {
        throw err(ErrorCode.FORBIDDEN, '无权限：仅可支付本人订单', 403);
      }
      if (order.status !== 'pending_payment') {
        throw err(ErrorCode.ORDER_STATE_INVALID, '订单状态不允许支付');
      }
      // 支付时复核优惠券是否仍有效（下单后券可能已过期）
      if (order.coupon_id) {
        const c = db
          .prepare('SELECT * FROM member_coupons WHERE id = ?')
          .get(order.coupon_id) as MemberCoupon | undefined;
        if (c && new Date(c.expires_at).getTime() < Date.now()) {
          throw err(ErrorCode.COUPON_EXPIRED, '优惠券已过期，无法支付', 400);
        }
      }
      const now = new Date().toISOString();
      const tx = db.transaction(() => {
        db.prepare("UPDATE orders SET status = 'paid', paid_at = ? WHERE id = ?").run(now, id);
        // 支付后按实付金额积分：每 1 元积 1 分
        if (order.member_id && order.payable_amount > 0) {
          const earned = pointsForAmount(order.payable_amount);
          if (earned > 0) {
            const member = db
              .prepare('SELECT points FROM members WHERE id = ?')
              .get(order.member_id) as { points: number };
            const balance = member.points + earned;
            db.prepare('UPDATE members SET points = ? WHERE id = ?').run(balance, order.member_id);
            db.prepare(
              `INSERT INTO point_logs (member_id, order_id, points, balance, remark, created_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
            ).run(order.member_id, id, earned, balance, '消费积分', now);
          }
        }
      });
      tx();
      const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;
      const updatedItems = db
        .prepare('SELECT * FROM order_items WHERE order_id = ?')
        .all(id) as OrderItemRow[];
      ok(reply, orderView(updated, updatedItems));
    },
  );

  // 取消订单（会员，仅本人，支付前）
  app.post<{ Params: { id: string } }>(
    '/api/orders/:id/cancel',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      if (req.user?.type !== 'member') {
        throw err(ErrorCode.FORBIDDEN, '无权限', 403);
      }
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw err(ErrorCode.VALIDATION, '订单 ID 非法');
      }
      const db = getDb();
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
      if (!order) throw err(ErrorCode.ORDER_NOT_FOUND, '订单不存在', 404);
      if (order.member_id !== req.user.id) {
        throw err(ErrorCode.FORBIDDEN, '无权限：仅可取消本人订单', 403);
      }
      if (!isBeforePayment(order.status)) {
        throw err(ErrorCode.ORDER_STATE_INVALID, '订单状态不允许取消');
      }
      const now = new Date().toISOString();
      const tx = db.transaction(() => {
        db.prepare("UPDATE orders SET status = 'cancelled', cancelled_at = ? WHERE id = ?").run(now, id);
        // 释放优惠券（清除使用时间与订单关联，恢复为未使用）
        if (order.coupon_id) {
          db.prepare(
            "UPDATE member_coupons SET status = 'unused', order_id = NULL, used_at = NULL WHERE id = ?",
          ).run(order.coupon_id);
        }
      });
      tx();
      const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;
      const updatedItems = db
        .prepare('SELECT * FROM order_items WHERE order_id = ?')
        .all(id) as OrderItemRow[];
      ok(reply, orderView(updated, updatedItems));
    },
  );

  // 后台订单列表（管理员全部；店员仅本门店；支持分页与北京时间日期筛选）
  app.get<{
    Querystring: {
      store_id?: string;
      status?: string;
      start?: string;
      end?: string;
      page?: string;
      page_size?: string;
    };
  }>(
    '/api/admin/orders',
    { preHandler: [app.requireAdminOrStaff] },
    async (req, reply) => {
      const db = getDb();
      const user = req.user!;
      const conds: string[] = [];
      const params: unknown[] = [];
      // 店员只能看本门店
      if (user.type === 'admin' && user.role === 'staff') {
        conds.push('o.store_id = ?');
        params.push(user.storeId);
      }
      if (req.query.store_id !== undefined && req.query.store_id !== '') {
        const sid = Number(req.query.store_id);
        if (!Number.isInteger(sid)) throw err(ErrorCode.VALIDATION, '门店 ID 非法');
        conds.push('o.store_id = ?');
        params.push(sid);
      }
      if (req.query.status !== undefined && req.query.status !== '') {
        const valid = ['pending_payment', 'paid', 'making', 'ready', 'completed', 'cancelled'];
        if (!valid.includes(req.query.status)) {
          throw err(ErrorCode.VALIDATION, '状态非法');
        }
        conds.push('o.status = ?');
        params.push(req.query.status);
      }
      // 日期筛选：按北京时间日期解释
      if (req.query.start) {
        conds.push('o.created_at >= ?');
        params.push(bjDayStart(req.query.start));
      }
      if (req.query.end) {
        conds.push('o.created_at <= ?');
        params.push(bjDayEnd(req.query.end));
      }
      const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

      // 分页
      // 分页参数校验：非法值返回 400 而非 500
      const rawPage = Number(req.query.page);
      const rawPageSize = Number(req.query.page_size);
      if (req.query.page !== undefined && (!Number.isFinite(rawPage) || rawPage > 1e6)) {
        throw err(ErrorCode.VALIDATION, '页码非法');
      }
      if (req.query.page_size !== undefined && (!Number.isFinite(rawPageSize) || rawPageSize > 1e6)) {
        throw err(ErrorCode.VALIDATION, '每页数量非法');
      }
      const page = Math.max(1, Math.floor(rawPage) || 1);
      const pageSize = Math.min(100, Math.max(1, Math.floor(rawPageSize) || 20));
      const total = (
        db.prepare(`SELECT COUNT(*) AS n FROM orders o ${where}`).get(...params) as { n: number }
      ).n;
      const rows = db
        .prepare(
          `SELECT o.*, m.phone AS member_phone
           FROM orders o LEFT JOIN members m ON m.id = o.member_id
           ${where} ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?`,
        )
        .all(...params, pageSize, (page - 1) * pageSize) as (OrderRow & {
        member_phone: string | null;
      })[];
      ok(reply, {
        total,
        page,
        pageSize,
        list: rows.map((o) => ({
          ...orderView(o, []),
          memberPhone: maskPhone(o.member_phone),
        })),
      });
    },
  );

  // 后台订单详情（管理员全部；店员仅本门店）
  app.get<{ Params: { id: string } }>(
    '/api/admin/orders/:id',
    { preHandler: [app.requireAdminOrStaff] },
    async (req, reply) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw err(ErrorCode.VALIDATION, '订单 ID 非法');
      }
      const db = getDb();
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
      if (!order) throw err(ErrorCode.ORDER_NOT_FOUND, '订单不存在', 404);
      const user = req.user!;
      if (user.type === 'admin' && user.role === 'staff' && order.store_id !== user.storeId) {
        throw err(ErrorCode.ORDER_STORE_MISMATCH, '无权限：订单不属于该门店', 403);
      }
      const items = db
        .prepare('SELECT * FROM order_items WHERE order_id = ?')
        .all(id) as OrderItemRow[];
      const member = order.member_id
        ? (db.prepare('SELECT phone FROM members WHERE id = ?').get(order.member_id) as
            | { phone: string }
            | undefined)
        : undefined;
      ok(reply, { ...orderView(order, items), memberPhone: maskPhone(member?.phone ?? null) });
    },
  );

  // 推进订单状态（已支付 → 制作中 → 待取餐 → 已完成）
  app.post<{ Params: { id: string }; Body: { target?: string } }>(
    '/api/admin/orders/:id/advance',
    {
      preHandler: [app.requireAdminOrStaff],
      schema: {
        body: {
          type: 'object',
          required: ['target'],
          properties: { target: { type: 'string' } },
        },
      },
    },
    async (req, reply) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw err(ErrorCode.VALIDATION, '订单 ID 非法');
      }
      const target = req.body?.target as OrderStatus;
      const db = getDb();
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
      if (!order) throw err(ErrorCode.ORDER_NOT_FOUND, '订单不存在', 404);
      const user = req.user!;
      if (user.type === 'admin' && user.role === 'staff' && order.store_id !== user.storeId) {
        throw err(ErrorCode.ORDER_STORE_MISMATCH, '无权限：订单不属于该门店', 403);
      }
      if (!canAdvance(order.status, target)) {
        throw err(
          ErrorCode.ORDER_STATE_INVALID,
          `订单状态不允许从「${order.status}」流转到「${target}」`,
        );
      }
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(target, id);
      const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;
      const updatedItems = db
        .prepare('SELECT * FROM order_items WHERE order_id = ?')
        .all(id) as OrderItemRow[];
      ok(reply, orderView(updated, updatedItems));
    },
  );
}
