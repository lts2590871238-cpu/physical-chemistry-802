import katex from 'katex'
import 'katex/dist/katex.min.css'
import 'katex/contrib/mhchem/mhchem.js'
import React from 'react'

/* ---------- siunitx 单位映射 ---------- */
const SI_UNITS: Record<string, string> = {
  celsius: '{}^{\\circ}\\mathrm{C}', ohm: '\\Omega', micro: '\\mu', milli: '\\mathrm{m}',
  centi: '\\mathrm{c}', kilo: '\\mathrm{k}', metre: '\\mathrm{m}', meter: '\\mathrm{m}',
  gram: '\\mathrm{g}', joule: '\\mathrm{J}', pascal: '\\mathrm{Pa}', kelvin: '\\mathrm{K}',
  mol: '\\mathrm{mol}', second: '\\mathrm{s}', minute: '\\mathrm{min}', hour: '\\mathrm{h}',
  ampere: '\\mathrm{A}', volt: '\\mathrm{V}', coulomb: '\\mathrm{C}', siemens: '\\mathrm{S}',
  bar: '\\mathrm{bar}', atm: '\\mathrm{atm}', litre: '\\mathrm{L}', liter: '\\mathrm{L}',
  per: '/', square: '{}^{2}', cubic: '{}^{3}',
}

function convertSI(v: string, u: string): string {
  // 单位串：反斜杠命令走映射，普通字母包 \mathrm
  let out = ''
  const re = /\\([a-zA-Z]+)|([a-zA-Z]+)|(.)/gs
  let m: RegExpExecArray | null
  while ((m = re.exec(u))) {
    if (m[1]) out += SI_UNITS[m[1]] ?? `\\mathrm{${m[1]}}`
    else if (m[2]) out += `\\mathrm{${m[2]}}`
    else out += m[3]
  }
  return `${v}~${out}`
}

const SI_RE = /\\SI\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g

/** 数学段内预处理：\SI 直接展开（不包 $） */
function preProcessMath(s: string): string {
  let prev = ''
  let out = s
  while (prev !== out) {
    prev = out
    out = out.replace(SI_RE, (_m, v, u) => convertSI(v, u))
  }
  out = out.replace(/\\celsius\b/g, '{}^{\\circ}\\mathrm{C}')
  return out
}

/** 文本段内预处理：\SI 包装成行内公式 */
function preProcessText(s: string): string {
  let prev = ''
  let out = s
  while (prev !== out) {
    prev = out
    out = out.replace(SI_RE, (_m, v, u) => `$${convertSI(v, u)}$`)
  }
  out = out.replace(/\\celsius\b/g, '℃')
  return out
}

/* ---------- 文本/数学分段 ---------- */
interface Seg { math: boolean; display: boolean; body: string }

/** 把 display 数学环境统一转成 \[...\]，KaTeX 内部支持 gathered/aligned */
function normalizeDisplayEnvs(s: string): string {
  return s
    .replace(/\\begin\{(gather\*?|align\*?|equation\*?|displaymath)\}([\s\S]*?)\\end\{\1\}/g,
      (_m, env: string, body: string) => {
        const inner = env.startsWith('gather') ? `\\begin{gathered}${body}\\end{gathered}`
          : env.startsWith('align') ? `\\begin{aligned}${body}\\end{aligned}`
          : body
        return `\\[${inner}\\]`
      })
}

function splitMath(s: string): Seg[] {
  const segs: Seg[] = []
  // 依次匹配 $$...$$、\[...\]（前面不能是反斜杠，避免吃掉 \\[1.2em] 行距）、\(...\)、$...$
  const re = /(\$\$[\s\S]+?\$\$|(?<!\\)\\\[[\s\S]+?\\\]|(?<!\\)\\\([\s\S]+?\\\)|\$[^$]+?\$)/g
  let last = 0
  let m: RegExpExecArray | null
  const src = normalizeDisplayEnvs(s)
  while ((m = re.exec(src))) {
    if (m.index > last) segs.push({ math: false, display: false, body: src.slice(last, m.index) })
    const tok = m[0]
    let body = tok
    let display = false
    if (tok.startsWith('$$')) { body = tok.slice(2, -2); display = true }
    else if (tok.startsWith('\\[')) { body = tok.slice(2, -2); display = true }
    else if (tok.startsWith('\\(')) { body = tok.slice(2, -2) }
    else { body = tok.slice(1, -1) }
    segs.push({ math: true, display, body })
    last = m.index + tok.length
  }
  if (last < src.length) segs.push({ math: false, display: false, body: src.slice(last) })
  return segs
}

/* ---------- 数学段渲染 ---------- */
function renderMath(body: string, display: boolean): string {
  let src = preProcessMath(body)
  // tabular → array（KaTeX 支持 array），书表线 → hline
  src = src
    .replace(/\\begin\{tabularx?\}(?:\{[^{}]*\})?\{/g, '\\begin{array}{')
    .replace(/\\end\{tabularx?\}/g, '\\end{array}')
    .replace(/\\toprule|\\midrule|\\bottomrule/g, '\\hline')
    .replace(/\\score\{([^{}]*)\}/g, '\\text{（$1 分）}')
    .replace(/\\blankline\b/g, '\\underline{\\qquad\\qquad}')
    .replace(/\\input\{[^{}]*\}/g, '\\text{【见题图】}')
  try {
    return katex.renderToString(src, {
      displayMode: display,
      throwOnError: false,
      strict: false,
      trust: true,
      macros: { '\\lg': '\\log', '\\blankline': '\\underline{\\qquad\\qquad}' },
    })
  } catch {
    return `<code class="tex-err">${escapeHtml(src)}</code>`
  }
}

/* ---------- 文本段渲染 ---------- */
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** 剥掉环境开头的参数组（支持一层嵌套大括号），如 tabularx{\textwidth}{c*{...}X} */
function stripEnvArgs(s: string): string {
  let t = s.replace(/^\s+/, '')
  while (t.startsWith('{')) {
    let depth = 0, i = 0
    for (; i < t.length; i++) {
      if (t[i] === '{') depth++
      else if (t[i] === '}') { depth--; if (depth === 0) { i++; break } }
    }
    t = t.slice(i).replace(/^\s+/, '')
  }
  return t
}

/** 文本段：处理 choices / subquestions / center / tabular 环境与行内残留宏 */
function renderText(rawBody: string, keyPrefix: string): React.ReactNode[] {
  // 文本段的 \SI 在此展开为行内公式，然后再次切分 math/text 以渲染它
  const body = preProcessText(rawBody)
  const envRe = /\\begin\{(choices|subquestions|center|tabularx?)\}[\s\S]*?\\end\{\1\}/g
  const nodes: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = envRe.exec(body))) {
    if (m.index > last) nodes.push(...renderInlineBlock(body.slice(last, m.index), `${keyPrefix}-t${k++}`))
    const env = m[1]
    const inner = m[0].replace(new RegExp(`^\\\\begin\\{${env}\\}`), '').replace(new RegExp(`\\\\end\\{${env}\\}$`), '')
    nodes.push(renderEnv(env, stripEnvArgs(inner), `${keyPrefix}-e${k++}`))
    last = m.index + m[0].length
  }
  if (last < body.length) nodes.push(...renderInlineBlock(body.slice(last), `${keyPrefix}-t${k++}`))
  return nodes
}

function splitItems(inner: string): string[] {
  return inner.split(/\\item\b/).map((s) => s.trim()).filter(Boolean)
}

function renderEnv(env: string, inner: string, key: string): React.ReactNode {
  if (env === 'choices') {
    const items = splitItems(inner)
    const labels = ['A', 'B', 'C', 'D', 'E', 'F']
    return (
      <div className="tex-choices" key={key}>
        {items.map((it, i) => (
          <div className="tex-choice" key={i}>
            <span className="tex-choice-label">{labels[i] ?? i + 1}.</span>
            <Tex text={it} />
          </div>
        ))}
      </div>
    )
  }
  if (env === 'subquestions') {
    const items = splitItems(inner)
    return (
      <div className="tex-subs" key={key}>
        {items.map((it, i) => (
          <div className="tex-sub" key={i}>
            <span className="tex-sub-label">（{i + 1}）</span>
            <Tex text={it} />
          </div>
        ))}
      </div>
    )
  }
  if (env === 'center') return <div className="tex-center" key={key}><Tex text={inner} /></div>
  // tabular：简易 HTML 表
  const rows = inner
    .replace(/\\toprule|\\midrule|\\bottomrule|\\hline/g, '')
    .split(/\\\\(?:\s*\[[^\]]*\])?/)
    .map((r) => r.split('&').map((c) => c.trim()).filter((c) => c !== ''))
    .filter((r) => r.length)
  return (
    <table className="tex-table" key={key}>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>{r.map((c, j) => <td key={j}><Tex text={c} /></td>)}</tr>
        ))}
      </tbody>
    </table>
  )
}

/** 普通文本块：残留宏 → HTML，空行分段；其中由 \SI 展开产生的行内公式再渲染 */
function renderInlineBlock(text: string, key: string): React.ReactNode[] {
  // 二次切分：preProcessText 产生的 $...$ 需要走 KaTeX
  const segs = splitMath(text)
  const out: React.ReactNode[] = []
  let k = 0
  for (const seg of segs) {
    if (seg.math) {
      out.push(
        <span key={`${key}-m${k++}`} dangerouslySetInnerHTML={{ __html: renderMath(seg.body, seg.display) }} />,
      )
    } else {
      out.push(...renderPlainText(seg.body, `${key}-p${k++}`))
    }
  }
  return out
}

function renderPlainText(text: string, key: string): React.ReactNode[] {
  let s = text
  s = s.replace(/\\score\{([^{}]*)\}/g, '⟨SCORE:$1⟩')
  s = s.replace(/\\blankline\b/g, '⟨BLANK⟩')
  s = s.replace(/\\input\{[^{}]*\}/g, '⟨FIG⟩')
  s = s.replace(/\\textbf\{([^{}]*)\}/g, '⟨B⟩$1⟨/B⟩')
  s = s.replace(/\\emph\{([^{}]*)\}/g, '⟨B⟩$1⟨/B⟩')
  s = s.replace(/\\textit\{([^{}]*)\}/g, '$1')
  s = s.replace(/\\underline\{([^{}]*)\}/g, '⟨U⟩$1⟨/U⟩')
  s = s.replace(/\\\\\s*\[[^\]]*\]/g, '⟨BR⟩')  // \\[1.2em] 行距
  s = s.replace(/\\\\/g, '⟨BR⟩')
  s = s.replace(/\\quad|\\qquad/g, '　')
  s = s.replace(/\\[;,]/g, ' ')
  s = s.replace(/~/g, ' ')
  s = s.replace(/\\noindent|\\centering|\\hline|\\toprule|\\midrule|\\bottomrule/g, '')
  const paras = s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const out: React.ReactNode[] = []
  paras.forEach((p, i) => {
    // 段内单个换行：中文之间直接去掉，否则视作空格（LaTeX 语义）
    const joined = p.replace(/([\u4e00-\u9fff，。：；、（）""''⟩])\n([\u4e00-\u9fff⟨])/g, '$1$2').replace(/\n/g, ' ')
    const html = escapeHtml(joined)
      .replace(/⟨SCORE:([^⟩]*)⟩/g, '<span class="tex-score">（$1 分）</span>')
      .replace(/⟨BLANK⟩/g, '<span class="tex-blank"></span>')
      .replace(/⟨BR⟩/g, '<br/>')
      .replace(/⟨FIG⟩/g, '<span class="tex-fig-ph">【此处有图，见下方题图】</span>')
      .replace(/⟨B⟩/g, '<strong>').replace(/⟨\/B⟩/g, '</strong>')
      .replace(/⟨U⟩/g, '<u>').replace(/⟨\/U⟩/g, '</u>')
    // 多段之间插入块级间隔元素；.tex-para 保持行内，避免句中公式被挤断行
    if (i > 0) out.push(<span key={`${key}-g${i}`} className="tex-gap" />)
    out.push(<span key={`${key}-${i}`} className="tex-para" dangerouslySetInnerHTML={{ __html: html }} />)
  })
  return out
}

/* ---------- 对外组件 ---------- */
export function Tex({ text, block }: { text: string; block?: boolean }) {
  const segs = splitMath(text || '')
  return (
    <span className={block ? 'tex block' : 'tex'}>
      {segs.map((seg, i) =>
        seg.math ? (
          <span key={i} dangerouslySetInnerHTML={{ __html: renderMath(seg.body, seg.display) }} />
        ) : (
          <React.Fragment key={i}>{renderText(seg.body, `s${i}`)}</React.Fragment>
        ),
      )}
    </span>
  )
}

/** 从选择题 raw 中抽选项（choices 环境），返回 {stem, options} */
export function extractChoices(raw: string): { stem: string; options: string[] } {
  const m = /\\begin\{choices\}([\s\S]*?)\\end\{choices\}/.exec(raw)
  if (!m) return { stem: raw, options: [] }
  const options = splitItems(m[1])
  const stem = raw.replace(m[0], '').trim()
  return { stem, options }
}
