<script setup lang="ts">
import { Leaf, Sun, Droplets, Award, Heart, Mountain } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="story-page">
    <section class="story-hero">
      <div class="container">
        <p class="story-eyebrow">OUR STORY</p>
        <h1 class="story-title">从山野到杯中</h1>
        <p class="story-subtitle">
          山野咖啡始于对纯粹味道的追求。我们相信，一杯好咖啡，源于对产地、工艺与匠心的执着。
        </p>
      </div>
    </section>

    <section class="story-timeline">
      <div class="container">
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-icon"><Mountain :size="24" /></div>
            <div class="timeline-content">
              <h3>产地直采</h3>
              <p>我们深入优质咖啡产区，与当地农户建立长期合作，确保每一颗咖啡豆都符合品质标准。</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-icon"><Sun :size="24" /></div>
            <div class="timeline-content">
              <h3>手工烘焙</h3>
              <p>小批量手工烘焙，根据产地特性和季节变化，调整烘焙曲线，呈现最佳风味。</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-icon"><Droplets :size="24" /></div>
            <div class="timeline-content">
              <h3>匠心萃取</h3>
              <p>精确控制水温、粉量与萃取时间，让每一杯咖啡都达到理想的风味平衡。</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="story-values">
      <div class="container">
        <h2 class="values-title">我们的坚持</h2>
        <div class="values-grid">
          <div class="value-card">
            <div class="value-icon"><Leaf :size="32" /></div>
            <h4>自然种植</h4>
            <p>尊重自然规律，采用有机种植方式，不使用化学农药，保护生态环境。</p>
          </div>
          <div class="value-card">
            <div class="value-icon"><Award :size="32" /></div>
            <h4>品质至上</h4>
            <p>从产地到杯中的每一个环节都严格把关，只为呈现最纯粹的咖啡风味。</p>
          </div>
          <div class="value-card">
            <div class="value-icon"><Heart :size="32" /></div>
            <h4>社区连接</h4>
            <p>咖啡是连接人与人之间的桥梁。我们希望成为社区的一部分，与每一位顾客建立真挚连接。</p>
          </div>
        </div>
      </div>
    </section>

    <section class="story-quote">
      <div class="container">
        <blockquote class="quote">
          <p>"每一杯咖啡，都是我们写给山野的情书。"</p>
          <cite>— 山野咖啡主理人</cite>
        </blockquote>
      </div>
    </section>

    <section class="story-cta">
      <div class="container">
        <div class="cta-inner">
          <h2>来山野喝一杯</h2>
          <p>找到离你最近的门店，体验这一杯来自山野的味道。</p>
          <RouterLink to="/stores" class="btn-cta">查找门店</RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.story-hero {
  padding: 100px 0 80px;
  text-align: center;
  background: linear-gradient(135deg, var(--brand-bg) 0%, var(--brand-accent) 100%);
}

.story-eyebrow {
  font-size: 0.75rem;
  letter-spacing: 4px;
  color: var(--brand-secondary);
  font-weight: 600;
  margin-bottom: 16px;
}

.story-title {
  font-family: var(--font-serif);
  font-size: 3.5rem;
  font-weight: 900;
  margin-bottom: 24px;
  color: var(--brand-text);
}

.story-subtitle {
  font-size: 1.15rem;
  color: var(--brand-text-light);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.8;
}

.story-timeline {
  padding: 80px 0;
}

.timeline {
  max-width: 700px;
  margin: 0 auto;
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 24px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--brand-border);
}

.timeline-item {
  display: flex;
  gap: 24px;
  margin-bottom: 40px;
  position: relative;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--brand-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.timeline-content h3 {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.timeline-content p {
  font-size: 0.95rem;
  color: var(--brand-text-light);
  line-height: 1.7;
}

.story-values {
  padding: 80px 0;
  background: var(--brand-surface);
}

.values-title {
  font-family: var(--font-serif);
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 48px;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.value-card {
  text-align: center;
  padding: 32px 24px;
  background: var(--brand-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--brand-border);
}

.value-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--brand-accent);
  color: var(--brand-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.value-card h4 {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.value-card p {
  font-size: 0.9rem;
  color: var(--brand-text-light);
  line-height: 1.7;
}

.story-quote {
  padding: 80px 0;
}

.quote {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.quote p {
  font-family: var(--font-serif);
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.6;
  color: var(--brand-text);
  margin-bottom: 20px;
}

.quote cite {
  font-size: 1rem;
  color: var(--brand-text-light);
  font-style: normal;
}

.story-cta {
  padding: 0 0 100px;
}

.cta-inner {
  background: var(--brand-primary);
  border-radius: var(--radius-lg);
  padding: 60px 40px;
  text-align: center;
  color: white;
}

.cta-inner h2 {
  font-family: var(--font-serif);
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.cta-inner p {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 28px;
}

.btn-cta {
  display: inline-flex;
  align-items: center;
  padding: 14px 32px;
  background: white;
  color: var(--brand-primary);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .story-title {
    font-size: 2.5rem;
  }

  .values-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .timeline::before {
    left: 20px;
  }

  .timeline-icon {
    width: 40px;
    height: 40px;
  }

  .timeline-item {
    gap: 16px;
  }
}

@media (max-width: 390px) {
  .story-title {
    font-size: 2rem;
  }

  .story-hero {
    padding: 60px 0;
  }

  .cta-inner {
    padding: 40px 24px;
  }
}
</style>
