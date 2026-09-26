import { NavLink } from 'react-router'
import { useState } from 'react'

const NAV = [
  { to: '/', label: '20 天作战图', en: 'PLAN', end: true },
  { to: '/stage1', label: '阶段一 · 模块精练', en: '03-11' },
  { to: '/stage2', label: '阶段二 · 混库成套', en: '12-20' },
  { to: '/stage3', label: '阶段三 · 掐时自测', en: '21-23' },
  { to: '/prediction', label: '预测卷 A / B', en: 'PREDICT' },
  { to: '/mistakes', label: '错题与弱点合成卷', en: 'REVIEW' },
  { to: '/analytics', label: '考情分析 24-26', en: 'TRENDS' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="shell">
      <aside className={`side ${menuOpen ? 'side-open' : ''}`}>
        <div className="side-brand">
          <div className="brand-kicker mono">NJTECH · 802</div>
          <h1 className="brand-title">物理化学<br />20 天 120 分大作战</h1>
          <div className="brand-sub">2003–2026 全部真题 · 零遗漏</div>
        </div>
        <nav className="side-nav">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end as boolean | undefined}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="nav-label">{n.label}</span>
              <span className="nav-en mono">{n.en}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-foot mono">
          ISSUE 802 · {new Date().toISOString().slice(0, 10)}
          <br />进度数据保存在本机浏览器
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="menu-btn mono" onClick={() => setMenuOpen(!menuOpen)}>MENU</button>
          <div className="topbar-line mono">
            <span>PHYSICAL CHEMISTRY BOOTCAMP</span>
            <span className="topbar-dot">·</span>
            <span>761 题全收录</span>
            <span className="topbar-dot">·</span>
            <span>目标 120/150</span>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
