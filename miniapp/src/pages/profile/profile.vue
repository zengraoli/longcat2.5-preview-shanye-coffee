<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api } from '../../lib/api';
import { clearSession, getSession, saveSession } from '../../lib/auth';
import { formatBeijing, levelProgress, maskPhone } from '../../lib/utils';
import type { Coupon, Member } from '../../lib/types';

/* ---------- 登录 ---------- */
const phone = ref('');
const code = ref('');
const loggingIn = ref(false);

async function login() {
  if (!/^1\d{10}$/.test(phone.value)) {
    uni.showToast({ title: '手机号格式错误', icon: 'none' });
    return;
  }
  if (!code.value) {
    uni.showToast({ title: '请输入验证码', icon: 'none' });
    return;
  }
  loggingIn.value = true;
  try {
    const res = await api.post<{ token: string; member: Member }>('/api/member/login', {
      phone: phone.value,
      code: code.value,
    });
    saveSession(res.token, res.member);
    isLoggedIn.value = true;
    loadMember();
    loadCoupons();
    uni.showToast({ title: '登录成功', icon: 'success' });
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '登录失败', icon: 'none' });
  } finally {
    loggingIn.value = false;
  }
}

function logout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    success: (res) => {
      if (!res.confirm) return;
      clearSession();
      member.value = null;
      coupons.value = [];
      isLoggedIn.value = false;
      uni.showToast({ title: '已退出', icon: 'none' });
    },
  });
}

/* ---------- 会员信息 ---------- */
const member = ref<Member | null>(null);
const coupons = ref<Coupon[]>([]);
const loadingMember = ref(false);
/** 响应式登录状态：登录/退出后立即更新视图 */
const isLoggedIn = ref<boolean>(!!getSession());

async function loadMember() {
  const session = getSession();
  if (!session) {
    member.value = null;
    return;
  }
  loadingMember.value = true;
  try {
    member.value = await api.get<Member>('/api/member/me');
  } catch {
    clearSession();
    member.value = null;
  } finally {
    loadingMember.value = false;
  }
}

async function loadCoupons() {
  const session = getSession();
  if (!session) {
    coupons.value = [];
    return;
  }
  try {
    coupons.value = await api.get<Coupon[]>('/api/member/coupons');
  } catch {
    coupons.value = [];
  }
}

onMounted(() => {
  loadMember();
  loadCoupons();
});

// 从其他页面返回时刷新（如支付后积分变化）
onShow(() => {
  if (getSession()) {
    loadMember();
    loadCoupons();
  }
});

const maskedPhone = computed(() => (member.value ? maskPhone(member.value.phone) : ''));
const displayName = computed(() => member.value?.nickname ?? maskedPhone.value);
const progress = computed(() =>
  member.value ? levelProgress(member.value.points, member.value.level.level) : 0,
);

const usableCoupons = computed(() => coupons.value.filter((c) => c.usable));
const usedCoupons = computed(() => coupons.value.filter((c) => !c.usable));

function couponStatusText(c: Coupon): string {
  if (c.status === 'used') return '已使用';
  if (c.status === 'expired') return '已过期';
  return '可使用';
}

function couponStatusClass(c: Coupon): string {
  if (c.status === 'used') return 'used';
  if (c.status === 'expired') return 'expired';
  return 'usable';
}

function goOrders() {
  uni.switchTab({ url: '/pages/orders/orders' });
}
</script>

<template>
  <view class="page">
    <!-- 未登录 -->
    <view v-if="!isLoggedIn" class="login-panel">
      <text class="login-title">登录会员</text>
      <text class="login-sub">手机号 + 验证码登录，首次登录自动注册</text>
      <input
        v-model="phone"
        class="login-input"
        type="number"
        maxlength="11"
        placeholder="请输入手机号"
      />
      <input
        v-model="code"
        class="login-input"
        type="number"
        maxlength="6"
        placeholder="验证码（测试固定 123456）"
      />
      <text class="login-btn" :class="{ disabled: loggingIn }" @tap="login">
        {{ loggingIn ? '登录中…' : '登录' }}
      </text>
    </view>

    <block v-else>
      <!-- 会员卡 -->
      <view class="member-card" :class="member?.level.level">
        <view class="member-card-top">
          <view>
            <text class="member-name">{{ displayName }}</text>
            <text class="member-phone">{{ maskedPhone }}</text>
          </view>
          <text class="level-badge">{{ member?.level.name }}</text>
        </view>
        <view class="points-row">
          <text class="points-value">{{ member?.points ?? 0 }}</text>
          <text class="points-label">积分</text>
        </view>
        <view class="level-bar-wrap">
          <view class="level-bar">
            <view class="level-bar-fill" :style="{ width: `${progress}%` }" />
          </view>
          <text class="level-hint">
            <template v-if="member?.level.nextLevel">
              再积 {{ member.level.pointsToNext }} 分升级
            </template>
            <template v-else>已达最高等级</template>
          </text>
        </view>
      </view>

      <!-- 功能入口 -->
      <view class="menu-card">
        <view class="menu-item" @tap="goOrders">
          <text class="menu-name">我的订单</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <!-- 优惠券 -->
      <view class="card">
        <text class="card-title">我的优惠券</text>
        <view v-if="coupons.length === 0" class="empty">
          <text class="empty-text">暂无优惠券</text>
        </view>
        <view
          v-for="c in usableCoupons"
          :key="c.id"
          class="coupon"
        >
          <view class="coupon-left">
            <text class="coupon-amount">
              {{ c.type === 'full_reduction' ? `减${((c.discountAmount ?? 0) / 100).toFixed(0)}` : `${c.discountRate}折` }}
            </text>
          </view>
          <view class="coupon-info">
            <text class="coupon-name">{{ c.name }}</text>
            <text class="coupon-desc">
              {{ c.type === 'full_reduction' ? `满${(c.threshold / 100).toFixed(0)}元可用` : '无门槛' }}
              · {{ formatBeijing(c.expiresAt) }} 到期
            </text>
          </view>
          <text class="coupon-status usable">可使用</text>
        </view>
        <view
          v-for="c in usedCoupons"
          :key="c.id"
          class="coupon"
        >
          <view class="coupon-left">
            <text class="coupon-amount">
              {{ c.type === 'full_reduction' ? `减${((c.discountAmount ?? 0) / 100).toFixed(0)}` : `${c.discountRate}折` }}
            </text>
          </view>
          <view class="coupon-info">
            <text class="coupon-name">{{ c.name }}</text>
            <text class="coupon-desc">{{ formatBeijing(c.expiresAt) }} 到期</text>
          </view>
          <text class="coupon-status" :class="couponStatusClass(c)">
            {{ couponStatusText(c) }}
          </text>
        </view>
      </view>

      <!-- 退出登录 -->
      <text class="logout-btn" @tap="logout">退出登录</text>
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

/* 登录面板 */
.login-panel {
  margin-top: 120rpx;
  background: #fff;
  border-radius: 24rpx;
  border: 2rpx solid $brand-100;
  padding: 48rpx 36rpx;
}
.login-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: $brand-900;
  text-align: center;
}
.login-sub {
  display: block;
  font-size: 24rpx;
  color: #8a968d;
  text-align: center;
  margin-top: 12rpx;
}
.login-input {
  background: $cream-50;
  border-radius: 12rpx;
  padding: 22rpx 24rpx;
  font-size: 28rpx;
  color: $brand-900;
  margin-top: 28rpx;
}
.login-btn {
  display: block;
  text-align: center;
  background: $brand-600;
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  padding: 24rpx 0;
  border-radius: 999rpx;
  margin-top: 36rpx;
  &.disabled {
    background: #6b7280;
  }
}

/* 会员卡 */
.member-card {
  border-radius: 24rpx;
  padding: 32rpx;
  background: linear-gradient(135deg, $brand-700 0%, $brand-900 100%);
  &.gold {
    background: linear-gradient(135deg, #b06f2c 0%, #8a5a2b 100%);
  }
  &.black {
    background: linear-gradient(135deg, #2b2b2b 0%, #111 100%);
  }
}
.member-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.member-name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
}
.member-phone {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 8rpx;
}
.level-badge {
  font-size: 24rpx;
  font-weight: 600;
  color: #fff;
  border: 2rpx solid rgba(255, 255, 255, 0.6);
  border-radius: 999rpx;
  padding: 6rpx 20rpx;
}
.points-row {
  display: flex;
  align-items: baseline;
  margin-top: 28rpx;
}
.points-value {
  font-size: 56rpx;
  font-weight: 800;
  color: #fff;
}
.points-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.75);
  margin-left: 12rpx;
}
.level-bar-wrap {
  margin-top: 24rpx;
}
.level-bar {
  height: 12rpx;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 999rpx;
  overflow: hidden;
}
.level-bar-fill {
  height: 100%;
  background: $caramel-400;
  border-radius: 999rpx;
}
.level-hint {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 12rpx;
}

/* 功能入口 */
.menu-card {
  background: #fff;
  border-radius: 20rpx;
  border: 2rpx solid $brand-100;
  margin-top: 20rpx;
}
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
}
.menu-name {
  font-size: 28rpx;
  color: $brand-900;
}
.menu-arrow {
  font-size: 36rpx;
  color: #8a968d;
}

/* 优惠券 */
.card {
  background: #fff;
  border-radius: 20rpx;
  border: 2rpx solid $brand-100;
  padding: 24rpx 28rpx;
  margin-top: 20rpx;
}
.card-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: $brand-900;
  margin-bottom: 16rpx;
}
.empty {
  padding: 40rpx 0;
  text-align: center;
}
.empty-text {
  font-size: 26rpx;
  color: #8a968d;
}
.coupon {
  display: flex;
  align-items: center;
  border: 2rpx solid $brand-100;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  &:last-child {
    margin-bottom: 0;
  }
}
.coupon-left {
  width: 120rpx;
  height: 100rpx;
  background: $brand-50;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.coupon-amount {
  font-size: 32rpx;
  font-weight: 800;
  color: $brand-700;
}
.coupon-info {
  flex: 1;
  margin-left: 20rpx;
}
.coupon-name {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: $brand-900;
}
.coupon-desc {
  display: block;
  font-size: 22rpx;
  color: #8a968d;
  margin-top: 6rpx;
}
.coupon-status {
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  flex-shrink: 0;
  &.usable {
    color: $brand-600;
    background: $brand-50;
  }
  &.used {
    color: #8a968d;
    background: $cream-100;
  }
  &.expired {
    color: #b0483e;
    background: #f9ecea;
  }
}

/* 退出登录 */
.logout-btn {
  display: block;
  text-align: center;
  margin-top: 32rpx;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #b0483e;
  background: #fff;
  border: 2rpx solid #f0d5d2;
  border-radius: 999rpx;
}
</style>
