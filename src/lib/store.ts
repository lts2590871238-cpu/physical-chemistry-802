import { useCallback, useEffect, useState } from 'react'

export type QStatus = 'correct' | 'wrong' | 'self-graded' | 'reviewed'

export interface QRecord {
  status: QStatus
  /** 计算/简答自评得分（采分点合计） */
  selfScore?: number
  /** 采分点满分 */
  fullScore?: number
  /** 数值核对点通过情况 */
  cpPassed?: boolean[]
  ts: number
}

export interface ProgressMap { [qid: string]: QRecord }

const KEY = 'pc802.v1'

interface Store {
  freezeVersion?: number
  progress: ProgressMap
  cardsDone: Record<string, boolean>
  daysDone: Record<string, boolean>
  examNotes: Record<string, string>
  savedIds: Record<string, boolean>
  retryStarted: Record<string, number>
}

const listeners = new Set<() => void>()

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = { progress: {}, cardsDone: {}, daysDone: {}, examNotes: {}, savedIds: {}, retryStarted: {}, ...JSON.parse(raw) } as Store
      if (saved.freezeVersion !== 1) {
        const old = saved.daysDone
        const days: Record<string, boolean> = {}
        for (const [from, to] of [[1, 1], [1, 2], [2, 3], [3, 4], [3, 5],
          [4, 6], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13],
          [13, 14], [14, 15], [15, 16], [16, 17], [17, 18], [19, 19], [20, 20]]) {
          if (old[String(from)]) days[String(to)] = true
        }
        if (old['5'] && old['6']) days['7'] = true
        saved.daysDone = days
        if (saved.cardsDone['体积功、焓与热容']) {
          saved.cardsDone['体积功与可逆过程'] = true
          saved.cardsDone['焓与热容'] = true
        }
        saved.freezeVersion = 1
      }
      return saved
    }
  } catch { /* ignore */ }
  return { freezeVersion: 1, progress: {}, cardsDone: {}, daysDone: {}, examNotes: {}, savedIds: {}, retryStarted: {} }
}

function write(s: Store) {
  localStorage.setItem(KEY, JSON.stringify(s))
  listeners.forEach((f) => f())
}

export const store = {
  get: read,
  setRecord(qid: string, rec: QRecord) {
    const s = read(); s.progress[qid] = rec; write(s)
  },
  removeRecord(qid: string) {
    const s = read(); delete s.progress[qid]; write(s)
  },
  setCardDone(name: string, done: boolean) {
    const s = read(); s.cardsDone[name] = done; write(s)
  },
  setDayDone(day: number, done: boolean) {
    const s = read(); s.daysDone[String(day)] = done; write(s)
  },
  setExamNote(k: string, note: string) {
    const s = read(); s.examNotes[k] = note; write(s)
  },
  setSaved(qid: string, saved: boolean) {
    const s = read(); if (saved) s.savedIds[qid] = true; else delete s.savedIds[qid]; write(s)
  },
  startRetry(ids: string[]) {
    const s = read()
    for (const id of ids) s.retryStarted[id] = Math.max(Date.now(), s.progress[id]?.ts ?? 0)
    write(s)
  },
  resetAll() { write({ freezeVersion: 1, progress: {}, cardsDone: {}, daysDone: {}, examNotes: {}, savedIds: {}, retryStarted: {} }) },
}

export function useStore(): Store {
  const [, tick] = useState(0)
  useEffect(() => {
    const f = () => tick((n) => n + 1)
    listeners.add(f)
    return () => { listeners.delete(f) }
  }, [])
  return read()
}

export function useQuestionRecord(qid: string): [QRecord | undefined, (r: QRecord) => void, () => void] {
  useStore()
  const set = useCallback((r: QRecord) => store.setRecord(qid, r), [qid])
  const clear = useCallback(() => store.removeRecord(qid), [qid])
  return [read().progress[qid], set, clear]
}
