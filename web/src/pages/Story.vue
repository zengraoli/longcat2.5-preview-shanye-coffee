<script setup lang="ts">
const steps = [
  {
    title: '高山庄园',
    desc: '产自海拔 1200 米以上的咖啡庄园，昼夜温差大，咖啡果成熟缓慢，风味更加集中。',
    icon: 'M3 20 L10 8 L14 14 L17 10 L21 20 Z M10 8 a2 2 0 1 1 0.1 0',
  },
  {
    title: '手工采摘',
    desc: '只采摘全红成熟的咖啡果，手工逐颗筛选，剔除未熟与过熟果，保证每一颗的品质。',
    icon: 'M12 3 c3 4 6 6 6 10 a6 6 0 0 1 -12 0 c0 -4 3 -6 6 -10 z M12 13 v6',
  },
  {
    title: '当日现烘',
    desc: '下单前 24 小时内新鲜烘焙，小批量慢烘，保留咖啡豆最本真的香气与层次。',
    icon: 'M6 18 h12 M8 18 v-6 a4 4 0 0 1 8 0 v6 M12 6 v2 M9 8 l1 1 M15 8 l-1 1',
  },
  {
    title: '冲煮呈现',
    desc: '专业咖啡师手冲或意式萃取，根据每款豆子的特性调整参数，呈现最佳风味。',
    icon: 'M5 9 h11 v4 a5 5 0 0 1 -5 5 h-1 a5 5 0 0 1 -5 -5 z M16 10 h2 a2 2 0 0 1 0 4 h-2 M8 5 q1 -2 0 -3 M12 5 q1 -2 0 -3',
  },
];

const values = [
  {
    title: '自然本味',
    desc: '不添加、不修饰，保留咖啡最真实的风味。',
    icon: 'M12 3 c4 5 7 8 7 12 a7 7 0 0 1 -14 0 c0 -4 3 -7 7 -12 z',
  },
  {
    title: '可持续',
    desc: '与庄园建立长期合作，支持生态种植与公平贸易。',
    icon: 'M12 21 c-5 -3 -8 -7 -8 -11 a8 8 0 0 1 16 0 c0 4 -3 8 -8 11 z M12 21 V10 M12 13 l-3 -2 M12 15 l3 -2',
  },
  {
    title: '匠心工艺',
    desc: '从生豆到杯中的每一步，都由经验丰富的团队把控。',
    icon: 'M12 3 l2.5 5 5.5.8 -4 4 1 5.7 -5 -2.7 -5 2.7 1 -5.7 -4 -4 5.5 -.8 z',
  },
];
</script>

<template>
  <div class="story-page">
    <!-- 品牌故事主视觉 -->
    <section class="story-hero">
      <div class="container story-hero-inner">
        <div class="story-hero-copy">
          <span class="hero-eyebrow">OUR STORY</span>
          <h1 class="story-title">从山野到一杯</h1>
          <p class="story-lead">
            山野咖啡始于一次高海拔庄园的旅行。我们被那里纯净的空气、
            昼夜温差与咖啡果的香气打动，决定把这份山野之间的风味，
            原原本本地带到你的杯中。
          </p>
        </div>
        <div class="story-hero-art">
          <svg viewBox="0 0 560 320" class="art" role="img" aria-label="山野咖啡故事插画">
            <defs>
              <linearGradient id="s-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#e0ede2" />
                <stop offset="1" stop-color="#fbf8f3" />
              </linearGradient>
            </defs>
            <rect width="560" height="320" fill="url(#s-sky)" />
            <circle cx="120" cy="70" r="30" fill="#d9a05b" opacity="0.8" />
            <path d="M0 220 L100 110 L180 190 L270 100 L370 200 L460 130 L560 220 L560 320 L0 320 Z" fill="#97c2a3" opacity="0.6" />
            <path d="M0 270 L130 160 L230 240 L350 150 L470 250 L560 180 L560 320 L0 320 Z" fill="#48855c" />
            <!-- 咖啡树 -->
            <g transform="translate(400 180)">
              <rect x="-4" y="20" width="8" height="50" rx="3" fill="#6b4226" />
              <circle cx="0" cy="10" r="26" fill="#356a47" />
              <circle cx="-18" cy="22" r="18" fill="#48855c" />
              <circle cx="18" cy="22" r="18" fill="#48855c" />
              <circle cx="-8" cy="6" r="3" fill="#c9853c" />
              <circle cx="10" cy="14" r="3" fill="#c9853c" />
              <circle cx="2" cy="-6" r="3" fill="#c9853c" />
            </g>
            <!-- 咖啡豆 -->
            <g transform="translate(120 240)">
              <ellipse cx="0" cy="0" rx="16" ry="20" fill="#6b4226" transform="rotate(-20)" />
              <path d="M-6 -14 q8 14 6 28" stroke="#4a2f1d" stroke-width="2.5" fill="none" transform="rotate(-20)" />
            </g>
          </svg>
        </div>
      </div>
    </section>

    <!-- 从山野到一杯 -->
    <section class="section">
      <div class="container">
        <h2 class="section-title center">从山野到一杯</h2>
        <p class="section-sub center">每一步，都只为保留最本真的风味</p>
        <div class="steps">
          <div v-for="(s, i) in steps" :key="s.title" class="step card">
            <div class="step-num">{{ String(i + 1).padStart(2, '0') }}</div>
            <svg viewBox="0 0 24 24" class="step-icon" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path :d="s.icon" />
            </svg>
            <div class="step-title">{{ s.title }}</div>
            <div class="step-desc">{{ s.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 品牌理念 -->
    <section class="section section-alt">
      <div class="container">
        <h2 class="section-title center">品牌理念</h2>
        <p class="section-sub center">我们相信，好咖啡是自然与匠心的结合</p>
        <div class="values">
          <div v-for="v in values" :key="v.title" class="value card">
            <svg viewBox="0 0 24 24" class="value-icon" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path :d="v.icon" />
            </svg>
            <div class="value-title">{{ v.title }}</div>
            <div class="value-desc">{{ v.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 品牌承诺 -->
    <section class="section">
      <div class="container promise">
        <div class="promise-card card">
          <h2 class="promise-title">我们的承诺</h2>
          <p class="promise-text">
            每一杯山野咖啡，都来自高海拔庄园的当季生豆，
            在 24 小时内新鲜烘焙，由专业咖啡师冲煮呈现。
            我们不追求规模，只追求每一杯的稳定与本真。
          </p>
          <router-link to="/menu" class="btn btn-primary">探索菜单</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.story-hero {
  background: linear-gradient(160deg, var(--cream-50), var(--brand-50));
  overflow: hidden;
}
.story-hero-inner {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 2.5rem;
  align-items: center;
  padding-top: 3rem;
  padding-bottom: 3rem;
}
.hero-eyebrow {
  display: inline-block;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  color: var(--caramel-500);
  font-weight: 600;
  margin-bottom: 1rem;
}
.story-title {
  font-size: 2.75rem;
  font-weight: 800;
  color: var(--brand-900);
  margin: 0 0 1.25rem;
  line-height: 1.15;
}
.story-lead {
  color: var(--brand-600);
  font-size: 1.05rem;
  line-height: 1.8;
  max-width: 30rem;
}
.story-hero-art .art {
  width: 100%;
  height: auto;
  border-radius: var(--radius);
}

.section {
  padding: 3.5rem 0;
}
.section-alt {
  background: var(--cream-100);
}
.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--brand-900);
  margin: 0 0 0.5rem;
}
.section-title.center {
  text-align: center;
}
.section-sub {
  color: var(--brand-500);
  margin: 0 0 2rem;
}
.section-sub.center {
  text-align: center;
}

.steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}
.step {
  padding: 1.75rem 1.5rem;
  text-align: center;
}
.step-num {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--caramel-500);
  letter-spacing: 0.1em;
  margin-bottom: 0.75rem;
}
.step-icon {
  width: 40px;
  height: 40px;
  color: var(--brand-primary);
  margin-bottom: 0.75rem;
}
.step-title {
  font-weight: 700;
  color: var(--brand-900);
  margin-bottom: 0.5rem;
}
.step-desc {
  font-size: 0.85rem;
  color: var(--brand-500);
  line-height: 1.7;
}

.values {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}
.value {
  padding: 2rem 1.75rem;
  text-align: center;
}
.value-icon {
  width: 44px;
  height: 44px;
  color: var(--brand-primary);
  margin-bottom: 1rem;
}
.value-title {
  font-weight: 700;
  color: var(--brand-900);
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}
.value-desc {
  color: var(--brand-500);
  font-size: 0.9rem;
}

.promise {
  display: flex;
  justify-content: center;
}
.promise-card {
  max-width: 640px;
  text-align: center;
  padding: 3rem 2.5rem;
}
.promise-title {
  font-size: 1.75rem;
  color: var(--brand-900);
  margin: 0 0 1rem;
}
.promise-text {
  color: var(--brand-600);
  line-height: 1.9;
  margin: 0 0 1.75rem;
}

@media (max-width: 1024px) {
  .story-hero-inner {
    grid-template-columns: 1fr;
  }
  .story-hero-art {
    order: -1;
  }
  .steps {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .story-title {
    font-size: 2rem;
  }
  .steps {
    grid-template-columns: 1fr;
  }
  .values {
    grid-template-columns: 1fr;
  }
}
</style>
