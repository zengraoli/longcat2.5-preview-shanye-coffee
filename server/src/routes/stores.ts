import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { err, ErrorCode } from '../lib/errors.js';
import { ok } from '../lib/reply.js';

/** 按北京时间计算门店当前是否营业（status 为 open 时按时间判断）。 */
function isOpenNow(status: string, openTime: string, closeTime: string): boolean {
  if (status !== 'open') return false;
  const now = new Date(Date.now() + 8 * 3600 * 1000);
  const cur = now.getUTCHours() * 60 + now.getUTCMinutes();
  const parse = (t: string): number => {
    const [h, m] = t.split(':');
    return Number(h) * 60 + Number(m);
  };
  const open = parse(openTime);
  const close = parse(closeTime);
  if (close >= open) return cur >= open && cur < close;
  return cur >= open || cur < close;
}

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

/** 门店路由：列表与详情（公开接口）。 */
export default async function storeRoutes(app: FastifyInstance) {
  app.get(
    '/api/stores',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              code: { type: 'integer' },
              message: { type: 'string' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    address: { type: 'string' },
                    phone: { type: 'string' },
                    openTime: { type: 'string' },
                    closeTime: { type: 'string' },
                    status: { type: 'string' },
                    isOpen: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (_req, reply) => {
    const rows = getDb()
      .prepare('SELECT * FROM stores ORDER BY sort, id')
      .all() as StoreRow[];
    ok(
      reply,
      rows.map((s) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        phone: s.phone,
        openTime: s.open_time,
        closeTime: s.close_time,
        status: s.status,
        isOpen: isOpenNow(s.status, s.open_time, s.close_time),
      })),
    );
  });

  app.get<{ Params: { id: string } }>(
    '/api/stores/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
      },
    },
    async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw err(ErrorCode.VALIDATION, '门店 ID 非法');
    }
    const s = getDb().prepare('SELECT * FROM stores WHERE id = ?').get(id) as StoreRow | undefined;
    if (!s) throw err(ErrorCode.STORE_NOT_FOUND, '门店不存在', 404);
    ok(reply, {
      id: s.id,
      name: s.name,
      address: s.address,
      phone: s.phone,
      openTime: s.open_time,
      closeTime: s.close_time,
      status: s.status,
      isOpen: isOpenNow(s.status, s.open_time, s.close_time),
    });
  });
}
