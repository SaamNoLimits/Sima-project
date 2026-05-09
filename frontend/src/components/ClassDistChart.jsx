import { CLASS_ORDER, CLASS_META } from '../classInfo'

// Vertical bar chart showing how many times each class has been predicted.
export default function ClassDistChart({ history }) {
  const counts = Object.fromEntries(CLASS_ORDER.map((c) => [c, 0]))
  history.forEach((h) => { if (counts[h.pred] !== undefined) counts[h.pred]++ })
  const max = Math.max(1, ...Object.values(counts))
  const totalAnalyses = history.length

  // Highlight the most frequent class
  const topClass = CLASS_ORDER.reduce(
    (acc, c) => (counts[c] > counts[acc] ? c : acc),
    CLASS_ORDER[0]
  )

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Class Distribution</h3>
          <div className="sub">
            {totalAnalyses === 0
              ? 'Aucune analyse pour le moment'
              : `Sur ${totalAnalyses} analyse${totalAnalyses > 1 ? 's' : ''}, "${CLASS_META[topClass].fr}" prédomine.`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="card-tab active">All time</button>
          <button className="card-tab">Today</button>
        </div>
      </div>

      <div className="barchart-wrap">
        {CLASS_ORDER.map((c) => {
          const v = counts[c]
          const heightPct = (v / max) * 100
          const isTop = totalAnalyses > 0 && c === topClass && v > 0
          return (
            <div className="bar-col" key={c}>
              <div
                className={`bar${isTop ? ' active' : ''}`}
                style={{ height: `${Math.max(heightPct, 4)}%` }}
              >
                {v > 0 && <span className="val">{v}</span>}
              </div>
              <div className="lbl">{CLASS_META[c].fr}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
