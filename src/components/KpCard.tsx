import { useState } from 'react'
import { Tex } from '../lib/tex'
import { store, useStore } from '../lib/store'

export interface KpGuide {
  module: string
  explain: string
  example: string
  examTip: string
  one_line?: string
  core_concepts?: string
  core_formula?: string
  symbols?: string
  applicability?: string
  not_applicable?: string
  derivation?: string
  steps?: string
  common_traps?: string
  prerequisites?: string[]
  linked_true_questions?: string[]
  link_note?: string
  curriculumStatus?: '2026_core' | '2026_familiar' | 'historical_extension' | 'optional'
}

/** 知识点教学卡：先学再练 —— 概念串讲 + 小例子 + 考法提示 */
export default function KpCard({ name, guide, count }: { name: string; guide?: KpGuide; count: number }) {
  const [open, setOpen] = useState(false)
  const { cardsDone } = useStore()
  return (
    <div className={`kp-card ${open ? 'kp-open' : ''}`} id={`kp-${name}`}>
      <button className="kp-head" onClick={() => setOpen(!open)}>
        <span className="kp-dot" />
        <span className="kp-name">{name}</span>
        {(guide?.curriculumStatus === 'historical_extension' || guide?.curriculumStatus === 'optional') &&
          <span className="tag">{guide.curriculumStatus === 'optional' ? '可选' : '历年真题补充'}</span>}
        {(guide?.curriculumStatus === '2026_core' || guide?.curriculumStatus === '2026_familiar') &&
          <span className="tag">{guide.curriculumStatus === '2026_core' ? '2026掌握' : '2026熟悉'}</span>}
        <span className="kp-count mono">{count ? `${count} 题` : '本阶段暂无直接真题'}</span>
        <span className="kp-toggle mono">{open ? '收起讲解 −' : '先学再练 +'}</span>
      </button>
      {open && guide?.one_line && (
        <div className="kp-body">
          <button className="btn btn-ghost" onClick={() => store.setCardDone(name, !cardsDone[name])}>
            {cardsDone[name] ? '✓ 已学过，点击取消' : '学完此卡，标记完成'}
          </button>
          {[
            ['一句话核心', guide.one_line],
            ['核心概念', guide.core_concepts],
            ['核心公式', guide.core_formula],
            ['符号与单位', guide.symbols],
            ['适用条件', guide.applicability],
            ['不适用情况', guide.not_applicable],
            ['推导思路', guide.derivation],
            ['做题步骤', guide.steps],
            ['高频陷阱', guide.common_traps],
          ].filter(([, value]) => value).map(([label, value]) => (
            <div className="kp-sec" key={label}><h6>{label}</h6><Tex text={value!} block /></div>
          ))}
          <div className="kp-sec">
            <h6>对应真题</h6>
            {count ? <p>{guide.linked_true_questions?.join('、') || '见本节下方真题'}</p>
              : <p>{guide.link_note || '本阶段暂无直接对应真题；相关题目将在阶段二出现。'}</p>}
          </div>
          {guide.prerequisites && guide.prerequisites.length > 0 && (
            <div className="kp-sec"><h6>前置知识</h6><p>{guide.prerequisites.join(' → ')}</p></div>
          )}
        </div>
      )}
      {open && guide && !guide.one_line && (
        <div className="kp-body">
          <div className="kp-sec">
            <h6>讲透概念</h6>
            <Tex text={guide.explain} block />
          </div>
          <div className="kp-sec kp-example">
            <h6>举个简单的例子</h6>
            <Tex text={guide.example} block />
          </div>
          <div className="kp-sec kp-tip">
            <h6>南工怎么考</h6>
            <Tex text={guide.examTip} block />
          </div>
        </div>
      )}
    </div>
  )
}
