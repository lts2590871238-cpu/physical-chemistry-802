import { store } from '../lib/store'

export default function RetryDayButton({ ids }: { ids: string[] }) {
  if (!ids.length) return null
  return <div className="retry-day">
    <div><strong>🔁 想再刷一遍？</strong><span>隐藏本页 {ids.length} 道题的旧答案，从空白题面重新答；错题和完成记录保留到你重新提交。</span></div>
    <button type="button" className="btn btn-primary" onClick={() => {
      store.startRetry(ids)
      window.location.reload()
    }}>↻ 重新刷本日</button>
  </div>
}
