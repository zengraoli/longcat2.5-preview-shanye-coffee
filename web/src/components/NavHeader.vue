<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Menu, X, Coffee } from 'lucide-vue-next'

const mobileOpen = ref(false)

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/menu', label: '菜单' },
  { to: '/stores', label: '门店' },
  { to: '/story', label: '品牌故事' },
  { to: '/member', label: '会员中心' },
]
</script>

<template>
  <header class="nav-header">
    <div class="container nav-inner">
      <RouterLink to="/" class="nav-logo">
        <Coffee :size="28" />
        <span class="logo-text">山野咖啡</span>
      </RouterLink>

      <nav class="nav-links" :class="{ open: mobileOpen }">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          @click="mobileOpen = false"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <button class="nav-toggle" @click="mobileOpen = !mobileOpen" aria-label="菜单">
        <Menu v-if="!mobileOpen" :size="24" />
        <X v-else :size="24" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.nav-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--brand-surface);
  border-bottom: 1px solid var(--brand-border);
  backdrop-filter: blur(12px);
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--brand-primary);
  font-weight: 700;
  font-size: 1.25rem;
}

.logo-text {
  font-family: var(--font-serif);
  letter-spacing: 2px;
}

.nav-links {
  display: flex;
  gap: 32px;
}

.nav-link {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--brand-text-light);
  transition: color 0.2s;
  position: relative;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--brand-primary);
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--brand-primary);
  border-radius: 1px;
}

.nav-toggle {
  display: none;
  color: var(--brand-text);
  padding: 4px;
}

@media (max-width: 768px) {
  .nav-toggle {
    display: block;
  }

  .nav-links {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    background: var(--brand-surface);
    flex-direction: column;
    gap: 0;
    padding: 8px 0;
    border-bottom: 1px solid var(--brand-border);
    box-shadow: var(--shadow-md);
    transform: translateY(-100%);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.25s, opacity 0.25s;
  }

  .nav-links.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .nav-link {
    padding: 12px 20px;
    display: block;
  }

  .nav-link.router-link-active::after {
    display: none;
  }
}
</style>
