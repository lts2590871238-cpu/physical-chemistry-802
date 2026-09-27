import { useMemo, useState } from 'react'
import { useAsync } from '../hooks/useAsync'
import { loadAllSolutions, loadQuestions } from '../lib/data'
import { useStore } from '../lib/store'
import type { Question, Solution } from '../lib/types'
import QuestionList from '../components/QuestionList'

/** 错题本 + 弱点合成卷 */
export default function MistakesPage() {
  const { data: questions } = useAsync(loadQuestions, [])
  const { data: sols } = useAsync(loadAllSolutions, [])
  const [genSeed, setGenSeed] = useState(0)

  const enriched: Question[] = useMemo(() => {
    if (!questions || !sols) return []
    return questions
      .filter((q) => q.year <= 2023)
      .map((q) => ({ ...q, sol: (sols as Record<string, Solution>)[q.id] }))
  }, [questions, sols])

  if (!questions || !sols) return <div className="loading">装载错题本…</div>

  return <MistakesInner enriched={enriched} genSeed={genSeed} onRegen={() => setGenSeed((s) => s + 1)} />
}

function MistakesInner({ enriched, genSeed, onRegen }: { enriched: Question[]; genSeed: number; onRegen: () => void }) {
  const { progress, savedIds } = useStore()
  const wrongs = enriched.filter((q) => progress[q.id]?.status === 'wrong')
  const saved = enriched.filter((q) => savedIds[q.id])

  const kpStat = useMemo(() => {
    const m = new Map<string, number>()
    for (const q of wrongs) for (const k of q.kp) m.set(k, (m.get(k) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [wrongs])

  /** 弱点合成卷：错题最多的 kp 各抽最多 3 道"同 kp 且未掌握"的题 */
  const synthetic = useMemo(() => {
    const picked = new Set<string>()
    const out: Question[] = []
    let s = genSeed + 7
    const rand = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
    for (const [kp] of kpStat.slice(0, 6)) {
      const cands = enriched.filter(
        (q) => q.kp.includes(kp) && !picked.has(q.id) && progress[q.id]?.status !== 'correct',
      )
      cands.sort(() => rand() - 0.5)
      for (const q of cands.slice(0, 3)) { picked.add(q.id); out.push(q) }
    }
    return out
  }, [kpStat, enriched, progress, genSeed])

  const maxCnt = kpStat[0]?.[1] ?? 1

  return (
    <div className="page">
      <header className="page-head">
        <h2 className="page-title">错题本与弱点合成卷</h2>
        <p className="page-sub">做错自动进错题本，也可点题目右上角的星标收藏。记录保存在当前浏览器；弱点合成卷会从高频失分知识点中选题。</p>
      </header>

      <div className="two-col">
        <section className="panel">
          <h3 className="sec-title">失分知识点排行 <span className="sec-sub mono">{wrongs.length} 道错题</span></h3>
          {kpStat.length === 0 && <div className="empty">还没有错题——做题时点"记入错题"或答错会自动收录</div>}
          {kpStat.slice(0, 12).map(([kp, c]) => (
            <div className="kp-bar-row" key={kp}>
              <span className="kp-bar-label">{kp}</span>
              <div className="kp-bar-track"><div className="kp-bar-fill" style={{ width: `${(c / maxCnt) * 100}%` }} /></div>
              <span className="kp-bar-num mono">{c}</span>
            </div>
          ))}
        </section>

        <section className="panel">
          <h3 className="sec-title">弱点合成卷
            {synthetic.length > 0 && <button className="btn btn-ghost mono" onClick={onRegen}>换一批</button>}
          </h3>
          {synthetic.length === 0 && <div className="empty">先积累一些错题，这里才能为你合成强化卷</div>}
          {synthetic.length > 0 && <div className="empty mono">{synthetic.length} 题 · 全部来自你的失分考点</div>}
        </section>
      </div>

      {synthetic.length > 0 && <QuestionList questions={synthetic} title="弱点合成卷" />}

      {wrongs.length > 0 && <QuestionList questions={wrongs} title="全部错题（重做后点「移出错题本」）" />}
      {saved.length > 0 && <QuestionList questions={saved} title="⭐ 收藏的试题" />}
    </div>
  )
}
