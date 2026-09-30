<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  image: string | null;
  name: string;
}>();

// 小程序端用文字图标替代 SVG（mp-weixin 不支持 svg 标签）
const iconText = computed(() => {
  const k = props.image ?? '';
  if (k.includes('coffee') || k.includes('latte') || k.includes('americano') || k.includes('mocha') || k.includes('cappuccino')) return '☕';
  if (k.includes('tea') || k.includes('matcha') || k.includes('jasmine')) return '🍵';
  if (k.includes('croissant') || k.includes('bagel') || k.includes('sandwich') || k.includes('cake') || k.includes('tiramisu')) return '🥐';
  return '🛍';
});

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

const kind = computed<Kind>(() => {
  const k = props.image ?? '';
  if (coffeeKeys.includes(k)) return 'coffee';
  if (teaKeys.includes(k)) return 'tea';
  if (['croissant', 'bagel', 'sandwich', 'wrap', 'tiramisu', 'basque'].includes(k)) return 'food';
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
  <!-- #ifdef H5 -->
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

    <!-- 轻食：按类型区分 -->
    <template v-else-if="kind === 'food'">
      <ellipse cx="60" cy="96" rx="36" ry="6" fill="#000" opacity="0.06" />
      <!-- 可颂 -->
      <template v-if="image === 'croissant'">
        <path d="M28 78 q4 -30 32 -30 t32 30 q-16 8 -32 8 t-32 -8 z" fill="#e9c48a" stroke="#d9a05b" stroke-width="2" />
        <path d="M40 66 q20 -12 40 0 M38 74 q22 -10 44 0" stroke="#b06f2c" stroke-width="2" fill="none" opacity="0.5" />
      </template>
      <!-- 贝果 -->
      <template v-else-if="image === 'bagel'">
        <circle cx="60" cy="66" r="26" fill="#e9c48a" stroke="#d9a05b" stroke-width="2" />
        <circle cx="60" cy="66" r="10" fill="#fbf8f3" />
        <circle cx="52" cy="58" r="2" fill="#b06f2c" />
        <circle cx="68" cy="60" r="2" fill="#b06f2c" />
        <circle cx="60" cy="76" r="2" fill="#b06f2c" />
      </template>
      <!-- 三明治 -->
      <template v-else-if="image === 'sandwich'">
        <path d="M32 60 h56 v10 a6 6 0 0 1 -6 6 h-44 a6 6 0 0 1 -6 -6 z" fill="#e9c48a" stroke="#d9a05b" stroke-width="2" />
        <path d="M32 60 h56" stroke="#7a9a4e" stroke-width="3" />
        <path d="M36 56 h48 l-6 -8 h-36 z" fill="#f5eee1" stroke="#d9a05b" stroke-width="1.5" />
      </template>
      <!-- 鸡肉卷 -->
      <template v-else-if="image === 'wrap'">
        <rect x="34" y="52" width="52" height="26" rx="13" fill="#e9c48a" stroke="#d9a05b" stroke-width="2" />
        <path d="M40 60 h40 M40 68 h40" stroke="#7a9a4e" stroke-width="3" stroke-linecap="round" />
        <circle cx="34" cy="65" r="4" fill="#7a9a4e" />
      </template>
      <!-- 提拉米苏 -->
      <template v-else-if="image === 'tiramisu'">
        <rect x="36" y="52" width="48" height="30" rx="4" fill="#f5eee1" stroke="#d9a05b" stroke-width="2" />
        <rect x="36" y="52" width="48" height="10" rx="4" fill="#6b4226" />
        <path d="M36 66 h48" stroke="#e9c48a" stroke-width="3" />
      </template>
      <!-- 巴斯克 -->
      <template v-else>
        <path d="M36 78 v-16 a24 10 0 0 1 48 0 v16 z" fill="#e9c48a" stroke="#d9a05b" stroke-width="2" />
        <path d="M36 62 a24 10 0 0 1 48 0 v-4 a24 8 0 0 0 -48 0 z" fill="#8a5a2b" />
      </template>
    </template>

    <!-- 周边 -->
    <template v-else>
      <ellipse cx="60" cy="98" rx="30" ry="6" fill="#000" opacity="0.06" />
      <!-- 随行杯 -->
      <template v-if="image === 'tumbler'">
        <path d="M44 40 h32 v52 a10 10 0 0 1 -10 10 h-12 a10 10 0 0 1 -10 -10 z" fill="#356a47" />
        <rect x="42" y="34" width="36" height="8" rx="3" fill="#2b553a" />
        <path d="M50 56 h20 M50 66 h20 M50 76 h14" stroke="#c2dbc8" stroke-width="2.5" stroke-linecap="round" />
      </template>
      <!-- 帆布袋 -->
      <template v-else-if="image === 'canvas-bag'">
        <path d="M40 52 h40 l6 34 a6 6 0 0 1 -6 6 h-40 a6 6 0 0 1 -6 -6 z" fill="#e9dcc3" stroke="#d9a05b" stroke-width="2" />
        <path d="M48 52 v-8 a12 12 0 0 1 24 0 v8" fill="none" stroke="#d9a05b" stroke-width="2.5" />
        <path d="M52 68 h16" stroke="#b06f2c" stroke-width="2.5" stroke-linecap="round" />
      </template>
      <!-- 咖啡豆 -->
      <template v-else>
        <path d="M40 50 h40 l-6 40 a8 8 0 0 1 -8 6 h-12 a8 8 0 0 1 -8 -6 z" fill="#6b4226" />
        <path d="M40 50 h40 v8 h-40 z" fill="#4a2f1d" />
        <ellipse cx="60" cy="72" rx="8" ry="12" fill="#8a5a2b" transform="rotate(-15 60 72)" />
        <path d="M56 62 q6 10 4 22" stroke="#4a2f1d" stroke-width="2" fill="none" transform="rotate(-15 60 72)" />
      </template>
    </template>
  </svg>
  <!-- #endif -->
  <!-- #ifndef H5 -->
  <view class="art art-mp">
    <text class="art-icon">{{ iconText }}</text>
  </view>
  <!-- #endif -->
</template>

<style scoped>
.art {
  width: 100%;
  height: 100%;
  display: block;
}
.art-mp {
  display: flex;
  align-items: center;
  justify-content: center;
}
.art-icon {
  font-size: 60rpx;
  line-height: 1;
}
</style>
