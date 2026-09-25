<template>
  <view class="stores-page">
    <view class="store-list">
      <view v-for="store in stores" :key="store.id" class="store-item">
        <view class="store-name">{{ store.name }}</view>
        <view class="store-addr">{{ store.address }}</view>
        <view class="store-meta">
          <text class="store-hours">{{ store.openTime }} - {{ store.closeTime }}</text>
          <text :class="['store-status', store.status]">
            {{ store.status === 'open' ? '营业中' : '休息中' }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { request } from '@/utils/request'

interface Store { id: number; name: string; address: string; openTime: string; closeTime: string; status: string }

const stores = ref<Store[]>([])

async function loadStores() {
  try { stores.value = await request<Store[]>('/stores') } catch {}
}

loadStores()
</script>

<style scoped>
.stores-page {
  min-height: 100vh;
  background: #FDF8F3;
  padding: 24rpx;
}

.store-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.store-item {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  border: 1rpx solid #E8DDD4;
}

.store-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #2C1810;
  margin-bottom: 8rpx;
}

.store-addr {
  font-size: 24rpx;
  color: #6B5B4F;
  margin-bottom: 12rpx;
}

.store-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.store-hours {
  font-size: 22rpx;
  color: #6B5B4F;
}

.store-status {
  font-size: 20rpx;
  padding: 2rpx 12rpx;
  border-radius: 999rpx;
}

.store-status.open { background: #E8F5E9; color: #2E7D32; }
.store-status.closed { background: #FFEBEE; color: #C62828; }
</style>
