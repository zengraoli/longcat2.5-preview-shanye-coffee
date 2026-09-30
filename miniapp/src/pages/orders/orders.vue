<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { api } from '../../lib/api';
import { getSession } from '../../lib/auth';
import { formatBeijing, formatYuan } from '../../lib/utils';
import { STATUS_TEXT } from '../../lib/orderStatus';
import type { Order } from '../../lib/types';

const orders = ref<Order[]>([]);
const loading = ref(true);
const isLoggedIn = ref<boolean>(!!getSession());

function loadOrders() {
  loading.value = true;
  return api
    .get<Order[]>('/api/orders')
    .then((list) => {
      orders.value = list;
    })
    .catch(() => {
      orders.value = [];
    })
    .finally(() => {
      loading.value = false;
    });
}

onMounted(() => {
  isLoggedIn.value = !!getSession();
  if (isLoggedIn.value) loadOrders();
  else loading.value = false;
});

// 从订单详情返回时刷新列表
onShow(() => {
  isLoggedIn.value = !!getSession();
  if (isLoggedIn.value) loadOrders();
});

// 下拉刷新：后台推进状态后，小程序刷新可见最新状态
onPullDownRefresh(() => {
  loadOrders().finally(() => {
    uni.stopPullDownRefresh();
  });
});

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${id}` });
}

function goOrder() {
  uni.switchTab({ url: '/pages/order/order' });
}

function goProfile() {
  uni.switchTab({ url: '/pages/profile/profile' });
}

/** 状态标签样式：取消为红，完成为绿，其余为焦糖 */
function statusClass(status: string): string {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'completed') return 'completed';
  return 'pending';
}
</script>

<template>
  <view class="page">
    <view v-if="!isLoggedIn" class="tip">
      <text class="tip-text">登录后查看我的订单</text>
      <text class="tip-action" @tap="goProfile">去登录</text>
    </view>
    <view v-else-if="loading" class="tip">
      <text class="tip-text">加载中…</text>
    </view>
    <view v-else-if="orders.length === 0" class="tip">
      <text class="tip-text">暂无订单</text>
      <text class="tip-action" @tap="goOrder">去点单</text>
    </view>

    <view
      v-for="o in orders"
      :key="o.id"
      class="order-card"
      @tap="goDetail(o.id)"
    >
      <view class="order-head">
        <text class="order-no">{{ o.orderNo }}</text>
        <text class="order-status" :class="statusClass(o.status)">
          {{ STATUS_TEXT[o.status] }}
        </text>
      </view>
      <view class="order-items">
        <text class="order-items-text">
          {{ o.items.map((it) => `${it.productName}×${it.quantity}`).join('、') }}
        </text>
      </view>
      <view class="order-foot">
        <text class="order-time">{{ formatBeijing(o.createdAt) }}</text>
        <text class="order-amount">{{ formatYuan(o.payableAmount) }}</text>
      </view>
    </view>
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
  padding: 160rpx 0;
  text-align: center;
}
.tip-text {
  display: block;
  font-size: 28rpx;
  color: #8a968d;
}
.tip-action {
  display: inline-block;
  margin-top: 32rpx;
  background: $brand-600;
  color: #fff;
  font-size: 28rpx;
  padding: 20rpx 56rpx;
  border-radius: 999rpx;
}

.order-card {
  background: #fff;
  border-radius: 20rpx;
  border: 2rpx solid $brand-100;
  padding: 24rpx 28rpx;
  margin-bottom: 20rpx;
}
.order-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.order-no {
  font-size: 24rpx;
  color: #8a968d;
}
.order-status {
  font-size: 24rpx;
  font-weight: 600;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  &.pending {
    color: $caramel-600;
    background: #faf0e3;
  }
  &.completed {
    color: $brand-600;
    background: $brand-50;
  }
  &.cancelled {
    color: #b0483e;
    background: #f9ecea;
  }
}
.order-items {
  margin-top: 16rpx;
}
.order-items-text {
  font-size: 26rpx;
  color: $brand-900;
  line-height: 1.5;
}
.order-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 2rpx solid $cream-100;
}
.order-time {
  font-size: 22rpx;
  color: #8a968d;
}
.order-amount {
  font-size: 32rpx;
  font-weight: 700;
  color: $brand-900;
}
</style>
