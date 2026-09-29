import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { config } from '../config.js';
import { err, ErrorCode } from '../lib/errors.js';
import { hashPassword } from '../db/seed.js';
import { issueAdminToken, issueMemberToken } from '../lib/tokens.js';
import { ok } from '../lib/reply.js';

const PHONE_RE = /^1\d{10}$/;

interface MemberLoginBody {
  phone?: string;
  code?: string;
}

interface AdminLoginBody {
  username?: string;
  password?: string;
}

/** 认证路由：会员验证码登录、后台账号登录、当前身份查询。 */
export default async function authRoutes(app: FastifyInstance) {
  // 会员登录：手机号 + 验证码（固定 123456，模拟短信）
  app.post<{ Body: MemberLoginBody }>(
    '/api/member/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['phone', 'code'],
          properties: {
            phone: { type: 'string' },
            code: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const { phone, code } = req.body ?? {};
      if (!phone || !PHONE_RE.test(phone)) {
        throw err(ErrorCode.PHONE_INVALID, '手机号格式错误');
      }
      if (code !== config.memberCode) {
        throw err(ErrorCode.MEMBER_CODE_INVALID, '验证码错误');
      }
      const db = getDb();
      let member = db
        .prepare('SELECT id, phone, nickname, points FROM members WHERE phone = ?')
        .get(phone) as { id: number; phone: string; nickname: string | null; points: number } | undefined;
      if (!member) {
        const nickname = `山野会员${phone.slice(-4)}`;
        const info = db
          .prepare('INSERT INTO members (phone, nickname, points, created_at) VALUES (?, ?, 0, ?)')
          .run(phone, nickname, new Date().toISOString());
        member = {
          id: Number(info.lastInsertRowid),
          phone,
          nickname,
          points: 0,
        };
      }
      const token = issueMemberToken(member.id);
      ok(reply, {
        token,
        member: {
          id: member.id,
          phone: member.phone,
          nickname: member.nickname,
          points: member.points,
        },
      });
    },
  );

  // 后台登录：账号 + 密码
  app.post<{ Body: AdminLoginBody }>(
    '/api/admin/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const { username, password } = req.body ?? {};
      if (!username || !password) {
        throw err(ErrorCode.ADMIN_CREDENTIALS_INVALID, '账号或密码错误');
      }
      const admin = getDb()
        .prepare('SELECT id, username, name, role, store_id, password_hash FROM admins WHERE username = ?')
        .get(username) as
        | {
            id: number;
            username: string;
            name: string;
            role: 'admin' | 'staff';
            store_id: number | null;
            password_hash: string;
          }
        | undefined;
      if (!admin || admin.password_hash !== hashPassword(password)) {
        throw err(ErrorCode.ADMIN_CREDENTIALS_INVALID, '账号或密码错误');
      }
      const token = issueAdminToken(admin.id);
      ok(reply, {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          role: admin.role,
          storeId: admin.store_id,
        },
      });
    },
  );

  // 当前会员信息
  app.get(
    '/api/member/me',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      if (req.user?.type !== 'member') {
        throw err(ErrorCode.FORBIDDEN, '无权限', 403);
      }
      const member = getDb()
        .prepare('SELECT id, phone, nickname, points FROM members WHERE id = ?')
        .get(req.user.id) as
        | { id: number; phone: string; nickname: string | null; points: number }
        | undefined;
      if (!member) throw err(ErrorCode.MEMBER_NOT_FOUND, '会员不存在', 404);
      ok(reply, {
        id: member.id,
        phone: member.phone,
        nickname: member.nickname,
        points: member.points,
      });
    },
  );

  // 管理员专属探针：验证角色校验（店员访问返回 403）
  app.get(
    '/api/admin/only-admin',
    { preHandler: [app.requireAdmin] },
    async (req, reply) => {
      ok(reply, { id: req.user!.id, role: req.user!.role });
    },
  );

  // 当前后台身份
  app.get(
    '/api/admin/me',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      if (req.user?.type !== 'admin') {
        throw err(ErrorCode.FORBIDDEN, '无权限', 403);
      }
      const admin = getDb()
        .prepare('SELECT id, username, name, role, store_id FROM admins WHERE id = ?')
        .get(req.user.id) as
        | { id: number; username: string; name: string; role: 'admin' | 'staff'; store_id: number | null }
        | undefined;
      if (!admin) throw err(ErrorCode.NOT_FOUND, '账号不存在', 404);
      ok(reply, {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        storeId: admin.store_id,
      });
    },
  );
}
