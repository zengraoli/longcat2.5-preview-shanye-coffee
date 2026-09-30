<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../lib/api';
import { formatYuan, specText } from '../lib/utils';
import type { Category, Product } from '../lib/types';
import ProductArt from '../components/ProductArt.vue';

const promoProductIds = ref<Set<number>>(new Set());

const route = useRoute();
const categories = ref<Category[]>([]);
const products = ref<Product[]>([]);
const activeCategory = ref<number | 'all'>('all');
const loading = ref(true);
const selected = ref<Product | null>(null);

// 支持从首页推荐跳转时携带分类参数
const initialCategory = Number(route.query.category);
if (Number.isInteger(initialCategory) && initialCategory > 0) {
  activeCategory.value = initialCategory;
}

onMounted(async () => {
  try {
    const [cats, prods, promo] = await Promise.all([
      api.get<Category[]>('/api/categories'),
      api.get<Product[]>('/api/products'),
      api
        .get<{ applicableProductIds: number[] }>('/api/promotions')
        .catch(() => null),
    ]);
    categories.value = cats;
    products.value = prods;
    promoProductIds.value = new Set(promo?.applicableProductIds ?? []);
    if (cats.length > 0) activeCategory.value = 'all';
  } finally {
    loading.value = false;
  }
});

const filtered = computed(() => {
  if (activeCategory.value === 'all') return products.value;
  return products.value.filter((p) => p.categoryId === activeCategory.value);
});

const selectCategory = (id: number | 'all') => {
  activeCategory.value = id;
};

const openDetail = (p: Product) => {
  selected.value = null;
  api
    .get<Product>(`/api/products/${p.id}`)
    .then((detail) => {
      selected.value = detail;
    })
    .catch(() => {});
};
</script>

<template>
  <div class="menu-page">
    <div class="container">
      <header class="page-head">
        <h1 class="page-title">菜单</h1>
        <p class="page-sub">当季风味，自采自烘</p>
      </header>

      <!-- 分类切换 -->
      <div class="tabs">
        <button
          class="tab"
          :class="{ active: activeCategory === 'all' }"
          @click="selectCategory('all')"
        >
          全部
        </button>
        <button
          v-for="c in categories"
          :key="c.id"
          class="tab"
          :class="{ active: activeCategory === c.id }"
          @click="selectCategory(c.id)"
        >
          {{ c.name }}
        </button>
      </div>

      <!-- 商品网格 -->
      <div v-if="loading" class="grid">
        <div v-for="i in 8" :key="i" class="product-card card skeleton"></div>
      </div>
      <div v-else class="grid">
        <button
          v-for="p in filtered"
          :key="p.id"
          class="product-card card"
          :class="{ 'is-soldout': p.soldOut }"
          @click="openDetail(p)"
        >
          <div class="product-art">
            <ProductArt :image="p.image" :name="p.name" />
          </div>
          <div class="product-info">
            <div class="product-name-row">
              <span class="product-name">{{ p.name }}</span>
              <span v-if="promoProductIds.has(p.id)" class="promo-tag">第二杯半价</span>
            </div>
            <div class="product-desc">{{ p.description }}</div>
            <div class="product-foot">
              <span class="product-price">{{ formatYuan(p.price) }}</span>
              <span v-if="p.soldOut" class="product-soldout">售罄</span>
            </div>
            <div v-if="p.soldOut" class="product-soldout-mask">已售罄</div>
          </div>
        </button>
      </div>
      <p v-if="!loading && filtered.length === 0" class="empty">该分类暂无商品</p>
    </div>

    <!-- 商品详情弹窗 -->
    <teleport to="body">
      <div v-if="selected" class="modal-mask" @click.self="selected = null">
        <div class="modal card">
          <button class="modal-close" aria-label="关闭" @click="selected = null">×</button>
          <div class="modal-art">
            <ProductArt :image="selected.image" :name="selected.name" />
          </div>
          <div class="modal-body">
            <h2 class="modal-title">{{ selected.name }}</h2>
            <p class="modal-desc">{{ selected.description }}</p>
            <div class="modal-price">{{ formatYuan(selected.price) }}</div>

            <div v-if="selected.specs && selected.specs.length > 0" class="spec-block">
              <div class="spec-title">可选规格</div>
              <div class="spec-grid">
                <div v-for="(s, i) in selected.specs" :key="i" class="spec-item">
                  <span class="spec-text">{{ specText(s) }}</span>
                  <span v-if="s.priceAdjust > 0" class="spec-adjust">
                    +{{ formatYuan(s.priceAdjust) }}
                  </span>
                </div>
              </div>
            </div>
            <p v-else class="spec-empty">该商品无规格选项</p>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
.menu-page {
  padding-bottom: 3rem;
}
.page-head {
  padding: 2.5rem 0 1.5rem;
}
.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--brand-900);
  margin: 0;
}
.page-sub {
  color: var(--brand-500);
  margin: 0.25rem 0 0;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.75rem;
}
.tab {
  padding: 0.5rem 1.1rem;
  border-radius: 999px;
  border: 1px solid var(--brand-200);
  background: #fff;
  color: var(--brand-700);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.tab:hover {
  border-color: var(--brand-400);
}
.tab.active {
  background: var(--brand-primary);
  color: #fff;
  border-color: var(--brand-primary);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}
.product-card {
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  padding: 0;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(30, 58, 41, 0.1);
}
.product-card.is-soldout {
  opacity: 0.6;
}
.product-card.is-soldout .product-art {
  filter: grayscale(0.8);
}
.product-soldout-mask {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background: rgba(30, 58, 41, 0.75);
  color: #fff;
  font-size: 0.7rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-weight: 600;
}
.product-art {
  aspect-ratio: 1;
  background: var(--cream-100);
  padding: 1.25rem;
}
.product-info {
  padding: 1rem 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}
.product-name-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.product-name {
  font-weight: 700;
  color: var(--brand-900);
}
.promo-tag {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--caramel-600);
  background: #faf0e3;
  border-radius: 0.25rem;
  padding: 0.1rem 0.4rem;
  flex-shrink: 0;
}
.product-desc {
  font-size: 0.8rem;
  color: var(--brand-500);
  flex: 1;
}
.product-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
}
.product-price {
  font-weight: 700;
  color: var(--brand-primary);
}
.product-soldout {
  font-size: 0.75rem;
  color: var(--caramel-600);
  background: var(--cream-200);
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
}
.skeleton {
  aspect-ratio: 3/4;
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
.empty {
  text-align: center;
  color: var(--brand-400);
  padding: 3rem 0;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 32, 22, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 100;
}
.modal {
  position: relative;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--cream-100);
  color: var(--brand-700);
  font-size: 1.25rem;
  cursor: pointer;
  z-index: 1;
}
.modal-art {
  background: var(--cream-100);
  padding: 2rem;
  display: flex;
  align-items: center;
}
.modal-body {
  padding: 2rem;
}
.modal-title {
  font-size: 1.5rem;
  color: var(--brand-900);
  margin: 0 0 0.5rem;
}
.modal-desc {
  color: var(--brand-500);
  font-size: 0.9rem;
  margin: 0 0 1rem;
}
.modal-price {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--brand-primary);
  margin-bottom: 1.25rem;
}
.spec-title {
  font-weight: 700;
  color: var(--brand-800);
  margin-bottom: 0.75rem;
}
.spec-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
.spec-item {
  display: flex;
  flex-direction: column;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--brand-100);
  border-radius: 0.5rem;
  background: var(--cream-50);
}
.spec-text {
  font-size: 0.85rem;
  color: var(--brand-800);
}
.spec-adjust {
  font-size: 0.75rem;
  color: var(--caramel-600);
}
.spec-empty {
  color: var(--brand-400);
  font-size: 0.9rem;
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 767px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .modal {
    grid-template-columns: 1fr;
  }
  .modal-art {
    padding: 1.5rem;
  }
}
@media (max-width: 480px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}
</style>
