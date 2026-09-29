<script setup lang="ts">
const year = new Date().getFullYear();
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <svg class="brand-logo" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M4 22 L12 10 L17 18 L21 12 L28 22 Z" fill="currentColor" opacity="0.9" />
          <circle cx="16" cy="7" r="2.4" fill="currentColor" />
        </svg>
        <div>
          <div class="footer-name">山野咖啡</div>
          <div class="footer-tag">山野之间 · 一杯好咖啡</div>
        </div>
      </div>
      <nav class="footer-nav">
        <router-link to="/menu">菜单</router-link>
        <router-link to="/stores">门店</router-link>
        <router-link to="/story">品牌故事</router-link>
        <router-link to="/member">会员中心</router-link>
      </nav>
    </div>
    <div class="footer-copy">© {{ year }} 山野咖啡 · 虚构品牌，仅用于演示</div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 4rem;
  background: var(--brand-900);
  color: var(--cream-100);
}
.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2.5rem 1.5rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.brand-logo {
  width: 34px;
  height: 34px;
  color: var(--caramel-400);
}
.footer-name {
  font-size: 1.1rem;
  font-weight: 700;
}
.footer-tag {
  font-size: 0.8rem;
  color: var(--brand-300);
}
.footer-nav {
  display: flex;
  gap: 1.5rem;
}
.footer-nav a {
  color: var(--cream-100);
  font-size: 0.9rem;
  opacity: 0.85;
  transition: opacity 0.2s;
}
.footer-nav a:hover {
  opacity: 1;
}
.footer-copy {
  text-align: center;
  padding: 1rem;
  font-size: 0.75rem;
  color: var(--brand-400);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
