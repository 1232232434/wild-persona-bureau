import { describe, expect, it } from 'vitest'

import { emptyScores } from '../../app/src/data/quiz'
import type { DimensionScores } from '../../app/src/types/quiz'
import { buildResultProfile, normalizeScores, rankArchetypes } from '../../app/src/utils/scoring'

const createScores = (overrides: Partial<DimensionScores>): DimensionScores => ({
  ...emptyScores(),
  ...overrides,
})

describe('scoring', () => {
  it('normalizeScores should map accumulated totals into a 0-100 scale', () => {
    const normalized = normalizeScores(
      createScores({
        social: 10,
        risk: 25,
        stress: 15,
        tempo: 5,
        energy: 20,
      }),
      5,
    )

    expect(normalized).toEqual({
      social: 40,
      risk: 100,
      stress: 60,
      tempo: 20,
      energy: 80,
    })
  })

  it('rankArchetypes should place the closest archetype first', () => {
    const ranking = rankArchetypes(
      createScores({
        social: 22,
        risk: 40,
        stress: 26,
        tempo: 28,
        energy: 20,
      }),
    )

    expect(ranking[0]?.id).toBe('snow-leopard')
    expect(ranking[0]?.match).toBeGreaterThanOrEqual(ranking[1]?.match ?? 0)
  })

  it('buildResultProfile should return confidence, rarity and adjacent insights', () => {
    const scores = createScores({
      social: 86,
      risk: 68,
      stress: 72,
      tempo: 70,
      energy: 90,
    })

    const ranking = rankArchetypes(scores)
    const profile = buildResultProfile(scores, ranking)

    expect(profile).not.toBeNull()
    expect(profile?.confidence.score).toBeGreaterThanOrEqual(48)
    expect(profile?.rarity.score).toBeGreaterThanOrEqual(28)
    expect(profile?.adjacent.title).toContain('你更像')
    expect(profile?.adjacent.sharedSignalLabels.length).toBeGreaterThan(0)
    expect(profile?.adjacent.decisiveSignalLabel.length).toBeGreaterThan(0)
  })

  it('buildResultProfile should return null when ranking is incomplete', () => {
    const profile = buildResultProfile(createScores({ social: 50 }), [])

    expect(profile).toBeNull()
  })
})
