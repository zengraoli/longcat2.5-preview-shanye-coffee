<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { api, formatYuan } from '@/api'
import type { Product, Store } from '@/types'
import { MapPin, Clock, ChevronRight, Coffee, Leaf, Star } from 'lucide-vue-next'

const products = ref<Product[]>([])
const stores = ref<Store[]>([])

onMounted(async () => {
  try {
    const [p, s] = await Promise.all([
      api.get<Product[]>('/products'),
      api.get<Store[]>('/stores'),
    ])
    products.value = p.filter((x) => !x.soldOut).slice(0, 4)
    stores.value = s
  } catch {}
})
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="hero-bg">
        <svg class="hero-illustration" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="650" cy="120" r="200" fill="#E8C9A0" opacity="0.3" />
          <circle cx="150" cy="300" r="150" fill="#D4A574" opacity="0.2" />
          <path d="M400 80 C380 80 360 100 360 120 C360 140 380 160 400 160 C420 160 440 140 440 120 C440 100 420 80 400 80Z" fill="#8B4513" opacity="0.15" />
          <path d="M350 200 C330 200 310 220 310 240 L310 320 C310 340 330 360 350 360 L450 360 C470 360 490 340 490 320 L490 240 C490 220 470 200 450 200 Z" fill="#8B4513" opacity="0.08" />
          <path d="M340 200 C340 180 360 160 380 160 L420 160 C440 160 460 180 460 200" stroke="#8B4513" stroke-width="3" fill="none" opacity="0.15" />
          <ellipse cx="400" cy="160" rx="60" ry="8" fill="#5C2E0A" opacity="0.08" />
          <path d="M200 320 Q250 280 300 320 Q350 360 400 320 Q450 280 500 320" stroke="#D4A574" stroke-width="2" fill="none" opacity="0.4" />
          <path d="M180 340 Q240 300 300 340 Q360 380 420 340 Q480 300 540 340" stroke="#D4A574" stroke-width="1.5" fill="none" opacity="0.3" />
        </svg>
      </div>
      <div class="container hero-content">
        <p class="hero-eyebrow">SHAN YE COFFEE</p>
        <h1 class="hero-title">
          山野之间<br />
          <span class="hero-title-accent">一杯好咖啡</span>
        </h1>
        <p class="hero-desc">
          从产地到杯中的每一步，我们用心呈现咖啡本真的味道。
          精选优质产地咖啡豆，手工烘焙，只为这一杯。
        </p>
        <div class="hero-actions">
          <RouterLink to="/menu" class="btn-primary">
            <Coffee :size="18" /> 查看菜单
          </RouterLink>
          <RouterLink to="/stores" class="btn-secondary">
            <MapPin :size="18" /> 查找门店
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="seasonal">
      <div class="container">
        <div class="section-header">
          <div>
            <p class="section-eyebrow">SEASONAL PICKS</p>
            <h2 class="section-title">当季推荐</h2>
          </div>
          <RouterLink to="/menu" class="section-more">
            全部菜单 <ChevronRight :size="16" />
          </RouterLink>
        </div>

        <div class="product-grid">
          <RouterLink
            v-for="product in products"
            :key="product.id"
            to="/menu"
            class="product-card"
          >
            <div class="product-img">
              <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="50" fill="#FDF8F3" />
                <path d="M40 50 L40 80 C40 90 48 96 60 96 C72 96 80 90 80 80 L80 50 Z" fill="#D4A574" opacity="0.3" />
                <ellipse cx="60" cy="50" rx="20" ry="5" fill="#8B4513" opacity="0.2" />
                <path d="M42 50 C42 44 48 40 60 40 C72 40 78 44 78 50" stroke="#8B4513" stroke-width="2.5" fill="none" opacity="0.4" />
                <path d="M55 35 C55 30 60 28 60 28 C60 28 65 30 65 35" stroke="#8B4513" stroke-width="1.5" fill="none" opacity="0.2" />
              </svg>
              <span class="product-badge">推荐</span>
            </div>
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <p class="product-desc">{{ product.description }}</p>
              <p class="product-price">{{ formatYuan(product.price) }}</p>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="stores-section">
      <div class="container">
        <div class="section-header">
          <div>
            <p class="section-eyebrow">OUR STORES</p>
            <h2 class="section-title">门店一览</h2>
          </div>
          <RouterLink to="/stores" class="section-more">
            全部门店 <ChevronRight :size="16" />
          </RouterLink>
        </div>

        <div class="store-grid">
          <RouterLink
            v-for="store in stores"
            :key="store.id"
            to="/stores"
            class="store-card"
          >
            <div class="store-icon">
              <MapPin :size="24" />
            </div>
            <div class="store-info">
              <h3 class="store-name">{{ store.name }}</h3>
              <p class="store-addr">{{ store.address }}</p>
              <div class="store-meta">
                <span class="store-hours">
                  <Clock :size="14" /> {{ store.openTime }} - {{ store.closeTime }}
                </span>
                <span class="store-status" :class="store.status">
                  {{ store.status === 'open' ? '营业中' : '休息中' }}
                </span>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="brand-values">
      <div class="container">
        <div class="values-grid">
          <div class="value-item">
            <div class="value-icon"><Leaf :size="28" /></div>
            <h3>产地直采</h3>
            <p>与优质产区直接合作，减少中间环节，确保每一颗咖啡豆的新鲜与品质。</p>
          </div>
          <div class="value-item">
            <div class="value-icon"><Coffee :size="28" /></div>
            <h3>手工烘焙</h3>
            <p>小批量手工烘焙，根据不同产地和季节调整烘焙曲线，呈现独特风味。</p>
          </div>
          <div class="value-item">
            <div class="value-icon"><Star :size="28" /></div>
            <h3>匠心萃取</h3>
            <p>专业咖啡师团队，精确控制水温和萃取时间，让每一杯都达到最佳状态。</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  padding: 80px 0 100px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-illustration {
  position: absolute;
  right: -50px;
  top: 50%;
  transform: translateY(-50%);
  width: 600px;
  max-width: 60%;
  opacity: 0.8;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 600px;
}

.hero-eyebrow {
  font-size: 0.8rem;
  letter-spacing: 4px;
  color: var(--brand-secondary);
  font-weight: 600;
  margin-bottom: 12px;
}

.hero-title {
  font-family: var(--font-serif);
  font-size: 3.5rem;
  line-height: 1.2;
  font-weight: 900;
  color: var(--brand-text);
  margin-bottom: 20px;
}

.hero-title-accent {
  color: var(--brand-primary);
  position: relative;
}

.hero-title-accent::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  height: 12px;
  background: var(--brand-accent);
  z-index: -1;
  border-radius: 2px;
}

.hero-desc {
  font-size: 1.1rem;
  color: var(--brand-text-light);
  line-height: 1.8;
  margin-bottom: 36px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--brand-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--brand-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: var(--brand-surface);
  color: var(--brand-primary);
  border: 2px solid var(--brand-primary);
}

.btn-secondary:hover {
  background: var(--brand-primary);
  color: white;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 32px;
}

.section-eyebrow {
  font-size: 0.75rem;
  letter-spacing: 3px;
  color: var(--brand-secondary);
  font-weight: 600;
  margin-bottom: 4px;
}

.section-title {
  font-family: var(--font-serif);
  font-size: 2rem;
  font-weight: 700;
  color: var(--brand-text);
}

.section-more {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--brand-primary);
  font-weight: 500;
  font-size: 0.95rem;
}

.section-more:hover {
  gap: 8px;
}

.seasonal {
  padding: 80px 0;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.product-card {
  background: var(--brand-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--brand-border);
  transition: all 0.25s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--brand-accent);
}

.product-img {
  position: relative;
  aspect-ratio: 1;
  background: var(--brand-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-img svg {
  width: 70%;
  height: 70%;
}

.product-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--brand-primary);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
}

.product-info {
  padding: 16px;
}

.product-name {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.product-desc {
  font-size: 0.85rem;
  color: var(--brand-text-light);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--brand-primary);
}

.stores-section {
  padding: 80px 0;
  background: var(--brand-surface);
}

.store-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.store-card {
  display: flex;
  gap: 16px;
  padding: 24px;
  background: var(--brand-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--brand-border);
  transition: all 0.25s;
}

.store-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--brand-accent);
}

.store-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--brand-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.store-name {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.store-addr {
  font-size: 0.85rem;
  color: var(--brand-text-light);
  margin-bottom: 8px;
}

.store-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.store-hours {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: var(--brand-text-light);
}

.store-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
}

.store-status.open {
  background: #E8F5E9;
  color: #2E7D32;
}

.store-status.closed {
  background: #FFEBEE;
  color: #C62828;
}

.brand-values {
  padding: 80px 0;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.value-item {
  text-align: center;
  padding: 32px 24px;
}

.value-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--brand-accent);
  color: var(--brand-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.value-item h3 {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.value-item p {
  font-size: 0.95rem;
  color: var(--brand-text-light);
  line-height: 1.7;
}

@media (max-width: 1024px) {
  .hero-title {
    font-size: 2.8rem;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .store-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 60px 0 80px;
  }

  .hero-illustration {
    position: relative;
    right: auto;
    top: auto;
    transform: none;
    width: 100%;
    max-width: 100%;
    margin-top: 32px;
    opacity: 0.5;
  }

  .hero-title {
    font-size: 2.2rem;
  }

  .hero-desc {
    font-size: 1rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .section-more {
    align-self: flex-end;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .store-grid {
    grid-template-columns: 1fr;
  }

  .values-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .seasonal,
  .stores-section,
  .brand-values {
    padding: 48px 0;
  }
}

@media (max-width: 390px) {
  .hero-title {
    font-size: 1.8rem;
  }

  .hero-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    justify-content: center;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .product-info {
    padding: 12px;
  }

  .store-card {
    padding: 16px;
  }
}
</style>
