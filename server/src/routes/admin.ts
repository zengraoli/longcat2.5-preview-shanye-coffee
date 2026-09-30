import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { err, ErrorCode } from '../lib/errors.js';
import { ok } from '../lib/reply.js';
import { maskPhone } from '../lib/mask.js';
import { levelForPoints } from '../services/points.js';
import { hashPassword } from '../db/seed.js';

interface StoreRow {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  open_time: string;
  close_time: string;
  status: 'open' | 'closed';
  sort: number;
}

interface MemberRow {
  id: number;
  phone: string;
  nickname: string | null;
  points: number;
  created_at: string;
}

interface TemplateRow {
  id: number;
  name: string;
  type: 'full_reduction' | 'discount';
  threshold: number;
  discount_amount: number | null;
  discount_rate: number | null;
  valid_days: number;
  total_stock: number;
  enabled: number;
  sort: number;
}

interface AdminRow {
  id: number;
  username: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'staff';
  store_id: number | null;
  enabled: number;
}

function templateView(t: TemplateRow) {
  return {
    id: t.id,
    name: t.name,
    type: t.type,
    threshold: t.threshold,
    discountAmount: t.discount_amount,
    discountRate: t.discount_rate,
    validDays: t.valid_days,
    totalStock: t.total_stock,
    enabled: t.enabled === 1,
  };
}

/** 校验时间格式 HH:MM 且合法。 */
function isValidTime(t: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const parts = t.split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return false;
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

/** 按北京时间计算门店当前是否营业（status 为 open 时按时间判断）。 */
function isOpenNow(status: string, openTime: string, closeTime: string): boolean {
  if (status !== 'open') return false;
  const now = new Date(Date.now() + 8 * 3600 * 1000);
  const cur = now.getUTCHours() * 60 + now.getUTCMinutes();
  const parse = (t: string): number => {
    const [h, m] = t.split(':');
    return Number(h ?? 0) * 60 + Number(m ?? 0);
  };
  const open = parse(openTime);
  const close = parse(closeTime);
  if (close >= open) return cur >= open && cur < close;
  // 跨夜营业（如 22:00-02:00）
  return cur >= open || cur < close;
}

/** 后台管理接口：门店编辑、会员列表/详情、优惠券模板 CRUD。 */
export default async function adminRoutes(app: FastifyInstance) {
  // 编辑门店信息与营业状态（仅管理员）
  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/api/admin/stores/:id',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw err(ErrorCode.VALIDATION, '门店 ID 非法');
      }
      const db = getDb();
      const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(id) as StoreRow | undefined;
      if (!store) throw err(ErrorCode.STORE_NOT_FOUND, '门店不存在', 404);

      const { name, address, phone, open_time, close_time, status } = req.body ?? {};
      if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
        throw err(ErrorCode.VALIDATION, '门店名称非法');
      }
      if (address !== undefined && (typeof address !== 'string' || address.trim() === '')) {
        throw err(ErrorCode.VALIDATION, '门店地址非法');
      }
      if (phone !== undefined && typeof phone !== 'string') {
        throw err(ErrorCode.VALIDATION, '门店电话非法');
      }
      if (status !== undefined && status !== 'open' && status !== 'closed') {
        throw err(ErrorCode.VALIDATION, '营业状态非法');
      }
      const newOpen = (open_time ?? store.open_time) as string;
      const newClose = (close_time ?? store.close_time) as string;
      if (!isValidTime(newOpen) || !isValidTime(newClose)) {
        throw err(ErrorCode.VALIDATION, '营业时间非法');
      }
      db.prepare(
        `UPDATE stores SET name = ?, address = ?, phone = ?, open_time = ?, close_time = ?, status = ?
         WHERE id = ?`,
      ).run(
        name ?? store.name,
        address ?? store.address,
        phone !== undefined ? phone : store.phone,
        newOpen,
        newClose,
        status ?? store.status,
        id,
      );
      const updated = db.prepare('SELECT * FROM stores WHERE id = ?').get(id) as StoreRow;
      ok(reply, {
        id: updated.id,
        name: updated.name,
        address: updated.address,
        phone: updated.phone,
        openTime: updated.open_time,
        closeTime: updated.close_time,
        status: updated.status,
        isOpen: isOpenNow(updated.status, updated.open_time, updated.close_time),
      });
    },
  );

  // 会员列表（仅管理员，手机号脱敏）
  app.get(
    '/api/admin/members',
    { preHandler: [app.requireAdmin] },
    async (_req, reply) => {
      const rows = getDb()
        .prepare('SELECT * FROM members ORDER BY id DESC LIMIT 500')
        .all() as MemberRow[];
      ok(
        reply,
        rows.map((m) => ({
          id: m.id,
          phone: maskPhone(m.phone),
          nickname: m.nickname,
          points: m.points,
          level: levelForPoints(m.points).name,
          createdAt: m.created_at,
        })),
      );
    },
  );

  // 会员详情（仅管理员）
  app.get<{ Params: { id: string } }>(
    '/api/admin/members/:id',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw err(ErrorCode.VALIDATION, '会员 ID 非法');
      }
      const db = getDb();
      const m = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as MemberRow | undefined;
      if (!m) throw err(ErrorCode.MEMBER_NOT_FOUND, '会员不存在', 404);
      const orders = db
        .prepare(
          `SELECT id, order_no, status, payable_amount, created_at FROM orders
           WHERE member_id = ? ORDER BY created_at DESC, id DESC LIMIT 20`,
        )
        .all(id) as {
        id: number;
        order_no: string;
        status: string;
        payable_amount: number;
        created_at: string;
      }[];
      const coupons = db
        .prepare(
          `SELECT c.id, c.status, c.expires_at, t.name, t.type
           FROM member_coupons c JOIN coupon_templates t ON t.id = c.template_id
           WHERE c.member_id = ? ORDER BY c.claimed_at DESC LIMIT 50`,
        )
        .all(id) as { id: number; status: string; expires_at: string; name: string; type: string }[];
      ok(reply, {
        id: m.id,
        phone: maskPhone(m.phone),
        nickname: m.nickname,
        points: m.points,
        level: levelForPoints(m.points).name,
        createdAt: m.created_at,
        orders: orders.map((o) => ({
          id: o.id,
          orderNo: o.order_no,
          status: o.status,
          payableAmount: o.payable_amount,
          createdAt: o.created_at,
        })),
        coupons: coupons.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          status: c.status,
          expiresAt: c.expires_at,
        })),
      });
    },
  );

  // 优惠券模板列表（仅管理员）
  app.get(
    '/api/admin/coupon-templates',
    { preHandler: [app.requireAdmin] },
    async (_req, reply) => {
      const rows = getDb()
        .prepare('SELECT * FROM coupon_templates ORDER BY sort, id')
        .all() as TemplateRow[];
      ok(reply, rows.map(templateView));
    },
  );

  // 可领取的优惠券模板（公开，仅启用）
  app.get('/api/coupon-templates', async (_req, reply) => {
    const rows = getDb()
      .prepare('SELECT * FROM coupon_templates WHERE enabled = 1 ORDER BY sort, id')
      .all() as TemplateRow[];
    ok(reply, rows.map(templateView));
  });

  // 创建优惠券模板（仅管理员）
  app.post<{ Body: Record<string, unknown> }>(
    '/api/admin/coupon-templates',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const body = req.body ?? {};
      const name = body.name;
      const type = body.type;
      if (typeof name !== 'string' || name.trim() === '') {
        throw err(ErrorCode.VALIDATION, '名称非法');
      }
      if (type !== 'full_reduction' && type !== 'discount') {
        throw err(ErrorCode.VALIDATION, '券类型非法');
      }
      const validDays = body.valid_days === undefined ? 30 : Number(body.valid_days);
      if (!Number.isInteger(validDays) || validDays <= 0) {
        throw err(ErrorCode.VALIDATION, '有效期非法');
      }
      const totalStock = body.total_stock === undefined ? 0 : Number(body.total_stock);
      if (!Number.isInteger(totalStock) || totalStock < 0) {
        throw err(ErrorCode.VALIDATION, '库存非法');
      }
      if (type === 'full_reduction') {
        const threshold = Number(body.threshold);
        const discountAmount = Number(body.discount_amount);
        if (!Number.isInteger(threshold) || threshold <= 0) {
          throw err(ErrorCode.VALIDATION, '满减门槛非法');
        }
        if (!Number.isInteger(discountAmount) || discountAmount <= 0) {
          throw err(ErrorCode.VALIDATION, '满减金额非法');
        }
        if (discountAmount >= threshold) {
          throw err(ErrorCode.VALIDATION, '满减金额不能大于等于门槛');
        }
      } else {
        const discountRate = Number(body.discount_rate);
        if (!Number.isInteger(discountRate) || discountRate <= 0 || discountRate >= 100) {
          throw err(ErrorCode.VALIDATION, '折扣率非法');
        }
      }
      const db = getDb();
      const maxSort = (
        db.prepare('SELECT COALESCE(MAX(sort), 0) AS m FROM coupon_templates').get() as { m: number }
      ).m;
      const info = db
        .prepare(
          `INSERT INTO coupon_templates (name, type, threshold, discount_amount, discount_rate, valid_days, total_stock, enabled, sort)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        )
        .run(
          name.trim(),
          type,
          type === 'full_reduction' ? Number(body.threshold) : 0,
          type === 'full_reduction' ? Number(body.discount_amount) : null,
          type === 'discount' ? Number(body.discount_rate) : null,
          validDays,
          totalStock,
          maxSort + 1,
        );
      const row = db
        .prepare('SELECT * FROM coupon_templates WHERE id = ?')
        .get(Number(info.lastInsertRowid)) as TemplateRow;
      ok(reply, templateView(row));
    },
  );

  // 后台账号列表（仅管理员）
  app.get(
    '/api/admin/accounts',
    { preHandler: [app.requireAdmin] },
    async (_req, reply) => {
      const rows = getDb()
        .prepare('SELECT * FROM admins ORDER BY id')
        .all() as AdminRow[];
      ok(
        reply,
        rows.map((a) => ({
          id: a.id,
          username: a.username,
          name: a.name,
          role: a.role,
          storeId: a.store_id,
          enabled: a.enabled === 1,
        })),
      );
    },
  );

  // 新增后台账号（仅管理员）
  app.post<{ Body: Record<string, unknown> }>(
    '/api/admin/accounts',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const body = req.body ?? {};
      const { username, password, name, role, store_id } = body;
      if (typeof username !== 'string' || username.trim() === '' || username.length > 64) {
        throw err(ErrorCode.VALIDATION, '账号非法');
      }
      if (typeof password !== 'string' || password.length < 6) {
        throw err(ErrorCode.VALIDATION, '密码至少 6 位');
      }
      if (typeof name !== 'string' || name.trim() === '') {
        throw err(ErrorCode.VALIDATION, '姓名非法');
      }
      if (role !== 'admin' && role !== 'staff') {
        throw err(ErrorCode.VALIDATION, '角色非法');
      }
      // 店员必须分配门店
      if (role === 'staff' && (store_id === undefined || store_id === null)) {
        throw err(ErrorCode.VALIDATION, '店员必须分配门店');
      }
      const db = getDb();
      const exists = db.prepare('SELECT id FROM admins WHERE username = ?').get(username.trim());
      if (exists) throw err(ErrorCode.CONFLICT, '账号已存在', 409);
      if (role === 'staff' && store_id != null) {
        if (!Number.isInteger(Number(store_id)) || Number(store_id) <= 0) {
          throw err(ErrorCode.VALIDATION, '门店 ID 非法');
        }
        const store = db.prepare('SELECT id FROM stores WHERE id = ?').get(Number(store_id));
        if (!store) throw err(ErrorCode.VALIDATION, '门店不存在');
      }
      const info = db
        .prepare(
          `INSERT INTO admins (username, password_hash, name, role, store_id, enabled)
           VALUES (?, ?, ?, ?, ?, 1)`,
        )
        .run(username, hashPassword(password), name, role, role === 'staff' ? store_id ?? null : null);
      const row = db.prepare('SELECT * FROM admins WHERE id = ?').get(Number(info.lastInsertRowid)) as AdminRow;
      ok(reply, {
        id: row.id,
        username: row.username,
        name: row.name,
        role: row.role,
        storeId: row.store_id,
        enabled: row.enabled === 1,
      });
    },
  );

  // 编辑账号 / 重置密码 / 停用启用（仅管理员）
  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/api/admin/accounts/:id',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw err(ErrorCode.VALIDATION, '账号 ID 非法');
      }
      const db = getDb();
      const a = db.prepare('SELECT * FROM admins WHERE id = ?').get(id) as AdminRow | undefined;
      if (!a) throw err(ErrorCode.NOT_FOUND, '账号不存在', 404);
      const body = req.body ?? {};
      const { name, role, store_id, enabled, password } = body;
      if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
        throw err(ErrorCode.VALIDATION, '姓名非法');
      }
      if (role !== undefined && role !== 'admin' && role !== 'staff') {
        throw err(ErrorCode.VALIDATION, '角色非法');
      }
      if (password !== undefined && (typeof password !== 'string' || password.length < 6)) {
        throw err(ErrorCode.VALIDATION, '密码至少 6 位');
      }
      // store_id 类型与存在性校验
      if (store_id !== undefined && store_id !== null) {
        if (!Number.isInteger(Number(store_id)) || Number(store_id) <= 0) {
          throw err(ErrorCode.VALIDATION, '门店 ID 非法');
        }
        const storeExists = db.prepare('SELECT id FROM stores WHERE id = ?').get(Number(store_id));
        if (!storeExists) throw err(ErrorCode.STORE_NOT_FOUND, '门店不存在', 404);
      }
      const effectiveRole = role ?? a.role;
      // 店员必须分配门店
      if (effectiveRole === 'staff' && (store_id !== undefined || role !== undefined) && store_id == null) {
        throw err(ErrorCode.VALIDATION, '店员必须分配门店');
      }
      const effectiveStoreId =
        effectiveRole === 'staff' ? (store_id !== undefined ? store_id : a.store_id) : null;
      // enabled 仅接受布尔或 0/1，字符串 "false" 不当作停用
      const effectiveEnabled = enabled === undefined ? a.enabled : enabled === true || enabled === 1 ? 1 : 0;

      // 不能把唯一的管理员改成店员（之后系统没有管理员）
      if (a.role === 'admin' && effectiveRole === 'staff') {
        const otherAdmins = (
          db
            .prepare("SELECT COUNT(*) AS n FROM admins WHERE role = 'admin' AND enabled = 1 AND id != ?")
            .get(id) as { n: number }
        ).n;
        if (otherAdmins === 0) {
          throw err(ErrorCode.FORBIDDEN, '无权限：不能把唯一的管理员改成店员', 403);
        }
      }

      // 不能停用自己的账号
      if (a.id === req.user!.id && effectiveEnabled === 0) {
        throw err(ErrorCode.FORBIDDEN, '无权限：不能停用自己的账号', 403);
      }
      // 不能停用最后一个启用中的管理员
      if (a.role === 'admin' && effectiveEnabled === 0) {
        const otherAdmins = (
          db
            .prepare("SELECT COUNT(*) AS n FROM admins WHERE role = 'admin' AND enabled = 1 AND id != ?")
            .get(id) as { n: number }
        ).n;
        if (otherAdmins === 0) {
          throw err(ErrorCode.FORBIDDEN, '无权限：不能停用最后一个管理员', 403);
        }
      }

      const tx = db.transaction(() => {
        db.prepare(
          `UPDATE admins SET name = ?, role = ?, store_id = ?, enabled = ?, password_hash = ? WHERE id = ?`,
        ).run(
          name ?? a.name,
          effectiveRole,
          effectiveStoreId,
          effectiveEnabled,
          password ? hashPassword(password) : a.password_hash,
          id,
        );
        // 停用或重置密码时，使已有登录凭证失效
        if (effectiveEnabled === 0 || password) {
          db.prepare('DELETE FROM admin_tokens WHERE admin_id = ?').run(id);
        }
      });
      tx();
      const row = db.prepare('SELECT * FROM admins WHERE id = ?').get(id) as AdminRow;
      ok(reply, {
        id: row.id,
        username: row.username,
        name: row.name,
        role: row.role,
        storeId: row.store_id,
        enabled: row.enabled === 1,
      });
    },
  );

  // 编辑/停用优惠券模板（仅管理员）
  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/api/admin/coupon-templates/:id',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw err(ErrorCode.VALIDATION, '优惠券 ID 非法');
      }
      const db = getDb();
      const t = db
        .prepare('SELECT * FROM coupon_templates WHERE id = ?')
        .get(id) as TemplateRow | undefined;
      if (!t) throw err(ErrorCode.COUPON_NOT_FOUND, '优惠券不存在', 404);

      const body = req.body ?? {};
      const { name, type, threshold, discount_amount, discount_rate, valid_days, total_stock, enabled } = body;
      if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
        throw err(ErrorCode.VALIDATION, '名称非法');
      }
      const newType = type ?? t.type;
      if (type !== undefined && type !== 'full_reduction' && type !== 'discount') {
        throw err(ErrorCode.VALIDATION, '券类型非法');
      }
      const newThreshold = threshold ?? t.threshold;
      const newDiscountAmount = discount_amount !== undefined ? discount_amount : t.discount_amount;
      const newDiscountRate = discount_rate !== undefined ? discount_rate : t.discount_rate;
      const newValidDays = valid_days ?? t.valid_days;
      const newTotalStock = total_stock ?? t.total_stock;
      if (newType === 'full_reduction') {
        if (!Number.isInteger(Number(newThreshold)) || Number(newThreshold) <= 0) {
          throw err(ErrorCode.VALIDATION, '满减门槛非法');
        }
        if (!Number.isInteger(Number(newDiscountAmount)) || Number(newDiscountAmount) <= 0) {
          throw err(ErrorCode.VALIDATION, '满减金额非法');
        }
        if (Number(newDiscountAmount) >= Number(newThreshold)) {
          throw err(ErrorCode.VALIDATION, '满减金额不能大于等于门槛');
        }
      } else {
        if (!Number.isInteger(Number(newDiscountRate)) || Number(newDiscountRate) <= 0 || Number(newDiscountRate) >= 100) {
          throw err(ErrorCode.VALIDATION, '折扣率非法');
        }
      }
      if (!Number.isInteger(Number(newValidDays)) || Number(newValidDays) <= 0) {
        throw err(ErrorCode.VALIDATION, '有效期非法');
      }
      if (!Number.isInteger(Number(newTotalStock)) || Number(newTotalStock) < 0) {
        throw err(ErrorCode.VALIDATION, '库存非法');
      }
      db.prepare(
        `UPDATE coupon_templates SET name = ?, type = ?, threshold = ?, discount_amount = ?,
           discount_rate = ?, valid_days = ?, total_stock = ?, enabled = ? WHERE id = ?`,
      ).run(
        name ?? t.name,
        newType,
        newType === 'full_reduction' ? Number(newThreshold) : 0,
        newType === 'full_reduction' ? Number(newDiscountAmount) : null,
        newType === 'discount' ? Number(newDiscountRate) : null,
        Number(newValidDays),
        Number(newTotalStock),
        enabled === undefined ? t.enabled : enabled ? 1 : 0,
        id,
      );
      const row = db
        .prepare('SELECT * FROM coupon_templates WHERE id = ?')
        .get(id) as TemplateRow;
      ok(reply, templateView(row));
    },
  );

  // 活动列表（仅管理员）
  app.get(
    '/api/admin/promotions',
    { preHandler: [app.requireAdmin] },
    async (_req, reply) => {
      const db = getDb();
      const rows = db
        .prepare('SELECT * FROM promotions ORDER BY sort, id')
        .all() as PromotionRow[];
      ok(reply, rows.map(promotionView));
    },
  );

  // 创建活动（仅管理员）
  app.post<{ Body: Record<string, unknown> }>(
    '/api/admin/promotions',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const body = req.body ?? {};
      const name = body.name;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        throw err(ErrorCode.VALIDATION, '活动名称非法');
      }
      const startAt = parsePromoTime(body.start_at, '开始时间');
      const endAt = parsePromoTime(body.end_at, '结束时间');
      if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
        throw err(ErrorCode.VALIDATION, '结束时间必须晚于开始时间');
      }
      const productIds = parseProductIds(body.product_ids);
      const db = getDb();
      const maxSort = (
        db.prepare('SELECT COALESCE(MAX(sort), 0) AS m FROM promotions').get() as { m: number }
      ).m;
      const tx = db.transaction(() => {
        const info = db
          .prepare(
            `INSERT INTO promotions (name, type, start_at, end_at, enabled, sort)
             VALUES (?, 'second_cup_half', ?, ?, 1, ?)`,
          )
          .run(name.trim(), startAt, endAt, maxSort + 1);
        const promoId = Number(info.lastInsertRowid);
        const insertProduct = db.prepare(
          'INSERT OR IGNORE INTO promotion_products (promotion_id, product_id) VALUES (?, ?)',
        );
        for (const pid of productIds) insertProduct.run(promoId, pid);
        return promoId;
      });
      const promoId = tx();
      const row = db.prepare('SELECT * FROM promotions WHERE id = ?').get(promoId) as PromotionRow;
      ok(reply, promotionView(row));
    },
  );

  // 编辑活动（时间 / 适用商品 / 名称，仅管理员）
  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/api/admin/promotions/:id',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw err(ErrorCode.VALIDATION, '活动 ID 非法');
      }
      const db = getDb();
      const p = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id) as PromotionRow | undefined;
      if (!p) throw err(ErrorCode.NOT_FOUND, '活动不存在', 404);
      const body = req.body ?? {};
      const name = body.name !== undefined ? String(body.name).trim() : p.name;
      if (!name) throw err(ErrorCode.VALIDATION, '活动名称非法');
      const startAt =
        body.start_at !== undefined ? parsePromoTime(body.start_at, '开始时间') : p.start_at;
      const endAt =
        body.end_at !== undefined ? parsePromoTime(body.end_at, '结束时间') : p.end_at;
      if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
        throw err(ErrorCode.VALIDATION, '结束时间必须晚于开始时间');
      }
      // 适用商品：不传则保留原配置；传空数组表示清空
      const productIds =
        body.product_ids !== undefined ? parseProductIds(body.product_ids) : null;
      const tx = db.transaction(() => {
        db.prepare('UPDATE promotions SET name = ?, start_at = ?, end_at = ? WHERE id = ?').run(
          name,
          startAt,
          endAt,
          id,
        );
        if (productIds !== null) {
          db.prepare('DELETE FROM promotion_products WHERE promotion_id = ?').run(id);
          const insertProduct = db.prepare(
            'INSERT OR IGNORE INTO promotion_products (promotion_id, product_id) VALUES (?, ?)',
          );
          for (const pid of productIds) insertProduct.run(id, pid);
        }
      });
      tx();
      const row = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id) as PromotionRow;
      ok(reply, promotionView(row));
    },
  );

  // 停用/启用活动（仅管理员）
  app.post<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/api/admin/promotions/:id/toggle',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw err(ErrorCode.VALIDATION, '活动 ID 非法');
      }
      const db = getDb();
      const p = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id) as PromotionRow | undefined;
      if (!p) throw err(ErrorCode.NOT_FOUND, '活动不存在', 404);
      const enabled = p.enabled === 1 ? 0 : 1;
      db.prepare('UPDATE promotions SET enabled = ? WHERE id = ?').run(enabled, id);
      const row = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id) as PromotionRow;
      ok(reply, promotionView(row));
    },
  );
}

interface PromotionRow {
  id: number;
  name: string;
  type: string;
  start_at: string;
  end_at: string;
  enabled: number;
  sort: number;
}

function promotionView(p: PromotionRow) {
  const db = getDb();
  const productRows = db
    .prepare('SELECT product_id FROM promotion_products WHERE promotion_id = ? ORDER BY product_id')
    .all(p.id) as { product_id: number }[];
  const now = new Date();
  const active =
    p.enabled === 1 &&
    now.getTime() >= new Date(p.start_at).getTime() &&
    now.getTime() <= new Date(p.end_at).getTime();
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    startAt: p.start_at,
    endAt: p.end_at,
    enabled: p.enabled === 1,
    active,
    productIds: productRows.map((r) => r.product_id),
  };
}

/** 解析并校验活动时间（支持 YYYY-MM-DD 或完整 ISO8601）。 */
function parsePromoTime(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw err(ErrorCode.VALIDATION, `${label}非法`);
  }
  const normalized = value.includes('T') ? value : `${value}T00:00:00.000Z`;
  const t = new Date(normalized).getTime();
  if (Number.isNaN(t)) throw err(ErrorCode.VALIDATION, `${label}非法`);
  return new Date(t).toISOString();
}

/** 解析并校验适用商品 ID 列表。 */
function parseProductIds(value: unknown): number[] {
  if (!Array.isArray(value)) {
    throw err(ErrorCode.VALIDATION, '适用商品列表非法');
  }
  const db = getDb();
  const ids: number[] = [];
  for (const v of value) {
    const id = Number(v);
    if (!Number.isInteger(id) || id <= 0) {
      throw err(ErrorCode.VALIDATION, '适用商品 ID 非法');
    }
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(id) as { id: number } | undefined;
    if (!product) throw err(ErrorCode.NOT_FOUND, `商品 ${id} 不存在`, 404);
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}
