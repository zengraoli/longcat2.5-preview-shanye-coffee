import Fastify from 'fastify';
import { buildApp } from './app.js';

const app = Fastify({ logger: true });

try {
  await buildApp(app);
  await app.listen({ port: 3300, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    await app.close();
    process.exit(0);
  });
}
