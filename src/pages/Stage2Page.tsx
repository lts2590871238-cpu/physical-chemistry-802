import { useSearchParams } from 'react-router'
import { useAsync } from '../hooks/useAsync'
import { loadAllSolutions, loadPlan, loadQuestions, pickByIds } from '../lib/data'
import type { Question, Solution } from '../lib/types'
import QuestionList from '../components/QuestionList'
import KpCard, { type KpGuide } from '../components/KpCard'
import RetryDayButton from '../components/RetryDayButton'

const LEVEL_LABEL: Record<string, string> = { easy: '基础', medium: '中档', hard: '攻坚' }

/** 阶段二：12-20 年混库成套（6 套） */
export default function Stage2Page() {
  const [params, setParams] = useSearchParams()
  const setId = params.get('set') ?? 'S2-E1'
  const { data: plan } = useAsync(loadPlan, [])
  const { data: questions } = useAsync(loadQuestions, [])
  const { data: sols } = useAsync(loadAllSolutions, [])
  const { data: kpGuide, error: guideError } = useAsync<Record<string, KpGuide>>(
    () => fetch(`${import.meta.env.BASE_URL}data/kp_guide.json`).then((r) => r.json()), [])

  if (guideError) return <div className="loading">加载知识卡出错：{guideError}</div>
  if (!plan || !questions || !sols || !kpGuide) return <div className="loading">装载套卷…</div>

  const current = plan.stage2.sets.find((s) => s.id === setId) ?? plan.stage2.sets[0]
  const qs: Question[] = (pickByIds(questions, current.ids) as Question[])
    .map((q) => ({ ...q, sol: (sols as Record<string, Solution>)[q.id] }))

  return (
    <div className="page">
      <header className="page-head">
        <h2 className="page-title">阶段二 · 打散混库成套 <span className="mono page-years">2012–2020 · 269 题</span></h2>
        <p className="page-sub">不再按年份也不按章节——随机混编、按难度分层。基础套以判断概念题为主快速过脑，中档套全是选择填空练速算，攻坚套全是计算简答练过程分。</p>
      </header>

      <div className="mod-tabs set-tabs">
        {plan.stage2.sets.map((s) => (
          <button
            key={s.id}
            className={`mod-tab lv-${s.level} ${s.id === current.id ? 'mod-on' : ''}`}
            onClick={() => setParams({ set: s.id })}
          >
            <span className="set-name">{s.name}</span>
            <span className="tag">{LEVEL_LABEL[s.level]}</span>
            <span className="mod-count mono">{s.ids.length}</span>
          </button>
        ))}
      </div>

      <div className="set-desc">{current.desc}</div>
      <RetryDayButton ids={current.ids} />

      <QuestionList questions={qs} title={current.name} beforeQuestion={(q) =>
        current.bridgeCards?.[q.id]?.map((name) => (
          <KpCard key={name} name={name} guide={kpGuide[name]}
            count={q.kp.includes(name) ? 1 : 0} />
        ))
      } />
      <RetryDayButton ids={current.ids} />
    </div>
  )
}
