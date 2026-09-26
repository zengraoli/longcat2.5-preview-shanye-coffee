<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api, formatYuan } from '@/api'
import type { Product, Category, ActivePromotion } from '@/types'
import { Coffee } from 'lucide-vue-next'

const categories = ref<Category[]>([])
const products = ref<Product[]>([])
const promotion = ref<ActivePromotion | null>(null)
const activeCategory = ref<number | null>(null)
const loading = ref(true)

const promoProductIds = computed(() => promotion.value?.productIds ?? [])

function formatPromoRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso)
    const bj = new Date(d.getTime() + 8 * 3600 * 1000)
    return `${bj.getUTCMonth() + 1}月${bj.getUTCDate()}日`
  }
  return `${fmt(start)} - ${fmt(end)}`
}

const promoRange = computed(() =>
  promotion.value ? formatPromoRange(promotion.value.startTime, promotion.value.endTime) : '',
)

const promoProductNames = computed(() =>
  promotion.value?.products.map((p) => p.name).join('、') ?? '',
)

onMounted(async () => {
  try {
    const [c, p, promo] = await Promise.all([
      api.get<Category[]>('/categories'),
      api.get<Product[]>('/products'),
      api.get<ActivePromotion | null>('/promotions/active'),
    ])
    categories.value = c
    products.value = p
    promotion.value = promo
    if (c.length > 0) activeCategory.value = c[0].id
  } catch {} finally {
    loading.value = false
  }
})

function filterByCategory(id: number) {
  activeCategory.value = id
}

function filteredProducts(): Product[] {
  if (!activeCategory.value) return products.value
  return products.value.filter((p) => p.categoryId === activeCategory.value)
}
</script>

<template>
  <div class="menu-page">
    <div class="container">
      <header class="page-header">
        <p class="page-eyebrow">OUR MENU</p>
        <h1 class="page-title">精选菜单</h1>
        <p class="page-desc">每一杯都是匠心之作</p>
      </header>

      <div v-if="promotion" class="promo-banner">
        <div class="promo-text">
          <p class="promo-title">
            <Coffee :size="18" />
            {{ promotion.name }}
          </p>
          <p class="promo-desc">参与商品：{{ promoProductNames }}</p>
          <p class="promo-range">{{ promoRange }}</p>
        </div>
      </div>

      <div class="category-tabs">
        <button
          v-for="cat in categories"
          :key="cat.id"
          :class="['cat-tab', { active: activeCategory === cat.id }]"
          @click="filterByCategory(cat.id)"
        >
          {{ cat.name }}
        </button>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="filteredProducts().length === 0" class="loading">该分类暂无商品</div>

      <div v-else class="menu-grid">
        <div v-for="product in filteredProducts()" :key="product.id" class="menu-card">
          <div class="menu-img">
            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="50" fill="#FDF8F3" />
              <path d="M40 50 L40 80 C40 90 48 96 60 96 C72 96 80 90 80 80 L80 50 Z" fill="#D4A574" opacity="0.3" />
              <ellipse cx="60" cy="50" rx="20" ry="5" fill="#8B4513" opacity="0.2" />
              <path d="M42 50 C42 44 48 40 60 40 C72 40 78 44 78 50" stroke="#8B4513" stroke-width="2.5" fill="none" opacity="0.4" />
            </svg>
            <span v-if="product.soldOut" class="soldout-badge">已售罄</span>
          </div>
          <div class="menu-info">
            <h3 class="menu-name">
              {{ product.name }}
              <span v-if="promoProductIds.includes(product.id)" class="menu-promo-tag">第二杯半价</span>
            </h3>
            <p class="menu-desc">{{ product.description }}</p>
            <div class="menu-footer">
              <span class="menu-price">{{ formatYuan(product.price) }}</span>
              <span v-if="product.soldOut" class="menu-status soldout">售罄</span>
              <span v-else class="menu-status available">可点</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-page {
  padding: 48px 0 80px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-eyebrow {
  font-size: 0.75rem;
  letter-spacing: 3px;
  color: var(--brand-secondary);
  font-weight: 600;
  margin-bottom: 8px;
}

.page-title {
  font-family: var(--font-serif);
  font-size: 2.5rem;
  font-weight: 900;
  margin-bottom: 12px;
}

.page-desc {
  color: var(--brand-text-light);
  font-size: 1rem;
}

.promo-banner {
  max-width: 1200px;
  margin: 0 auto 32px;
  background: linear-gradient(120deg, #c05f2e, #a84e22);
  border-radius: var(--radius-lg);
  padding: 20px 28px;
  color: #fff;
}

.promo-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.promo-desc {
  font-size: 0.85rem;
  opacity: 0.92;
  margin-bottom: 4px;
}

.promo-range {
  font-size: 0.8rem;
  opacity: 0.85;
}

.menu-promo-tag {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 999px;
  background: #fdeadd;
  color: #c05f2e;
  font-size: 0.7rem;
  font-weight: 600;
  vertical-align: middle;
}

.category-tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.cat-tab {
  padding: 10px 24px;
  border-radius: 999px;
  border: 1.5px solid var(--brand-border);
  background: var(--brand-surface);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--brand-text-light);
  transition: all 0.2s;
}

.cat-tab:hover {
  border-color: var(--brand-primary);
  color: var(--brand-primary);
}

.cat-tab.active {
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  color: white;
}

.loading {
  text-align: center;
  padding: 60px 0;
  color: var(--brand-text-light);
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.menu-card {
  background: var(--brand-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--brand-border);
  transition: all 0.25s;
}

.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.menu-img {
  position: relative;
  aspect-ratio: 1;
  background: var(--brand-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-img svg {
  width: 70%;
  height: 70%;
}

.soldout-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 0.7rem;
  padding: 4px 10px;
  border-radius: 999px;
}

.menu-info {
  padding: 16px;
}

.menu-name {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.menu-desc {
  font-size: 0.85rem;
  color: var(--brand-text-light);
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.menu-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.menu-price {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--brand-primary);
}

.menu-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
}

.menu-status.available {
  background: #E8F5E9;
  color: #2E7D32;
}

.menu-status.soldout {
  background: #FFEBEE;
  color: #C62828;
}

@media (max-width: 1024px) {
  .menu-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }

  .menu-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .cat-tab {
    padding: 8px 16px;
    font-size: 0.85rem;
  }
}

@media (max-width: 390px) {
  .menu-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .menu-info {
    padding: 12px;
  }

  .menu-price {
    font-size: 1rem;
  }
}
</style>
