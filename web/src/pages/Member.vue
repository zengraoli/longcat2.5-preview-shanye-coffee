<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '../lib/api';
import { formatYuan, formatBeijing, maskPhone, specText } from '../lib/utils';
import type { Coupon, CouponTemplate, Member, Order, OrderStatus } from '../lib/types';

const member = ref<Member | null>(null);
const orders = ref<Order[]>([]);
const myCoupons = ref<Coupon[]>([]);
const available = ref<CouponTemplate[]>([]);
const activeTab = ref<'orders' | 'coupons' | 'claim'>('orders');
const loading = ref(true);
const error = ref('');
const claiming = ref<number | null>(null);

const statusMeta: Record<OrderStatus, { text: string; cls: string }> = {
  pending_payment: { text: '待支付', cls: 'pending' },
  paid: { text: '已支付', cls: 'paid' },
  making: { text: '制作中', cls: 'making' },
  ready: { text: '待取餐', cls: 'ready' },
  completed: { text: '已完成', cls: 'completed' },
  cancelled: { text: '已取消', cls: 'cancelled' },
};

const levelInfo = computed(() => member.value?.level ?? { name: '银卡', level: 'silver', points: 0 });
const levelProgress = computed(() => {
  const l = levelInfo.value;
  if (l.level === 'black') return 100;
  if (l.level === 'gold') return Math.round(((l.points - 500) / 1500) * 100);
  return Math.round((l.points / 500) * 100);
});

onMounted(async () => {
  try {
    const [m, o, mc, av] = await Promise.all([
      api.get<Member>('/api/member/me'),
      api.get<Order[]>('/api/orders'),
      api.get<Coupon[]>('/api/member/coupons'),
      api.get<CouponTemplate[]>('/api/coupon-templates'),
    ]);
    member.value = m;
    orders.value = o;
    myCoupons.value = mc;
    available.value = av;
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败';
  } finally {
    loading.value = false;
  }
});

const claim = async (c: CouponTemplate) => {
  claiming.value = c.id;
  error.value = '';
  try {
    await api.post(`/api/coupons/${c.id}/claim`);
    const mc = await api.get<Coupon[]>('/api/member/coupons');
    myCoupons.value = mc;
  } catch (e) {
    error.value = e instanceof Error ? e.message : '领取失败';
  } finally {
    claiming.value = null;
  }
};

const hasClaimed = (templateId: number) => myCoupons.value.some((c) => c.templateId === templateId);
</script>

<template>
  <div class="member-page">
    <div class="container">
      <!-- 会员信息卡 -->
      <div class="member-card card">
        <div class="member-main">
          <div class="member-avatar">
            {{ (member?.nickname ?? '山')[0] }}
          </div>
          <div class="member-info">
            <div class="member-name">{{ member?.nickname ?? '会员' }}</div>
            <div class="member-phone">{{ maskPhone(member?.phone) }}</div>
          </div>
        </div>
        <div class="member-stats">
          <div class="stat">
            <div class="stat-value">{{ member?.points ?? 0 }}</div>
            <div class="stat-label">积分</div>
          </div>
          <div class="stat">
            <div class="stat-value level-badge" :class="levelInfo.level">
              {{ levelInfo.name }}
            </div>
            <div class="stat-label">等级</div>
          </div>
        </div>
      </div>

      <!-- 等级进度 -->
      <div class="level-bar-wrap">
        <div class="level-bar">
          <div class="level-bar-fill" :style="{ width: `${levelProgress}%` }"></div>
        </div>
        <div class="level-hint">
          <template v-if="levelInfo.level === 'silver'">再积 {{ 500 - levelInfo.points }} 分升级金卡</template>
          <template v-else-if="levelInfo.level === 'gold'">再积 {{ 2000 - levelInfo.points }} 分升级黑卡</template>
          <template v-else>已达最高等级</template>
        </div>
      </div>

      <!-- 标签页 -->
      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">
          我的订单
        </button>
        <button class="tab" :class="{ active: activeTab === 'coupons' }" @click="activeTab = 'coupons'">
          我的优惠券
        </button>
        <button class="tab" :class="{ active: activeTab === 'claim' }" @click="activeTab = 'claim'">
          领取优惠券
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="loading" class="loading">加载中…</p>

      <!-- 订单 -->
      <div v-if="!loading && activeTab === 'orders'" class="panel">
        <p v-if="orders.length === 0" class="empty">暂无订单</p>
        <div v-for="o in orders" :key="o.id" class="order-item card">
          <div class="order-head">
            <span class="order-no">{{ o.orderNo }}</span>
            <span v-if="o.pickupCode" class="order-code">取餐码 {{ o.pickupCode }}</span>
            <span class="order-status" :class="statusMeta[o.status]?.cls">
              {{ statusMeta[o.status]?.text ?? o.status }}
            </span>
          </div>
          <div class="order-items">
            <div v-for="it in o.items" :key="it.id" class="order-line">
              <span class="order-name">
                {{ it.productName }}
                <span v-if="it.cup" class="order-spec">{{ specText(it) }}</span>
              </span>
              <span class="order-qty">×{{ it.quantity }}</span>
            </div>
          </div>
          <div class="order-foot">
            <span class="order-time">{{ formatBeijing(o.createdAt) }}</span>
            <span v-if="o.discountAmount > 0" class="order-discount">
              优惠 {{ formatYuan(o.discountAmount) }}
            </span>
            <span class="order-amount">{{ formatYuan(o.payableAmount) }}</span>
          </div>
        </div>
      </div>

      <!-- 我的优惠券 -->
      <div v-if="!loading && activeTab === 'coupons'" class="panel">
        <p v-if="myCoupons.length === 0" class="empty">暂无优惠券</p>
        <div class="coupon-grid">
          <div
            v-for="c in myCoupons"
            :key="c.id"
            class="coupon card"
            :class="{ disabled: c.status !== 'unused' }"
          >
            <div class="coupon-name">{{ c.name }}</div>
            <div class="coupon-desc">
              {{ c.type === 'full_reduction' ? `满${formatYuan(c.threshold)}减${formatYuan(c.discountAmount ?? 0)}` : `${(c.discountRate ?? 0) / 10} 折` }}
            </div>
            <div class="coupon-meta">
              <span :class="c.status === 'unused' ? 'ok' : 'muted'">
                {{ c.status === 'unused' ? '可使用' : c.status === 'used' ? '已使用' : '已过期' }}
              </span>
              <span class="coupon-exp">至 {{ formatBeijing(c.expiresAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 领取优惠券 -->
      <div v-if="!loading && activeTab === 'claim'" class="panel">
        <p v-if="available.length === 0" class="empty">暂无可领取的优惠券</p>
        <div class="coupon-grid">
          <div v-for="c in available" :key="c.id" class="coupon card">
            <div class="coupon-name">{{ c.name }}</div>
            <div class="coupon-desc">
              {{ c.type === 'full_reduction' ? `满${formatYuan(c.threshold)}减${formatYuan(c.discountAmount ?? 0)}` : `${(c.discountRate ?? 0) / 10} 折` }}
            </div>
            <div class="coupon-meta">
              <span class="coupon-exp">有效期 {{ c.validDays }} 天</span>
            </div>
            <button
              class="btn btn-primary coupon-claim"
              :disabled="hasClaimed(c.id) || claiming === c.id"
              @click="claim(c)"
            >
              {{ hasClaimed(c.id) ? '已领取' : claiming === c.id ? '领取中…' : '领取' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.member-page {
  padding: 2rem 0 3rem;
}
.member-card {
  padding: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
  background: linear-gradient(135deg, var(--brand-800), var(--brand-600));
  color: #fff;
  border: none;
}
.member-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.member-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--caramel-400);
  color: var(--brand-900);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 700;
}
.member-name {
  font-size: 1.2rem;
  font-weight: 700;
}
.member-phone {
  font-size: 0.85rem;
  opacity: 0.8;
}
.member-stats {
  display: flex;
  gap: 2.5rem;
}
.stat {
  text-align: center;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
}
.stat-label {
  font-size: 0.75rem;
  opacity: 0.75;
}
.level-badge.silver {
  color: #e5e7eb;
}
.level-badge.gold {
  color: #fbbf24;
}
.level-badge.black {
  color: var(--caramel-400);
}

.level-bar-wrap {
  margin: 1.25rem 0 1.75rem;
}
.level-bar {
  height: 8px;
  background: var(--brand-100);
  border-radius: 999px;
  overflow: hidden;
}
.level-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-400), var(--caramel-400));
  border-radius: 999px;
  transition: width 0.4s;
}
.level-hint {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--brand-500);
}

.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--brand-100);
  margin-bottom: 1.5rem;
}
.tab {
  padding: 0.6rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--brand-600);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: -1px;
  white-space: nowrap;
}
@media (max-width: 480px) {
  .tab {
    padding: 0.6rem 0.6rem;
    font-size: 0.8rem;
  }
}
.tab.active {
  color: var(--brand-primary);
  border-bottom-color: var(--brand-primary);
}

.panel {
  min-height: 200px;
}
.empty,
.loading {
  text-align: center;
  color: var(--brand-400);
  padding: 3rem 0;
}
.error {
  color: #dc2626;
  font-size: 0.9rem;
}

.order-item {
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
}
.order-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.order-no {
  font-weight: 700;
  color: var(--brand-900);
}
.order-status {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-weight: 600;
}
.order-status.pending {
  background: #fef3c7;
  color: #b45309;
}
.order-status.paid {
  background: #e0e7ff;
  color: #4338ca;
}
.order-status.making {
  background: var(--brand-100);
  color: var(--brand-700);
}
.order-status.ready {
  background: #d1fae5;
  color: #047857;
}
.order-status.completed {
  background: #f3f4f6;
  color: #6b7280;
}
.order-status.cancelled {
  background: #fee2e2;
  color: #b91c1c;
}
.order-line {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.9rem;
  color: var(--brand-700);
}
.order-spec {
  color: var(--brand-400);
  font-size: 0.8rem;
  margin-left: 0.35rem;
}
.order-qty {
  color: var(--brand-500);
}
.order-foot {
  display: flex;
  justify-content: space-between;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--brand-100);
}
.order-time {
  font-size: 0.8rem;
  color: var(--brand-400);
}
.order-amount {
  font-weight: 700;
  color: var(--brand-primary);
}

.coupon-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.coupon {
  padding: 1.25rem;
  border-left: 4px solid var(--caramel-400);
}
.coupon.disabled {
  opacity: 0.6;
  border-left-color: var(--brand-200);
}
.coupon-name {
  font-weight: 700;
  color: var(--brand-900);
  margin-bottom: 0.35rem;
}
.coupon-desc {
  color: var(--brand-600);
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}
.coupon-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
}
.coupon-meta .ok {
  color: var(--brand-600);
  font-weight: 600;
}
.coupon-meta .muted {
  color: var(--brand-400);
}
.coupon-exp {
  color: var(--brand-400);
}
.coupon-claim {
  margin-top: 0.85rem;
  width: 100%;
  padding: 0.5rem;
  font-size: 0.85rem;
}

@media (max-width: 767px) {
  .coupon-grid {
    grid-template-columns: 1fr;
  }
  .member-stats {
    gap: 1.5rem;
  }
}
</style>
