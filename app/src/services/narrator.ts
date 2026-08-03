import {
  buildPersonaNarratorUserPrompt,
  createFallbackNarration,
  PERSONA_NARRATION_FIELDS,
  PERSONA_NARRATOR_SYSTEM_PROMPT,
  type PersonaNarration,
  type PersonaNarrationInput,
} from '../prompts/personaNarrator'

type NarratorMode = 'mock' | 'proxy'
type NarrationSource = 'mock' | 'proxy' | 'fallback'

export interface NarrationResult {
  narration: PersonaNarration
  source: NarrationSource
  model?: string
  warning?: string
}

interface ProxyPayload {
  narration?: Partial<PersonaNarration>
  data?: Partial<PersonaNarration> | { narration?: Partial<PersonaNarration> }
  meta?: {
    model?: string
  }
  model?: string
}

interface ProxyErrorPayload {
  error?: string
}

const fallbackProxyUrl = '/api/persona/narrate'
const fallbackMockDelayMs = 900
const fallbackProxyTimeoutMs = 3500
const lowSignalPhrases = [
  '很有价值',
  '模型',
  '原型',
  '稀有度',
  '相邻原型',
  '市场趋势',
  '消费者',
  '高效沟通',
  '建立连接',
  '数据分析',
  '沟通策略',
  '利益相关者',
  '生产力',
  '商业成功',
  '情绪价值',
]

const wait = (durationMs: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs)
  })

const readMode = (): NarratorMode => {
  const mode = import.meta.env.VITE_NARRATOR_MODE?.toLowerCase()
  return mode === 'proxy' ? 'proxy' : 'mock'
}

const readMockDelay = () => {
  const value = Number(import.meta.env.VITE_NARRATOR_MOCK_DELAY_MS ?? fallbackMockDelayMs)
  return Number.isFinite(value) ? value : fallbackMockDelayMs
}

const readProxyUrl = () => import.meta.env.VITE_NARRATOR_PROXY_URL ?? fallbackProxyUrl
const readProxyTimeout = () => fallbackProxyTimeoutMs

const isPersonaNarration = (value: unknown): value is PersonaNarration => {
  if (!value || typeof value !== 'object') {
    return false
  }

  return PERSONA_NARRATION_FIELDS.every((field) => typeof (value as Record<string, unknown>)[field] === 'string')
}

const isLowSignalNarration = (value: PersonaNarration, input: PersonaNarrationInput) => {
  const combined = PERSONA_NARRATION_FIELDS.map((field) => value[field]).join(' ').toLowerCase()
  const containsGenericPhrase = lowSignalPhrases.some((phrase) => combined.includes(phrase))
  const containsLatinText = /[a-z]{2,}/.test(combined)
  const containsSecondPerson = combined.includes('你')
  const mentionsPrimaryAnimal = combined.includes(input.archetype.animal.toLowerCase())
  const mentionsRunnerUpAnimal = combined.includes(input.runnerUp.animal.toLowerCase())
  const mentionsTrait = input.archetype.traits.some((trait) => combined.includes(trait.toLowerCase()))
  const longFields = PERSONA_NARRATION_FIELDS.filter((field) => value[field].trim().length > 80)

  return (
    containsGenericPhrase ||
    containsLatinText ||
    !containsSecondPerson ||
    (!mentionsPrimaryAnimal && !mentionsRunnerUpAnimal) ||
    !mentionsTrait ||
    longFields.length >= 3
  )
}

const readJsonSafely = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

const requestProxyNarration = async (input: PersonaNarrationInput): Promise<NarrationResult> => {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), readProxyTimeout())

  try {
    const response = await fetch(readProxyUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemPrompt: PERSONA_NARRATOR_SYSTEM_PROMPT,
        userPrompt: buildPersonaNarratorUserPrompt(input),
        input,
        responseFormat: {
          type: 'json_schema',
          json_schema: {
            name: 'persona_narration',
            schema: {
              type: 'object',
              additionalProperties: false,
              required: PERSONA_NARRATION_FIELDS,
              properties: PERSONA_NARRATION_FIELDS.reduce<Record<string, { type: 'string' }>>((accumulator, field) => {
                accumulator[field] = { type: 'string' }
                return accumulator
              }, {}),
            },
          },
        },
      }),
    })

    const payload = await readJsonSafely<ProxyPayload & ProxyErrorPayload>(response)

    if (!response.ok) {
      throw new Error(payload?.error || `请求失败：${response.status}`)
    }

    if (!payload) {
      throw new Error('返回内容不是有效的 JSON')
    }

    const narrationCandidate =
      payload.narration ?? (payload.data && 'narration' in payload.data ? payload.data.narration : payload.data)

    if (!isPersonaNarration(narrationCandidate)) {
      throw new Error('返回内容不符合结果文案结构')
    }

    if (isLowSignalNarration(narrationCandidate, input)) {
      throw new Error('生成结果过于空泛，已拦截')
    }

    return {
      narration: narrationCandidate,
      source: 'proxy',
      model: payload.meta?.model ?? payload.model,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('在线解读超时')
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export const generatePersonaNarration = async (input: PersonaNarrationInput): Promise<NarrationResult> => {
  const mode = readMode()

  if (mode === 'mock') {
    await wait(readMockDelay())

    return {
      narration: createFallbackNarration(input),
      source: 'mock',
    }
  }

  try {
    return await requestProxyNarration(input)
  } catch (error) {
    await wait(Math.min(readMockDelay(), 500))

    return {
      narration: createFallbackNarration(input),
      source: 'fallback',
      warning: error instanceof Error ? error.message : '在线生成请求失败',
    }
  }
}
