export interface Store {
  id: number
  name: string
  address: string
  phone: string
  openTime: string
  closeTime: string
  status: 'open' | 'closed'
}

export interface Product {
  id: number
  categoryId: number
  name: string
  description: string
  price: number
  soldOut: boolean
}

export interface Category {
  id: number
  name: string
  sort_order: number
}

export interface ActivePromotion {
  id: number
  name: string
  startTime: string
  endTime: string
  productIds: number[]
  products: Product[]}

export interface Coupon {
  id: number
  userCouponId: number
  name: string
  type: 'fixed' | 'percent'
  threshold: number
  discount: number
  validFrom: string
  validTo: string
}

export interface Order {
  id: number
  order_no: string
  pickup_code: string
  type: string
  status: string
  original_amount: number
  discount_amount: number
  paid_amount: number
  created_at: string
  store_name: string
}

export interface MemberInfo {
  id: number
  phone: string
  points: number
}
