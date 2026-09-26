import { useAsync } from '../hooks/useAsync'
import { loadAnalysis } from '../lib/data'
import { MODULE_ORDER } from '../lib/types'

const MODULE_NAMES: Record<string, string> = {
  M1: '气体与液化', M2: '热一律', M3: '热二律·三律', M4: '多组分',
  M5: '化学平衡', M6: '相平衡', M7: '电化学', M8: '动力学', M9: '界面化学',
}

/** 考情分析：2024-2026 只展示考情，不出题不给答案 */
export default function AnalyticsPage() {
  const { data: a } = useAsync(loadAnalysis, [])
  if (!a) return <div className="loading">装载考情…</div>

  const years = Object.keys(a.years).sort()
  const hotspots = a.hotspots_weighted_761.slice(0, 20)
  const maxHot = hotspots[0]?.[1] ?? 1
  const maxMod = Math.max(...years.flatMap((y) => Object.values(a.years[y].modules)))

  return (
    <div className="page">
      <header className="page-head">
        <h2 className="page-title">考情分析 <span className="mono page-years">2024–2026</span></h2>
        <p className="page-sub">最近三年试卷留作考前私考——本站<b>不出题、不给答案</b>，只告诉你它们考了什么、按梯队权重该把劲往哪儿使。</p>
      </header>

      <section className="panel">
        <h3 className="sec-title">梯队权重</h3>
        <div className="tiers">
          {Object.entries(a.tier_weights).map(([k, v]) => (
            <div className="tier" key={k}>
              <b className="mono">{Math.round(v * 100)}%</b>
              <span>{k}</span>
            </div>
          ))}
        </div>
        <p className="panel-note">加权口径：761 道真题全库，按梯队权重折算每个知识点的"应得关注度"。越新的年份权重越高。</p>
      </section>

      <section className="panel">
        <h3 className="sec-title">加权热点 TOP 20 <span className="sec-sub mono">761 题全库重算</span></h3>
        {hotspots.map(([kp, w]) => (
          <div className="kp-bar-row" key={kp}>
            <span className="kp-bar-label">{kp}</span>
            <div className="kp-bar-track">
              <div className="kp-bar-fill hot" style={{ width: `${(w / maxHot) * 100}%` }} />
            </div>
            <span className="kp-bar-num mono">{w.toFixed(1)}</span>
          </div>
        ))}
      </section>

      <section className="panel">
        <h3 className="sec-title">三年模块分布对比 <span className="sec-sub mono">每格 = 当年题数</span></h3>
        <table className="mod-table">
          <thead>
            <tr><th>模块</th>{years.map((y) => <th key={y}>{y}</th>)}</tr>
          </thead>
          <tbody>
            {MODULE_ORDER.map((m) => (
              <tr key={m}>
                <td><span className="mono">{m}</span> {MODULE_NAMES[m]}</td>
                {years.map((y) => {
                  const v = a.years[y].modules[m] ?? 0
                  const heat = v / maxMod
                  return (
                    <td key={y}>
                      <span className="mod-cell" style={{ opacity: v ? 0.45 + heat * 0.55 : 0.15 }}>{v || '—'}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h3 className="sec-title">三年题型结构</h3>
        <table className="mod-table">
          <thead><tr><th>年份</th><th>总题数</th><th>选择</th><th>填空</th><th>简答</th><th>计算</th></tr></thead>
          <tbody>
            {years.map((y) => (
              <tr key={y}>
                <td className="mono">{y}</td>
                <td className="mono">{a.years[y].total}</td>
                {(['choice', 'fill', 'short', 'calc'] as const).map((t) => (
                  <td key={t} className="mono">{a.years[y].types[t] ?? 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="panel-note">稳定结构：选择 15–20 题 + 填空 10–12 题 + 简答 1 题 + 计算 5–6 题 = 150 分。预测卷 A/B 即按此卷面编排。</p>
      </section>
    </div>
  )
}
