import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { AppError, ErrorCode } from './lib/errors.js';
import { initDb } from './db/index.js';
import { registerAuth } from './plugins/auth.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import storeRoutes from './routes/stores.js';
import productRoutes from './routes/products.js';

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
    ajv: { customOptions: { coerceTypes: true } },
  });

  // 全局错误处理：任何错误都转为 {"code":..,"data":null,"message":".."}
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof AppError) {
      request.log.debug({ err: error }, '业务错误');
      return reply
        .status(error.statusCode)
        .send({ code: error.code, data: null, message: error.message });
    }
    // Fastify 参数校验错误
    if (error.validation) {
      return reply
        .status(400)
        .send({
          code: ErrorCode.VALIDATION,
          data: null,
          message: `参数错误：${error.message}`,
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
  await registerAuth(app);
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(storeRoutes);
  await app.register(productRoutes);

  return app;
}
