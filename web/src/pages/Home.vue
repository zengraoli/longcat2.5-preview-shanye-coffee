<script setup lang="ts">
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="container hero-inner">
        <h1 class="hero-title">山野之间<br />一杯好咖啡</h1>
        <p class="hero-sub">来自高海拔庄园的当季风味，自采自烘，只为这一杯。</p>
        <div class="hero-actions">
          <router-link to="/menu" class="btn btn-primary">浏览菜单</router-link>
          <router-link to="/stores" class="btn btn-outline">查找门店</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  padding: 5rem 0 4rem;
  background: linear-gradient(160deg, var(--cream-50), var(--brand-50));
  text-align: center;
}
.hero-title {
  font-size: 2.75rem;
  line-height: 1.2;
  color: var(--brand-900);
  margin: 0 0 1rem;
}
.hero-sub {
  color: var(--brand-500);
  font-size: 1.1rem;
  margin: 0 0 2rem;
}
.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}
@media (max-width: 768px) {
  .hero {
    padding: 3rem 0 2.5rem;
  }
  .hero-title {
    font-size: 2rem;
  }
}
</style>
