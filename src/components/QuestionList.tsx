import { Fragment, useMemo, useState, type ReactNode } from 'react'
import type { Question } from '../lib/types'
import { toUI, QuestionCard } from '../lib/QuestionCard'
import { useStore } from '../lib/store'

type Filter = 'all' | 'todo' | 'wrong' | 'done'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'todo', label: '未做' },
  { key: 'wrong', label: '错题' },
  { key: 'done', label: '已掌握' },
]

export default function QuestionList({ questions, title, beforeQuestion }: { questions: Question[]; title?: string; beforeQuestion?: (q: Question) => ReactNode }) {
  const { progress } = useStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [collapsed, setCollapsed] = useState(false)

  const stats = useMemo(() => {
    let done = 0, correct = 0, graded = 0
    for (const q of questions) {
      const r = progress[q.id]
      if (r) { done++; if (r.status === 'correct' || r.status === 'wrong') graded++; if (r.status === 'correct') correct++ }
    }
    return { done, correct, graded, total: questions.length }
  }, [questions, progress])

  const shown = useMemo(() => {
    if (filter === 'all') return questions
    return questions.filter((q) => {
      const r = progress[q.id]
      if (filter === 'todo') return !r
      if (filter === 'wrong') return r?.status === 'wrong'
      return r?.status === 'correct'
    })
  }, [questions, progress, filter])

  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0
  const acc = stats.graded ? Math.round((stats.correct / stats.graded) * 100) : 0

  return (
    <section className="qlist">
      <header className="qlist-head">
        <div className="qlist-title-row">
          <h3 className="qlist-title">{title ?? '题目'}</h3>
          <span className="qlist-stats mono">
            {stats.done}/{stats.total} 已做 · 正确率 {acc}%
          </span>
          <button className="btn btn-ghost mono" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '展开' : '收起'}
          </button>
        </div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        <div className="qlist-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`chip ${filter === f.key ? 'chip-on' : ''}`}
              onClick={() => setFilter(f.key)}
            >{f.label}</button>
          ))}
          <span className="chip-count mono">{shown.length} 题</span>
        </div>
      </header>
      {!collapsed && (
        <div className="qlist-body">
          {shown.map((q, i) => <Fragment key={q.id}>{beforeQuestion?.(q)}<QuestionCard q={toUI(q)} index={i} /></Fragment>)}
          {shown.length === 0 && <div className="empty">该筛选条件下没有题目</div>}
        </div>
      )}
    </section>
  )
}
