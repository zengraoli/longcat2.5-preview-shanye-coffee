import type { FastifyInstance } from 'fastify';
import { randomBytes } from 'node:crypto';
import { getDb } from '../db.js';
import { AppError, ErrorCode } from '../errors.js';
import { ok } from '../reply.js';
import { authRequired, adminRequired } from '../plugins/auth.js';
import { calculateDiscount, isCouponValid } from '../utils/coupon.js';
import { assertTransition } from '../utils/order.js';
import { calcPointsFromAmount, getMemberLevel } from '../utils/points.js';

function generatePickupCode(): string {
  return randomBytes(2).toString('hex').toUpperCase().slice(0, 4);
}

function generateOrderNo(): string {
  const now = new Date();
  const ts = now.getTime().toString(36).toUpperCase();
  const rand = randomBytes(2).toString('hex').toUpperCase();
  return `SY${ts}${rand}`;
}

interface OrderItemInput {
  productId: number;
  quantity: number;
  cupSize: string;
  temperature: string;
  sugar: string;
}

export default async function orderRoutes(app: FastifyInstance): Promise<void> {
  await app.register(async (instance) => {
    authRequired(instance);

    instance.post('/api/orders', async (request, reply) => {
      const body = request.body as {
        storeId?: number;
        type?: string;
        items?: OrderItemInput[];
        userCouponId?: number | null;
      };
      if (!body.storeId || !body.type || !['pickup', 'dine_in'].includes(body.type)) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, '门店和订单类型不能为空');
      }
      if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, '商品列表不能为空');
      }

      const db = getDb();
      const store = db.prepare('SELECT id FROM stores WHERE id = ?').get(body.storeId) as { id: number } | undefined;
      if (!store) throw new AppError(ErrorCode.NOT_FOUND, '门店不存在', 404);

      let originalAmount = 0;
      const orderItems: Array<{
        product_id: number;
        product_name: string;
        cup_size: string;
        temperature: string;
        sugar: string;
        quantity: number;
        unit_price: number;
      }> = [];

      for (const item of body.items) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
          throw new AppError(ErrorCode.VALIDATION_FAILED, '商品数量必须大于 0');
        }
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId) as
          | { id: number; name: string; base_price: number; status: string; sold_out: number }
          | undefined;
        if (!product) throw new AppError(ErrorCode.NOT_FOUND, `商品 ${item.productId} 不存在`, 404);
        if (product.status !== 'on') throw new AppError(ErrorCode.PRODUCT_OFF_SHELF, `商品「${product.name}」已下架`);
        if (product.sold_out === 1) throw new AppError(ErrorCode.PRODUCT_SOLD_OUT, `商品「${product.name}」已售罄`);

        const spec = db.prepare(
          'SELECT price_delta FROM product_specs WHERE product_id = ? AND cup_size = ? AND temperature = ? AND sugar = ?',
        ).get(item.productId, item.cupSize, item.temperature, item.sugar) as { price_delta: number } | undefined;
        if (!spec) throw new AppError(ErrorCode.VALIDATION_FAILED, `商品「${product.name}」规格不存在`);

        const unitPrice = product.base_price + spec.price_delta;
        originalAmount += unitPrice * item.quantity;
        orderItems.push({
          product_id: product.id,
          product_name: product.name,
          cup_size: item.cupSize,
          temperature: item.temperature,
          sugar: item.sugar,
          quantity: item.quantity,
          unit_price: unitPrice,
        });
      }

      const now = new Date().toISOString();

      let promoDiscount = 0;
      const activePromo = db.prepare(
        'SELECT id FROM promotions WHERE status = ? AND start_time <= ? AND end_time >= ? LIMIT 1',
      ).get('active', now, now) as { id: number } | undefined;
      if (activePromo) {
        const promoProductIds = (db.prepare(
          'SELECT product_id FROM promotion_products WHERE promotion_id = ?',
        ).all(activePromo.id) as Array<{ product_id: number }>).map((r) => r.product_id);
        const promoItems = orderItems.filter((i) => promoProductIds.includes(i.product_id));
        const productGroups = new Map<number, typeof promoItems>();
        for (const item of promoItems) {
          const existing = productGroups.get(item.product_id) || [];
          existing.push(item);
          productGroups.set(item.product_id, existing);
        }
        for (const [, items] of productGroups) {
          const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
          const halfQty = Math.floor(totalQty / 2);
          if (halfQty > 0) {
            let remaining = halfQty;
            const sorted = [...items].sort((a, b) => b.unit_price - a.unit_price);
            for (const item of sorted) {
              if (remaining <= 0) break;
              const deduct = Math.min(item.quantity, remaining);
              promoDiscount += Math.floor((item.unit_price * deduct) / 2);
              remaining -= deduct;
            }
          }
        }
      }

      const amountAfterPromo = originalAmount - promoDiscount;

      let discountAmount = promoDiscount;
      let couponId: number | null = null;
      if (body.userCouponId) {
        const uc = db.prepare(
          'SELECT uc.id, uc.status, c.id AS coupon_id, c.type, c.threshold, c.discount, c.valid_from, c.valid_to FROM user_coupons uc JOIN coupons c ON uc.coupon_id = c.id WHERE uc.id = ? AND uc.user_id = ?',
        ).get(body.userCouponId, request.currentUser!.userId) as any;
        if (!uc) throw new AppError(ErrorCode.NOT_FOUND, '优惠券不存在', 404);
        if (uc.status !== 'unused') throw new AppError(ErrorCode.COUPON_NOT_USABLE, '优惠券已被使用');
        if (!isCouponValid(uc)) throw new AppError(ErrorCode.COUPON_EXPIRED, '优惠券已过期');
        const coupon = { id: uc.coupon_id, name: uc.name ?? '', type: uc.type, threshold: uc.threshold, discount: uc.discount, valid_from: uc.valid_from, valid_to: uc.valid_to };
        const couponDiscount = calculateDiscount(coupon, amountAfterPromo);
        if (couponDiscount <= 0) throw new AppError(ErrorCode.COUPON_NOT_USABLE, '优惠券不满足使用条件');
        discountAmount += couponDiscount;
        couponId = uc.coupon_id;
      }

      const paidAmount = originalAmount - discountAmount;
      const pickupCode = generatePickupCode();
      const orderNo = generateOrderNo();

      const result = db.prepare(
        'INSERT INTO orders (order_no, pickup_code, user_id, store_id, type, status, original_amount, discount_amount, paid_amount, coupon_id, points_earned, promo_discount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(orderNo, pickupCode, request.currentUser!.userId, body.storeId, body.type, 'pending', originalAmount, discountAmount, paidAmount, couponId, 0, promoDiscount, now);
      const orderId = Number(result.lastInsertRowid);

      const insertItem = db.prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, cup_size, temperature, sugar, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      );
      for (const item of orderItems) {
        insertItem.run(orderId, item.product_id, item.product_name, item.cup_size, item.temperature, item.sugar, item.quantity, item.unit_price);
      }

      if (couponId && body.userCouponId) {
        db.prepare('UPDATE user_coupons SET status = ?, order_id = ? WHERE id = ?').run('used', orderId, body.userCouponId);
      }

      ok(reply, {
        id: orderId,
        orderNo,
        pickupCode,
        status: 'pending',
        originalAmount,
        discountAmount,
        paidAmount,
      });
    });

    instance.get('/api/orders', async (request, reply) => {
      const query = request.query as { status?: string };
      const db = getDb();
      let sql = `
        SELECT o.id, o.order_no, o.pickup_code, o.type, o.status, o.original_amount, o.discount_amount, o.paid_amount,
               o.points_earned, o.created_at, o.paid_at, o.cancelled_at,
               s.id AS store_id, s.name AS store_name
        FROM orders o JOIN stores s ON o.store_id = s.id
        WHERE o.user_id = ?`;
      const params: any[] = [request.currentUser!.userId];
      if (query.status) {
        sql += ' AND o.status = ?';
        params.push(query.status);
      }
      sql += ' ORDER BY o.created_at DESC LIMIT 50';
      const rows = db.prepare(sql).all(...params);
      ok(reply, rows);
    });

    instance.get('/api/orders/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = getDb();
      const order = db.prepare(
        `SELECT o.id, o.order_no, o.pickup_code, o.type, o.status, o.original_amount, o.discount_amount, o.paid_amount,
                o.points_earned, o.promo_discount, o.created_at, o.paid_at, o.cancelled_at,
                s.id AS store_id, s.name AS store_name
         FROM orders o JOIN stores s ON o.store_id = s.id WHERE o.id = ? AND o.user_id = ?`,
      ).get(Number(id), request.currentUser!.userId) as any;
      if (!order) throw new AppError(ErrorCode.NOT_FOUND, '订单不存在', 404);

      const items = db.prepare(
        'SELECT id, product_id, product_name, cup_size, temperature, sugar, quantity, unit_price FROM order_items WHERE order_id = ?',
      ).all(order.id);
      ok(reply, { ...order, items });
    });

    instance.post('/api/orders/:id/pay', async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = getDb();
      const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(Number(id), request.currentUser!.userId) as any;
      if (!order) throw new AppError(ErrorCode.NOT_FOUND, '订单不存在', 404);
      assertTransition(order.status, 'paid');

      const now = new Date().toISOString();
      db.prepare("UPDATE orders SET status = 'paid', paid_at = ? WHERE id = ?").run(now, order.id);

      const pointsEarned = calcPointsFromAmount(order.paid_amount);
      if (pointsEarned > 0) {
        const member = db.prepare('SELECT points FROM members WHERE id = ?').get(order.user_id) as { points: number };
        const newPoints = member.points + pointsEarned;
        db.prepare('UPDATE members SET points = ? WHERE id = ?').run(newPoints, order.user_id);
        db.prepare('INSERT INTO points_logs (user_id, order_id, points, balance_after, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
          order.user_id, order.id, pointsEarned, newPoints, '消费积分', now,
        );
        db.prepare('UPDATE orders SET points_earned = ? WHERE id = ?').run(pointsEarned, order.id);
      }

      const member = db.prepare('SELECT points FROM members WHERE id = ?').get(order.user_id) as { points: number };
      ok(reply, { id: order.id, status: 'paid', paidAt: now, pointsEarned, level: getMemberLevel(member.points) });
    });

    instance.post('/api/orders/:id/cancel', async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = getDb();
      const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(Number(id), request.currentUser!.userId) as any;
      if (!order) throw new AppError(ErrorCode.NOT_FOUND, '订单不存在', 404);
      assertTransition(order.status, 'cancelled');

      const now = new Date().toISOString();
      db.prepare("UPDATE orders SET status = 'cancelled', cancelled_at = ? WHERE id = ?").run(now, order.id);
      if (order.coupon_id) {
        db.prepare('UPDATE user_coupons SET status = ?, order_id = NULL WHERE order_id = ?').run('unused', order.id);
      }
      ok(reply, { id: order.id, status: 'cancelled' });
    });

  });

  await app.register(async (instance) => {
    authRequired(instance);
    adminRequired(instance);

    instance.get('/api/admin/orders', async (request, reply) => {
      const user = request.currentUser!;
      const query = request.query as { storeId?: string; status?: string };
      const db = getDb();
      let sql = `
        SELECT o.id, o.order_no, o.pickup_code, o.type, o.status, o.original_amount, o.discount_amount, o.paid_amount,
               o.points_earned, o.promo_discount, o.created_at, o.paid_at, o.cancelled_at,
               s.id AS store_id, s.name AS store_name
        FROM orders o JOIN stores s ON o.store_id = s.id WHERE 1=1`;
      const params: any[] = [];
      if (user.role === 'staff') {
        sql += ' AND o.store_id = ?';
        params.push(user.storeId);
      } else if (query.storeId) {
        sql += ' AND o.store_id = ?';
        params.push(Number(query.storeId));
      }
      if (query.status) {
        sql += ' AND o.status = ?';
        params.push(query.status);
      }
      sql += ' ORDER BY o.created_at DESC LIMIT 100';
      const rows = db.prepare(sql).all(...params);
      ok(reply, rows);
    });

    instance.get('/api/admin/orders/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.currentUser!;
      const db = getDb();
      const order = db.prepare(
        `SELECT o.id, o.order_no, o.pickup_code, o.type, o.status, o.original_amount, o.discount_amount, o.paid_amount,
                o.points_earned, o.promo_discount, o.created_at, o.paid_at, o.cancelled_at,
                s.id AS store_id, s.name AS store_name
         FROM orders o JOIN stores s ON o.store_id = s.id WHERE o.id = ?`,
      ).get(Number(id)) as any;
      if (!order) throw new AppError(ErrorCode.NOT_FOUND, '订单不存在', 404);
      if (user.role === 'staff' && order.store_id !== user.storeId) {
        throw new AppError(ErrorCode.FORBIDDEN, '没有权限执行此操作', 403);
      }
      const items = db.prepare(
        'SELECT id, product_name, cup_size, temperature, sugar, quantity, unit_price FROM order_items WHERE order_id = ?',
      ).all(order.id);
      ok(reply, { ...order, items });
    });

    instance.post('/api/admin/orders/:id/status', async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { status?: string };
      if (!body.status) throw new AppError(ErrorCode.VALIDATION_FAILED, '目标状态不能为空');
      const user = request.currentUser!;

      const db = getDb();
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id)) as any;
      if (!order) throw new AppError(ErrorCode.NOT_FOUND, '订单不存在', 404);
      if (user.role === 'staff' && order.store_id !== user.storeId) {
        throw new AppError(ErrorCode.FORBIDDEN, '没有权限执行此操作', 403);
      }
      assertTransition(order.status, body.status as any);

      const now = new Date().toISOString();
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(body.status, order.id);
      ok(reply, { id: order.id, status: body.status });
    });
  });
}
