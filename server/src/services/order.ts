/**
 * 订单纯函数服务：金额明细计算、状态流转校验。
 * 不依赖数据库，便于单元测试。
 */

export interface OrderItemInput {
  /** 单价（含规格加价，分） */
  price: number;
  quantity: number;
}

export interface OrderAmount {
  /** 原价（分） */
  originalAmount: number;
  /** 优惠（分） */
  discountAmount: number;
  /** 实付（分） */
  payableAmount: number;
}

/**
 * 计算订单金额明细：
 * - 原价 = Σ(单价 × 数量)
 * - 优惠 = min(优惠, 原价)，不为负
 * - 实付 = 原价 - 优惠
 */
export function computeOrderAmount(items: OrderItemInput[], discount: number): OrderAmount {
  const originalAmount = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const discountAmount = Math.min(Math.max(discount, 0), originalAmount);
  const payableAmount = originalAmount - discountAmount;
  return { originalAmount, discountAmount, payableAmount };
}

export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'making',
  'ready',
  'completed',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** 制作推进流转：已支付 → 制作中 → 待取餐 → 已完成。 */
const ADVANCE_FLOW: Record<string, OrderStatus> = {
  paid: 'making',
  making: 'ready',
  ready: 'completed',
};

/** 校验制作推进流转是否合法。 */
export function canAdvance(from: OrderStatus, to: OrderStatus): boolean {
  return ADVANCE_FLOW[from] === to;
}

/** 判断是否为支付前状态（可取消）。 */
export function isBeforePayment(status: OrderStatus): boolean {
  return status === 'pending_payment';
}
