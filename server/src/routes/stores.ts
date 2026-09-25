import type { FastifyInstance } from 'fastify';
import { getDb } from '../db.js';
import { AppError, ErrorCode } from '../errors.js';
import { ok } from '../reply.js';
import { maskPhone } from '../utils/format.js';

function isStoreOpen(openTime: string, closeTime: string): boolean {
  const now = new Date();
  const bj = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const currentMinutes = bj.getUTCHours() * 60 + bj.getUTCMinutes();
  const [oh, om] = openTime.split(':').map(Number);
  const [ch, cm] = closeTime.split(':').map(Number);
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

export default async function storeRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/stores', async (_request, reply) => {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM stores ORDER BY id').all() as Array<{
      id: number; name: string; address: string; phone: string;
      open_time: string; close_time: string; status: string;
    }>;
    ok(reply, rows.map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      phone: maskPhone(s.phone),
      openTime: s.open_time,
      closeTime: s.close_time,
      status: s.status === 'open' && isStoreOpen(s.open_time, s.close_time) ? 'open' : 'closed',
    })));
  });

  app.get('/api/stores/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();
    const s = db.prepare('SELECT * FROM stores WHERE id = ?').get(Number(id)) as
      | { id: number; name: string; address: string; phone: string; open_time: string; close_time: string; status: string }
      | undefined;
    if (!s) throw new AppError(ErrorCode.NOT_FOUND, '门店不存在', 404);
    ok(reply, {
      id: s.id,
      name: s.name,
      address: s.address,
      phone: maskPhone(s.phone),
      openTime: s.open_time,
      closeTime: s.close_time,
      status: s.status === 'open' && isStoreOpen(s.open_time, s.close_time) ? 'open' : 'closed',
    });
  });
}
