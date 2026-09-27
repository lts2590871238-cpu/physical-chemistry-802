import { useState } from 'react'
import { Tex } from '../lib/tex'
import { store, useStore } from '../lib/store'
import type { Question } from '../lib/types'
import { questionFigure, isRedrawnFigure } from '../lib/figureAssets'

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
  first_question?: string
  prerequisites?: string[]
  linked_true_questions?: string[]
  link_note?: string
  curriculumStatus?: '2026_core' | '2026_familiar' | 'historical_extension' | 'optional'
}

export interface GuidedLesson {
  problem: string
  steps: string[]
  check: string
  transfer: string
}

/** 每卡先讲条件与公式，再带做一道真题；答案在学习者点开后出现。 */
export default function KpCard({ name, guide, count, workedQuestion, guided, judgeQuestions }: {
  name: string; guide?: KpGuide; count: number; workedQuestion?: Question; guided?: GuidedLesson; judgeQuestions?: Question[]
}) {
  const [open, setOpen] = useState(false)
  const [showWorked, setShowWorked] = useState(false)
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
      {open && guide && (
        <div className="kp-body">
          <button className="btn btn-ghost" onClick={() => store.setCardDone(name, !cardsDone[name])}>
            {cardsDone[name] ? '✓ 已学过，点击取消' : '学完此卡，标记完成'}
          </button>
          {[
            ['① 先抓住什么', guide.one_line],
            ['② 概念说清楚', guide.explain || guide.core_concepts],
            ['③ 公式怎么选', guide.core_formula],
            ['④ 符号与单位', guide.symbols],
            ['⑤ 什么时候能用', guide.applicability],
            ['⑥ 哪些情况不能套', guide.not_applicable],
            ['⑦ 为什么这样做', guide.derivation],
            ['⑧ 读题到落笔', guide.steps],
          ].filter(([, value]) => value).map(([label, value]) => (
            <div className="kp-sec" key={label}><h6>{label}</h6><Tex text={value!} block /></div>
          ))}
          {guided && <div className="kp-guided">
            <h6>🧭 跟做一题：从题眼走到答案</h6>
            <p><Tex text={guided.problem} /></p>
            <ol>{guided.steps.map((step, i) => <li key={i}><Tex text={step} /></li>)}</ol>
            <p><b>怎么验算：</b><Tex text={guided.check} /></p>
            <p><b>迁移到真题：</b><Tex text={guided.transfer} /></p>
          </div>}
          {workedQuestion?.sol && <div className="kp-worked">
            <button type="button" className="btn btn-primary" onClick={() => setShowWorked(!showWorked)}>
              {showWorked ? '收起真题带练' : `✍️ 跟练 ${workedQuestion.id} 真题（先独立想一想）`}
            </button>
            {showWorked && <div className="kp-worked-body">
              <h6>原题</h6><Tex text={workedQuestion.raw} block />
              {workedQuestion.has_fig && questionFigure(workedQuestion) && <img className="kp-worked-figure"
                src={import.meta.env.BASE_URL + questionFigure(workedQuestion)}
                alt={`${workedQuestion.id} ${isRedrawnFigure(workedQuestion.id) ? '清晰重绘题图' : '原卷题图'}`} loading="lazy" />}
              {workedQuestion.sol.method && <><h6>先怎么想</h6><Tex text={workedQuestion.sol.method} block /></>}
              {workedQuestion.sol.solution && <><h6>逐步核对</h6><Tex text={workedQuestion.sol.solution} block /></>}
              {workedQuestion.sol.answer.final && <><h6>落笔答案</h6><Tex text={workedQuestion.sol.answer.final} block /></>}
              {workedQuestion.sol.answer.correct && <p>参考选项／判断：{workedQuestion.sol.answer.correct}</p>}
            </div>}
          </div>}
          {judgeQuestions && judgeQuestions.length > 0 && <details className="kp-judge">
            <summary>✅ 判断题先过一遍 · {judgeQuestions.length} 条本考点真题</summary>
            <p>先自己判断，再点开对应题目，看判定依据。尤其留意题中的“总是”“一定”和适用条件。</p>
            {judgeQuestions.map((q) => <details key={q.id} className="kp-judge-item">
              <summary><span className="mono">{q.id}</span> <Tex text={q.raw} /></summary>
              <div><b>参考判断：{q.sol?.answer.correct ?? '见解析'}</b>
                {q.sol?.solution && <Tex text={q.sol.solution} block />}
                {q.sol?.method && <Tex text={q.sol.method} block />}
              </div>
            </details>)}
          </details>}
          {[
            ['一句小例子', guide.example],
            ['⑨ 判断与易错点', guide.common_traps],
            ['南工考法提醒', guide.examTip],
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
    </div>
  )
}
