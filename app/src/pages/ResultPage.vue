<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import DimensionMeter from '../components/DimensionMeter.vue'
import { archetypes, dimensionMeta } from '../data/quiz'
import { createFallbackNarration, type PersonaNarration } from '../prompts/personaNarrator'
import { generatePersonaNarration, type NarrationResult } from '../services/narrator'
import { useQuizStore } from '../stores/quiz'
import type { DimensionKey, RankedArchetype } from '../types/quiz'
import { buildResultProfile, rankArchetypes } from '../utils/scoring'
import { renderResultPoster } from '../utils/resultPoster'

const route = useRoute()
const router = useRouter()
const quiz = useQuizStore()
const isExporting = ref(false)
const posterPreviewUrl = ref<string | null>(null)
const posterFileName = ref('')
const narration = ref<PersonaNarration | null>(null)
const narrationSource = ref<NarrationResult['source']>('mock')
const narrationModel = ref<string | null>(null)
const narrationWarning = ref<string | null>(null)
const narrationStatus = ref<'idle' | 'loading' | 'ready'>('idle')
let narrationRequestId = 0

const previewMode = computed(() => route.query.preview === '1')
const fallbackResult = archetypes[0]
const hasCompleteResult = computed(() => quiz.isFinished && Boolean(quiz.result))
const hasPartialProgress = computed(() => !previewMode.value && quiz.answers.length > 0 && !quiz.isFinished)

const displayedScores = computed(() => {
  if (previewMode.value) {
    return fallbackResult.signature
  }

  if (hasCompleteResult.value) {
    return quiz.scores
  }

  return fallbackResult.signature
})

const displayRanking = computed(() => rankArchetypes(displayedScores.value))

const activeResult = computed<RankedArchetype | null>(() => {
  if (previewMode.value || hasCompleteResult.value) {
    return displayRanking.value[0] ?? null
  }

  return null
})

const activeRunnerUp = computed<RankedArchetype | null>(() => {
  if (previewMode.value || hasCompleteResult.value) {
    return displayRanking.value[1] ?? displayRanking.value[0] ?? null
  }

  return null
})

const activeMatch = computed(() => activeResult.value?.match ?? 88)

const resultProfile = computed(() => {
  if (!activeResult.value) {
    return null
  }

  return buildResultProfile(displayedScores.value, displayRanking.value)
})

const scoreEntries = computed(
  () => Object.entries(displayedScores.value) as Array<[DimensionKey, number]>,
)

const dominantDimension = computed(() =>
  [...scoreEntries.value].sort((left, right) => right[1] - left[1])[0],
)

const reportCode = computed(() => {
  if (!activeResult.value) {
    return '预览档案'
  }

  const index = archetypes.findIndex((item) => item.id === activeResult.value?.id)
  return index >= 0 ? `档案 ${String(index + 1).padStart(2, '0')}` : '档案 未编号'
})

const adjacentSharedLabelText = computed(() => resultProfile.value?.adjacent.sharedSignalLabels.join(' / ') ?? '')

const narrationSeed = computed(() => {
  if (!activeResult.value) {
    return null
  }

  return JSON.stringify({
    archetype: activeResult.value.id,
    runnerUp: activeRunnerUp.value?.id ?? activeResult.value.id,
    scores: displayedScores.value,
  })
})

const blendedAdvice = computed(() => {
  if (!activeResult.value) {
    return []
  }

  const items = [narration.value?.actionAdvice, ...activeResult.value.advice].filter(
    (item): item is string => Boolean(item),
  )

  return [...new Set(items)]
})

const narrationModeLabel = computed(() => {
  if (previewMode.value && narrationSource.value === 'mock') {
    return '示例解读'
  }

  if (narrationSource.value === 'proxy') {
    return '在线解读'
  }

  if (narrationSource.value === 'fallback') {
    return '本地解读'
  }

  return '系统解读'
})

const loadNarration = async () => {
  if (!activeResult.value) {
    narration.value = null
    narrationStatus.value = 'idle'
    narrationWarning.value = null
    narrationModel.value = null
    return
  }

  const currentRequestId = ++narrationRequestId
  narrationStatus.value = 'loading'
  narrationWarning.value = null

  if (previewMode.value) {
    narration.value = createFallbackNarration({
      archetype: activeResult.value,
      runnerUp: activeRunnerUp.value ?? activeResult.value,
      scores: displayedScores.value,
    })
    narrationSource.value = 'mock'
    narrationModel.value = null
    narrationStatus.value = 'ready'
    return
  }

  const result = await generatePersonaNarration({
    archetype: activeResult.value,
    runnerUp: activeRunnerUp.value ?? activeResult.value,
    scores: displayedScores.value,
  })

  if (currentRequestId !== narrationRequestId) {
    return
  }

  narration.value = result.narration
  narrationSource.value = result.source
  narrationModel.value = result.model ?? null
  narrationWarning.value = result.warning ?? null
  narrationStatus.value = 'ready'
}

watch(
  narrationSeed,
  () => {
    void loadNarration()
  },
  { immediate: true },
)

const restartQuiz = () => {
  router.push('/test?fresh=1')
}

const resumeQuiz = () => {
  router.push('/test?resume=1')
}

const revokePosterPreviewUrl = () => {
  if (posterPreviewUrl.value) {
    URL.revokeObjectURL(posterPreviewUrl.value)
    posterPreviewUrl.value = null
  }
}

const closePosterPreview = () => {
  revokePosterPreviewUrl()
  posterFileName.value = ''
}

const openPosterPreviewInNewTab = () => {
  if (!posterPreviewUrl.value) {
    return
  }

  window.open(posterPreviewUrl.value, '_blank', 'noopener,noreferrer')
}

onBeforeUnmount(() => {
  revokePosterPreviewUrl()
})

const exportShareCard = async () => {
  if (!activeResult.value || !activeRunnerUp.value) {
    return
  }

  isExporting.value = true

  try {
    const posterNarration =
      narration.value ??
      createFallbackNarration({
        archetype: activeResult.value,
        runnerUp: activeRunnerUp.value,
        scores: displayedScores.value,
      })

    const posterBlob = await renderResultPoster({
      result: activeResult.value,
      runnerUp: activeRunnerUp.value,
      runnerUpMatch: activeRunnerUp.value.match,
      match: activeMatch.value,
      reportCode: reportCode.value,
      dominantDimensionLabel: dimensionMeta[dominantDimension.value[0]].label,
      confidence: resultProfile.value?.confidence ?? null,
      rarity: resultProfile.value?.rarity ?? null,
      adjacentInsightTitle: resultProfile.value?.adjacent.title ?? `${activeResult.value.animal}与你很近`,
      narration: posterNarration,
      dimensions: scoreEntries.value.map(([key, value]) => ({
        label: dimensionMeta[key].label,
        low: dimensionMeta[key].low,
        high: dimensionMeta[key].high,
        value,
      })),
      advice: blendedAdvice.value,
    })
    revokePosterPreviewUrl()
    const downloadUrl = URL.createObjectURL(posterBlob)
    posterPreviewUrl.value = downloadUrl
    posterFileName.value = `${activeResult.value.name}-人格档案.png`

    const link = document.createElement('a')
    link.download = posterFileName.value
    link.href = downloadUrl
    link.click()
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <section v-if="activeResult" class="result-shell">
    <article class="result-banner page-card">
      <div class="dossier-poster">
        <span class="eyebrow">人格档案</span>
        <p class="display-kicker">档案编号 {{ reportCode }}</p>
        <h1 class="headline headline--md">{{ activeResult.name }}</h1>
        <p class="dossier-poster__animal">{{ activeResult.animal }}</p>
        <p class="subcopy">{{ activeResult.title }}</p>

        <div class="tag-list dossier-poster__tags">
          <span v-for="trait in activeResult.traits" :key="trait" class="tag">{{ trait }}</span>
        </div>

        <div class="dossier-seal">
          <span>匹配度</span>
          <strong>{{ activeMatch }}%</strong>
        </div>
      </div>

      <aside class="dossier-summary">
        <article class="panel">
          <div class="muted-label">你更容易发光的场景</div>
          <h3>{{ activeResult.habitat }}</h3>
          <p>{{ activeResult.summary }}</p>
        </article>

        <div class="kpi-grid dossier-summary__grid">
          <div class="kpi-card">
            <span class="muted-label">结果置信度</span>
            <strong>{{ resultProfile?.confidence.label ?? '分析中' }}</strong>
          </div>
          <div class="kpi-card">
            <span class="muted-label">模型内稀有度</span>
            <strong>{{ resultProfile?.rarity.label ?? '分析中' }}</strong>
          </div>
          <div class="kpi-card">
            <span class="muted-label">相邻原型</span>
            <strong>{{ activeRunnerUp?.animal ?? '待分析' }}</strong>
          </div>
        </div>

        <article class="panel">
          <div class="muted-label">人生格言</div>
          <h3>{{ activeResult.contrast }}</h3>
          <p>这句话更像是你遇事时最值得记住的那条线，短，但很适合你拿来提醒自己。</p>
        </article>
      </aside>
    </article>

    <section v-if="resultProfile" class="signal-grid">
      <article class="panel signal-card">
        <div class="muted-label">结果置信度</div>
        <div class="signal-card__score-row">
          <strong>{{ resultProfile.confidence.score }}</strong>
          <span>/ 100</span>
        </div>
        <h3>{{ resultProfile.confidence.label }}</h3>
        <p>{{ resultProfile.confidence.summary }}</p>
        <small>{{ resultProfile.confidence.detail }}</small>
      </article>

      <article class="panel signal-card">
        <div class="muted-label">模型内稀有度</div>
        <div class="signal-card__score-row">
          <strong>{{ resultProfile.rarity.score }}</strong>
          <span>/ 100</span>
        </div>
        <h3>{{ resultProfile.rarity.label }}</h3>
        <p>{{ resultProfile.rarity.summary }}</p>
        <small>{{ resultProfile.rarity.detail }}</small>
      </article>

      <article class="panel signal-card signal-card--wide">
        <div class="muted-label">相邻人格解释</div>
        <h3>{{ resultProfile.adjacent.title }}</h3>
        <p>{{ resultProfile.adjacent.summary }}</p>
        <div class="tag-list signal-card__tags">
          <span class="tag">共同底色：{{ adjacentSharedLabelText }}</span>
          <span class="tag">真正分野：{{ resultProfile.adjacent.decisiveSignalLabel }}</span>
          <span class="tag">最明显的你：{{ dimensionMeta[dominantDimension[0]].label }}</span>
        </div>
      </article>
    </section>

    <article class="panel narrative-panel">
      <div class="narrative-panel__top">
        <div>
          <div class="muted-label">结果讲述</div>
          <h3 class="narrative-panel__heading">你的结果解读</h3>
        </div>

        <div class="narrative-status">
          <span class="narrative-status__chip">{{ narrationModeLabel }}</span>
          <button class="button button--ghost narrative-status__button" type="button" @click="loadNarration">
            重新生成
          </button>
        </div>
      </div>

      <div v-if="narrationStatus === 'loading'" class="narrative-loading">
        <div class="narrative-loading__hero"></div>
        <div class="narrative-grid">
          <div v-for="index in 4" :key="index" class="narrative-card narrative-card--loading">
            <div class="narrative-loading__line narrative-loading__line--short"></div>
            <div class="narrative-loading__line"></div>
            <div class="narrative-loading__line"></div>
          </div>
        </div>
      </div>

      <template v-else-if="narration">
        <div class="narrative-panel__intro">
          <h3>{{ narration.opener }}</h3>
          <span class="narrative-panel__share">{{ narration.shareLine }}</span>
        </div>

        <p v-if="narrationWarning" class="narrative-warning">在线解读暂时不可用，已自动切换为本地结果文案。</p>

        <div class="narrative-grid">
          <article class="narrative-card">
            <div class="muted-label">你做事的方式</div>
            <p>{{ narration.fieldNote }}</p>
          </article>
          <article class="narrative-card">
            <div class="muted-label">你受压时的样子</div>
            <p>{{ narration.pressurePattern }}</p>
          </article>
          <article class="narrative-card">
            <div class="muted-label">你和人相处的方式</div>
            <p>{{ narration.socialPattern }}</p>
          </article>
          <article class="narrative-card">
            <div class="muted-label">你要留意的失衡点</div>
            <p>{{ narration.growthEdge }}</p>
          </article>
        </div>
      </template>
    </article>

    <section class="result-grid">
      <article class="panel">
        <div class="muted-label">你的五维画像</div>
        <div class="result-meters">
          <DimensionMeter
            v-for="[key, value] in scoreEntries"
            :key="key"
            :label="dimensionMeta[key].label"
            :low="dimensionMeta[key].low"
            :high="dimensionMeta[key].high"
            :value="value"
          />
        </div>
      </article>

      <article class="panel">
        <div class="muted-label">你已经很强的地方</div>
        <h3>这些优势，会在你熟悉的场景里稳定发光。</h3>
        <div class="result-list">
          <div v-for="strength in activeResult.strengths" :key="strength" class="result-list__item">
            {{ strength }}
          </div>
        </div>

        <div class="result-note">
          <div class="muted-label">你可以这样用好自己</div>
          <div class="result-list">
            <div v-for="advice in blendedAdvice" :key="advice" class="result-list__item">
              {{ advice }}
            </div>
          </div>
        </div>

        <div class="result-note">
          <div class="muted-label">给你的提醒</div>
          <h4>{{ activeResult.warning }}</h4>
          <p>这不是在给你贴负面标签，而是在提醒你：当优势用过头时，你最容易在哪一步把自己消耗掉。</p>
        </div>
      </article>
    </section>

    <div class="button-row result-shell__actions">
      <button class="button button--primary" type="button" @click="restartQuiz">重新测试</button>
      <button class="button" type="button" :disabled="isExporting" @click="exportShareCard">
        {{ isExporting ? '导出中...' : '导出结果海报' }}
      </button>
      <RouterLink class="button button--ghost" to="/">返回首页</RouterLink>
    </div>

    <div v-if="posterPreviewUrl" class="poster-preview">
      <div class="poster-preview__backdrop" @click="closePosterPreview"></div>
      <div class="poster-preview__panel">
        <div class="poster-preview__top">
          <div>
            <div class="muted-label">海报已生成</div>
            <h3>如果浏览器没有直接下载，你可以在这里预览和保存。</h3>
          </div>
          <button class="button button--ghost poster-preview__close" type="button" @click="closePosterPreview">
            关闭
          </button>
        </div>

        <img class="poster-preview__image" :src="posterPreviewUrl" alt="结果海报预览" />

        <div class="button-row poster-preview__actions">
          <button class="button button--primary" type="button" @click="openPosterPreviewInNewTab">
            在新页打开海报
          </button>
          <button class="button" type="button" @click="exportShareCard">重新生成海报</button>
        </div>
      </div>
    </div>
  </section>

  <section v-else class="page-card page-empty">
    <span class="eyebrow">暂无结果</span>
    <h1 class="headline headline--md">
      {{ hasPartialProgress ? '你还没完成全部情境题。' : '你还没有生成专属人格档案。' }}
    </h1>
    <p class="subcopy">
      {{
        hasPartialProgress
          ? '继续答完剩余题目之后，我们才会根据你的完整选择生成正式结果。'
          : '先完成一次测试，我们会把你在真实生活情境里的选择整理成一份清晰的人格档案。'
      }}
    </p>
    <div class="button-row" style="justify-content: center">
      <button class="button button--primary" type="button" @click="hasPartialProgress ? resumeQuiz() : restartQuiz()">
        {{ hasPartialProgress ? '继续答题' : '开始测试' }}
      </button>
      <button v-if="hasPartialProgress" class="button" type="button" @click="restartQuiz">重新测试</button>
      <RouterLink class="button button--ghost" to="/">返回首页</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.result-shell {
  display: grid;
  gap: 22px;
  margin-top: 12px;
}

.result-banner {
  display: grid;
  grid-template-columns: minmax(0, 0.98fr) minmax(360px, 1.02fr);
  gap: 20px;
  padding: 34px;
}

.dossier-poster {
  position: relative;
  min-height: 520px;
  padding: 28px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--line);
  background:
    radial-gradient(circle at 20% 18%, rgba(214, 191, 134, 0.14), transparent 22%),
    radial-gradient(circle at 80% 84%, rgba(124, 166, 149, 0.12), transparent 18%),
    linear-gradient(180deg, rgba(24, 37, 33, 0.94), rgba(11, 17, 16, 0.96));
  overflow: hidden;
}

.dossier-poster::before {
  content: '';
  position: absolute;
  inset: 22px;
  border: 1px dashed rgba(214, 191, 134, 0.16);
  border-radius: calc(var(--radius-xl) - 10px);
  pointer-events: none;
}

.dossier-poster__animal {
  margin: 2px 0 0;
  color: rgba(243, 234, 214, 0.78);
  font-family: var(--font-display);
  font-size: 1.3rem;
  letter-spacing: 0.18em;
}

.dossier-poster__tags {
  margin-top: 22px;
}

.dossier-seal {
  position: absolute;
  right: 28px;
  bottom: 28px;
  width: 148px;
  height: 148px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(214, 191, 134, 0.28);
  background:
    radial-gradient(circle at 50% 42%, rgba(214, 191, 134, 0.22), transparent 46%),
    rgba(11, 18, 16, 0.86);
  text-align: center;
}

.dossier-seal span {
  display: block;
  color: var(--muted);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
}

.dossier-seal strong {
  display: block;
  margin-top: 4px;
  font-family: var(--font-display);
  font-size: 2rem;
}

.dossier-summary {
  display: grid;
  gap: 18px;
}

.dossier-summary__grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.signal-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.signal-card {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(214, 191, 134, 0.09), transparent 36%),
    rgba(255, 255, 255, 0.025);
}

.signal-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.035), transparent 42%);
  pointer-events: none;
}

.signal-card--wide {
  grid-column: span 1;
}

.signal-card__score-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-top: 16px;
}

.signal-card__score-row strong {
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 5vw, 3.5rem);
  line-height: 1;
}

.signal-card__score-row span {
  color: var(--muted);
  letter-spacing: 0.08em;
  font-size: 0.84rem;
}

.signal-card h3 {
  margin: 16px 0 0;
  font-size: 1.12rem;
}

.signal-card p {
  margin: 12px 0 0;
  color: var(--text);
  line-height: 1.8;
}

.signal-card small {
  display: block;
  margin-top: 14px;
  color: rgba(188, 174, 144, 0.72);
  font-size: 0.8rem;
  line-height: 1.7;
}

.signal-card__tags {
  margin-top: 16px;
}

.narrative-panel__top {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.narrative-panel__heading {
  margin: 8px 0 0;
}

.narrative-status {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.narrative-status__chip {
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(214, 191, 134, 0.06);
  color: var(--accent);
  font-size: 0.8rem;
}

.narrative-status__button {
  margin-top: 0;
  padding: 10px 14px;
}

.narrative-loading {
  margin-top: 18px;
}

.narrative-loading__hero {
  height: 32px;
  width: 54%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.04), rgba(214, 191, 134, 0.1), rgba(255, 255, 255, 0.04));
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
}

.narrative-panel__intro {
  margin-top: 18px;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.narrative-panel__intro h3,
.narrative-panel__intro span {
  margin: 0;
}

.narrative-panel__intro h3 {
  max-width: 760px;
}

.narrative-panel__share {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(214, 191, 134, 0.06);
  color: var(--accent);
  font-size: 0.84rem;
}

.narrative-warning {
  margin: 14px 0 0;
  color: rgba(243, 203, 136, 0.9);
  font-size: 0.88rem;
}

.narrative-grid {
  margin-top: 20px;
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.narrative-card {
  padding: 16px 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
}

.narrative-card p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.74;
}

.narrative-card--loading {
  min-height: 138px;
}

.narrative-loading__line {
  height: 12px;
  margin-top: 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.04), rgba(214, 191, 134, 0.1), rgba(255, 255, 255, 0.04));
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
}

.narrative-loading__line--short {
  width: 34%;
}

.result-grid {
  display: grid;
  gap: 22px;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.result-meters {
  margin-top: 18px;
  display: grid;
  gap: 18px;
}

.result-list {
  margin-top: 18px;
  display: grid;
  gap: 12px;
}

.result-list__item {
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
}

.result-note {
  margin-top: 22px;
  padding-top: 22px;
  border-top: 1px solid rgba(214, 191, 134, 0.12);
}

.result-note h4,
.result-note p {
  margin: 0;
}

.result-note h4 {
  margin-top: 8px;
  font-size: 1.04rem;
}

.result-note p {
  margin-top: 10px;
  color: var(--muted);
  line-height: 1.72;
}

.result-shell__actions {
  margin-top: 0;
}

.poster-preview {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 24px;
}

.poster-preview__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(4, 8, 8, 0.76);
  backdrop-filter: blur(12px);
}

.poster-preview__panel {
  position: relative;
  z-index: 1;
  width: min(980px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  padding: 22px;
  border-radius: var(--radius-2xl);
  border: 1px solid var(--line-strong);
  background: rgba(12, 19, 18, 0.96);
  box-shadow: var(--shadow-xl);
}

.poster-preview__top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.poster-preview__top h3 {
  margin: 8px 0 0;
  font-size: 1rem;
}

.poster-preview__close {
  margin-top: 0;
}

.poster-preview__image {
  width: 100%;
  margin-top: 18px;
  border-radius: calc(var(--radius-xl) - 4px);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.02);
}

.poster-preview__actions {
  margin-top: 18px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 1080px) {
  .signal-grid,
  .result-banner,
  .result-grid {
    grid-template-columns: 1fr;
  }

  .result-banner {
    padding: 24px;
  }

  .narrative-panel__top,
  .narrative-panel__intro,
  .narrative-grid {
    display: grid;
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dossier-summary__grid,
  .signal-grid,
  .narrative-grid {
    grid-template-columns: 1fr;
  }

  .dossier-poster {
    min-height: 460px;
    padding: 22px;
  }
}
</style>
