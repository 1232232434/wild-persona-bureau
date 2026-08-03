export type DimensionKey = 'social' | 'risk' | 'stress' | 'tempo' | 'energy'

export type DimensionScores = Record<DimensionKey, number>

export interface QuestionOption {
  id: string
  label: string
  text: string
  weight: DimensionScores
}

export interface Question {
  id: string
  scene: string
  prompt: string
  options: QuestionOption[]
}

export interface Archetype {
  id: string
  animal: string
  name: string
  title: string
  summary: string
  habitat: string
  personality: string
  love: string
  career: string
  animalProfile: {
    vibe: string
    personality: string
    love: string
    career: string
    blindSpot: string
  }
  traits: string[]
  strengths: string[]
  advice: string[]
  warning: string
  contrast: string
  signature: DimensionScores
}

export interface RankedArchetype extends Archetype {
  match: number
}

export interface ResultMetric {
  score: number
  label: string
  summary: string
  detail: string
}

export interface AdjacentPersonaInsight {
  title: string
  summary: string
  sharedSignalLabels: string[]
  decisiveSignalLabel: string
}

export interface ResultProfile {
  confidence: ResultMetric
  rarity: ResultMetric
  adjacent: AdjacentPersonaInsight
}
