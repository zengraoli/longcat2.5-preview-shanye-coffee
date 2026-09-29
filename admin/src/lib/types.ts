/** 后台账号角色 */
export type Role = 'admin' | 'staff';

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  role: Role;
  storeId: number | null;
}

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

export interface Product {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  status: 'on' | 'off';
  soldOut: boolean;
}

export interface ProductSpec {
  cup: 'medium' | 'large';
  temperature: 'ice' | 'hot';
  sugar: 'none' | 'less' | 'standard';
  priceAdjust: number;
}

export interface ProductDetail extends Product {
  specs: ProductSpec[];
}

export interface Category {
  id: number;
  name: string;
}

export interface CouponTemplate {
  id: number;
  name: string;
  type: 'full_reduction' | 'discount';
  threshold: number;
  discountAmount: number | null;
  discountRate: number | null;
  validDays: number;
  totalStock: number;
  enabled: boolean;
}

export interface Member {
  id: number;
  phone: string;
  nickname: string | null;
  points: number;
  level: string;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
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
  couponId: number | null;
  remark: string | null;
  createdAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  items: OrderItem[];
  memberPhone?: string | null;
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  avgOrderAmount: number;
  newMembers: number;
  trend7d: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  recentOrders: Order[];
}
