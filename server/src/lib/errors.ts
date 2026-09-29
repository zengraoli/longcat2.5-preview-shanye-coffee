/**
 * 统一错误码。完整登记见 server/docs/errors.md。
 * 约定：1xxx 通用，2xxx 认证，3xxx 门店商品，4xxx 优惠券，5xxx 订单，6xxx 积分会员。
 */
export const ErrorCode = {
  // 通用
  INTERNAL: 1000,
  VALIDATION: 1001,
  NOT_FOUND: 1002,
  UNAUTHORIZED: 1003,
  FORBIDDEN: 1004,
  CONFLICT: 1005,
  // 认证
  PHONE_INVALID: 2001,
  MEMBER_CODE_INVALID: 2002,
  ADMIN_CREDENTIALS_INVALID: 2003,
  TOKEN_EXPIRED: 2004,
  // 门店与商品
  STORE_NOT_FOUND: 3001,
  STORE_CLOSED: 3005,
  PRODUCT_NOT_FOUND: 3002,
  PRODUCT_OFF_SHELF: 3003,
  PRODUCT_SOLD_OUT: 3004,
  // 优惠券
  COUPON_NOT_FOUND: 4001,
  COUPON_ALREADY_CLAIMED: 4002,
  COUPON_EXPIRED: 4003,
  COUPON_NOT_USABLE: 4004,
  // 订单
  ORDER_NOT_FOUND: 5001,
  COUPON_NOT_OWNED: 5005,
  ORDER_STATE_INVALID: 5002,
  ORDER_STORE_MISMATCH: 5003,
  ORDER_ITEMS_INVALID: 5004,
  // 积分会员
  MEMBER_NOT_FOUND: 6001,
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/** 业务错误：携带错误码与 HTTP 状态码，由全局错误处理器转为统一响应格式。 */
export class AppError extends Error {
  readonly code: number;
  readonly statusCode: number;

  constructor(code: number, message: string, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function err(
  code: number,
  message: string,
  statusCode = 400,
): AppError {
  return new AppError(code, message, statusCode);
}
