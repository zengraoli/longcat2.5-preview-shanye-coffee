import type { FastifyReply } from 'fastify';

export function ok<T>(reply: FastifyReply, data: T): void {
  reply.send({ code: 0, data, message: 'ok' });
}

export function fail(
  reply: FastifyReply,
  statusCode: number,
  code: number,
  message: string,
): void {
  reply.status(statusCode).send({ code, data: null, message });
}
