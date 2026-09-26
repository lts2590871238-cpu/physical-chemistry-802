import type { Analysis, Plan, PredPaper, Question, RawQuestion, Solution } from './types'

const cache = new Map<string, Promise<unknown>>()
const BASE = import.meta.env.BASE_URL || '/'

async function fetchRetry(url: string, tries = 3): Promise<Response> {
  let lastErr: unknown
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url)
      if (r.ok) return r
      lastErr = new Error(`HTTP ${r.status}`)
    } catch (e) { lastErr = e }
    await new Promise((r) => setTimeout(r, 300 * (i + 1)))
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

function load<T>(url: string): Promise<T> {
  const full = url.startsWith('http') ? url : `${BASE}${url.replace(/^\//, '')}`
  if (!cache.has(full)) {
    cache.set(full, fetchRetry(full).then((r) => r.json() as Promise<T>))
  }
  return cache.get(full) as Promise<T>
}

let questionsP: Promise<RawQuestion[]> | null = null
export function loadQuestions(): Promise<RawQuestion[]> {
  if (!questionsP) {
    questionsP = load<{ questions: RawQuestion[] }>('/data/questions.json').then((d) => d.questions)
  }
  return questionsP
}

let allSolsP: Promise<Record<string, Solution>> | null = null
/** 加载全部解析（2003-2023，单文件），返回 id → Solution */
export function loadAllSolutions(): Promise<Record<string, Solution>> {
  if (!allSolsP) allSolsP = load<Record<string, Solution>>('/data/solutions_all.json')
  return allSolsP
}

/** 单年解析（从总表过滤） */
export async function loadSolutions(year: number): Promise<Record<string, Solution>> {
  const all = await loadAllSolutions()
  const prefix = `${year}-`
  const out: Record<string, Solution> = {}
  for (const [k, v] of Object.entries(all)) if (k.startsWith(prefix)) out[k] = v
  return out
}

/** 合并题目与解析 */
export async function loadEnriched(yearMin: number, yearMax: number): Promise<Question[]> {
  const [qs, sols] = await Promise.all([loadQuestions(), loadAllSolutions()])
  return qs
    .filter((q) => q.year >= yearMin && q.year <= yearMax)
    .map((q) => ({ ...q, sol: sols[q.id] }))
}

export const loadPlan = () => load<Plan>('/data/plan.json')
export const loadAnalysis = () => load<Analysis>('/data/analysis_2024_2026.json')
export const loadPrediction = (p: 'A' | 'B') => load<PredPaper>(`/data/prediction_${p}.json`)

/** 按 id 列表取题（保序） */
export function pickByIds(questions: Question[] | RawQuestion[], ids: string[]): RawQuestion[] {
  const m = new Map(questions.map((q) => [q.id, q]))
  return ids.map((id) => m.get(id)).filter(Boolean) as RawQuestion[]
}
