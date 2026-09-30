export interface Store {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  openTime: string;
  closeTime: string;
  status: 'open' | 'closed';
  isOpen: boolean;
}

export interface Category {
  id: number;
  name: string;
}

export interface ProductSpec {
  cup: 'medium' | 'large';
  temperature: 'ice' | 'hot';
  sugar: 'none' | 'less' | 'standard';
  priceAdjust: number;
}

export interface Product {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  soldOut: boolean;
  specs: ProductSpec[];
}

export type MemberLevel = 'silver' | 'gold' | 'black';

export interface Member {
  id: number;
  phone: string;
  nickname: string | null;
  points: number;
  level: {
    level: MemberLevel;
    name: string;
    points: number;
    /** 下一等级；已达最高等级时为 null */
    nextLevel: MemberLevel | null;
    /** 距下一等级还差的分数；已达最高等级时为 null */
    pointsToNext: number | null;
  };
}

export interface OrderItem {
  id: number;
  productName: string;
  cup: string | null;
  temperature: string | null;
  sugar: string | null;
  price: number;
  quantity: number;
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'making'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: number;
  orderNo: string;
  storeId: number;
  type: 'pickup' | 'dine_in';
  status: OrderStatus;
  pickupCode: string | null;
  originalAmount: number;
  discountAmount: number;
  payableAmount: number;
  remark: string | null;
  createdAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  items: OrderItem[];
}

export interface Coupon {
  id: number;
  templateId: number;
  name: string;
  type: 'full_reduction' | 'discount';
  threshold: number;
  discountAmount: number | null;
  discountRate: number | null;
  status: string;
  expiresAt: string;
  usable: boolean;
}
