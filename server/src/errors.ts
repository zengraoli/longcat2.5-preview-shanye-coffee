export const ErrorCode = {
  VALIDATION_FAILED: 1001,
  UNAUTHORIZED: 1002,
  TOKEN_EXPIRED: 1003,
  FORBIDDEN: 1004,
  NOT_FOUND: 1005,
  ALREADY_EXISTS: 1006,
  INVALID_ORDER_STATUS: 2001,
  PRODUCT_OFF_SHELF: 2002,
  PRODUCT_SOLD_OUT: 2003,
  COUPON_EXPIRED: 3001,
  COUPON_ALREADY_CLAIMED: 3002,
  COUPON_NOT_USABLE: 3003,
  ORDER_NOT_PAYABLE: 4001,
  INTERNAL_ERROR: 9999,
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export class AppError extends Error {
  code: ErrorCodeValue;
  statusCode: number;

  constructor(code: ErrorCodeValue, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function errorMessage(code: ErrorCodeValue): string {
  const messages: Record<ErrorCodeValue, string> = {
    [ErrorCode.VALIDATION_FAILED]: '参数校验失败',
    [ErrorCode.UNAUTHORIZED]: '未登录或登录已过期',
    [ErrorCode.TOKEN_EXPIRED]: '登录已过期，请重新登录',
    [ErrorCode.FORBIDDEN]: '没有权限执行此操作',
    [ErrorCode.NOT_FOUND]: '资源不存在',
    [ErrorCode.ALREADY_EXISTS]: '数据已存在',
    [ErrorCode.INVALID_ORDER_STATUS]: '非法的订单状态流转',
    [ErrorCode.PRODUCT_OFF_SHELF]: '商品已下架',
    [ErrorCode.PRODUCT_SOLD_OUT]: '商品已售罄',
    [ErrorCode.COUPON_EXPIRED]: '优惠券已过期',
    [ErrorCode.COUPON_ALREADY_CLAIMED]: '优惠券已领取',
    [ErrorCode.COUPON_NOT_USABLE]: '优惠券不满足使用条件',
    [ErrorCode.ORDER_NOT_PAYABLE]: '订单当前状态不可支付',
    [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
  };
  return messages[code] ?? '未知错误';
}
