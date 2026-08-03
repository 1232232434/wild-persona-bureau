<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { archetypes } from '../data/quiz'

const router = useRouter()

const archetypeCount = computed(() => archetypes.length)
const heroArchetypes = computed(() => archetypes.slice(0, 6))
const atlasArchetypes = computed(() => archetypes)

const beginExperiment = () => {
  router.push('/test?fresh=1')
}
</script>

<template>
  <section class="hero-card page-card">
    <div class="hero-card__copy">
      <span class="eyebrow">人格实验室</span>
      <p class="display-kicker">荒野档案 01</p>
      <h1 class="headline">野性人格局</h1>
      <p class="hero-card__cn">用真实生活情境，测出你在压力、关系与选择里的本能风格</p>
      <p class="subcopy">
        你会在十个贴近现实的场景里做选择，比如临时加急、朋友冷场、边界被踩、功劳被拿走。系统会把你的反应映射成动物人格，再给你一份可分享、也更像在说你的结果档案。
      </p>

      <div class="button-row">
        <button class="button button--primary" type="button" @click="beginExperiment">开始测试</button>
        <RouterLink class="button button--ghost" to="/result?preview=1">预览结果档案</RouterLink>
      </div>

      <div class="tag-list hero-card__tags">
        <span class="tag">10 个情境题</span>
        <span class="tag">{{ archetypeCount }} 种动物人格</span>
        <span class="tag">沉浸式档案结果页</span>
        <span class="tag">三文档协同开发</span>
      </div>

      <div class="kpi-grid hero-card__kpis">
        <div class="kpi-card">
          <span class="muted-label">演示时长</span>
          <strong>3 分钟</strong>
        </div>
        <div class="kpi-card">
          <span class="muted-label">结果形态</span>
          <strong>分享海报</strong>
        </div>
        <div class="kpi-card">
          <span class="muted-label">开发方式</span>
          <strong>三文档协同</strong>
        </div>
      </div>
    </div>

    <aside class="signal-card">
      <div class="signal-card__mesh"></div>
      <div class="signal-card__ring signal-card__ring--outer"></div>
      <div class="signal-card__ring signal-card__ring--inner"></div>

      <div class="signal-card__core">
        <span>本能反应堆</span>
        <strong>{{ archetypeCount }} 种动物</strong>
        <small>压力 / 冒险 / 节奏 / 回充</small>
      </div>

      <div class="signal-card__badge signal-card__badge--top">人格档案</div>
      <div class="signal-card__badge signal-card__badge--left">可分享</div>
      <div class="signal-card__badge signal-card__badge--right">可拓展</div>

      <div class="signal-card__ledger">
        <div class="signal-card__row">
          <span>场景数</span>
          <strong>10</strong>
        </div>
        <div class="signal-card__row">
          <span>输出物</span>
          <strong>人格海报</strong>
        </div>
        <div class="signal-card__row">
          <span>方法论</span>
          <strong>规范 / 计划 / 任务</strong>
        </div>
      </div>
    </aside>
  </section>

  <section class="feature-grid">
    <article class="panel">
      <div class="muted-label">为什么好玩</div>
      <h3>你不会被追问抽象形容词，而是会在生活场景里自然暴露自己的反应。</h3>
      <p>
        题目不是“你内向还是外向”这种老路子，而是把工作、社交、关系边界和选择压力放到你面前，看你下意识会怎么做。
      </p>
    </article>

    <article class="panel">
      <div class="muted-label">结果风格</div>
      <h3>结果不是生硬贴标签，而是像一份在认真观察你的生活型人格档案。</h3>
      <p>
        你会看到自己的优势、容易失衡的地方、适合发光的场景，以及几条真正能落地的小建议，而不是空泛金句。
      </p>
    </article>

    <article class="panel">
      <div class="muted-label">开发方式</div>
      <h3>它既是一款完整产品，也把三文档协同开发方式落到了仓库里。</h3>
      <p>
        仓库内同时包含规范文档、技术计划和执行任务清单，既能看见界面，也能看见这款产品是怎么被系统做出来的。
      </p>
    </article>
  </section>

  <section class="insight-grid">
    <article class="panel process-panel">
      <div class="muted-label">体验流程</div>
      <h3>从氛围铺陈到人格归档，一共四步。</h3>
      <div class="process-list">
        <div class="process-item">
          <span>01</span>
          <div>
            <strong>先代入生活</strong>
            <p>你先进入十个真实又熟悉的生活场景，而不是被迫回答抽象问题。</p>
          </div>
        </div>
        <div class="process-item">
          <span>02</span>
          <div>
            <strong>再暴露本能</strong>
            <p>系统抓取的是你第一反应里的节奏、边界、冒险感和能量来源。</p>
          </div>
        </div>
        <div class="process-item">
          <span>03</span>
          <div>
            <strong>映射结构维度</strong>
            <p>每次选择都会沉淀成五维画像，再和不同动物人格进行匹配。</p>
          </div>
        </div>
        <div class="process-item">
          <span>04</span>
          <div>
            <strong>交付结果档案</strong>
            <p>最后你会拿到一份更像在讲你本人的人格档案和可分享结果海报。</p>
          </div>
        </div>
      </div>
    </article>

    <article class="panel atlas-panel">
      <div class="muted-label">动物图鉴</div>
      <h3>每一种结果都有自己独立的性格气质。</h3>
      <div class="atlas-ribbon">
        <span v-for="archetype in heroArchetypes" :key="archetype.id" class="atlas-chip">
          {{ archetype.animal }}
        </span>
      </div>
      <div class="atlas-grid">
        <article v-for="archetype in atlasArchetypes" :key="archetype.id" class="atlas-card">
          <div class="muted-label">{{ archetype.animal }}</div>
          <h4>{{ archetype.name }}</h4>
          <p>{{ archetype.summary }}</p>
          <div class="tag-list">
            <span v-for="trait in archetype.traits" :key="trait" class="tag">{{ trait }}</span>
          </div>
        </article>
      </div>
    </article>
  </section>
</template>

<style scoped>
.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: 26px;
  margin-top: 12px;
  padding: 42px;
}

.hero-card__copy {
  position: relative;
  z-index: 1;
}

.hero-card__cn {
  margin: 0 0 18px;
  color: rgba(243, 234, 214, 0.86);
  font-family: var(--font-display);
  font-size: clamp(1.2rem, 2.6vw, 1.7rem);
  line-height: 1.7;
}

.hero-card__tags {
  margin-top: 22px;
}

.hero-card__kpis {
  margin-top: 28px;
}

.signal-card {
  position: relative;
  min-height: 520px;
  border-radius: calc(var(--radius-2xl) - 6px);
  border: 1px solid var(--line);
  background:
    radial-gradient(circle at 50% 48%, rgba(214, 191, 134, 0.14), transparent 22%),
    linear-gradient(160deg, rgba(12, 23, 21, 0.96), rgba(11, 17, 16, 0.92));
  overflow: hidden;
}

.signal-card__mesh {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 56px 56px;
  opacity: 0.38;
}

.signal-card__ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(214, 191, 134, 0.18);
}

.signal-card__ring--outer {
  inset: 72px;
}

.signal-card__ring--inner {
  inset: 132px;
  border-style: dashed;
}

.signal-card__core {
  position: absolute;
  inset: 50%;
  width: 230px;
  height: 230px;
  margin-left: -115px;
  margin-top: -115px;
  display: grid;
  place-items: center;
  text-align: center;
  border-radius: 50%;
  border: 1px solid rgba(214, 191, 134, 0.24);
  background:
    radial-gradient(circle at 30% 30%, rgba(214, 191, 134, 0.24), transparent 48%),
    rgba(13, 22, 20, 0.9);
  box-shadow: inset 0 0 60px rgba(255, 255, 255, 0.02);
}

.signal-card__core span,
.signal-card__core small {
  display: block;
}

.signal-card__core span {
  color: var(--muted);
  font-size: 0.74rem;
  letter-spacing: 0.2em;
}

.signal-card__core strong {
  margin: 8px 0;
  font-family: var(--font-display);
  font-size: 2.2rem;
  letter-spacing: 0.04em;
}

.signal-card__core small {
  color: rgba(188, 174, 144, 0.74);
  font-size: 0.78rem;
  line-height: 1.7;
}

.signal-card__badge {
  position: absolute;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font-size: 0.76rem;
  letter-spacing: 0.12em;
}

.signal-card__badge--top {
  top: 26px;
  left: 50%;
  transform: translateX(-50%);
}

.signal-card__badge--left {
  left: 34px;
  top: 50%;
  transform: translateY(-50%) rotate(-90deg);
}

.signal-card__badge--right {
  right: 24px;
  top: 50%;
  transform: translateY(-50%) rotate(90deg);
}

.signal-card__ledger {
  position: absolute;
  left: 26px;
  right: 26px;
  bottom: 26px;
  display: grid;
  gap: 10px;
}

.signal-card__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
}

.signal-card__row span {
  color: var(--muted);
  letter-spacing: 0.12em;
  font-size: 0.74rem;
}

.signal-card__row strong {
  font-family: var(--font-display);
  font-size: 1rem;
}

.feature-grid {
  margin-top: 22px;
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.insight-grid {
  margin-top: 22px;
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 0.84fr) minmax(0, 1.16fr);
}

.process-list {
  margin-top: 18px;
  display: grid;
  gap: 16px;
}

.process-item {
  display: grid;
  grid-template-columns: 58px 1fr;
  gap: 14px;
  align-items: start;
  padding-top: 6px;
}

.process-item span {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: rgba(214, 191, 134, 0.08);
  font-family: var(--font-display);
  font-size: 1.2rem;
}

.process-item strong {
  display: block;
  margin-bottom: 6px;
  font-size: 1rem;
}

.process-item p {
  margin: 0;
}

.atlas-ribbon {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.atlas-chip {
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  color: var(--accent);
  background: rgba(214, 191, 134, 0.06);
}

.atlas-grid {
  margin-top: 18px;
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.atlas-card {
  padding: 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.025);
}

.atlas-card h4,
.atlas-card p {
  margin: 0;
}

.atlas-card h4 {
  margin-top: 8px;
  font-size: 1.05rem;
}

.atlas-card p {
  margin-top: 10px;
  color: var(--muted);
  line-height: 1.7;
}

.atlas-card .tag-list {
  margin-top: 14px;
}

@media (max-width: 1024px) {
  .hero-card,
  .feature-grid,
  .insight-grid {
    grid-template-columns: 1fr;
  }

  .hero-card {
    padding: 24px;
  }
}

@media (max-width: 640px) {
  .atlas-grid {
    grid-template-columns: 1fr;
  }

  .signal-card {
    min-height: 440px;
  }

  .signal-card__ring--outer {
    inset: 52px;
  }

  .signal-card__ring--inner {
    inset: 102px;
  }
}
</style>
