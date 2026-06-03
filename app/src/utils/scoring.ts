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
    high: '会主动把人和节奏带起来',
    low: '会先守住自己的判断通道',
  },
  risk: {
    high: '更愿意先抓窗口再补路径',
    low: '更愿意先算成本和退路',
  },
  stress: {
    high: '受压时会直接接住局面',
    low: '受压时会先收住自己',
  },
  tempo: {
    high: '更习惯边做边调',
    low: '更习惯看清再启动',
  },
  energy: {
    high: '一重新掌控就会慢慢回电',
    low: '一安静下来就会慢慢回电',
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
      label: '轮廓非常清晰',
      summary: '你的大多数选择都在把结果往同一个方向推，所以这一型不是偶然撞中的。',
      detail: `你和相邻原型拉开了 ${margin} 分，五个维度里有 ${alignedDimensions} 个维度明显贴近主原型。`,
    }
  }

  if (score >= 70) {
    return {
      score,
      label: '轮廓稳定成型',
      summary: '你的主原型已经很明显，但你身上还保留了一点相邻人格的弹性和层次。',
      detail: `你和相邻原型相差 ${margin} 分，说明你的主结果清楚，但并不是单线条的人。`,
    }
  }

  if (score >= 56) {
    return {
      score,
      label: '混合但可辨认',
      summary: '你不是没有主型，而是你会随场景切换做法，所以结果会带一点自然的混合感。',
      detail: `你和相邻原型只差 ${margin} 分，这通常意味着你在不同生活场景里会显出两套相近的应对方式。`,
    }
  }

  return {
    score,
    label: '过渡型结果',
    summary: '你现在更像两种人格风格并行，所以这份结果更适合拿来观察你最近的状态变化。',
    detail: `你和相邻原型只差 ${margin} 分，说明你最近的选择还没有完全收束成单一风格。`,
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
      label: '模型内少见',
      summary: '在这套八型图谱里，你的组合辨识度很高，不太容易和别人撞成同一种气质。',
      detail: '这只是当前八种原型里的模型内稀有度，不代表真实人口比例。',
    }
  }

  if (score >= 58) {
    return {
      score,
      label: '辨识度偏高',
      summary: '你的轮廓不是大众模板，身上有几处很鲜明的偏向，所以别人通常会记住你的风格。',
      detail: '这只是当前八种原型里的模型内稀有度，不代表真实人口比例。',
    }
  }

  if (score >= 42) {
    return {
      score,
      label: '有个人棱角',
      summary: '你的结构不靠极端感取胜，但你依然有稳定而清楚的个人棱角，不会显得模糊。',
      detail: '这只是当前八种原型里的模型内稀有度，不代表真实人口比例。',
    }
  }

  return {
    score,
    label: '均衡耐看',
    summary: '你的组合更偏均衡耐用，不靠夸张对比吸引注意，而是靠稳定和连续性让人信任。',
    detail: '这只是当前八种原型里的模型内稀有度，不代表真实人口比例。',
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
    title: `你更像${result.animal}，也带着${runnerUp.animal}的一面`,
    summary: `${sharedSummary}但真正把你推向${result.name}的，是你在${decisiveLabel}上更接近“${decisivePhrase}”这一面。`,
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
