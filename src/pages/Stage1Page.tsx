import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAsync } from '../hooks/useAsync'
import { loadAllSolutions, loadPlan, loadQuestions, pickByIds } from '../lib/data'
import { useStore } from '../lib/store'
import type { Question, Solution } from '../lib/types'
import { MODULE_ORDER } from '../lib/types'
import QuestionList from '../components/QuestionList'
import KpCard, { type KpGuide } from '../components/KpCard'

interface KpGuideMap { [kp: string]: KpGuide & { search_terms?: string[] } }

/** 阶段一：03-11 年按模块精练，模块内按知识点分节（讲解卡 + 概念→运用题序） */
export default function Stage1Page() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const { progress, cardsDone } = useStore()
  const mod = params.get('mod') ?? 'M1'
  const { data: plan, error: e1 } = useAsync(loadPlan, [])
  const { data: questions, error: e2 } = useAsync(loadQuestions, [])
  const { data: sols, error: e3 } = useAsync(loadAllSolutions, [])
  const { data: kpGuide, error: e4 } = useAsync<KpGuideMap>(
    () => fetch(`${import.meta.env.BASE_URL}data/kp_guide.json`).then((r) => r.json()), [])

  if (e1 || e2 || e3 || e4) return <div className="loading">加载出错：{e1 ?? e2 ?? e3 ?? e4}</div>
  if (!plan || !questions || !sols || !kpGuide) return <div className="loading">装载模块题库…</div>

  const moduleName = plan.modules[mod]?.name ?? mod

  const needle = search.trim().toLocaleLowerCase()
  const stage1Ids = MODULE_ORDER.flatMap((m) => plan.stage1.byModule[m] ?? [])
  const stage1Questions = pickByIds(questions, stage1Ids)
  const isCore = (name: string) => ['2026_core', '2026_familiar'].includes(kpGuide[name]?.curriculumStatus ?? '')
  const coreQuestions = stage1Questions.filter((q) => isCore(q.primaryKnowledgePoint ?? q.kp[0]))
  const historicalQuestions = stage1Questions.length - coreQuestions.length
  const cardNames = MODULE_ORDER.flatMap((m) => (plan.stage1.kpSeq[m] ?? []).map((s) => s.kp)).filter(isCore)
  const byType = (['judge', 'choice', 'fill', 'short', 'calc'] as const).map((type) => {
    const subset = coreQuestions.filter((q) => q.type === type)
    const done = subset.filter((q) => progress[q.id]).length
    const evaluated = subset.filter((q) => progress[q.id]?.status === 'correct' || progress[q.id]?.status === 'wrong')
    const right = evaluated.filter((q) => progress[q.id]?.status === 'correct').length
    return { type, total: subset.length, done, evaluated: evaluated.length, right }
  })
  const wrongCount = coreQuestions.filter((q) => progress[q.id]?.status === 'wrong' ||
    (progress[q.id]?.status === 'self-graded' && progress[q.id]?.fullScore != null &&
      (progress[q.id]?.selfScore ?? 0) < progress[q.id]!.fullScore!)).length
  const weak = new Map<string, number>()
  for (const q of coreQuestions) {
    if (progress[q.id]?.status !== 'wrong') continue
    const kp = q.primaryKnowledgePoint ?? q.kp[0]
    weak.set(kp, (weak.get(kp) ?? 0) + 1)
  }
  const topWeak = [...weak.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  const sections = (needle ? MODULE_ORDER : [mod]).flatMap((module) => {
    const ids = plan.stage1.byModule[module] ?? []
    let cursor = 0
    return (plan.stage1.kpSeq[module] ?? []).map((s) => {
      const seg = ids.slice(cursor, cursor + s.count)
      cursor += s.count
      const qs: Question[] = (pickByIds(questions, seg) as Question[])
        .map((q) => ({ ...q, sol: (sols as Record<string, Solution>)[q.id] }))
      return { ...s, module, qs }
    }).filter((s) => !needle || `${s.kp} ${kpGuide[s.kp]?.explain ?? ''} ${kpGuide[s.kp]?.search_terms?.join(' ') ?? ''}`.toLocaleLowerCase().includes(needle))
  })

  return (
    <div className="page">
      <header className="page-head">
        <h2 className="page-title">阶段一 · 按知识点精练 <span className="mono page-years">2003–2011 · 284 题</span></h2>
        <p className="page-sub">每个知识点先读讲解卡（讲透概念 → 小例子 → 南工考法），再按「判断 → 选择 → 填空 → 简答 → 计算」的顺序做题，从概念理解一步步走到灵活运用。</p>
      </header>

      <div className="mod-tabs">
        {MODULE_ORDER.map((m) => (
          <button
            key={m}
            className={`mod-tab ${m === mod ? 'mod-on' : ''}`}
            onClick={() => setParams({ mod: m })}
          >
            <span className="mono">{m}</span>
            <span className="mod-name">{plan.modules[m]?.short ?? m}</span>
            <span className="mod-count mono">{(plan.stage1.byModule[m] ?? []).length}</span>
          </button>
        ))}
      </div>

      <h3 className="sec-title">{mod} {moduleName}</h3>
      {!needle && plan.stage1.moduleGuide?.[mod] && <p className="page-sub">{plan.stage1.moduleGuide[mod]}</p>}

      <input className="kp-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索知识卡：第三定律、Arrhenius、Nernst…" aria-label="搜索第一阶段知识卡" />
      {needle && <p className="page-sub">找到 {sections.length} 张知识卡</p>}

      {sections.map((s) => (
        <div key={`${s.module}-${s.kp}`} className="kp-section">
          {needle && <p className="page-sub">{s.module} {plan.modules[s.module]?.name}</p>}
          <KpCard name={s.kp} guide={kpGuide[s.kp]} count={s.count} />
          {s.count > 0 && <QuestionList questions={s.qs} />}
        </div>
      ))}
      {sections.length === 0 && <div className="empty">没有找到对应知识卡</div>}
      {!needle && <section className="kp-section">
        <h3 className="sec-title">阶段一毕业检查</h3>
        <p>2026 大纲知识卡完成 {cardNames.filter((name) => cardsDone[name]).length}/{cardNames.length}；
          核心真题已做 {coreQuestions.filter((q) => progress[q.id]).length}/{coreQuestions.length}；
          错题 {wrongCount} 道。</p>
        <p>另有历年真题补充 {historicalQuestions} 道，可练习，但不计入 2026 核心完成率。</p>
        <ul>
          {byType.map(({ type, total, done, evaluated, right }) => (
            <li key={type}>{({ judge: '判断', choice: '选择', fill: '填空', short: '简答', calc: '计算' })[type]}：
              完成 {done}/{total}{type === 'judge' || type === 'choice' ? `，已判题正确 ${right}/${evaluated}` : ''}</li>
          ))}
        </ul>
        <p>高频错误知识点：{topWeak.length ? topWeak.map(([name, n]) => `${name} ${n}题`).join('、') : '暂无记录'}。</p>
      </section>}
    </div>
  )
}
