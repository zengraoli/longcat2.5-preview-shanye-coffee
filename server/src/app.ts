import type { FastifyError, FastifyInstance } from 'fastify';
import { AppError, errorMessage } from './errors.js';
import { fail } from './reply.js';
import { seedIfEmpty } from './seed.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import memberRoutes from './routes/member.js';
import storeRoutes from './routes/stores.js';
import productRoutes from './routes/products.js';
import couponRoutes from './routes/coupons.js';
import orderRoutes from './routes/orders.js';
import docsRoutes from './routes/docs.js';
import dashboardRoutes from './routes/dashboard.js';
import adminManageRoutes from './routes/admin-manage.js';

export async function buildApp(app: FastifyInstance): Promise<FastifyInstance> {
  seedIfEmpty();

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
  await app.register(authRoutes);
  await app.register(memberRoutes);
  await app.register(storeRoutes);
  await app.register(productRoutes);
  await app.register(couponRoutes);
  await app.register(orderRoutes);
  await app.register(docsRoutes);
  await app.register(dashboardRoutes);
  await app.register(adminManageRoutes);

  return app;
}
