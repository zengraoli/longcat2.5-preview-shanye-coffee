<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getSession, clearSession } from '../lib/auth';

const router = useRouter();
const open = ref(false);
const session = getSession();

const links = [
  { to: '/', label: '首页' },
  { to: '/menu', label: '菜单' },
  { to: '/stores', label: '门店' },
  { to: '/story', label: '品牌故事' },
];

const logout = () => {
  clearSession();
  open.value = false;
  router.push('/');
};
</script>

<template>
  <header class="site-header">
    <div class="container header-inner">
      <router-link to="/" class="brand" @click="open = false">
        <svg class="brand-logo" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M4 22 L12 10 L17 18 L21 12 L28 22 Z" fill="currentColor" opacity="0.9" />
          <circle cx="16" cy="7" r="2.4" fill="currentColor" />
        </svg>
        <span class="brand-name">山野咖啡</span>
      </router-link>

      <nav class="nav-desktop" :class="{ 'is-active': false }">
        <router-link
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="nav-link"
          :class="{ 'router-link-active': false }"
        >
          {{ l.label }}
        </router-link>
        <router-link v-if="session" to="/member" class="nav-link">会员中心</router-link>
        <router-link v-else to="/login" class="nav-link">登录</router-link>
      </nav>

      <button
        class="nav-toggle"
        :aria-expanded="open"
        aria-label="菜单"
        @click="open = !open"
      >
        <span :class="{ open }"></span>
        <span :class="{ open }"></span>
        <span :class="{ open }"></span>
      </button>
    </div>

    <transition name="fade">
      <nav v-if="open" class="nav-mobile">
        <router-link
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="nav-mobile-link"
          @click="open = false"
        >
          {{ l.label }}
        </router-link>
        <router-link v-if="session" to="/member" class="nav-mobile-link" @click="open = false">
          会员中心
        </router-link>
        <router-link v-else to="/login" class="nav-mobile-link" @click="open = false">
          登录
        </router-link>
        <button v-if="session" class="nav-mobile-link as-link" @click="logout">退出登录</button>
      </nav>
    </transition>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(251, 248, 243, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--brand-100);
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--brand-primary);
}
.brand-logo {
  width: 30px;
  height: 30px;
}
.brand-name {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--brand-800);
}
.nav-desktop {
  display: flex;
  align-items: center;
  gap: 1.75rem;
}
.nav-link {
  color: var(--brand-700);
  font-weight: 500;
  font-size: 0.95rem;
  padding: 0.25rem 0;
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
}
.nav-link:hover {
  color: var(--brand-primary);
}
.nav-link.router-link-active {
  color: var(--brand-primary);
  border-bottom-color: var(--brand-primary);
}
.nav-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
}
.nav-toggle span {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--brand-800);
  border-radius: 2px;
  transition: transform 0.25s, opacity 0.25s;
}
.nav-toggle span.open:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.nav-toggle span.open:nth-child(2) {
  opacity: 0;
}
.nav-toggle span.open:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}
.nav-mobile {
  display: none;
  flex-direction: column;
  padding: 0.5rem 1.5rem 1rem;
  background: var(--cream-50);
  border-bottom: 1px solid var(--brand-100);
}
.nav-mobile-link {
  padding: 0.75rem 0;
  color: var(--brand-800);
  font-weight: 500;
  border-bottom: 1px solid var(--brand-100);
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  text-align: left;
  font-size: 1rem;
  cursor: pointer;
}
.nav-mobile-link.as-link {
  color: var(--brand-500);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .nav-desktop {
    display: none;
  }
  .nav-toggle {
    display: flex;
  }
  .nav-mobile {
    display: flex;
  }
}
</style>
