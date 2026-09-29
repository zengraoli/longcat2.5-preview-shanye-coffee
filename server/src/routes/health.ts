import type { FastifyInstance } from 'fastify';
import { ok } from '../lib/reply.js';

/** 健康检查：GET /health，返回统一响应格式。 */
export default async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_req, reply) => {
    ok(reply, {
      status: 'ok',
      service: 'shanye-coffee-server',
      time: new Date().toISOString(),
    });
  });
}
