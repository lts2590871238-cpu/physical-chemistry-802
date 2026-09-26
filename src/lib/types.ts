export type QType = 'choice' | 'fill' | 'judge' | 'short' | 'calc'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface RawQuestion {
  id: string
  year: number
  no: number
  section: string
  type: QType
  n_sub: number
  has_fig: boolean
  figs: string[]
  source?: { kind: string; year?: number; file?: string; page?: number; printed_no?: string; verified?: boolean }
  raw: string
  module: string
  kp: string[]
  tier: string
  primaryKnowledgePoint?: string
  secondaryKnowledgePoints?: string[]
}

export interface Checkpoint { label: string; value: number; unit: string; tol: number }
export interface MarkPoint { point: string; score: number }

export interface Solution {
  id: string
  type: QType
  answer: { correct?: string; blanks?: string[]; final?: string }
  difficulty: Difficulty | number
  recall: string
  solution: string
  method: string
  pitfalls: string
  checkpoints: Checkpoint[]
  markingScheme: MarkPoint[]
}

export interface Question extends RawQuestion { sol?: Solution }

export interface PredQuestion {
  id: string
  section: string
  type: QType
  score: number
  module: string
  kp: string[]
  tier: string
  difficulty: Difficulty
  raw: string
  options?: Record<string, string>
  answer: { correct?: string; blanks?: string[]; final?: string }
  source: string
  solution: string
  method: string
  pitfalls: string
  recall: string
  checkpoints: Checkpoint[]
  markingScheme: MarkPoint[]
}

export interface PredPaper {
  meta: { paper: string; title: string; total: number; structure: { section: string; count: number; each: number; total: number }[]; source: string; time: string }
  questions: PredQuestion[]
}

export interface PlanSet { id: string; name: string; level: Difficulty; desc: string; ids: string[]; bridgeCards?: Record<string, string[]> }
export interface PlanDay {
  day: number; stage: string; title: string; kind: 'module' | 'set' | 'paper' | 'review' | 'pred'
  ref: string; est: string; note: string
}
export interface KpSeg { kp: string; count: number }
export interface Plan {
  modules: Record<string, { name: string; short: string }>
  stage1: { years: string; byModule: Record<string, string[]>; kpSeq: Record<string, KpSeg[]>; moduleGuide?: Record<string, string> }
  stage2: { years: string; sets: PlanSet[] }
  stage3: { years: string[] }
  days: PlanDay[]
}

export interface Analysis {
  scope: string
  tier_weights: Record<string, number>
  years: Record<string, { total: number; types: Record<string, number>; modules: Record<string, number>; kp: Record<string, number> }>
  hotspots_weighted_761: [string, number][]
}

export const MODULE_ORDER = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9']

export function normDifficulty(d: Difficulty | number | undefined): Difficulty {
  if (d === 1 || d === 2 || d === 'easy') return 'easy'
  if (d === 4 || d === 5 || d === 'hard') return 'hard'
  return 'medium'
}

export const TYPE_LABEL: Record<QType, string> = {
  choice: '选择', fill: '填空', judge: '判断', short: '简答', calc: '计算',
}
