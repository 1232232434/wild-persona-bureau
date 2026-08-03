<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { dimensionMeta } from '../data/quiz'
import { useQuizStore } from '../stores/quiz'

const route = useRoute()
const router = useRouter()
const quiz = useQuizStore()
const pageMountedAt = Date.now()

const getNavigationType = () => {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') {
    return 'navigate'
  }

  const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  return entry?.type ?? 'navigate'
}

const wantsResume = route.query.resume === '1'
const wantsFreshRound = route.query.fresh === '1'
const hasRecoverableSession =
  Boolean(quiz.startedAt) && !quiz.isFinished && quiz.currentQuestion !== null
const canKeepCurrentSession = wantsResume || (!wantsFreshRound && getNavigationType() === 'reload' && hasRecoverableSession)

if (!canKeepCurrentSession) {
  quiz.start()
}

if ((wantsResume || wantsFreshRound) && route.fullPath !== '/test') {
  router.replace('/test')
}

watch(
  () => quiz.completedAt,
  (completedAt) => {
    if (completedAt && completedAt > pageMountedAt) {
      router.push('/result')
    }
  },
  { immediate: true },
)

const showCompletedState = computed(
  () =>
    quiz.isFinished &&
    quiz.currentQuestion === null &&
    quiz.completedAt !== null &&
    quiz.completedAt <= pageMountedAt,
)

const questionCount = computed(() => Math.max(quiz.questions.length, 1))
const progressLabel = computed(
  () => `${Math.min(quiz.answers.length + 1, questionCount.value)} / ${questionCount.value}`,
)
const questionNumber = computed(() => String(Math.min(quiz.currentIndex + 1, questionCount.value)).padStart(2, '0'))
const dimensionEntries = computed(() => Object.entries(dimensionMeta))

const chooseOption = (optionId: string) => {
  quiz.answer(optionId)
}
</script>

<template>
  <section v-if="quiz.currentQuestion" class="test-shell">
    <article class="question-card page-card">
      <div class="question-card__noise"></div>
      <div class="question-card__header">
        <div>
          <span class="eyebrow">真实情境</span>
          <p class="display-kicker">场景 {{ progressLabel }}</p>
          <h1 class="headline headline--md">{{ quiz.currentQuestion.scene }}</h1>
        </div>

        <div class="question-card__count">
          <span>当前题号</span>
          <strong>{{ questionNumber }}</strong>
        </div>
      </div>

      <p class="subcopy">{{ quiz.currentQuestion.prompt }}</p>

      <div class="progress-module">
        <div class="progress-module__labels">
          <span>完成进度</span>
          <span>{{ quiz.progress }}%</span>
        </div>
        <div class="progress-module__track">
          <div class="progress-module__fill" :style="{ width: `${Math.max(quiz.progress, 8)}%` }"></div>
        </div>
      </div>

      <div class="option-stack">
        <button
          v-for="option in quiz.currentQuestion.options"
          :key="option.id"
          class="option-card"
          type="button"
          @click="chooseOption(option.id)"
        >
          <span class="option-card__tag">{{ option.label }}</span>
          <strong>{{ option.text }}</strong>
          <small>请选择你在真实压力下最可能做出的第一反应。</small>
        </button>
      </div>

      <div class="button-row">
        <button class="button button--ghost" type="button" :disabled="quiz.currentIndex === 0" @click="quiz.goBack()">
          上一题
        </button>
        <button class="button" type="button" @click="quiz.restart()">重新开始</button>
      </div>
    </article>

    <aside class="test-sidebar">
      <article class="panel">
        <div class="muted-label">作答提醒</div>
        <h3>不要替“更体面版本的你”答题。</h3>
        <p>
          你只需要选最像自己真实反应的那一个，不用选看起来更成熟、更正确、或更讨人喜欢的答案。
        </p>
        <p>本轮题目会从多套生活情境母题库里随机抽取，同样的测试入口，每次遇到的题面都可能不一样。</p>
      </article>

      <article class="panel">
        <div class="muted-label">维度透镜</div>
        <h3>你的每一次选择，都会落到五个行为维度里。</h3>
        <div class="lens-list">
          <div v-for="[key, meta] in dimensionEntries" :key="key" class="lens-item">
            <strong>{{ meta.label }}</strong>
            <p>{{ meta.low }} 到 {{ meta.high }}</p>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="muted-label">结果怎么来的</div>
        <h3>你的结果不是随便猜的，而是由每一道情境题里的行为偏好累积出来的。</h3>
        <p>
          这些分数会决定你更像哪种动物人格，也会决定最后那份结果解读为什么会说中你的做事方式和关系风格。
        </p>
      </article>
    </aside>
  </section>

  <section v-else-if="showCompletedState" class="page-card page-empty test-complete">
    <span class="eyebrow">测试已完成</span>
    <h1 class="headline headline--md">你已经答完这套情境题了。</h1>
    <p class="subcopy">你可以直接去看结果，或者重新开始一次，观察自己在不同心态下会不会出现别的模式。</p>
    <div class="button-row" style="justify-content: center">
      <button class="button button--primary" type="button" @click="router.push('/result')">查看结果</button>
      <button class="button" type="button" @click="quiz.restart()">重新测试</button>
      <RouterLink class="button button--ghost" to="/">返回首页</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.test-shell {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1.16fr) minmax(300px, 0.84fr);
  margin-top: 12px;
}

.question-card {
  position: relative;
  padding: 38px;
}

.question-card__noise {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 16% 12%, rgba(214, 191, 134, 0.08), transparent 18%),
    radial-gradient(circle at 88% 28%, rgba(124, 166, 149, 0.08), transparent 22%);
  pointer-events: none;
}

.question-card__header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.question-card__count {
  min-width: 140px;
  padding: 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
  text-align: right;
}

.question-card__count span {
  display: block;
  color: var(--muted);
  letter-spacing: 0.1em;
  font-size: 0.72rem;
}

.question-card__count strong {
  display: block;
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: 2.5rem;
  line-height: 1;
}

.progress-module {
  margin-top: 28px;
}

.progress-module__labels {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--muted);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
}

.progress-module__track {
  height: 12px;
  margin-top: 10px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
}

.progress-module__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent-2), var(--accent));
  box-shadow: 0 0 24px rgba(214, 191, 134, 0.24);
}

.option-stack {
  margin-top: 28px;
  display: grid;
  gap: 14px;
}

.option-card {
  position: relative;
  width: 100%;
  padding: 20px 22px;
  display: grid;
  gap: 10px;
  text-align: left;
  color: var(--text);
  border-radius: var(--radius-xl);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.025);
  cursor: pointer;
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease,
    box-shadow 0.22s ease;
}

.option-card:hover {
  transform: translateY(-3px);
  border-color: var(--line-strong);
  background: rgba(214, 191, 134, 0.07);
  box-shadow: var(--shadow-md);
}

.option-card__tag {
  display: inline-flex;
  width: fit-content;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(214, 191, 134, 0.18);
  background: rgba(214, 191, 134, 0.08);
  color: var(--accent);
  font-size: 0.76rem;
  letter-spacing: 0.08em;
}

.option-card strong {
  font-size: 1rem;
  line-height: 1.7;
}

.option-card small {
  color: rgba(188, 174, 144, 0.72);
  font-size: 0.78rem;
  letter-spacing: 0.03em;
}

.test-sidebar {
  display: grid;
  gap: 18px;
}

.lens-list {
  margin-top: 16px;
  display: grid;
  gap: 12px;
}

.lens-item {
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
}

.lens-item strong {
  display: block;
  font-size: 0.96rem;
}

.lens-item p {
  margin-top: 6px;
}

.test-complete {
  margin-top: 12px;
}

@media (max-width: 980px) {
  .test-shell {
    grid-template-columns: 1fr;
  }

  .question-card {
    padding: 24px;
  }

  .question-card__header {
    flex-direction: column;
  }

  .question-card__count {
    width: 100%;
    text-align: left;
  }
}
</style>
