<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onPullDownRefresh } from '@dcloudio/uni-app';
import { api, ApiError } from '../../lib/api';
import { formatBeijing, formatYuan, specText } from '../../lib/utils';
import { ORDER_STATUS_FLOW, STATUS_TEXT, statusIndex } from '../../lib/orderStatus';
import type { Order } from '../../lib/types';

const order = ref<Order | null>(null);
const loading = ref(true);
const acting = ref(false);

const orderId = ref(0);

function loadDetail() {
  loading.value = true;
  return api
    .get<Order>(`/api/orders/${orderId.value}`)
    .then((o) => {
      order.value = o;
    })
    .catch(() => {
      order.value = null;
    })
    .finally(() => {
      loading.value = false;
    });
}

onMounted(() => {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1] as { options?: { id?: string } };
  const id = Number(current?.options?.id);
  if (Number.isInteger(id) && id > 0) {
    orderId.value = id;
    loadDetail();
  } else {
    loading.value = false;
  }
});

const idx = computed(() => (order.value ? statusIndex(order.value.status) : -1));
const cancelled = computed(() => order.value?.status === 'cancelled');
const canPay = computed(() => order.value?.status === 'pending_payment');
const canCancel = computed(() => order.value?.status === 'pending_payment');

async function pay() {
  const target = order.value;
  if (!target || acting.value) return;
  acting.value = true;
  try {
    order.value = await api.post<Order>(`/api/orders/${target.id}/pay`);
    uni.showToast({ title: '支付成功', icon: 'success' });
  } catch (e) {
    uni.showToast({ title: e instanceof ApiError ? e.message : '支付失败', icon: 'none' });
  } finally {
    acting.value = false;
  }
}

async function cancel() {
  const target = order.value;
  if (!target || acting.value) return;
  uni.showModal({
    title: '取消订单',
    content: '确定要取消该订单吗？',
    success: async (res) => {
      if (!res.confirm) return;
      acting.value = true;
      try {
        order.value = await api.post<Order>(`/api/orders/${target.id}/cancel`);
        uni.showToast({ title: '订单已取消', icon: 'none' });
      } catch (e) {
        uni.showToast({ title: e instanceof ApiError ? e.message : '取消失败', icon: 'none' });
      } finally {
        acting.value = false;
      }
    },
  });
}

// 下拉刷新：重新拉取订单详情，后台推进状态后可见最新状态
onPullDownRefresh(() => {
  loadDetail().finally(() => {
    uni.stopPullDownRefresh();
  });
});
</script>

<template>
  <view class="page">
    <view v-if="loading" class="tip">
      <text class="tip-text">加载中…</text>
    </view>
    <view v-else-if="!order" class="tip">
      <text class="tip-text">订单不存在或已失效</text>
    </view>

    <block v-else>
      <!-- 取餐码 -->
      <view v-if="order.type === 'pickup' && order.pickupCode" class="pickup-code">
        <text class="pickup-label">取餐码</text>
        <text class="pickup-value">{{ order.pickupCode }}</text>
        <text class="pickup-hint">到店出示此码取餐</text>
      </view>

      <!-- 状态进度条 -->
      <view class="card">
        <view class="status-head">
          <text class="status-text" :class="{ cancelled: cancelled }">
            {{ STATUS_TEXT[order.status] }}
          </text>
          <text class="status-time">{{ formatBeijing(order.createdAt) }}</text>
        </view>
        <view v-if="!cancelled" class="progress">
          <view
            v-for="(s, i) in ORDER_STATUS_FLOW"
            :key="s"
            class="progress-step"
            :class="{ active: i <= idx, current: i === idx }"
          >
            <view class="progress-dot" />
            <text class="progress-label">{{ STATUS_TEXT[s] }}</text>
          </view>
        </view>
        <view v-else class="cancelled-tip">
          <text class="cancelled-text">订单已取消</text>
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="card">
        <view class="info-row">
          <text class="info-label">订单号</text>
          <text class="info-value">{{ order.orderNo }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">取餐方式</text>
          <text class="info-value">{{ order.type === 'pickup' ? '自提' : '堂食' }}</text>
        </view>
        <view v-if="order.remark" class="info-row">
          <text class="info-label">备注</text>
          <text class="info-value">{{ order.remark }}</text>
        </view>
      </view>

      <!-- 商品清单 -->
      <view class="card">
        <text class="card-title">商品清单</text>
        <view v-for="item in order.items" :key="item.id" class="order-item">
          <view class="order-item-info">
            <text class="order-item-name">{{ item.productName }}</text>
            <text class="order-item-spec">{{ specText(item) }}</text>
          </view>
          <view class="order-item-right">
            <text class="order-item-price">{{ formatYuan(item.price) }}</text>
            <text class="order-item-qty">×{{ item.quantity }}</text>
          </view>
        </view>
      </view>

      <!-- 金额明细 -->
      <view class="card">
        <view class="amount-row">
          <text class="amount-label">商品原价</text>
          <text class="amount-value">{{ formatYuan(order.originalAmount) }}</text>
        </view>
        <view v-if="order.promoDiscountAmount > 0" class="amount-row">
          <text class="amount-label">活动优惠</text>
          <text class="amount-value discount">-{{ formatYuan(order.promoDiscountAmount) }}</text>
        </view>
        <view class="amount-row">
          <text class="amount-label">优惠券优惠</text>
          <text class="amount-value discount">-{{ formatYuan(order.discountAmount) }}</text>
        </view>
        <view class="amount-row total">
          <text class="amount-label">实付</text>
          <text class="amount-value payable">{{ formatYuan(order.payableAmount) }}</text>
        </view>
        <text v-if="order.paidAt" class="paid-time">
          支付时间 {{ formatBeijing(order.paidAt) }}
        </text>
      </view>

      <!-- 操作按钮 -->
      <view class="actions">
        <text v-if="canCancel" class="btn btn-outline" @tap="cancel">取消订单</text>
        <text v-if="canPay" class="btn btn-primary" :class="{ disabled: acting }" @tap="pay">
          {{ acting ? '支付中…' : `去支付 ${formatYuan(order.payableAmount)}` }}
        </text>
      </view>
    </block>
  </view>
</template>

<style lang="scss" scoped>
@import '../../uni.scss';

.page {
  min-height: 100vh;
  background: $cream-50;
  padding: 20rpx 24rpx 60rpx;
}
.tip {
  padding: 200rpx 0;
  text-align: center;
}
.tip-text {
  font-size: 28rpx;
  color: #8a968d;
}

/* 取餐码 */
.pickup-code {
  background: $brand-600;
  border-radius: 20rpx;
  padding: 32rpx;
  text-align: center;
  margin-bottom: 20rpx;
}
.pickup-label {
  display: block;
  font-size: 24rpx;
  color: $cream-200;
}
.pickup-value {
  display: block;
  font-size: 72rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: 8rpx;
  margin: 12rpx 0;
}
.pickup-hint {
  display: block;
  font-size: 22rpx;
  color: $cream-200;
}

.card {
  background: #fff;
  border-radius: 20rpx;
  border: 2rpx solid $brand-100;
  padding: 24rpx 28rpx;
  margin-bottom: 20rpx;
}
.card-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: $brand-900;
  margin-bottom: 16rpx;
}

/* 状态进度条 */
.status-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28rpx;
}
.status-text {
  font-size: 32rpx;
  font-weight: 700;
  color: $brand-600;
  &.cancelled {
    color: #b0483e;
  }
}
.status-time {
  font-size: 22rpx;
  color: #8a968d;
}
.progress {
  display: flex;
}
.progress-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    top: 14rpx;
    left: -50%;
    width: 100%;
    height: 4rpx;
    background: $cream-100;
  }
  &:first-child::before {
    display: none;
  }
  &.active::before {
    background: $brand-500;
  }
}
.progress-dot {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: $cream-100;
  border: 4rpx solid $cream-100;
  margin-bottom: 12rpx;
  position: relative;
  z-index: 1;
}
.progress-step.active .progress-dot {
  background: $brand-500;
  border-color: $brand-500;
}
.progress-step.current .progress-dot {
  background: $brand-600;
  border-color: $brand-600;
  box-shadow: 0 0 0 6rpx $brand-100;
}
.progress-label {
  font-size: 20rpx;
  color: #8a968d;
}
.progress-step.active .progress-label {
  color: $brand-700;
}
.cancelled-tip {
  padding: 12rpx 0;
}
.cancelled-text {
  font-size: 26rpx;
  color: #b0483e;
}

/* 订单信息 */
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
}
.info-label {
  font-size: 26rpx;
  color: #5c6b60;
}
.info-value {
  font-size: 26rpx;
  color: $brand-900;
}

/* 商品清单 */
.order-item {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 2rpx solid $cream-100;
  &:last-child {
    border-bottom: none;
  }
}
.order-item-info {
  flex: 1;
}
.order-item-name {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: $brand-900;
}
.order-item-spec {
  display: block;
  font-size: 22rpx;
  color: #8a968d;
  margin-top: 4rpx;
}
.order-item-right {
  text-align: right;
  margin-left: 16rpx;
}
.order-item-price {
  display: block;
  font-size: 26rpx;
  color: $brand-900;
}
.order-item-qty {
  display: block;
  font-size: 22rpx;
  color: #8a968d;
  margin-top: 4rpx;
}

/* 金额明细 */
.amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
  &.total {
    border-top: 2rpx solid $cream-100;
    margin-top: 8rpx;
    padding-top: 20rpx;
  }
}
.amount-label {
  font-size: 26rpx;
  color: #5c6b60;
}
.amount-value {
  font-size: 26rpx;
  color: $brand-900;
  &.discount {
    color: $caramel-600;
  }
  &.payable {
    font-size: 34rpx;
    font-weight: 700;
  }
}
.paid-time {
  display: block;
  font-size: 22rpx;
  color: #8a968d;
  margin-top: 8rpx;
}

/* 操作按钮 */
.actions {
  display: flex;
  gap: 20rpx;
  margin-top: 12rpx;
}
.btn {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  border-radius: 999rpx;
  font-size: 30rpx;
  font-weight: 600;
}
.btn-primary {
  background: $brand-600;
  color: #fff;
  &.disabled {
    background: #6b7280;
  }
}
.btn-outline {
  background: #fff;
  color: $brand-700;
  border: 2rpx solid $brand-200;
}
</style>
