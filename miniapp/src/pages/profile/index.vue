<template>
  <view class="profile-page">
    <view v-if="member" class="member-card">
      <view class="card-bg" />
      <view class="card-content">
        <view class="card-left">
          <text class="card-phone">{{ member.phone }}</text>
          <text :class="['card-level', levelClass]">{{ level }}</text>
        </view>
        <view class="card-right">
          <text class="card-points">{{ member.points }}</text>
          <text class="card-points-label">积分</text>
        </view>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: `${progress}%` }" />
      </view>
      <view class="progress-text">
        <text v-if="level === '银卡'">再积 {{ 500 - member.points }} 分升级金卡</text>
        <text v-else-if="level === '金卡'">再积 {{ 2000 - member.points }} 分升级黑卡</text>
        <text v-else>已达最高等级</text>
      </view>
    </view>

    <view v-else class="login-tap" @tap="goLogin">
      <text>点击登录</text>
    </view>

    <view v-if="member" class="menu-list">
      <view class="menu-item" @tap="goOrders">
        <text class="menu-text">我的订单</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @tap="showCoupons = true">
        <text class="menu-text">我的优惠券</text>
        <text class="menu-badge">{{ coupons.length }}</text>
      </view>
      <view class="menu-item" @tap="goStores">
        <text class="menu-text">门店查询</text>
        <text class="menu-arrow">></text>
      </view>
    </view>

    <view v-if="showCoupons" class="coupon-mask" @tap="showCoupons = false">
      <view class="coupon-panel" @tap.stop>
        <view class="coupon-header">
          <text class="coupon-title">我的优惠券</text>
          <text class="coupon-close" @tap="showCoupons = false">×</text>
        </view>
        <view v-if="coupons.length === 0" class="coupon-empty">暂无优惠券</view>
        <view v-else class="coupon-list">
          <view v-for="c in coupons" :key="c.id" class="coupon-item">
            <view class="coupon-left">
              <text class="coupon-name">{{ c.name }}</text>
              <text class="coupon-expire">有效期至 {{ c.validTo.slice(0, 10) }}</text>
            </view>
            <view class="coupon-right">
              <text class="coupon-discount">{{ c.type === 'fixed' ? formatYuan(c.discount) : c.discount + '%' }}</text>
              <text class="coupon-threshold">满{{ formatYuan(c.threshold) }}可用</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { request, formatYuan, getMemberToken } from '@/utils/request'
import type { MemberInfo, Coupon } from '@/types'

const member = ref<MemberInfo | null>(null)
const coupons = ref<Coupon[]>([])
const showCoupons = ref(false)

const level = computed(() => {
  if (!member.value) return '银卡'
  if (member.value.points >= 2000) return '黑卡'
  if (member.value.points >= 500) return '金卡'
  return '银卡'
})

const levelClass = computed(() => level.value.toLowerCase())

const progress = computed(() => {
  if (!member.value) return 0
  const pts = member.value.points
  if (pts >= 2000) return 100
  if (pts >= 500) return Math.round(((pts - 500) / 1500) * 100)
  return Math.round((pts / 500) * 100)
})

async function loadProfile() {
  if (!getMemberToken()) return
  try {
    const [m, c] = await Promise.all([
      request<MemberInfo>('/member/me'),
      request<Coupon[]>('/my/coupons'),
    ])
    member.value = m
    coupons.value = c.filter((x) => x.validTo > new Date().toISOString())
  } catch {}
}

loadProfile()

function goLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}

function goOrders() {
  uni.navigateTo({ url: '/pages/order-detail/index' })
}

function goStores() {
  uni.navigateTo({ url: '/pages/stores/index' })
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #FDF8F3;
  padding: 24rpx;
}

.member-card {
  position: relative;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 32rpx;
  background: #2C1810;
  color: white;
}

.card-bg {
  position: absolute;
  top: -50%;
  right: -30%;
  width: 400rpx;
  height: 400rpx;
  border-radius: 50%;
  background: #8B4513;
  opacity: 0.5;
}

.card-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 32rpx 32rpx;
}

.card-phone {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.card-level {
  display: inline-block;
  font-size: 20rpx;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.2);
}

.card-level.金卡 { background: #E65100; }
.card-level.黑卡 { background: #D4A574; color: #2C1810; }

.card-right {
  text-align: right;
}

.card-points {
  display: block;
  font-size: 48rpx;
  font-weight: 900;
}

.card-points-label {
  font-size: 22rpx;
  opacity: 0.8;
}

.progress-bar {
  position: relative;
  height: 6rpx;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 32rpx 16rpx;
  border-radius: 999rpx;
}

.progress-fill {
  height: 100%;
  background: #D4A574;
  border-radius: 999rpx;
}

.progress-text {
  position: relative;
  padding: 0 32rpx 32rpx;
  font-size: 22rpx;
  opacity: 0.8;
}

.login-tap {
  text-align: center;
  padding: 80rpx;
  background: #FFFFFF;
  border-radius: 20rpx;
  color: #8B4513;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 32rpx;
}

.menu-list {
  background: #FFFFFF;
  border-radius: 16rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #E8DDD4;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-text {
  font-size: 28rpx;
  color: #2C1810;
}

.menu-arrow {
  font-size: 32rpx;
  color: #6B5B4F;
}

.menu-badge {
  background: #C0392B;
  color: white;
  font-size: 20rpx;
  min-width: 32rpx;
  height: 32rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

.coupon-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.coupon-panel {
  width: 100%;
  background: #FFFFFF;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx;
  max-height: 70vh;
}

.coupon-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.coupon-title {
  font-size: 32rpx;
  font-weight: 700;
}

.coupon-close {
  font-size: 40rpx;
  color: #6B5B4F;
  padding: 0 8rpx;
}

.coupon-empty {
  text-align: center;
  padding: 60rpx 0;
  color: #6B5B4F;
}

.coupon-list {
  overflow-y: auto;
}

.coupon-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  border-bottom: 1rpx solid #E8DDD4;
}

.coupon-name {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
}

.coupon-expire {
  display: block;
  font-size: 20rpx;
  color: #6B5B4F;
  margin-top: 4rpx;
}

.coupon-right {
  text-align: right;
}

.coupon-discount {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #8B4513;
}

.coupon-threshold {
  display: block;
  font-size: 20rpx;
  color: #6B5B4F;
}
</style>
