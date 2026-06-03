import type { Archetype, DimensionKey, DimensionScores } from '../types/quiz'

export interface PersonaNarrationInput {
  archetype: Archetype
  runnerUp: Archetype
  scores: DimensionScores
}

export interface PersonaNarration {
  opener: string
  fieldNote: string
  pressurePattern: string
  socialPattern: string
  growthEdge: string
  actionAdvice: string
  shareLine: string
}

export const PERSONA_NARRATION_FIELDS: Array<keyof PersonaNarration> = [
  'opener',
  'fieldNote',
  'pressurePattern',
  'socialPattern',
  'growthEdge',
  'actionAdvice',
  'shareLine',
]

const dimensionNarrationMap: Record<
  DimensionKey,
  { high: string; low: string; label: string }
> = {
  social: {
    label: '群体姿态',
    high: '你会自然把周围的人拉进同一个节奏，也愿意主动影响局面',
    low: '你会先守住自己的判断通道，再决定要不要让别人进入你的节奏',
  },
  risk: {
    label: '冒险阈值',
    high: '事情越新、越快、越没标准答案，你越容易被激活',
    low: '你会先看清成本和退路，再决定这一步值不值得往前迈',
  },
  stress: {
    label: '受压反应',
    high: '压力会让你的边界感和行动力都变得更明显',
    low: '压力会先让你收住自己，等确认局势后再表态',
  },
  tempo: {
    label: '行动节奏',
    high: '你更相信速度、切换和边走边调',
    low: '你更相信蓄势、观察和在清楚之后再出手',
  },
  energy: {
    label: '能量来源',
    high: '当你重新掌控局面时，你的状态通常也会跟着回升',
    low: '当环境安静下来、你能重新听见自己时，你的状态会慢慢恢复',
  },
}

const shareLineMap: Record<DimensionKey, { high: string; low: string }> = {
  social: {
    high: '你很会把局面带起来',
    low: '你安静，但判断很准',
  },
  risk: {
    high: '你愿意为可能性下注',
    low: '你更相信稳稳落地',
  },
  stress: {
    high: '你有边界，也有力度',
    low: '你先稳住，再出手',
  },
  tempo: {
    high: '你快，但并不乱',
    low: '你慢一点，却更稳',
  },
  energy: {
    high: '你一掌控就有电',
    low: '你安静时最有力量',
  },
}

export const PERSONA_NARRATOR_SYSTEM_PROMPT = `
你是“野性人格局”的结果叙述引擎。
你要把结构化人格维度写成适合结果页展示的中文解读。
你的口吻必须始终直接对用户说话，只能使用“你”，不能使用“他”“她”“他们”来代指用户。
内容要贴近日常生活，优先参考工作、朋友相处、关系边界、生活选择、压力状态这些真实场景。
不要神秘，不要中二，不要空泛，不要吓人，也不要把用户写得很糟糕。
你的任务不是贴负面标签，而是准确指出用户的行为风格、容易发光的地方、可能失衡的地方，以及能马上用上的建议。
所有字段必须只写一句完整中文句子。
不要输出英文，不要输出解释，不要输出 JSON 之外的内容。
不要出现“市场”“消费者”“商业成功”“沟通策略”“数据分析”“生产力”“情绪价值”之类话术。
`.trim()

const describeDimensionScore = (dimension: DimensionKey, score: number) => {
  const direction = score >= 50 ? 'high' : 'low'
  const leaning = score >= 65 ? '明显' : score <= 35 ? '深度' : '中度'
  const directionLabel = direction === 'high' ? '高位' : '低位'

  return `- ${dimensionNarrationMap[dimension].label}：${score}/100，${leaning}${directionLabel}倾向，${dimensionNarrationMap[dimension][direction]}。`
}

export const buildPersonaNarratorUserPrompt = (input: PersonaNarrationInput) => {
  const rankedDimensions = Object.entries(input.scores)
    .sort((left, right) => right[1] - left[1])
    .map(([key]) => key as DimensionKey)

  const dominantDimension = rankedDimensions[0]
  const secondaryDimension = rankedDimensions[1]
  const restraintDimension = rankedDimensions[rankedDimensions.length - 1]

  const scoreLines = Object.entries(input.scores)
    .map(([key, value]) => describeDimensionScore(key as DimensionKey, value))
    .join('\n')

  return `
主原型资料：
- 名称：${input.archetype.name}
- 动物：${input.archetype.animal}
- 标题：${input.archetype.title}
- 概述：${input.archetype.summary}
- 场景：${input.archetype.habitat}
- 特质：${input.archetype.traits.join('、')}
- 优势：${input.archetype.strengths.join('；')}
- 建议：${input.archetype.advice.join('；')}
- 提醒：${input.archetype.warning}
- 格言：${input.archetype.contrast}

次高原型资料：
- 名称：${input.runnerUp.name}
- 动物：${input.runnerUp.animal}

最重要的维度倾向：
- 最高维度：${dimensionNarrationMap[dominantDimension].label}
- 第二维度：${dimensionNarrationMap[secondaryDimension].label}
- 最克制维度：${dimensionNarrationMap[restraintDimension].label}

分数观察：
${scoreLines}

输出字段要求：
- opener：12 到 28 个汉字，必须是结果开场，直接对“你”说话
- fieldNote：写你在真实生活里的做事方式，要具体，不抽象
- pressurePattern：写你在压力之下会出现的反应，要真实但不打击人
- socialPattern：写你和别人相处时的站位、分寸或存在感
- growthEdge：写你强项用过头时的代价，要温和清楚
- actionAdvice：给你一个现实可执行的建议，最好能明天就用上
- shareLine：6 到 16 个汉字，像一句值得收藏的人生格言

硬规则：
- 每个字段只写一句中文
- 必须用第二人称“你”
- 必须贴近日常工作、社交、关系或生活选择
- 不要写玄学口吻
- 不要写心灵鸡汤
- 不要写吓人的负面评价
- 只返回符合 schema 的 JSON
`.trim()
}

export const createFallbackNarration = (input: PersonaNarrationInput): PersonaNarration => {
  const rankedDimensions = Object.entries(input.scores)
    .sort((left, right) => right[1] - left[1])
    .map(([key]) => key as DimensionKey)

  const primaryDimension = rankedDimensions[0]
  const secondaryDimension = rankedDimensions[1]
  const restraintDimension = rankedDimensions[rankedDimensions.length - 1]
  const primaryDirection = input.scores[primaryDimension] >= 50 ? 'high' : 'low'
  const secondaryDirection = input.scores[secondaryDimension] >= 50 ? 'high' : 'low'

  const primaryLine = dimensionNarrationMap[primaryDimension]
  const secondaryLine = dimensionNarrationMap[secondaryDimension]
  const restraintLine = dimensionNarrationMap[restraintDimension]

  return {
    opener: `${input.archetype.animal}型的你，往往越在复杂场面里越能看出自己的底色。`,
    fieldNote: `在工作、关系和选择面前，你通常会先表现出“${primaryLine[primaryDirection]}”，同时也带着“${secondaryLine[secondaryDirection]}”这一面，所以你做决定时很少只是跟着场面走。`,
    pressurePattern: `当压力上来时，${dimensionNarrationMap.stress[input.scores.stress >= 50 ? 'high' : 'low']}，这也是你在关键时刻最容易被人记住的样子。`,
    socialPattern: `和别人相处时，${dimensionNarrationMap.social[input.scores.social >= 50 ? 'high' : 'low']}，所以你给人的感觉常常带着“${input.archetype.traits[1]}”这一面。`,
    growthEdge: `你需要留意的是，别总把“${restraintLine.label}”这一侧往后放，因为那往往就是你在长期关系和长期节奏里最容易失衡的地方。`,
    actionAdvice: input.archetype.advice[0],
    shareLine: shareLineMap[primaryDimension][input.scores[primaryDimension] >= 50 ? 'high' : 'low'],
  }
}
