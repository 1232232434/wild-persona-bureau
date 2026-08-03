import { describe, expect, it } from 'vitest'

import { archetypes, emptyScores } from '../../app/src/data/quiz'
import type { DimensionScores } from '../../app/src/types/quiz'
import { buildPersonaNarratorUserPrompt, createFallbackNarration } from '../../app/src/prompts/personaNarrator'

const createScores = (overrides: Partial<DimensionScores>): DimensionScores => ({
  ...emptyScores(),
  ...overrides,
})

describe('personaNarrator', () => {
  it('buildPersonaNarratorUserPrompt should include structured archetype and score context', () => {
    const prompt = buildPersonaNarratorUserPrompt({
      archetype: archetypes[0],
      runnerUp: archetypes[1],
      scores: createScores({
        social: 22,
        risk: 44,
        stress: 30,
        tempo: 26,
        energy: 18,
      }),
    })

    expect(prompt).toContain('主动物人格资料')
    expect(prompt).toContain(archetypes[0].name)
    expect(prompt).toContain(archetypes[1].animal)
    expect(prompt).toContain('输出字段要求')
    expect(prompt).toContain('只返回符合 schema 的 JSON')
  })

  it('createFallbackNarration should generate second-person narration with action advice', () => {
    const narration = createFallbackNarration({
      archetype: archetypes[2],
      runnerUp: archetypes[3],
      scores: createScores({
        social: 58,
        risk: 90,
        stress: 42,
        tempo: 84,
        energy: 68,
      }),
    })

    expect(narration.opener).toContain('你')
    expect(narration.fieldNote).toContain('你')
    expect(narration.actionAdvice).toBe(archetypes[2].advice[0])
    expect(narration.shareLine.length).toBeGreaterThan(0)
  })
})
