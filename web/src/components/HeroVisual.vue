<script setup lang="ts">
</script>

<template>
  <svg viewBox="0 0 560 360" class="hero-visual" role="img" aria-label="山野咖啡品牌视觉">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e0ede2" />
        <stop offset="1" stop-color="#fbf8f3" />
      </linearGradient>
      <linearGradient id="mtn-back" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#97c2a3" />
        <stop offset="1" stop-color="#6aa37b" />
      </linearGradient>
      <linearGradient id="mtn-front" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#48855c" />
        <stop offset="1" stop-color="#356a47" />
      </linearGradient>
    </defs>

    <rect width="560" height="360" fill="url(#sky)" />

    <!-- 太阳 -->
    <circle cx="440" cy="80" r="34" fill="#d9a05b" opacity="0.85" />
    <circle cx="440" cy="80" r="46" fill="#d9a05b" opacity="0.18" />

    <!-- 远山 -->
    <path d="M0 240 L90 130 L160 200 L240 110 L330 210 L420 140 L560 250 L560 360 L0 360 Z" fill="url(#mtn-back)" opacity="0.7" />
    <!-- 近山 -->
    <path d="M0 300 L120 190 L210 260 L320 170 L430 270 L560 200 L560 360 L0 360 Z" fill="url(#mtn-front)" />

    <!-- 山间咖啡杯 -->
    <g transform="translate(230 210)">
      <ellipse cx="50" cy="92" rx="46" ry="7" fill="#000" opacity="0.08" />
      <path d="M14 40 h72 v40 a18 18 0 0 1 -18 18 h-36 a18 18 0 0 1 -18 -18 z" fill="#fff" stroke="#e0ede2" stroke-width="2.5" />
      <path d="M86 48 h10 a10 10 0 0 1 0 20 h-10" fill="none" stroke="#e0ede2" stroke-width="3.5" />
      <path d="M16 42 h68 v8 a12 12 0 0 1 -12 12 h-44 a12 12 0 0 1 -12 -12 z" fill="#6b4226" />
      <path d="M36 22 q4 -8 0 -16 M52 22 q4 -8 0 -16 M68 22 q4 -8 0 -16" stroke="#c2dbc8" stroke-width="3" fill="none" stroke-linecap="round" />
    </g>

    <!-- 飘叶 -->
    <g fill="#48855c" opacity="0.55">
      <path d="M120 90 q14 -10 26 2 q-14 10 -26 -2 z" />
      <path d="M480 150 q12 -8 22 2 q-12 8 -22 -2 z" />
      <path d="M180 150 q10 -7 18 2 q-10 7 -18 -2 z" />
    </g>
  </svg>
</template>

<style scoped>
.hero-visual {
  width: 100%;
  height: auto;
  display: block;
}
</style>
