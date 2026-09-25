<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api'
import type { Store } from '@/types'
import { MapPin, Clock, Phone, Navigation } from 'lucide-vue-next'

const stores = ref<Store[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await api.get<Store[]>('/stores')
    stores.value = data
  } catch {} finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="stores-page">
    <div class="container">
      <header class="page-header">
        <p class="page-eyebrow">FIND US</p>
        <h1 class="page-title">我们的门店</h1>
        <p class="page-desc">来店里坐坐，喝杯好咖啡</p>
      </header>

      <div v-if="loading" class="loading">加载中...</div>

      <div v-else class="stores-list">
        <div v-for="store in stores" :key="store.id" class="store-card">
          <div class="store-map">
            <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="200" height="120" rx="8" fill="#FDF8F3" />
              <path d="M0 60 L200 60" stroke="#E8DDD4" stroke-width="1" />
              <path d="M100 0 L100 120" stroke="#E8DDD4" stroke-width="1" />
              <circle cx="100" cy="60" r="40" fill="#D4A574" opacity="0.15" />
              <circle cx="100" cy="60" r="8" fill="#8B4513" />
              <path d="M96 60 L100 52 L104 60 L100 68 Z" fill="white" />
            </svg>
          </div>
          <div class="store-body">
            <div class="store-header">
              <h3 class="store-name">{{ store.name }}</h3>
              <span :class="['store-status', store.status]">
                {{ store.status === 'open' ? '营业中' : '休息中' }}
              </span>
            </div>
            <div class="store-details">
              <div class="store-row">
                <MapPin :size="16" />
                <span>{{ store.address }}</span>
              </div>
              <div class="store-row">
                <Clock :size="16" />
                <span>{{ store.openTime }} - {{ store.closeTime }}</span>
              </div>
              <div class="store-row">
                <Phone :size="16" />
                <span>{{ store.phone }}</span>
              </div>
            </div>
            <a
              :href="`https://map.baidu.com/search/${encodeURIComponent(store.address)}`"
              target="_blank"
              rel="noopener"
              class="store-nav"
            >
              <Navigation :size="14" /> 导航前往
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stores-page {
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

.loading {
  text-align: center;
  padding: 60px 0;
  color: var(--brand-text-light);
}

.stores-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.store-card {
  display: flex;
  background: var(--brand-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--brand-border);
  overflow: hidden;
  transition: all 0.25s;
}

.store-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--brand-accent);
}

.store-map {
  width: 200px;
  flex-shrink: 0;
}

.store-map svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.store-body {
  flex: 1;
  padding: 24px;
}

.store-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.store-name {
  font-size: 1.25rem;
  font-weight: 700;
}

.store-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
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

.store-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.store-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--brand-text-light);
}

.store-row svg {
  color: var(--brand-secondary);
  flex-shrink: 0;
}

.store-nav {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--brand-primary);
  font-size: 0.9rem;
  font-weight: 500;
}

.store-nav:hover {
  gap: 10px;
}

@media (max-width: 768px) {
  .store-card {
    flex-direction: column;
  }

  .store-map {
    width: 100%;
    height: 160px;
  }

  .page-title {
    font-size: 2rem;
  }
}

@media (max-width: 390px) {
  .store-body {
    padding: 16px;
  }

  .store-name {
    font-size: 1.1rem;
  }
}
</style>
