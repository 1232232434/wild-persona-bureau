import { archetypes, dimensionMeta, emptyScores } from '../data/quiz'
import type {
  AdjacentPersonaInsight,
  DimensionKey,
  DimensionScores,
  RankedArchetype,
  ResultMetric,
  ResultProfile,
} from '../types/quiz'

const dimensionKeys = Object.keys(emptyScores()) as DimensionKey[]
const closeFitThreshold = 16

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const averageDistance = (left: DimensionScores, right: DimensionScores) =>
  dimensionKeys.reduce((sum, key) => sum + Math.abs(left[key] - right[key]), 0) / dimensionKeys.length

const directionOf = (value: number) => (value >= 50 ? 'high' : 'low')

const dimensionBehaviorCopy: Record<DimensionKey, { high: string; low: string }> = {
  social: {
    high: '更容易主动把气氛带起来',
    low: '更习惯先观察再靠近',
  },
  risk: {
    high: '敢先迈出去试一把',
    low: '会先确认代价和退路',
  },
  stress: {
    high: '压力越大越容易正面处理',
    low: '压力越大越需要先缓一口气',
  },
  tempo: {
    high: '喜欢边做边调整',
    low: '喜欢想清楚再开始',
  },
  energy: {
    high: '掌控住局面就会回电',
    low: '独处安静下来就会回电',
  },
}

const archetypeDistinctness = (() => {
  const entries = archetypes.map((archetype) => {
    const averageGap =
      archetypes
        .filter((candidate) => candidate.id !== archetype.id)
        .reduce((sum, candidate) => sum + averageDistance(archetype.signature, candidate.signature), 0) /
      Math.max(archetypes.length - 1, 1)

    return {
      id: archetype.id,
      averageGap,
    }
  })

  const values = entries.map((entry) => entry.averageGap)
  const min = Math.min(...values)
  const max = Math.max(...values)

  return new Map(
    entries.map((entry) => {
      if (max === min) {
        return [entry.id, 60]
      }

      const normalized = Math.round(((entry.averageGap - min) / (max - min)) * 100)
      return [entry.id, normalized]
    }),
  )
})()

export const normalizeScores = (totals: DimensionScores, questionCount: number): DimensionScores => {
  if (!questionCount) {
    return emptyScores()
  }

  const ceiling = questionCount * 5

  return dimensionKeys.reduce((accumulator, key) => {
    accumulator[key] = Math.round((totals[key] / ceiling) * 100)
    return accumulator
  }, emptyScores())
}

export const rankArchetypes = (scores: DimensionScores): RankedArchetype[] =>
  archetypes
    .map((archetype) => {
      return {
        ...archetype,
        match: Math.max(0, Math.round(100 - averageDistance(scores, archetype.signature))),
      }
    })
    .sort((left, right) => right.match - left.match)

const buildConfidenceMetric = (
  scores: DimensionScores,
  result: RankedArchetype,
  runnerUp: RankedArchetype,
): ResultMetric => {
  const margin = Math.max(0, result.match - runnerUp.match)
  const alignedDimensions = dimensionKeys.filter(
    (key) => Math.abs(scores[key] - result.signature[key]) <= closeFitThreshold,
  ).length
  const score = clamp(Math.round(result.match * 0.55 + margin * 2.4 + alignedDimensions * 4), 48, 96)

  if (score >= 84) {
    return {
      score,
      label: '很像你本人',
      summary: '你的大多数选择都在指向同一种气质，所以这个结果不是随便凑出来的。',
      detail: `你和第二高的动物人格拉开了 ${margin} 分，五个维度里有 ${alignedDimensions} 个都很贴近当前结果。`,
    }
  }

  if (score >= 70) {
    return {
      score,
      label: '主线很清楚',
      summary: '你的主要性格方向已经很明显，同时还保留了一点副属性，所以结果不会显得单薄。',
      detail: `你和第二高的动物人格相差 ${margin} 分，说明你有明确主线，但不是只有一种面孔。`,
    }
  }

  if (score >= 56) {
    return {
      score,
      label: '有两种面向',
      summary: '你不是测不准，而是你在不同场景里会切换不同状态，所以看起来有一点混合感。',
      detail: `你和第二高的动物人格只差 ${margin} 分，说明你在生活里可能会同时表现出两套相近的反应。`,
    }
  }

  return {
    score,
    label: '最近状态偏混合',
    summary: '你现在更像几种状态一起出现，可能和最近压力、心情或生活阶段有关。',
    detail: `你和第二高的动物人格只差 ${margin} 分，说明你最近还没有完全固定在单一风格里。`,
  }
}

const buildRarityMetric = (scores: DimensionScores, result: RankedArchetype): ResultMetric => {
  const values = dimensionKeys.map((key) => scores[key])
  const extremeness = values.reduce((sum, value) => sum + Math.abs(value - 50), 0) / values.length
  const range = Math.max(...values) - Math.min(...values)
  const distinctness = archetypeDistinctness.get(result.id) ?? 50
  const score = clamp(Math.round(distinctness * 0.52 + extremeness * 0.66 + range * 0.15), 28, 92)

  if (score >= 75) {
    return {
      score,
      label: '人设很有记忆点',
      summary: '你的气质不太像普通模板，别人和你相处之后，通常会记得你身上很鲜明的那一面。',
      detail: '这个分数看的是你五个维度的鲜明程度，不是现实人群比例，也不是谁更高级。',
    }
  }

  if (score >= 58) {
    return {
      score,
      label: '辨识度很高',
      summary: '你不是那种完全没棱角的人，身上有几个明显特点，容易被朋友用一句话概括出来。',
      detail: '这个分数看的是你五个维度的鲜明程度，不是现实人群比例，也不是谁更高级。',
    }
  }

  if (score >= 42) {
    return {
      score,
      label: '耐看型人设',
      summary: '你的风格不是第一眼特别夸张，但越相处越能看出稳定、清楚的个人味道。',
      detail: '这个分数看的是你五个维度的鲜明程度，不是现实人群比例，也不是谁更高级。',
    }
  }

  return {
    score,
    label: '低调舒服型',
    summary: '你的风格不靠强烈反差吸引注意，更像是相处起来稳定、舒服、不会太压迫的类型。',
    detail: '这个分数看的是你五个维度的鲜明程度，不是现实人群比例，也不是谁更高级。',
  }
}

const buildAdjacentPersonaInsight = (
  scores: DimensionScores,
  result: RankedArchetype,
  runnerUp: RankedArchetype,
): AdjacentPersonaInsight => {
  const sharedDimensions = dimensionKeys
    .filter(
      (key) =>
        directionOf(result.signature[key]) === directionOf(runnerUp.signature[key]) &&
        Math.abs(result.signature[key] - runnerUp.signature[key]) <= 26,
    )
    .sort(
      (left, right) =>
        Math.abs(scores[right] - 50) - Math.abs(scores[left] - 50) ||
        Math.abs(result.signature[left] - runnerUp.signature[left]) -
          Math.abs(result.signature[right] - runnerUp.signature[right]),
    )
    .slice(0, 2)

  const fallbackSharedDimensions =
    sharedDimensions.length > 0
      ? sharedDimensions
      : [...dimensionKeys]
          .sort(
            (left, right) =>
              Math.abs(result.signature[left] - runnerUp.signature[left]) -
              Math.abs(result.signature[right] - runnerUp.signature[right]),
          )
          .slice(0, 2)

  const decisiveDimension =
    dimensionKeys
      .map((key) => ({
        key,
        advantage:
          Math.abs(scores[key] - runnerUp.signature[key]) - Math.abs(scores[key] - result.signature[key]),
      }))
      .sort((left, right) => right.advantage - left.advantage)[0]?.key ?? dimensionKeys[0]

  const sharedSignalLabels = fallbackSharedDimensions.map((key) => dimensionMeta[key].label)
  const sharedPhrases = fallbackSharedDimensions.map((key) => dimensionBehaviorCopy[key][directionOf(scores[key])])
  const decisiveLabel = dimensionMeta[decisiveDimension].label
  const decisivePhrase = dimensionBehaviorCopy[decisiveDimension][directionOf(scores[decisiveDimension])]

  const sharedSummary =
    sharedPhrases.length >= 2
      ? `你身上同时有${sharedSignalLabels.join('和')}这两层共同底色，所以你既${sharedPhrases[0]}，也${sharedPhrases[1]}。`
      : `你身上同时有${sharedSignalLabels[0]}这一层共同底色，所以你${sharedPhrases[0]}。`

  return {
    title: `你的主动物是${result.animal}，隐藏副属性像${runnerUp.animal}`,
    summary: `${sharedSummary}但真正让你更像${result.animal}的，是你在${decisiveLabel}上更接近“${decisivePhrase}”这一面。`,
    sharedSignalLabels,
    decisiveSignalLabel: decisiveLabel,
  }
}

export const buildResultProfile = (scores: DimensionScores, ranking: RankedArchetype[]): ResultProfile | null => {
  const [result, runnerUp] = ranking

  if (!result || !runnerUp) {
    return null
  }

  return {
    confidence: buildConfidenceMetric(scores, result, runnerUp),
    rarity: buildRarityMetric(scores, result),
    adjacent: buildAdjacentPersonaInsight(scores, result, runnerUp),
  }
}
