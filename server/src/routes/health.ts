import type { FastifyInstance } from 'fastify';
import { ok } from '../reply.js';

export default async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_request, reply) => {
    ok(reply, { status: 'ok', uptime: process.uptime() });
  });
}
