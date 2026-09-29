import type { FastifyReply } from 'fastify';

/** 统一成功响应：{"code":0,"data":...,"message":"ok"} */
export function ok<T>(reply: FastifyReply, data: T, message = 'ok') {
  return reply.send({ code: 0, data, message });
}

/** 统一错误响应：{"code":<非0>,"data":null,"message":"<中文原因>"} */
export function fail(
  reply: FastifyReply,
  code: number,
  message: string,
  statusCode = 400,
) {
  return reply.status(statusCode).send({ code, data: null, message });
}
