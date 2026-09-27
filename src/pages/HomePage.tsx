import { Link } from 'react-router'
import { useAsync } from '../hooks/useAsync'
import { loadPlan, loadQuestions } from '../lib/data'
import { store, useStore } from '../lib/store'
import type { PlanDay } from '../lib/types'

const STAGE_META: Record<string, { name: string; color: string }> = {
  S1: { name: '阶段一', color: 'stage-s1' },
  S2: { name: '阶段二', color: 'stage-s2' },
  S3: { name: '阶段三', color: 'stage-s3' },
  P: { name: '预测', color: 'stage-p' },
}

function dayLink(d: PlanDay): string {
  switch (d.kind) {
    case 'module': return `/stage1?mod=${d.ref}`
    case 'set': return `/stage2?set=${d.ref}`
    case 'paper': return `/stage3?year=${d.ref}`
    case 'pred': return `/prediction?paper=${d.ref}`
    default: return '/mistakes'
  }
}

export default function HomePage() {
  const { data: plan } = useAsync(loadPlan, [])
  const { data: questions } = useAsync(loadQuestions, [])
  const { progress, daysDone } = useStore()

  if (!plan || !questions) return <div className="loading">装载作战图…</div>

  const drillable = questions.filter((q) => q.year <= 2023)
  const done = drillable.filter((q) => progress[q.id]).length
  const correct = drillable.filter((q) => progress[q.id]?.status === 'correct').length
  const wrong = drillable.filter((q) => progress[q.id]?.status === 'wrong').length
  const daysCompleted = Object.values(daysDone).filter(Boolean).length

  return (
    <div className="home">
      <section className="hero">
        <img className="hero-photo-image" src={`${import.meta.env.BASE_URL}decor/home-hero.jpg`} alt="" aria-hidden="true" />
        <div className="hero-kicker mono">🌿 南京工业大学 · 802 物理化学 · 考研冲刺</div>
        <h2 className="hero-title">20 天，练会真题<br /><span>冲向 120 分</span></h2>
        <p className="hero-sub">
          三阶段推进：03–11 年按知识点精练，12–20 年打散成套，21–23 年掐时自测；
          最后两天两套预测卷收官。知识卡带着读题、选公式、核答案；错题留在本机，随时回来再练。
        </p>
        <div className="hero-stats">
          <div className="hstat"><b className="mono">{done}</b><span>/ {drillable.length} 已练</span></div>
          <div className="hstat"><b className="mono">{correct}</b><span>已掌握</span></div>
          <div className="hstat hstat-warn"><b className="mono">{wrong}</b><span>在错题本</span></div>
          <div className="hstat"><b className="mono">{daysCompleted}</b><span>/ 20 天完成</span></div>
        </div>
      </section>

      <section className="stage-cards">
        <Link to="/stage1" className="scard stage-s1">
          <div className="scard-no mono">🌱 01 · 打基础</div>
          <h4>模块精练</h4>
          <p>2003–2011 · 284 题按知识点聚类，先学讲解再做题，从概念到运用</p>
        </Link>
        <Link to="/stage2" className="scard stage-s2">
          <div className="scard-no mono">🧩 02 · 会组合</div>
          <h4>混库成套</h4>
          <p>2012–2020 · 269 题按难度拆成 6 套：基础扫描 → 中档选择 → 计算攻坚</p>
        </Link>
        <Link to="/stage3" className="scard stage-s3">
          <div className="scard-no mono">⏱️ 03 · 练速度</div>
          <h4>掐时自测</h4>
          <p>2021–2023 三年整卷，线下 3 小时模拟 + 网页逐题核对打分</p>
        </Link>
        <Link to="/prediction" className="scard stage-p">
          <div className="scard-no mono">✨ 04 · 做整卷</div>
          <h4>预测卷 A / B</h4>
          <p>侯文华习题集精编 64 题：A 卷持平最新难度，B 卷上调 30–50%</p>
        </Link>
      </section>

      <section className="plan">
        <h3 className="sec-title">20 天作战图 <span className="sec-sub mono">点击任意一天直达训练场</span></h3>
        <div className="plan-list">
          {plan.days.map((d) => {
            const doneDay = !!daysDone[String(d.day)]
            return (
              <div key={d.day} className={`day ${doneDay ? 'day-done' : ''}`}>
                <div className="day-num mono">D{d.day}</div>
                <span className={`day-stage ${STAGE_META[d.stage]?.color}`}>{STAGE_META[d.stage]?.name}</span>
                <Link to={dayLink(d)} className="day-title">{d.title}</Link>
                <span className="day-meta"><span className="day-est mono">{d.est}</span><span className="day-note">{d.note}</span></span>
                <button
                  className={`day-check ${doneDay ? 'day-check-on' : ''}`}
                  onClick={() => store.setDayDone(d.day, !doneDay)}
                  title={doneDay ? '取消完成标记' : '标记今日完成'}
                >{doneDay ? '✓' : ''}</button>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
