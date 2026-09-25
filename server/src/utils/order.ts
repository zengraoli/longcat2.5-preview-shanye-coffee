export type OrderStatus = 'pending' | 'paid' | 'making' | 'ready' | 'completed' | 'cancelled';

const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['making', 'cancelled'],
  making: ['ready'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from]?.includes(to) ?? false;
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`非法的订单状态流转: ${from} -> ${to}`);
  }
}
