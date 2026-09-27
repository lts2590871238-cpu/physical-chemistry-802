import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAsync } from '../hooks/useAsync'
import { loadQuestions, loadSolutions } from '../lib/data'
import type { Question, Solution } from '../lib/types'
import { QuestionCard, toUI } from '../lib/QuestionCard'
import { useStore } from '../lib/store'
import RetryDayButton from '../components/RetryDayButton'
import StudyPhoto from '../components/StudyPhoto'

/** 阶段三：21-23 整卷掐时自测 */
export default function Stage3Page() {
  const [params, setParams] = useSearchParams()
  const year = params.get('year') ?? '2021'
  const { data: questions } = useAsync(loadQuestions, [])
  const { data: sols } = useAsync(() => loadSolutions(parseInt(year)), [year])
  const { progress, retryStarted } = useStore()
  const [elapsed, setElapsed] = useState(0)
  const [timing, setTiming] = useState(false)

  useEffect(() => {
    if (!timing) return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [timing])

  const qs: Question[] = useMemo(() => {
    if (!questions || !sols) return []
    return questions
      .filter((q) => q.year === parseInt(year))
      .sort((a, b) => a.no - b.no)
      .map((q) => ({ ...q, sol: (sols as Record<string, Solution>)[q.id] }))
  }, [questions, sols, year])

  if (!questions || !sols) return <div className="loading">装载 {year} 年试卷…</div>

  const done = qs.filter((q) => progress[q.id] && progress[q.id].ts > (retryStarted[q.id] ?? 0)).length
  const correct = qs.filter((q) => progress[q.id]?.status === 'correct' && progress[q.id].ts > (retryStarted[q.id] ?? 0)).length
  const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0')
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="page study-layout">
      <StudyPhoto file="stage3.jpg" alt="戴黄色帽子的玩偶" caption="掐好时间，独立做完再核对。" />
      <div className="study-main">
      <header className="page-head">
        <h2 className="page-title">阶段三 · 掐时自测 <span className="mono page-years">2021–2023 整卷</span></h2>
        <p className="page-sub">建议流程：开启计时 → 在纸上完整作答（按 150 分钟掐）→ 逐题核对并自评。错题自动进入错题本，第 18 天统一重练。</p>
      </header>

      <div className="mod-tabs set-tabs">
        {['2021', '2022', '2023'].map((y) => (
          <button key={y} className={`mod-tab ${y === year ? 'mod-on' : ''}`} onClick={() => setParams({ year: y })}>
            <span className="set-name">{y} 年卷</span>
            <span className="mod-count mono">{questions.filter((q) => q.year === parseInt(y)).length} 题</span>
          </button>
        ))}
      </div>

      <div className="exam-bar">
        <div className="timer mono">{hh}:{mm}:{ss}</div>
        <button className={`btn ${timing ? 'btn-bad' : 'btn-primary'}`} onClick={() => setTiming(!timing)}>
          {timing ? '暂停计时' : elapsed > 0 ? '继续计时' : '开始计时'}
        </button>
        <button className="btn btn-ghost" onClick={() => { setTiming(false); setElapsed(0) }}>归零</button>
        <span className="exam-stat mono">{done}/{qs.length} 已核对 · 正确 {correct}</span>
        <span className="exam-hint">建议 150 分钟内完成</span>
      </div>

      <RetryDayButton ids={qs.map((q) => q.id)} />

      <div className="qlist-body">
        {qs.map((q, i) => <QuestionCard key={q.id} q={toUI(q)} index={i} />)}
      </div>
      <RetryDayButton ids={qs.map((q) => q.id)} />
      </div>
    </div>
  )
}
