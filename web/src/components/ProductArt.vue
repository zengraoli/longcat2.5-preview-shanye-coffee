<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  image: string | null;
  name: string;
}>();

type Kind = 'coffee' | 'tea' | 'food' | 'merch';

const coffeeKeys = [
  'americano',
  'latte',
  'cappuccino',
  'caramel-macchiato',
  'mocha',
  'cold-brew',
  'oat-latte',
  'pour-over',
];
const teaKeys = [
  'jasmine-tea',
  'four-seasons',
  'peach-oolong',
  'lemon-tea',
  'matcha-latte',
  'osmanthus-oolong',
];
const foodKeys = ['croissant', 'bagel', 'sandwich', 'wrap', 'tiramisu', 'basque'];

const kind = computed<Kind>(() => {
  const k = props.image ?? '';
  if (coffeeKeys.includes(k)) return 'coffee';
  if (teaKeys.includes(k)) return 'tea';
  if (foodKeys.includes(k)) return 'food';
  return 'merch';
});

const liquid = computed(() => {
  switch (props.image) {
    case 'matcha-latte':
    case 'jasmine-tea':
    case 'four-seasons':
      return '#7a9a4e';
    case 'peach-oolong':
    case 'osmanthus-oolong':
      return '#d9a05b';
    case 'lemon-tea':
      return '#e3c565';
    case 'cold-brew':
      return '#4a2f1d';
    default:
      return '#6b4226';
  }
});
</script>

<template>
  <svg viewBox="0 0 120 120" class="art" role="img" :aria-label="name">
    <!-- 咖啡 -->
    <template v-if="kind === 'coffee'">
      <ellipse cx="60" cy="98" rx="34" ry="6" fill="#000" opacity="0.06" />
      <path d="M38 50 h44 v34 a14 14 0 0 1 -14 14 h-16 a14 14 0 0 1 -14 -14 z" fill="#fff" stroke="#e0ede2" stroke-width="2" />
      <path d="M82 56 h8 a8 8 0 0 1 0 16 h-8" fill="none" stroke="#e0ede2" stroke-width="3" />
      <path d="M40 52 h40 v6 a10 10 0 0 1 -10 10 h-20 a10 10 0 0 1 -10 -10 z" :fill="liquid" />
      <path d="M50 34 q3 -6 0 -12 M60 34 q3 -6 0 -12 M70 34 q3 -6 0 -12" stroke="#c2dbc8" stroke-width="2.5" fill="none" stroke-linecap="round" />
    </template>

    <!-- 茶饮 -->
    <template v-else-if="kind === 'tea'">
      <ellipse cx="60" cy="98" rx="34" ry="6" fill="#000" opacity="0.06" />
      <path d="M40 46 h40 v40 a12 12 0 0 1 -12 12 h-16 a12 12 0 0 1 -12 -12 z" fill="#fff" stroke="#e0ede2" stroke-width="2" />
      <path d="M42 48 h36 v8 a8 8 0 0 1 -8 8 h-20 a8 8 0 0 1 -8 -8 z" :fill="liquid" />
      <path d="M52 30 q3 -6 0 -12 M62 30 q3 -6 0 -12" stroke="#c2dbc8" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <circle cx="74" cy="70" r="4" fill="#d9a05b" opacity="0.5" />
    </template>

    <!-- 轻食 -->
    <template v-else-if="kind === 'food'">
      <ellipse cx="60" cy="96" rx="36" ry="6" fill="#000" opacity="0.06" />
      <path d="M30 78 q0 -22 30 -22 t30 22 z" fill="#e9c48a" stroke="#d9a05b" stroke-width="2" />
      <path d="M30 78 h60" stroke="#d9a05b" stroke-width="2" />
      <path d="M42 62 q18 -10 36 0" stroke="#b06f2c" stroke-width="2" fill="none" opacity="0.5" />
      <circle cx="60" cy="50" r="3" fill="#b06f2c" />
    </template>

    <!-- 周边 -->
    <template v-else>
      <ellipse cx="60" cy="98" rx="30" ry="6" fill="#000" opacity="0.06" />
      <path d="M44 40 h32 v52 a10 10 0 0 1 -10 10 h-12 a10 10 0 0 1 -10 -10 z" fill="#356a47" />
      <rect x="42" y="34" width="36" height="8" rx="3" fill="#2b553a" />
      <path d="M50 56 h20 M50 66 h20 M50 76 h14" stroke="#c2dbc8" stroke-width="2.5" stroke-linecap="round" />
    </template>
  </svg>
</template>

<style scoped>
.art {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
