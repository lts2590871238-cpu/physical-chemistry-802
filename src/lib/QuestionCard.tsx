import { useEffect, useMemo, useRef, useState } from 'react'
import type { PredQuestion, Question } from './types'
import { normDifficulty, TYPE_LABEL } from './types'
import { extractChoices, Tex } from './tex'
import { useQuestionRecord } from './store'

/** 统一真题与预测题为一棵渲染树 */
export interface UIQuestion {
  id: string
  year?: number
  type: Question['type']
  raw: string
  module: string
  kp: string[]
  score?: number
  options?: Record<string, string>
  source?: string
  answer: { correct?: string; blanks?: string[]; final?: string }
  solution: string
  method: string
  pitfalls: string
  recall: string
  checkpoints: { label: string; value: number; unit: string; tol: number }[]
  markingScheme: { point: string; score: number }[]
  difficulty: 'easy' | 'medium' | 'hard'
  hasFig?: boolean
  figSrc?: string
}

const REDRAWN_PHASE_IDS = new Set([
  '2003-Q26', '2004-Q11', '2005-Q29', '2009-Q11', '2010-Q30',
  '2011-Q35', '2016-Q27', '2017-Q17', '2021-Q32', '2023-Q10',
  '2024-Q32', '2026-Q08', '2026-Q36',
])

export function toUI(q: Question): UIQuestion {
  const s = q.sol
  // pitfalls 在数据里有数组/字符串两种形态，数组按段落合并
  const pitfalls = Array.isArray(s?.pitfalls) ? s!.pitfalls.join('\n\n') : (s?.pitfalls ?? '')
  return {
    id: q.id, year: q.year, type: q.type, raw: q.raw, module: q.module, kp: q.kp,
    hasFig: q.has_fig,
    figSrc: REDRAWN_PHASE_IDS.has(q.id)
      ? 'redrawn-diagrams/' + q.id + '-phase.svg'
      : q.figs?.find((fig) => /\.(?:png|jpe?g|webp|svg)$/i.test(fig)),
    source: q.source?.verified && q.source.kind === 'NJTech_802_past_exam'
      ? `${q.year} 南京工业大学802 · 第${q.source.printed_no ?? q.no}题（原卷 PDF 第${q.source.page}页）`
      : undefined,
    answer: s?.answer ?? {}, solution: s?.solution ?? '', method: s?.method ?? '',
    pitfalls, recall: s?.recall ?? '',
    checkpoints: s?.checkpoints ?? [], markingScheme: s?.markingScheme ?? [],
    difficulty: normDifficulty(s?.difficulty),
  }
}

export function predToUI(q: PredQuestion): UIQuestion {
  // 预测题 kp 在数据里是单个字符串，真题是数组，这里统一成数组
  const kp = Array.isArray(q.kp) ? q.kp : [q.kp as unknown as string]
  return {
    id: q.id, type: q.type, raw: q.raw, module: q.module, kp, score: q.score,
    options: q.options, source: q.source,
    answer: q.answer, solution: q.solution, method: q.method, pitfalls: q.pitfalls,
    recall: q.recall, checkpoints: q.checkpoints ?? [], markingScheme: q.markingScheme ?? [],
    difficulty: q.difficulty,
  }
}

const DIFF_LABEL = { easy: '基础', medium: '中档', hard: '攻坚' } as const

export function QuestionCard({ q, index }: { q: UIQuestion; index?: number }) {
  const [rec, setRec] = useQuestionRecord(q.id)
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const [cpVals, setCpVals] = useState<string[]>(() => q.checkpoints.map(() => ''))
  const [marks, setMarks] = useState<boolean[]>(() => q.markingScheme.map(() => false))
  const [zoomed, setZoomed] = useState(false)
  const figureTrigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!zoomed) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setZoomed(false)
        requestAnimationFrame(() => figureTrigger.current?.focus({ preventScroll: true }))
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [zoomed])

  function closeFigure() {
    setZoomed(false)
    requestAnimationFrame(() => figureTrigger.current?.focus({ preventScroll: true }))
  }

  const { stem, options } = useMemo(() => {
    if (q.type === 'choice') {
      if (q.options) {
        const keys = Object.keys(q.options).sort()
        return { stem: q.raw, options: keys.map((k) => q.options![k]) }
      }
      return extractChoices(q.raw)
    }
    return { stem: q.raw, options: [] }
  }, [q])

  const revealed = open || !!rec
  const choiceUndetermined = q.type === 'choice' && !/^[A-E]$/.test(q.answer.correct ?? '')
  const fullScore = q.score ?? (q.markingScheme.reduce((a, b) => a + b.score, 0) || undefined)
  const markTotal = q.markingScheme.reduce((a, b) => a + b.score, 0)
  const selfTotal = q.markingScheme.reduce((a, b, i) => a + (marks[i] ? b.score : 0), 0)

  function grade(status: 'correct' | 'wrong') {
    setRec({ status, ts: Date.now(), fullScore })
    setOpen(true)
  }

  function pickChoice(label: string) {
    if (revealed || choiceUndetermined) return
    setPicked(label)
    grade(label === q.answer.correct ? 'correct' : 'wrong')
  }

  function pickJudge(ans: 'right' | 'wrong') {
    if (revealed) return
    // correct 可能是布尔或字符串（对/√/true…），统一转字符串再判
    const c = String(q.answer.correct ?? '').trim()
    const truth = c === '对' || c === '√' || c === '正确' || c === 'T' || c.toLowerCase() === 'true' ? 'right' : 'wrong'
    grade(ans === truth ? 'correct' : 'wrong')
  }

  function submitSelfGrade() {
    setRec({
      status: selfTotal >= markTotal * 0.6 ? 'correct' : 'wrong',
      selfScore: selfTotal, fullScore: markTotal || fullScore, ts: Date.now(),
    })
  }

  function cpState(i: number): 'none' | 'ok' | 'bad' {
    const v = parseFloat(cpVals[i])
    if (Number.isNaN(v)) return 'none'
    const cp = q.checkpoints[i]
    return Math.abs(v - cp.value) <= cp.tol ? 'ok' : 'bad'
  }

  const statusCls = rec?.status === 'correct' ? 'q-correct' : rec?.status === 'wrong' ? 'q-wrong' : ''
  const figureUrl = q.figSrc ? import.meta.env.BASE_URL + q.figSrc.replace(/^\/+/, '') : ''

  return (
    <article className={`qcard ${statusCls}`} id={`q-${q.id}`}>
      <header className="q-head">
        <span className="q-no">{index != null ? `${index + 1}.` : ''} <span className="mono">{q.id}</span></span>
        <span className="q-tags">
          {q.year && <span className="tag">{q.year} 年</span>}
          <span className="tag">{q.module}</span>
          <span className="tag">{TYPE_LABEL[q.type]}</span>
          <span className={`tag diff-${q.difficulty}`}>{DIFF_LABEL[q.difficulty]}</span>
          {fullScore != null && fullScore > 0 && <span className="tag tag-score">{fullScore} 分</span>}
          {rec && (
            <span className={`tag ${rec.status === 'correct' ? 'tag-ok' : rec.status === 'wrong' ? 'tag-bad' : ''}`}>
              {rec.status === 'correct' ? '✓ 已掌握' : rec.status === 'wrong' ? '✗ 错题' : rec.status === 'reviewed' ? '已读审校说明' : '已自评'}
              {rec.selfScore != null && rec.fullScore ? ` ${rec.selfScore}/${rec.fullScore}` : ''}
            </span>
          )}
        </span>
      </header>

      <div className="q-stem">
        <Tex text={stem} block />
        {q.hasFig && (
          <div className="q-fig">
            {q.figSrc ? (
              <button ref={figureTrigger} type="button" className="q-fig-trigger" onClick={() => setZoomed(true)} title="点击放大题图">
                <img src={figureUrl} alt={q.id + ' 题图'} loading="lazy" />
                <span>点击放大题图</span>
              </button>
            ) : (
              <span>本题原图待核验接入，请先查看原卷。</span>
            )}
          </div>
        )}
      </div>
      {zoomed && q.figSrc && (
        <div className="q-lightbox" onMouseDown={(event) => { if (event.target === event.currentTarget) closeFigure() }}>
          <div className="q-lightbox-panel" role="dialog" aria-modal="true" aria-label={q.id + ' 题图大图'}>
            <div className="q-lightbox-bar">
              <button type="button" onClick={closeFigure}>← 返回题目</button>
              <span className="mono">{q.id}</span>
            </div>
            <div className="q-lightbox-scroll"><img src={figureUrl} alt={q.id + ' 放大题图'} /></div>
          </div>
        </div>
      )}

      {q.kp.length > 0 && (
        <div className="q-kp mono">{q.kp.join(' · ')}</div>
      )}

      {/* 选择 */}
      {q.type === 'choice' && options.length > 0 && (
        <div className="q-options">
          {options.map((op, i) => {
            const label = String.fromCharCode(65 + i)
            let cls = 'q-opt'
            if (revealed) {
              if (label === q.answer.correct) cls += ' opt-right'
              else if (picked === label) cls += ' opt-wrong'
            } else if (picked === label) cls += ' opt-picked'
            return (
              <button key={label} className={cls} onClick={() => pickChoice(label)} disabled={revealed || choiceUndetermined}>
                <span className="opt-label">{label}</span>
                <Tex text={op} />
              </button>
            )
          })}
        </div>
      )}
      {choiceUndetermined && !revealed && (
        <div className="q-actions"><button className="btn btn-primary" onClick={() => {
          setRec({ status: 'reviewed', ts: Date.now() }); setOpen(true)
        }}>查看原题审校说明</button></div>
      )}

      {/* 判断 */}
      {q.type === 'judge' && !revealed && (
        <div className="q-actions">
          <button className="btn btn-judge" onClick={() => pickJudge('right')}>这句话 <b>对</b></button>
          <button className="btn btn-judge" onClick={() => pickJudge('wrong')}>这句话 <b>错</b></button>
        </div>
      )}
      {q.type === 'judge' && revealed && (
        <div className="q-judge-result">
          答案：<b>{(() => {
            const c = String(q.answer.correct ?? '').trim()
            return c === '对' || c === '√' || c === '正确' || c === 'T' || c.toLowerCase() === 'true' ? '对 ✓' : '错 ✗'
          })()}</b>
        </div>
      )}

      {/* 填空 / 简答 / 计算：揭示按钮 */}
      {(q.type === 'fill' || q.type === 'short' || q.type === 'calc') && !revealed && (
        <div className="q-actions">
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            我已在纸上作答，核对答案
          </button>
        </div>
      )}

      {/* 解析区 */}
      {revealed && (
        <div className="q-solution">
          {choiceUndetermined && q.answer.final && (
            <div className="sol-block sol-final"><h5>原题审校说明</h5><Tex text={q.answer.final} block /></div>
          )}
          {q.type === 'fill' && q.answer.blanks && (
            <div className="sol-block">
              <h5>参考答案</h5>
              <ol className="blanks">
                {q.answer.blanks.map((b, i) => (
                  <li key={i}><span className="mono">空{i + 1}</span> <Tex text={b} /></li>
                ))}
              </ol>
              {!rec && (
                <div className="q-actions">
                  <button className="btn btn-ok" onClick={() => grade('correct')}>我填对了</button>
                  <button className="btn btn-bad" onClick={() => grade('wrong')}>填错了，记入错题</button>
                </div>
              )}
            </div>
          )}

          {(q.type === 'calc' || q.type === 'short') && q.answer.final && (
            <div className="sol-block sol-final">
              <h5>满分作答模板</h5>
              <Tex text={q.answer.final} block />
            </div>
          )}

          {q.checkpoints.length > 0 && (
            <div className="sol-block">
              <h5>数值核对点 <small>输入你算出的数值，自动核对（容差已设）</small></h5>
              <div className="cps">
                {q.checkpoints.map((cp, i) => (
                  <div className={`cp cp-${cpState(i)}`} key={i}>
                    <span className="cp-label"><Tex text={cp.label} /></span>
                    <input
                      value={cpVals[i]}
                      placeholder="你的数值"
                      inputMode="decimal"
                      onChange={(e) => {
                        const v = [...cpVals]; v[i] = e.target.value; setCpVals(v)
                      }}
                    />
                    <span className="cp-unit">{cp.unit}</span>
                    <span className="cp-verdict">
                      {cpState(i) === 'ok' ? '✓' : cpState(i) === 'bad' ? '✗' : ''}
                    </span>
                    {cpState(i) === 'bad' && (
                      <span className="cp-ref">参考 {cp.value} {cp.unit}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {q.markingScheme.length > 0 && (
            <div className="sol-block">
              <h5>采分点自评 <small>对照你的过程逐项勾选，合计 {selfTotal}/{markTotal} 分</small></h5>
              <div className="marks">
                {q.markingScheme.map((mp, i) => (
                  <label className={`mark ${marks[i] ? 'mark-on' : ''}`} key={i}>
                    <input
                      type="checkbox"
                      checked={marks[i]}
                      onChange={(e) => {
                        const v = [...marks]; v[i] = e.target.checked; setMarks(v)
                      }}
                    />
                    <span className="mark-score mono">+{mp.score}</span>
                    <Tex text={mp.point} />
                  </label>
                ))}
              </div>
              {!rec && (
                <div className="q-actions">
                  <button className="btn btn-primary" onClick={submitSelfGrade}>
                    提交自评（{selfTotal}/{markTotal} 分）
                  </button>
                </div>
              )}
            </div>
          )}

          {q.recall && (
            <div className="sol-block sol-recall">
              <h5>知识回忆</h5>
              <Tex text={q.recall} block />
            </div>
          )}

          {q.solution && (
            <div className="sol-block">
              <h5>详细解析（为什么做 · 怎么做）</h5>
              <Tex text={q.solution} block />
            </div>
          )}

          {q.method && (
            <div className="sol-block">
              <h5>做题方法</h5>
              <Tex text={q.method} block />
            </div>
          )}

          {q.pitfalls && (
            <div className="sol-block sol-pitfall">
              <h5>易错点</h5>
              <Tex text={q.pitfalls} block />
            </div>
          )}

          {q.source && <div className="q-source mono">题源：{q.source}</div>}

          <div className="q-actions q-foot">
            {rec ? (
              <>
                {rec.status === 'wrong' ? (
                  <button className="btn btn-ok" onClick={() => grade('correct')}>重做对 → 移出错题本</button>
                ) : (
                  <button className="btn btn-bad" onClick={() => grade('wrong')}>其实没掌握 → 记入错题</button>
                )}
              </>
            ) : (
              <>
                <button className="btn btn-ok" onClick={() => grade('correct')}>我已掌握</button>
                <button className="btn btn-bad" onClick={() => grade('wrong')}>记入错题</button>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
