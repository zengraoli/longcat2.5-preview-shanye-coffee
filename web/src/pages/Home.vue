<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../lib/api';
import { formatYuan } from '../lib/utils';
import type { Product, Store } from '../lib/types';
import HeroVisual from '../components/HeroVisual.vue';
import ProductArt from '../components/ProductArt.vue';

const recommended = ref<Product[]>([]);
const stores = ref<Store[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const [products, storeList] = await Promise.all([
      api.get<Product[]>('/api/products'),
      api.get<Store[]>('/api/stores'),
    ]);
    // 当季推荐：取前 4 个上架商品
    recommended.value = products.slice(0, 4);
    stores.value = storeList;
  } finally {
    loading.value = false;
  }
});

const features = [
  {
    title: '高山庄园',
    desc: '海拔 1200m 以上庄园直采',
    icon: 'M3 18 L9 7 L13 13 L16 9 L21 18 Z',
  },
  {
    title: '当日现烘',
    desc: '下单前 24 小时内新鲜烘焙',
    icon: 'M6 18 h12 M8 18 v-6 a4 4 0 0 1 8 0 v6 M12 6 v2',
  },
  {
    title: '山野风味',
    desc: '柑橘、花香、黑巧的层次',
    icon: 'M12 3 c3 4 6 6 6 10 a6 6 0 0 1 -12 0 c0 -4 3 -6 6 -10 z',
  },
];
</script>

<template>
  <div class="home">
    <!-- 品牌主视觉 -->
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="hero-eyebrow">SHANYE COFFEE · EST. 2024</span>
          <h1 class="hero-title">
            山野之间<br />
            <span class="accent">一杯好咖啡</span>
          </h1>
          <p class="hero-sub">
            来自高海拔庄园的当季风味，自采自烘，只为这一杯。
            从山间到杯中，保留最本真的香气。
          </p>
          <div class="hero-actions">
            <router-link to="/menu" class="btn btn-primary">浏览菜单</router-link>
            <router-link to="/stores" class="btn btn-outline">查找门店</router-link>
          </div>
        </div>
        <div class="hero-art">
          <HeroVisual />
        </div>
      </div>
    </section>

    <!-- 品牌理念 -->
    <section class="features">
      <div class="container features-grid">
        <div v-for="f in features" :key="f.title" class="feature card">
          <svg viewBox="0 0 24 24" class="feature-icon" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path :d="f.icon" />
          </svg>
          <div class="feature-title">{{ f.title }}</div>
          <div class="feature-desc">{{ f.desc }}</div>
        </div>
      </div>
    </section>

    <!-- 当季推荐 -->
    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title">当季推荐</h2>
            <p class="section-sub">本季风味，限时供应</p>
          </div>
          <router-link to="/menu" class="btn btn-ghost">查看全部 →</router-link>
        </div>
        <div v-if="loading" class="grid-products">
          <div v-for="i in 4" :key="i" class="product-card card skeleton"></div>
        </div>
        <div v-else class="grid-products">
          <router-link
            v-for="p in recommended"
            :key="p.id"
            to="/menu"
            class="product-card card"
          >
            <div class="product-art">
              <ProductArt :image="p.image" :name="p.name" />
            </div>
            <div class="product-info">
              <div class="product-name">{{ p.name }}</div>
              <div class="product-desc">{{ p.description }}</div>
              <div class="product-foot">
                <span class="product-price">{{ formatYuan(p.price) }}</span>
                <span v-if="p.soldOut" class="product-soldout">售罄</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <!-- 门店入口 -->
    <section class="section section-alt">
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title">线下门店</h2>
            <p class="section-sub">三家门店，欢迎光临</p>
          </div>
          <router-link to="/stores" class="btn btn-ghost">全部门店 →</router-link>
        </div>
        <div class="grid-stores">
          <router-link
            v-for="s in stores"
            :key="s.id"
            to="/stores"
            class="store-card card"
          >
            <div class="store-status" :class="s.isOpen ? 'open' : 'closed'">
              {{ s.isOpen ? '营业中' : '休息中' }}
            </div>
            <div class="store-name">{{ s.name }}</div>
            <div class="store-addr">{{ s.address }}</div>
            <div class="store-time">{{ s.openTime }} - {{ s.closeTime }}</div>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 主视觉 */
.hero {
  background: linear-gradient(160deg, var(--cream-50) 0%, var(--brand-50) 100%);
  overflow: hidden;
}
.hero-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 2rem;
  align-items: center;
  padding-top: 3rem;
  padding-bottom: 3rem;
}
.hero-eyebrow {
  display: inline-block;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  color: var(--caramel-500);
  font-weight: 600;
  margin-bottom: 1rem;
}
.hero-title {
  font-size: 3rem;
  line-height: 1.15;
  color: var(--brand-900);
  margin: 0 0 1.25rem;
  font-weight: 800;
}
.hero-title .accent {
  color: var(--brand-primary);
}
.hero-sub {
  color: var(--brand-500);
  font-size: 1.05rem;
  margin: 0 0 2rem;
  max-width: 30rem;
}
.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.hero-art {
  border-radius: var(--radius);
  overflow: hidden;
}

/* 理念 */
.features {
  padding: 3rem 0;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}
.feature {
  padding: 1.75rem;
  text-align: center;
}
.feature-icon {
  width: 40px;
  height: 40px;
  color: var(--brand-primary);
  margin-bottom: 0.75rem;
}
.feature-title {
  font-weight: 700;
  color: var(--brand-900);
  margin-bottom: 0.25rem;
}
.feature-desc {
  font-size: 0.85rem;
  color: var(--brand-500);
}

/* 区块 */
.section {
  padding: 3.5rem 0;
}
.section-alt {
  background: var(--cream-100);
}
.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
}

/* 商品 */
.grid-products {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}
.product-card {
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(30, 58, 41, 0.1);
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
.product-name {
  font-weight: 700;
  color: var(--brand-900);
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

/* 门店 */
.grid-stores {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}
.store-card {
  padding: 1.5rem;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}
.store-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(30, 58, 41, 0.1);
}
.store-status {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  font-size: 0.72rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-weight: 600;
}
.store-status.open {
  background: var(--brand-100);
  color: var(--brand-700);
}
.store-status.closed {
  background: var(--cream-200);
  color: var(--brand-500);
}
.store-name {
  font-weight: 700;
  color: var(--brand-900);
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  padding-right: 4rem;
}
.store-addr {
  color: var(--brand-600);
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}
.store-time {
  color: var(--brand-400);
  font-size: 0.85rem;
}

/* 响应式：平板 */
@media (max-width: 1024px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .hero-art {
    order: -1;
  }
  .grid-products {
    grid-template-columns: repeat(2, 1fr);
  }
  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 响应式：手机 */
@media (max-width: 640px) {
  .hero-title {
    font-size: 2.1rem;
  }
  .features-grid {
    grid-template-columns: 1fr;
  }
  .grid-products {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  .grid-stores {
    grid-template-columns: 1fr;
  }
  .section {
    padding: 2.5rem 0;
  }
}
</style>
