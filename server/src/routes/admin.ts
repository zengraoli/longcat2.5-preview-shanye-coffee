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
      if (status !== undefined && status !== 'open' && status !== 'closed') {
        throw err(ErrorCode.VALIDATION, '营业状态非法');
      }
      db.prepare(
        `UPDATE stores SET name = ?, address = ?, phone = ?, open_time = ?, close_time = ?, status = ?
         WHERE id = ?`,
      ).run(
        name ?? store.name,
        address ?? store.address,
        phone !== undefined ? phone : store.phone,
        open_time ?? store.open_time,
        close_time ?? store.close_time,
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
        isOpen: updated.status === 'open',
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
        orders,
        coupons,
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

  // 创建优惠券模板（仅管理员）
  app.post<{ Body: Record<string, unknown> }>(
    '/api/admin/coupon-templates',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      const body = req.body ?? {};
      const name = body.name;
      const type = body.type;
      if (!name || typeof name !== 'string') {
        throw err(ErrorCode.VALIDATION, '名称非法');
      }
      if (type !== 'full_reduction' && type !== 'discount') {
        throw err(ErrorCode.VALIDATION, '券类型非法');
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
          name,
          type,
          type === 'full_reduction' ? Number(body.threshold) : 0,
          type === 'full_reduction' ? Number(body.discount_amount) : null,
          type === 'discount' ? Number(body.discount_rate) : null,
          Number(body.valid_days) || 30,
          Number(body.total_stock) || 0,
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
      if (!username || typeof username !== 'string') {
        throw err(ErrorCode.VALIDATION, '账号非法');
      }
      if (!password || typeof password !== 'string' || password.length < 6) {
        throw err(ErrorCode.VALIDATION, '密码至少 6 位');
      }
      if (!name || typeof name !== 'string') {
        throw err(ErrorCode.VALIDATION, '姓名非法');
      }
      if (role !== 'admin' && role !== 'staff') {
        throw err(ErrorCode.VALIDATION, '角色非法');
      }
      const db = getDb();
      const exists = db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
      if (exists) throw err(ErrorCode.CONFLICT, '账号已存在', 409);
      if (role === 'staff' && store_id != null) {
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
      if (role !== undefined && role !== 'admin' && role !== 'staff') {
        throw err(ErrorCode.VALIDATION, '角色非法');
      }
      if (password !== undefined && (typeof password !== 'string' || password.length < 6)) {
        throw err(ErrorCode.VALIDATION, '密码至少 6 位');
      }
      db.prepare(
        `UPDATE admins SET name = ?, role = ?, store_id = ?, enabled = ?, password_hash = ? WHERE id = ?`,
      ).run(
        name ?? a.name,
        role ?? a.role,
        role === 'staff' ? store_id ?? a.store_id : null,
        enabled === undefined ? a.enabled : enabled ? 1 : 0,
        password ? hashPassword(password) : a.password_hash,
        id,
      );
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

      const { name, type, threshold, discount_amount, discount_rate, valid_days, enabled } =
        req.body ?? {};
      if (type !== undefined && type !== 'full_reduction' && type !== 'discount') {
        throw err(ErrorCode.VALIDATION, '券类型非法');
      }
      db.prepare(
        `UPDATE coupon_templates SET name = ?, type = ?, threshold = ?, discount_amount = ?,
           discount_rate = ?, valid_days = ?, enabled = ? WHERE id = ?`,
      ).run(
        name ?? t.name,
        type ?? t.type,
        threshold ?? t.threshold,
        discount_amount !== undefined ? discount_amount : t.discount_amount,
        discount_rate !== undefined ? discount_rate : t.discount_rate,
        valid_days ?? t.valid_days,
        enabled === undefined ? t.enabled : enabled ? 1 : 0,
        id,
      );
      const row = db
        .prepare('SELECT * FROM coupon_templates WHERE id = ?')
        .get(id) as TemplateRow;
      ok(reply, templateView(row));
    },
  );
}
