import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { AppError, ErrorCode } from './lib/errors.js';
import { initDb } from './db/index.js';
import { registerAuth } from './plugins/auth.js';
import { registerCouponDecorator } from './plugins/coupon.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import storeRoutes from './routes/stores.js';
import productRoutes from './routes/products.js';
import couponRoutes from './routes/coupons.js';
import orderRoutes from './routes/orders.js';
import statsRoutes from './routes/stats.js';
import adminRoutes from './routes/admin.js';

export interface BuildAppOptions {
  /** 数据库文件路径，默认取 config.dbFile；测试可传 :memory: */
  dbFile?: string;
  /** 是否打印日志，测试时关闭 */
  logger?: boolean;
}

/**
 * 构建 Fastify 应用：注册全局错误处理、统一响应格式、路由。
 * 每个任务阶段在此追加路由注册。
 */
export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
    // 关闭类型强制转换：客户端应发送正确的 JSON 类型，避免 true 被当成 1 等
    ajv: { customOptions: { coerceTypes: false } },
    // 限制请求体大小，防止过大 body
    bodyLimit: 1024 * 1024,
  });

  // 全局错误处理：任何错误都转为 {"code":..,"data":null,"message":".."}
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof AppError) {
      request.log.debug({ err: error }, '业务错误');
      return reply
        .status(error.statusCode)
        .send({ code: error.code, data: null, message: error.message });
    }
    // Fastify 参数校验 / 解析错误（400/413/415 等）
    if (error.validation || error.statusCode) {
      const status = error.statusCode && error.statusCode < 500 ? error.statusCode : 400;
      request.log.debug({ err: error }, '请求错误');
      return reply.status(status).send({
        code: ErrorCode.VALIDATION,
        data: null,
        message: error.message || '请求错误',
      });
    }
    request.log.error({ err: error }, '未处理异常');
    return reply
      .status(500)
      .send({ code: ErrorCode.INTERNAL, data: null, message: '服务器内部错误' });
  });

  // 未匹配路由
  app.setNotFoundHandler((request, reply) => {
    reply
      .status(404)
      .send({ code: ErrorCode.NOT_FOUND, data: null, message: '接口不存在' });
  });

  // 初始化数据库（建表 + 种子数据由 db 层负责）
  await initDb(options.dbFile ?? 'data/app.db');

  // 注意：registerAuth 必须以普通函数调用（而非 app.register），
  // 否则装饰器只作用于封装子上下文，后续路由无法继承。
  // OpenAPI 文档页（/docs）
  await app.register(swagger, {
    openapi: {
      info: {
        title: '山野咖啡点单平台 API',
        version: '0.7.0',
        description: '会员、门店、商品、优惠券、订单、积分等接口文档。',
      },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  await registerAuth(app);
  await registerCouponDecorator(app);
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(storeRoutes);
  await app.register(productRoutes);
  await app.register(couponRoutes);
  await app.register(orderRoutes);
  await app.register(statsRoutes);
  await app.register(adminRoutes);

  return app;
}
