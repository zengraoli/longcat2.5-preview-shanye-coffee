<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api, formatYuan, formatTime, getMemberToken, clearMemberToken } from '@/api'
import type { MemberInfo, Order, Coupon } from '@/types'
import { LogOut, Ticket, ShoppingBag, Award, ChevronRight } from 'lucide-vue-next'

const router = useRouter()
const member = ref<MemberInfo | null>(null)
const orders = ref<Order[]>([])
const coupons = ref<Coupon[]>([])
const loading = ref(true)

const level = computed(() => {
  if (!member.value) return '银卡'
  if (member.value.points >= 2000) return '黑卡'
  if (member.value.points >= 500) return '金卡'
  return '银卡'
})

const levelProgress = computed(() => {
  if (!member.value) return 0
  const pts = member.value.points
  if (pts >= 2000) return 100
  if (pts >= 500) return ((pts - 500) / 1500) * 100
  return (pts / 500) * 100
})

const STATUS_LABELS: Record<string, string> = {
  pending: '待支付', paid: '已支付', making: '制作中', ready: '待取餐', completed: '已完成', cancelled: '已取消',
}

onMounted(async () => {
  if (!getMemberToken()) {
    router.replace('/login')
    return
  }
  try {
    const [m, o, c] = await Promise.all([
      api.get<MemberInfo>('/member/me'),
      api.get<Order[]>('/orders'),
      api.get<Coupon[]>('/my/coupons'),
    ])
    member.value = m
    orders.value = o
    coupons.value = c.filter((x) => x.validTo > new Date().toISOString())
  } catch {
    clearMemberToken()
    router.replace('/login')
  } finally {
    loading.value = false
  }
})

function handleLogout() {
  clearMemberToken()
  router.push('/login')
}
</script>

<template>
  <div class="member-page">
    <div class="container">
      <div v-if="loading" class="loading">加载中...</div>

      <template v-else-if="member">
        <div class="member-header">
          <div class="member-info">
            <div class="avatar">{{ member.phone.slice(7) }}</div>
            <div>
              <h1>{{ member.phone }}</h1>
              <span :class="['level-badge', level]">{{ level }}</span>
            </div>
          </div>
          <button @click="handleLogout" class="logout-btn">
            <LogOut :size="16" /> 退出
          </button>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <Award :size="24" />
            <div>
              <p class="stat-value">{{ member.points }}</p>
              <p class="stat-label">积分</p>
            </div>
          </div>
          <div class="stat-card">
            <ShoppingBag :size="24" />
            <div>
              <p class="stat-value">{{ orders.length }}</p>
              <p class="stat-label">订单</p>
            </div>
          </div>
          <div class="stat-card">
            <Ticket :size="24" />
            <div>
              <p class="stat-value">{{ coupons.length }}</p>
              <p class="stat-label">优惠券</p>
            </div>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-header">
            <span>会员等级进度</span>
            <span>{{ level }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${levelProgress}%` }" />
          </div>
          <p class="progress-hint">
            {{ level === '银卡' ? `再积 ${500 - (member?.points ?? 0)} 分升级金卡` : level === '金卡' ? `再积 ${2000 - (member?.points ?? 0)} 分升级黑卡` : '已达最高等级' }}
          </p>
        </div>

        <div class="section">
          <h2 class="section-title">我的订单</h2>
          <div v-if="orders.length === 0" class="empty">暂无订单</div>
          <div v-else class="order-list">
            <div v-for="order in orders" :key="order.id" class="order-item">
              <div class="order-main">
                <span class="order-no">{{ order.order_no }}</span>
                <span :class="['order-status', order.status]">{{ STATUS_LABELS[order.status] }}</span>
              </div>
              <div class="order-sub">
                <span>{{ order.store_name }}</span>
                <span>{{ formatYuan(order.paid_amount) }}</span>
                <span class="order-time">{{ formatTime(order.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">我的优惠券</h2>
          <div v-if="coupons.length === 0" class="empty">暂无优惠券</div>
          <div v-else class="coupon-list">
            <div v-for="coupon in coupons" :key="coupon.id" class="coupon-item">
              <div class="coupon-left">
                <span class="coupon-name">{{ coupon.name }}</span>
                <span class="coupon-type">{{ coupon.type === 'fixed' ? '满减' : '折扣' }}</span>
              </div>
              <div class="coupon-right">
                <span class="coupon-discount">
                  {{ coupon.type === 'fixed' ? formatYuan(coupon.discount) : `${coupon.discount}%` }}
                </span>
                <span class="coupon-threshold">满{{ formatYuan(coupon.threshold) }}可用</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.member-page {
  padding: 48px 0 80px;
}

.loading {
  text-align: center;
  padding: 60px 0;
  color: var(--brand-text-light);
}

.member-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--brand-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
}

.member-info h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.level-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
}

.level-badge.银卡 {
  background: #E8E8E8;
  color: #666;
}

.level-badge.金卡 {
  background: #FFF3E0;
  color: #E65100;
}

.level-badge.黑卡 {
  background: #2C1810;
  color: #D4A574;
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--brand-border);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  color: var(--brand-text-light);
  transition: all 0.2s;
}

.logout-btn:hover {
  border-color: var(--brand-error);
  color: var(--brand-error);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: var(--brand-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--brand-border);
}

.stat-card svg {
  color: var(--brand-primary);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--brand-text-light);
}

.progress-section {
  background: var(--brand-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--brand-border);
  padding: 24px;
  margin-bottom: 32px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 12px;
}

.progress-bar {
  height: 8px;
  background: var(--brand-border);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-secondary), var(--brand-primary));
  border-radius: 999px;
  transition: width 0.5s;
}

.progress-hint {
  font-size: 0.8rem;
  color: var(--brand-text-light);
  margin-top: 8px;
}

.section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.empty {
  text-align: center;
  padding: 40px 0;
  color: var(--brand-text-light);
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  background: var(--brand-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--brand-border);
  padding: 16px;
}

.order-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.order-no {
  font-family: monospace;
  font-size: 0.85rem;
}

.order-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: #E8F5E9;
  color: #2E7D32;
}

.order-sub {
  display: flex;
  gap: 16px;
  font-size: 0.85rem;
  color: var(--brand-text-light);
}

.order-time {
  margin-left: auto;
}

.coupon-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.coupon-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--brand-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--brand-border);
  border-left: 4px solid var(--brand-primary);
  padding: 16px;
}

.coupon-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.coupon-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.coupon-type {
  font-size: 0.75rem;
  color: var(--brand-text-light);
}

.coupon-right {
  text-align: right;
}

.coupon-discount {
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--brand-primary);
}

.coupon-threshold {
  font-size: 0.75rem;
  color: var(--brand-text-light);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .coupon-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 390px) {
  .member-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
