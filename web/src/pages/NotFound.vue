<script setup lang="ts">
</script>

<template>
  <div class="container notfound">
    <h1 class="notfound-title">404</h1>
    <p class="notfound-text">页面不存在或已移动</p>
    <router-link to="/" class="btn btn-primary">回到首页</router-link>
  </div>
</template>

<style scoped>
.notfound {
  text-align: center;
  padding: 6rem 1.5rem;
}
.notfound-title {
  font-size: 4rem;
  color: var(--brand-300);
  margin: 0;
}
.notfound-text {
  color: var(--brand-500);
  margin: 0.5rem 0 2rem;
}
</style>
