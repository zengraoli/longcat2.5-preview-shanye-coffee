<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavHeader from '@/components/NavHeader.vue'
</script>

<template>
  <div class="app-shell">
    <NavHeader />
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}
</style>
