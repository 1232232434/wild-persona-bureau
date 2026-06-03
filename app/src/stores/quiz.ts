import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

import { buildQuestionSet, isValidQuestionSet } from '../data/questionBank'
import { emptyScores } from '../data/quiz'
import type { DimensionScores, Question } from '../types/quiz'
import { normalizeScores, rankArchetypes } from '../utils/scoring'

interface AnswerRecord {
  questionId: string
  optionId: string
}

const normalizeAnswerRecords = (records: AnswerRecord[], questionSet: Question[]) => {
  const questionOptionMap = new Map(
    questionSet.map((question) => [question.id, new Set(question.options.map((option) => option.id))]),
  )
  const picked = new Map<string, string>()

  for (const record of records) {
    const validOptions = questionOptionMap.get(record.questionId)

    if (!validOptions || !validOptions.has(record.optionId) || picked.has(record.questionId)) {
      continue
    }

    picked.set(record.questionId, record.optionId)
  }

  return questionSet
    .filter((question) => picked.has(question.id))
    .map((question) => ({
      questionId: question.id,
      optionId: picked.get(question.id) as string,
    }))
}

const normalizeCurrentIndex = (storedIndex: number, answerCount: number, totalQuestionCount: number) => {
  const safeIndex = Number.isFinite(storedIndex) ? Math.max(0, Math.floor(storedIndex)) : 0

  if (answerCount >= totalQuestionCount) {
    return totalQuestionCount
  }

  return Math.min(safeIndex, answerCount, totalQuestionCount - 1)
}

const STORAGE_KEYS = {
  version: 'wild-persona-question-set-version',
  questions: 'wild-persona-questions',
  answers: 'wild-persona-answers',
  currentIndex: 'wild-persona-current-index',
  startedAt: 'wild-persona-started-at',
  completedAt: 'wild-persona-completed-at',
} as const

const QUESTION_SET_STORAGE_VERSION = 2

const readStored = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? (JSON.parse(rawValue) as T) : fallback
  } catch {
    return fallback
  }
}

const writeStored = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export const useQuizStore = defineStore('quiz', () => {
  const storedVersion = readStored<number | null>(STORAGE_KEYS.version, null)
  const storedQuestions = readStored<Question[]>(STORAGE_KEYS.questions, [])
  const hasStoredQuestionSet =
    storedVersion === QUESTION_SET_STORAGE_VERSION && isValidQuestionSet(storedQuestions)
  const initialQuestions = hasStoredQuestionSet ? storedQuestions : buildQuestionSet()
  const initialAnswers = hasStoredQuestionSet
    ? normalizeAnswerRecords(readStored<AnswerRecord[]>(STORAGE_KEYS.answers, []), initialQuestions)
    : []
  const initialCurrentIndex = hasStoredQuestionSet
    ? normalizeCurrentIndex(readStored(STORAGE_KEYS.currentIndex, 0), initialAnswers.length, initialQuestions.length)
    : 0
  const initialStartedAt = hasStoredQuestionSet ? readStored<number | null>(STORAGE_KEYS.startedAt, null) : null
  const initialCompletedAt =
    hasStoredQuestionSet && initialAnswers.length >= initialQuestions.length
      ? readStored<number | null>(STORAGE_KEYS.completedAt, null)
      : null

  const questions = ref<Question[]>(initialQuestions)
  const answers = ref<AnswerRecord[]>(initialAnswers)
  const currentIndex = ref<number>(initialCurrentIndex)
  const startedAt = ref<number | null>(initialStartedAt)
  const completedAt = ref<number | null>(initialCompletedAt)

  watch(
    [questions, answers, currentIndex, startedAt, completedAt],
    () => {
      writeStored(STORAGE_KEYS.version, QUESTION_SET_STORAGE_VERSION)
      writeStored(STORAGE_KEYS.questions, questions.value)
      writeStored(STORAGE_KEYS.answers, answers.value)
      writeStored(STORAGE_KEYS.currentIndex, currentIndex.value)
      writeStored(STORAGE_KEYS.startedAt, startedAt.value)
      writeStored(STORAGE_KEYS.completedAt, completedAt.value)
    },
    { deep: true, immediate: true },
  )

  const currentQuestion = computed(() => questions.value[currentIndex.value] ?? null)
  const isFinished = computed(() => answers.value.length >= questions.value.length)
  const progress = computed(() =>
    questions.value.length ? Math.round((answers.value.length / questions.value.length) * 100) : 0,
  )

  const rawScores = computed<DimensionScores>(() => {
    const totals = emptyScores()

    for (const answer of answers.value) {
      const question = questions.value.find((item) => item.id === answer.questionId)
      const option = question?.options.find((item) => item.id === answer.optionId)

      if (!option) {
        continue
      }

      for (const [dimension, value] of Object.entries(option.weight)) {
        totals[dimension as keyof DimensionScores] += value
      }
    }

    return totals
  })

  const scores = computed(() => normalizeScores(rawScores.value, Math.max(answers.value.length, 1)))
  const ranking = computed(() => (isFinished.value ? rankArchetypes(scores.value) : []))
  const result = computed(() => ranking.value[0] ?? null)
  const runnerUp = computed(() => ranking.value[1] ?? null)

  const start = () => {
    questions.value = buildQuestionSet()
    answers.value = []
    currentIndex.value = 0
    startedAt.value = Date.now()
    completedAt.value = null
  }

  const restart = () => start()

  const goBack = () => {
    if (currentIndex.value > 0) {
      currentIndex.value -= 1
    }
  }

  const answer = (optionId: string) => {
    const question = currentQuestion.value

    if (!question) {
      return
    }

    const existingIndex = answers.value.findIndex((item) => item.questionId === question.id)

    if (existingIndex >= 0) {
      answers.value[existingIndex] = { questionId: question.id, optionId }
    } else {
      answers.value = [...answers.value, { questionId: question.id, optionId }]
    }

    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value += 1
      return
    }

    currentIndex.value = questions.value.length
    completedAt.value = Date.now()
  }

  return {
    questions,
    answers,
    currentIndex,
    currentQuestion,
    goBack,
    isFinished,
    progress,
    ranking,
    result,
    runnerUp,
    scores,
    start,
    restart,
    answer,
    startedAt,
    completedAt,
  }
})
