import type { FastifyInstance } from 'fastify';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function docsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/docs', async (_request, reply) => {
    const html = await readFile(path.join(__dirname, 'docs', 'openapi.html'), 'utf-8');
    reply.type('text/html; charset=utf-8').send(html);
  });
}
