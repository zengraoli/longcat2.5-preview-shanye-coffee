<template>
  <view class="order-detail-page">
    <view v-if="order" class="detail-card">
      <view class="pickup-section">
        <text class="pickup-label">取餐码</text>
        <text class="pickup-code">{{ order.pickup_code }}</text>
        <text class="order-no">{{ order.order_no }}</text>
      </view>

      <view class="progress-section">
        <view
          v-for="(step, idx) in steps"
          :key="idx"
          :class="['progress-step', { active: currentStep >= idx, done: currentStep > idx }]"
        >
          <view class="step-dot">{{ idx + 1 }}</view>
          <text class="step-label">{{ step }}</text>
          <view v-if="idx < steps.length - 1" class="step-line" />
        </view>
      </view>

      <view class="info-section">
        <view class="info-row">
          <text class="info-label">门店</text>
          <text class="info-value">{{ order.store_name }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">类型</text>
          <text class="info-value">{{ order.type === 'pickup' ? '自提' : '堂食' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">金额</text>
          <text class="info-value">{{ formatYuan(order.paid_amount) }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">下单时间</text>
          <text class="info-value">{{ formatTime(order.created_at) }}</text>
        </view>
        <view v-if="order.paid_at" class="info-row">
          <text class="info-label">支付时间</text>
          <text class="info-value">{{ formatTime(order.paid_at) }}</text>
        </view>
      </view>
    </view>

    <view class="list-section">
      <view class="list-header">
        <text class="list-title">我的订单</text>
        <text class="list-refresh" @tap="loadOrders">刷新</text>
      </view>

      <view v-if="orders.length === 0" class="empty">暂无订单</view>

      <view
        v-for="item in orders"
        :key="item.id"
        class="order-item"
        @tap="viewDetail(item.id)"
      >
        <view class="order-top">
          <text class="order-name">{{ item.order_no }}</text>
          <text :class="['order-status', item.status]">{{ statusLabel(item.status) }}</text>
        </view>
        <view class="order-bottom">
          <text class="order-store">{{ item.store_name }}</text>
          <text class="order-amount">{{ formatYuan(item.paid_amount) }}</text>
        </view>
        <text class="order-time">{{ formatTime(item.created_at) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { request, formatYuan, formatTime } from '@/utils/request'

interface Order {
  id: number
  order_no: string
  pickup_code: string
  type: string
  status: string
  paid_amount: number
  created_at: string
  paid_at: string | null
  store_name: string
}

const order = ref<Order | null>(null)
const orders = ref<Order[]>([])

const steps = ['已支付', '制作中', '待取餐', '已完成']

const currentStep = computed(() => {
  if (!order.value) return 0
  const map: Record<string, number> = { paid: 0, making: 1, ready: 2, completed: 3, pending: -1, cancelled: -1 }
  return map[order.value.status] ?? 0
})

function statusLabel(s: string): string {
  const map: Record<string, string> = { pending: '待支付', paid: '已支付', making: '制作中', ready: '待取餐', completed: '已完成', cancelled: '已取消' }
  return map[s] || s
}

function viewDetail(id: number) {
  const item = orders.value.find((o) => o.id === id)
  if (item) {
    order.value = item
  }
  uni.pageScrollTo({ scrollTop: 0 })
}

async function loadOrders() {
  try {
    orders.value = await request<Order[]>('/orders')
    if (!order.value && orders.value.length > 0) {
      order.value = orders.value[0]
    }
  } catch {}
}

onLoad((options: any) => {
  loadOrders()
  if (options?.orderId) {
    setTimeout(() => {
      const item = orders.value.find((o) => o.id === Number(options.orderId))
      if (item) order.value = item
    }, 300)
  }
})
</script>

<style scoped>
.order-detail-page {
  min-height: 100vh;
  background: #FDF8F3;
}

.detail-card {
  background: #FFFFFF;
  margin: 24rpx;
  border-radius: 16rpx;
  padding: 32rpx;
}

.pickup-section {
  text-align: center;
  padding-bottom: 32rpx;
  border-bottom: 1rpx solid #E8DDD4;
  margin-bottom: 32rpx;
}

.pickup-label {
  display: block;
  font-size: 24rpx;
  color: #6B5B4F;
  margin-bottom: 8rpx;
}

.pickup-code {
  display: block;
  font-size: 72rpx;
  font-weight: 900;
  color: #8B4513;
  letter-spacing: 8rpx;
}

.order-no {
  display: block;
  font-size: 20rpx;
  color: #6B5B4F;
  margin-top: 8rpx;
}

.progress-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 32rpx;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

.step-dot {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #E8DDD4;
  color: #6B5B4F;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.progress-step.active .step-dot {
  background: #8B4513;
  color: white;
}

.progress-step.done .step-dot {
  background: #4A7C59;
  color: white;
}

.step-label {
  font-size: 20rpx;
  color: #6B5B4F;
}

.step-line {
  position: absolute;
  top: 24rpx;
  left: 50%;
  width: 100%;
  height: 2rpx;
  background: #E8DDD4;
}

.progress-step:last-child .step-line {
  display: none;
}

.info-section {
  border-top: 1rpx solid #E8DDD4;
  padding-top: 24rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
}

.info-label {
  font-size: 26rpx;
  color: #6B5B4F;
}

.info-value {
  font-size: 26rpx;
  color: #2C1810;
  font-weight: 500;
}

.list-section {
  padding: 0 24rpx 40rpx;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.list-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #2C1810;
}

.list-refresh {
  font-size: 24rpx;
  color: #8B4513;
}

.empty {
  text-align: center;
  padding: 60rpx 0;
  color: #6B5B4F;
}

.order-item {
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 12rpx;
  border: 1rpx solid #E8DDD4;
}

.order-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.order-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #2C1810;
}

.order-status {
  font-size: 20rpx;
  padding: 2rpx 12rpx;
  border-radius: 999rpx;
}

.order-status.paid { background: #E3F2FD; color: #1565C0; }
.order-status.making { background: #FFF3E0; color: #E65100; }
.order-status.ready { background: #E8F5E9; color: #2E7D32; }
.order-status.completed { background: #F5F5F5; color: #616161; }
.order-status.cancelled { background: #FFEBEE; color: #C62828; }

.order-bottom {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4rpx;
}

.order-store {
  font-size: 22rpx;
  color: #6B5B4F;
}

.order-amount {
  font-size: 26rpx;
  font-weight: 700;
  color: #8B4513;
}

.order-time {
  font-size: 20rpx;
  color: #6B5B4F;
}
</style>
