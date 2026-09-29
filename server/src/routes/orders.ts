import type { FastifyInstance } from 'fastify';
import { randomInt } from 'node:crypto';
import { getDb } from '../db/index.js';
import { err, ErrorCode } from '../lib/errors.js';
import { ok } from '../lib/reply.js';
import { maskPhone } from '../lib/mask.js';
import { bestCoupon, isCouponUsable, type CouponTemplate, type MemberCoupon } from '../services/coupon.js';
import { canAdvance, computeOrderAmount, isBeforePayment, type OrderStatus } from '../services/order.js';
import { pointsForAmount } from '../services/points.js';

interface ProductRow {
  id: number;
  name: string;
  price: number;
  status: 'on' | 'off';
  sold_out: number;
}

interface OrderItemBody {
  product_id?: number;
  cup?: string;
  temperature?: string;
  sugar?: string;
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
  product_id: number;
  product_name: string;
  cup: string | null;
  temperature: string | null;
  sugar: string | null;
  price: number;
  quantity: number;
}

/** 解析订单商品行（含规格校验），返回单价与规格快照。 */
function resolveItem(item: OrderItemBody) {
  if (!item.product_id || !Number.isInteger(item.product_id) || item.product_id <= 0) {
    throw err(ErrorCode.ORDER_ITEMS_INVALID, '订单商品 ID 非法');
  }
  const quantity = item.quantity ?? 1;
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 99) {
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
  const spec = db
    .prepare('SELECT * FROM product_specs WHERE product_id = ?')
    .get(item.product_id) as { id: number } | undefined;
  if (spec) {
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
      quantity,
    },
  };
}

function genOrderNo(): string {
  return `YC${Date.now().toString(36).toUpperCase()}${randomInt(10, 99)}`;
}

function genPickupCode(): string {
  return String(randomInt(0, 10000)).padStart(4, '0');
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
      if (!store_id || !Number.isInteger(store_id)) {
        throw err(ErrorCode.VALIDATION, '门店 ID 非法');
      }
      if (type !== 'pickup' && type !== 'dine_in') {
        throw err(ErrorCode.VALIDATION, '订单类型非法');
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw err(ErrorCode.ORDER_ITEMS_INVALID, '订单商品不能为空');
      }
      const db = getDb();
      const store = db.prepare('SELECT id FROM stores WHERE id = ?').get(store_id);
      if (!store) throw err(ErrorCode.STORE_NOT_FOUND, '门店不存在', 404);

      // 解析商品与规格，计算原价
      const resolved = items.map(resolveItem);
      const originalAmount = resolved.reduce((s, r) => s + r.item.price * r.item.quantity, 0);

      // 优惠券：手动选择或自动推荐最优券
      let discount = 0;
      let usedCouponId: number | null = null;
      if (coupon_id) {
        const { discount: d } = app.computeCouponDiscount(coupon_id, originalAmount);
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
              .get(c.template_id) as CouponTemplate;
            templates.set(c.template_id, t);
          }
        }
        const best = bestCoupon(coupons, templates, originalAmount);
        if (best) {
          discount = best.discount;
          usedCouponId = best.coupon.id;
        }
      }

      const amounts = computeOrderAmount(
        resolved.map((r) => ({ price: r.item.price, quantity: r.item.quantity })),
        discount,
      );

      // 生成订单号与取餐码（唯一冲突时重试）
      let orderNo = '';
      let pickupCode = '';
      let orderId = 0;
      const now = new Date().toISOString();
      for (let attempt = 0; attempt < 5; attempt++) {
        orderNo = genOrderNo();
        pickupCode = genPickupCode();
        try {
          const tx = db.transaction(() => {
            const info = db
              .prepare(
                `INSERT INTO orders
                  (order_no, member_id, store_id, type, status, pickup_code,
                   original_amount, discount_amount, payable_amount, coupon_id, remark, created_at)
                 VALUES (?, ?, ?, ?, 'pending_payment', ?, ?, ?, ?, ?, ?, ?)`,
              )
              .run(
                orderNo,
                req.user!.id,
                store_id,
                type,
                pickupCode,
                amounts.originalAmount,
                amounts.discountAmount,
                amounts.payableAmount,
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

  // 我的订单列表（会员）
  app.get(
    '/api/orders',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      if (req.user?.type !== 'member') {
        throw err(ErrorCode.FORBIDDEN, '无权限', 403);
      }
      const rows = getDb()
        .prepare('SELECT * FROM orders WHERE member_id = ? ORDER BY created_at DESC, id DESC')
        .all(req.user.id) as OrderRow[];
      ok(reply, rows.map((o) => orderView(o, [])));
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
          properties: { id: { type: 'integer' } },
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
      const now = new Date().toISOString();
      const tx = db.transaction(() => {
        db.prepare("UPDATE orders SET status = 'paid', paid_at = ? WHERE id = ?").run(now, id);
        // 标记优惠券为已使用
        if (order.coupon_id) {
          db.prepare(
            "UPDATE member_coupons SET status = 'used', used_at = ?, order_id = ? WHERE id = ?",
          ).run(now, id, order.coupon_id);
        }
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
      ok(reply, orderView(updated, []));
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
        // 释放优惠券
        if (order.coupon_id) {
          db.prepare("UPDATE member_coupons SET status = 'unused', order_id = NULL WHERE id = ?").run(
            order.coupon_id,
          );
        }
      });
      tx();
      const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;
      ok(reply, orderView(updated, []));
    },
  );

  // 后台订单列表（管理员全部；店员仅本门店）
  app.get<{ Querystring: { store_id?: string; status?: string; start?: string; end?: string } }>(
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
      if (req.query.store_id !== undefined) {
        conds.push('o.store_id = ?');
        params.push(Number(req.query.store_id));
      }
      if (req.query.status !== undefined) {
        const valid = ['pending_payment', 'paid', 'making', 'ready', 'completed', 'cancelled'];
        if (!valid.includes(req.query.status)) {
          throw err(ErrorCode.VALIDATION, '状态非法');
        }
        conds.push('o.status = ?');
        params.push(req.query.status);
      }
      if (req.query.start !== undefined) {
        conds.push('o.created_at >= ?');
        params.push(new Date(req.query.start).toISOString());
      }
      if (req.query.end !== undefined) {
        conds.push('o.created_at <= ?');
        params.push(new Date(req.query.end).toISOString());
      }
      const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
      const rows = db
        .prepare(
          `SELECT o.*, m.phone AS member_phone
           FROM orders o LEFT JOIN members m ON m.id = o.member_id
           ${where} ORDER BY o.created_at DESC, o.id DESC LIMIT 200`,
        )
        .all(...params) as (OrderRow & { member_phone: string | null })[];
      ok(
        reply,
        rows.map((o) => ({
          ...orderView(o, []),
          memberPhone: maskPhone(o.member_phone),
        })),
      );
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
      ok(reply, orderView(updated, []));
    },
  );
}
