<template>
  <view class="checkout-page">
    <view class="section">
      <text class="section-title">取餐方式</text>
      <view class="type-options">
        <view :class="['type-opt', { active: orderType === 'pickup' }]" @tap="orderType = 'pickup'">自提</view>
        <view :class="['type-opt', { active: orderType === 'dine_in' }]" @tap="orderType = 'dine_in'">堂食</view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">商品明细</text>
      <view class="item-list">
        <view v-for="(item, idx) in cartItems" :key="idx" class="item-row">
          <text class="item-name">{{ item.productName }}</text>
          <text class="item-spec">{{ item.cupSize === 'medium' ? '中杯' : '大杯' }} · {{ item.temperature === 'hot' ? '热' : '冰' }} · {{ item.sugar === 'standard' ? '标准' : item.sugar === 'less' ? '少糖' : '无糖' }}</text>
          <view class="item-right">
            <text class="item-qty">x{{ item.quantity }}</text>
            <text class="item-price">{{ formatYuan(item.unitPrice * item.quantity) }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">优惠券</text>
      <view class="coupon-row" @tap="loadBestCoupon">
        <text v-if="bestCoupon" class="coupon-text">
          已选：{{ bestCoupon.name }}（{{ bestCoupon.type === 'fixed' ? formatYuan(bestCoupon.discount) : bestCoupon.discount + '%' }}）
        </text>
        <text v-else class="coupon-text placeholder">点击获取最优券</text>
        <text class="coupon-arrow">></text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">金额明细</text>
      <view class="amount-list">
        <view class="amount-row">
          <text>原价</text>
          <text>{{ formatYuan(originalAmount) }}</text>
        </view>
        <view v-if="promoDiscount > 0" class="amount-row">
          <text>第二杯半价</text>
          <text class="discount">-{{ formatYuan(promoDiscount) }}</text>
        </view>
        <view v-if="couponDiscount > 0" class="amount-row">
          <text>优惠券</text>
          <text class="discount">-{{ formatYuan(couponDiscount) }}</text>
        </view>
        <view class="amount-row total">
          <text>实付</text>
          <text class="total-price">{{ formatYuan(paidAmount) }}</text>
        </view>
      </view>
    </view>

    <view class="footer-bar">
      <view class="footer-info">
        <text class="footer-label">实付</text>
        <view>
          <text class="footer-price">{{ formatYuan(paidAmount) }}</text>
          <text v-if="totalDiscount > 0" class="footer-discount">已优惠 {{ formatYuan(totalDiscount) }}</text>
        </view>
      </view>
      <view class="footer-btn" :class="{ disabled: submitting }" @tap="submitOrder">
        {{ submitting ? '提交中...' : '模拟支付' }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { request, formatYuan } from '@/utils/request'
import { calcPromoDiscount } from '@/utils/promo'

interface CartItem { productId: number; productName: string; cupSize: string; temperature: string; sugar: string; quantity: number; unitPrice: number }
interface BestCoupon { userCouponId: number; couponId: number; name: string; type: string; threshold: number; discount: number }

const cartItems = ref<CartItem[]>([])
const orderType = ref<'pickup' | 'dine_in'>('pickup')
const bestCoupon = ref<BestCoupon | null>(null)
const promoProductIds = ref<number[]>([])
const submitting = ref(false)

const storeId = ref(1)

const originalAmount = computed(() => cartItems.value.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0))
const promoDiscount = computed(() => calcPromoDiscount(cartItems.value, promoProductIds.value))
const amountAfterPromo = computed(() => originalAmount.value - promoDiscount.value)
const couponDiscount = computed(() => {
  if (!bestCoupon.value) return 0
  const c = bestCoupon.value
  if (amountAfterPromo.value < c.threshold) return 0
  if (c.type === 'fixed') return Math.min(c.discount, amountAfterPromo.value)
  return Math.min(Math.floor((amountAfterPromo.value * c.discount) / 100), amountAfterPromo.value)
})
const totalDiscount = computed(() => promoDiscount.value + couponDiscount.value)
const paidAmount = computed(() => amountAfterPromo.value - couponDiscount.value)

onLoad((options: any) => {
  if (options?.cart) {
    try { cartItems.value = JSON.parse(decodeURIComponent(options.cart)) } catch {}
  }
  loadActivePromo()
  loadBestCoupon()
})

async function loadActivePromo() {
  try {
    const promo = await request<{ productIds: number[] } | null>('/promotions/active')
    promoProductIds.value = promo?.productIds ?? []
  } catch {}
}

async function loadBestCoupon() {
  if (amountAfterPromo.value <= 0) return
  try {
    const res = await request<BestCoupon | null>('/coupons/best', {
      method: 'POST',
      body: JSON.stringify({ amount: amountAfterPromo.value }),
    })
    bestCoupon.value = res
  } catch {}
}

async function submitOrder() {
  if (submitting.value) return
  submitting.value = true
  try {
    const order = await request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify({
        storeId: storeId.value,
        type: orderType.value,
        items: cartItems.value.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          cupSize: i.cupSize,
          temperature: i.temperature,
          sugar: i.sugar,
        })),
        userCouponId: bestCoupon.value?.userCouponId ?? null,
      }),
    })
    const paid = await request<any>(`/orders/${order.id}/pay`, { method: 'POST' })
    uni.showToast({ title: '支付成功', icon: 'success' })
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/order-detail/index?orderId=' + order.id })
    }, 1000)
  } catch {} finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.checkout-page {
  min-height: 100vh;
  background: #FDF8F3;
  padding-bottom: 120rpx;
}

.section {
  background: #FFFFFF;
  margin: 16rpx 24rpx;
  border-radius: 16rpx;
  padding: 24rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #2C1810;
  margin-bottom: 16rpx;
}

.type-options {
  display: flex;
  gap: 16rpx;
}

.type-opt {
  flex: 1;
  text-align: center;
  padding: 16rpx;
  border: 1rpx solid #E8DDD4;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #6B5B4F;
}

.type-opt.active {
  border-color: #8B4513;
  color: #8B4513;
  background: #FDF8F3;
  font-weight: 600;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.item-row {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.item-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #2C1810;
}

.item-spec {
  font-size: 20rpx;
  color: #6B5B4F;
}

.item-right {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-qty {
  font-size: 22rpx;
  color: #6B5B4F;
}

.item-price {
  font-size: 26rpx;
  font-weight: 600;
  color: #2C1810;
}

.coupon-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx;
  background: #FDF8F3;
  border-radius: 12rpx;
}

.coupon-text {
  font-size: 26rpx;
  color: #8B4513;
}

.coupon-text.placeholder {
  color: #6B5B4F;
}

.coupon-arrow {
  font-size: 28rpx;
  color: #6B5B4F;
}

.amount-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 26rpx;
  color: #6B5B4F;
}

.amount-row .discount {
  color: #C0392B;
}

.amount-row.total {
  font-size: 30rpx;
  font-weight: 700;
  color: #2C1810;
  padding-top: 12rpx;
  border-top: 1rpx solid #E8DDD4;
}

.total-price {
  color: #8B4513;
  font-size: 36rpx;
}

.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  background: #FFFFFF;
  border-top: 1rpx solid #E8DDD4;
}

.footer-info {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.footer-label {
  font-size: 26rpx;
  color: #6B5B4F;
}

.footer-price {
  font-size: 40rpx;
  font-weight: 700;
  color: #8B4513;
}

.footer-discount {
  display: block;
  font-size: 20rpx;
  color: #C05F2E;
  margin-top: 2rpx;
}

.footer-btn {
  padding: 16rpx 48rpx;
  background: #8B4513;
  color: white;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.footer-btn.disabled {
  opacity: 0.6;
}
</style>
