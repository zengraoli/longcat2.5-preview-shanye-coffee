import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { err, ErrorCode } from '../lib/errors.js';
import { findAdminByToken, findMemberByToken } from '../lib/tokens.js';

export interface AuthUser {
  type: 'member' | 'admin';
  id: number;
  role?: 'admin' | 'staff';
  storeId?: number | null;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
  interface FastifyInstance {
    /** 校验 Bearer token，成功则挂载 req.user；失败抛出统一格式错误。 */
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** 校验 token 且必须为管理员，否则 403。 */
    requireAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** 校验 token 且必须为管理员或店员，否则 403。 */
    requireAdminOrStaff: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** 按 ID 取会员券并计算优惠金额；券不存在/过期/不满足条件时抛统一错误。 */
    computeCouponDiscount: (couponId: number, originalAmount: number) => {
      coupon: { id: number; status: string };
      template: { id: number; name: string; type: string };
      discount: number;
    };
  }
}

function bearerToken(req: FastifyRequest): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

/** 注册鉴权装饰器：authenticate / requireAdmin。 */
export async function registerAuth(app: FastifyInstance) {
  app.decorate('authenticate', async (req: FastifyRequest, _reply: FastifyReply) => {
    const token = bearerToken(req);
    if (!token) {
      throw err(ErrorCode.UNAUTHORIZED, '未登录', 401);
    }
    const member = findMemberByToken(token);
    if (member) {
      req.user = { type: 'member', id: member.id };
      return;
    }
    const admin = findAdminByToken(token);
    if (admin) {
      req.user = {
        type: 'admin',
        id: admin.id,
        role: admin.role,
        storeId: admin.store_id,
      };
      return;
    }
    throw err(ErrorCode.UNAUTHORIZED, '登录已失效，请重新登录', 401);
  });

  app.decorate('requireAdmin', async (req: FastifyRequest, _reply: FastifyReply) => {
    await app.authenticate(req, _reply);
    const user = req.user;
    if (!user || user.type !== 'admin' || user.role !== 'admin') {
      throw err(ErrorCode.FORBIDDEN, '无权限：仅管理员可访问', 403);
    }
  });

  app.decorate('requireAdminOrStaff', async (req: FastifyRequest, _reply: FastifyReply) => {
    await app.authenticate(req, _reply);
    const user = req.user;
    if (!user || user.type !== 'admin') {
      throw err(ErrorCode.FORBIDDEN, '无权限：仅管理员或店员可访问', 403);
    }
  });
}
