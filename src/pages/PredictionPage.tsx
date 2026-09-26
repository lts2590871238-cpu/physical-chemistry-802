import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useAsync } from '../hooks/useAsync'
import { loadPrediction } from '../lib/data'
import { predToUI, QuestionCard } from '../lib/QuestionCard'
import { useStore } from '../lib/store'

const SECTION_ORDER = ['choice', 'fill', 'short', 'calc'] as const
const SECTION_LABEL: Record<string, string> = {
  choice: '一、选择题', fill: '二、填空题', short: '三、简答题', calc: '四、计算题',
}

/** 预测卷 A/B（侯文华习题集题源） */
export default function PredictionPage() {
  const [params, setParams] = useSearchParams()
  const paper = (params.get('paper') ?? 'A') as 'A' | 'B'
  const { data: p } = useAsync(() => loadPrediction(paper), [paper])
  const { progress } = useStore()

  const groups = useMemo(() => {
    if (!p) return []
    return SECTION_ORDER.map((sec) => ({
      sec,
      qs: p.questions.filter((q) => q.section === sec || (q.section as string) === sec),
      meta: p.meta.structure.find((s) => s.section === sec),
    })).filter((g) => g.qs.length > 0)
  }, [p])

  if (!p) return <div className="loading">装载预测卷…</div>

  const done = p.questions.filter((q) => progress[q.id]).length
  const earned = p.questions.reduce((a, q) => a + (progress[q.id]?.selfScore ?? (progress[q.id]?.status === 'correct' ? q.score : 0)), 0)

  return (
    <div className="page">
      <header className="page-head">
        <h2 className="page-title">{p.meta.title}</h2>
        <p className="page-sub">{p.meta.source} 建议 {p.meta.time}，再回网页逐题核对自评。</p>
      </header>

      <div className="mod-tabs set-tabs">
        {(['A', 'B'] as const).map((x) => (
          <button key={x} className={`mod-tab ${x === paper ? 'mod-on' : ''}`} onClick={() => setParams({ paper: x })}>
            <span className="set-name">预测卷 {x}</span>
            <span className="tag">{x === 'A' ? '持平 24-26 难度' : '难度 +30~50%'}</span>
          </button>
        ))}
      </div>

      <div className="exam-bar">
        <span className="exam-stat mono">满分 {p.meta.total} · 已核对 {done}/{p.questions.length} · 自评累计 {Math.round(earned * 10) / 10} 分</span>
      </div>

      {groups.map((g) => (
        <section key={g.sec} className="paper-section">
          <h3 className="sec-title">
            {SECTION_LABEL[g.sec]}
            {g.meta && <span className="sec-sub mono">{g.meta.count} 题 × {g.meta.each} 分 = {g.meta.total} 分</span>}
          </h3>
          <div className="qlist-body">
            {g.qs.map((q, i) => <QuestionCard key={q.id} q={predToUI(q)} index={i} />)}
          </div>
        </section>
      ))}
    </div>
  )
}
