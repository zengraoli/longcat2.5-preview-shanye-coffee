import type { FastifyError, FastifyInstance } from 'fastify';
import { AppError, errorMessage } from './errors.js';
import { fail } from './reply.js';
import healthRoutes from './routes/health.js';

export async function buildApp(app: FastifyInstance): Promise<FastifyInstance> {
  app.setErrorHandler((error: unknown, request, reply) => {
    if (error instanceof AppError) {
      fail(reply, error.statusCode, error.code, error.message);
      return;
    }
    const err = error as FastifyError;
    if (err.statusCode && err.statusCode < 500) {
      fail(reply, err.statusCode, 1001, err.message || errorMessage(1001));
      return;
    }
    request.log.error(err);
    fail(reply, 500, 9999, errorMessage(9999));
  });

  app.setNotFoundHandler((request, reply) => {
    fail(reply, 404, 1005, errorMessage(1005));
  });

  await app.register(healthRoutes);

  return app;
}
