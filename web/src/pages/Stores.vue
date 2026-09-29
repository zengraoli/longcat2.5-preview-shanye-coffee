<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../lib/api';
import type { Store } from '../lib/types';

const stores = ref<Store[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    stores.value = await api.get<Store[]>('/api/stores');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="stores-page">
    <div class="container">
      <header class="page-head">
        <h1 class="page-title">门店</h1>
        <p class="page-sub">三家门店，欢迎光临</p>
      </header>

      <div v-if="loading" class="list">
        <div v-for="i in 3" :key="i" class="store-card card skeleton"></div>
      </div>
      <div v-else class="list">
        <div v-for="s in stores" :key="s.id" class="store-card card">
          <div class="store-top">
            <div class="store-name">{{ s.name }}</div>
            <span class="store-status" :class="s.isOpen ? 'open' : 'closed'">
              {{ s.isOpen ? '营业中' : '休息中' }}
            </span>
          </div>
          <div class="store-row">
            <svg viewBox="0 0 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <span>{{ s.address }}</span>
          </div>
          <div class="store-row">
            <svg viewBox="0 0 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span>{{ s.openTime }} - {{ s.closeTime }}</span>
          </div>
          <div class="store-row">
            <svg viewBox="0 0 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
            </svg>
            <span>{{ s.phone ?? '暂无电话' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stores-page {
  padding-bottom: 3rem;
}
.page-head {
  padding: 2.5rem 0 1.75rem;
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
.list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}
.store-card {
  padding: 1.5rem;
}
.store-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.store-name {
  font-weight: 700;
  color: var(--brand-900);
  font-size: 1.1rem;
}
.store-status {
  font-size: 0.72rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-weight: 600;
  white-space: nowrap;
}
.store-status.open {
  background: var(--brand-100);
  color: var(--brand-700);
}
.store-status.closed {
  background: var(--cream-200);
  color: var(--brand-500);
}
.store-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--brand-600);
  font-size: 0.9rem;
  padding: 0.35rem 0;
}
.icon {
  width: 18px;
  height: 18px;
  color: var(--brand-400);
  flex-shrink: 0;
}
.skeleton {
  aspect-ratio: 4/3;
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
@media (max-width: 1024px) {
  .list {
    grid-template-columns: 1fr;
  }
}
</style>
