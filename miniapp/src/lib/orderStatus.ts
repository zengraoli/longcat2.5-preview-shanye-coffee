/**
 * 订单状态流转与文案。
 * 制作推进：待支付 → 已支付 → 制作中 → 待取餐 → 已完成；取消为终态。
 */

export const ORDER_STATUS_FLOW = [
  'pending_payment',
  'paid',
  'making',
  'ready',
  'completed',
] as const;

export type OrderStatus = (typeof ORDER_STATUS_FLOW)[number] | 'cancelled';

export const STATUS_TEXT: Record<OrderStatus, string> = {
  pending_payment: '待支付',
  paid: '已支付',
  making: '制作中',
  ready: '待取餐',
  completed: '已完成',
  cancelled: '已取消',
};

/** 状态在进度条上的位置（-1 表示取消等终态） */
export function statusIndex(status: string): number {
  return ORDER_STATUS_FLOW.indexOf(status as (typeof ORDER_STATUS_FLOW)[number]);
}

/** 进度条步骤数 */
export const STATUS_STEPS = ORDER_STATUS_FLOW.length;
