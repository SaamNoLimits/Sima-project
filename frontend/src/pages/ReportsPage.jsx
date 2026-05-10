import { useMemo } from 'react'
import { CLASS_ORDER, CLASS_META } from '../classInfo'

export default function ReportsPage({ history }) {
  // KPIs
  const kpis = useMemo(() => {
    const total = history.length
    const oneWeek = Date.now() - 7 * 24 * 3600 * 1000
    const thisWeek = history.filter((h) => h.ts >= oneWeek).length
    const tumorCount = history.filter((h) => h.pred !== 'notumor').length
    const avgConf = total ? history.reduce((s, h) => s + h.confidence, 0) / total : 0

    // Most frequent class
    const counts = Object.fromEntries(CLASS_ORDER.map((c) => [c, 0]))
    history.forEach((h) => { if (counts[h.pred] !== undefined) counts[h.pred]++ })
    const topClass = total > 0
      ? CLASS_ORDER.reduce((a, c) => (counts[c] > counts[a] ? c : a), CLASS_ORDER[0])
      : null

    return { total, thisWeek, tumorCount, avgConf, counts, topClass }
  }, [history])

  // Daily volume for the last 30 days
  const dailyVolume = useMemo(() => {
    const days = 30
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const arr = Array.from({ length: days }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (days - 1 - i))
      return { date: d, count: 0 }
    })
    history.forEach((h) => {
      const d = new Date(h.ts); d.setHours(0, 0, 0, 0)
      const idx = arr.findIndex((a) => a.date.getTime() === d.getTime())
      if (idx >= 0) arr[idx].count++
    })
    return arr
  }, [history])

  const maxDaily = Math.max(1, ...dailyVolume.map((d) => d.count))
  const W = 600, H = 200, pad = 30
  const xStep = (W - pad * 2) / (dailyVolume.length - 1 || 1)
  const yScale = (H - pad * 2) / maxDaily
  const linePath = dailyVolume.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${pad + i * xStep} ${H - pad - d.count * yScale}`
  ).join(' ')
  const areaPath = `${linePath} L ${pad + (dailyVolume.length - 1) * xStep} ${H - pad} L ${pad} ${H - pad} Z`

  // Donut for class distribution
  const total = kpis.total
  const r = 70, c = 2 * Math.PI * r, stroke = 22
  const seg = (cls) => total ? (kpis.counts[cls] / total) * c : 0
  let acc = 0
  const segs = CLASS_ORDER.map((cls) => {
    const len = seg(cls)
    const offset = -acc
    acc += len
    return { cls, len, offset, count: kpis.counts[cls] }
  })

  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h2>Rapports &amp; analytics</h2>
          <p>Aperçu agrégé de votre activité diagnostique.</p>
        </div>
        <div className="page-actions">
          <button className="btn outline" disabled={total === 0}>
            <span className="material-symbols-outlined">picture_as_pdf</span>
            Exporter PDF
          </button>
        </div>
      </div>

      {/* KPI row (4 cards) */}
      <section className="stat-grid">
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-label">Analyses totales</div>
            <div className="stat-icon"><span className="material-symbols-outlined">database</span></div>
          </div>
          <div className="stat-num">{kpis.total || '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-label">Cette semaine</div>
            <div className="stat-icon"><span className="material-symbols-outlined">date_range</span></div>
          </div>
          <div className="stat-num">{kpis.thisWeek || '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-label">Catégorie la plus fréquente</div>
            <div className="stat-icon"><span className="material-symbols-outlined">star</span></div>
          </div>
          <div className="stat-num" style={{ fontSize: 22, color: kpis.topClass ? CLASS_META[kpis.topClass].color : 'var(--on-surface-variant)' }}>
            {kpis.topClass ? CLASS_META[kpis.topClass].fr : '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-label">Confiance moyenne</div>
            <div className="stat-icon"><span className="material-symbols-outlined">verified</span></div>
          </div>
          <div className="stat-num">
            {kpis.total === 0 ? '—' : `${(kpis.avgConf * 100).toFixed(1)}%`}
          </div>
        </div>
      </section>

      {/* Charts row */}
      <section className="dash-row eight-four">
        {/* Line chart */}
        <div className="card">
          <div className="card-header">
            <h3>Volume par jour</h3>
            <span className="t-label muted">30 derniers jours</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 220 }}>
            <defs>
              <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* y axis ticks */}
            {[0, 0.5, 1].map((t) => (
              <line key={t} x1={pad} x2={W - pad} y1={H - pad - t * (H - pad * 2)}
                    y2={H - pad - t * (H - pad * 2)} stroke="var(--outline-variant)"
                    strokeWidth="0.5" strokeDasharray="2 4" />
            ))}
            {total > 0 && (
              <>
                <path d={areaPath} fill="url(#grad)" />
                <path d={linePath} fill="none" stroke="var(--secondary)" strokeWidth="2.5"
                      strokeLinejoin="round" strokeLinecap="round" />
                {dailyVolume.map((d, i) => d.count > 0 && (
                  <circle key={i} cx={pad + i * xStep}
                          cy={H - pad - d.count * yScale}
                          r="3" fill="var(--primary)" />
                ))}
              </>
            )}
            <text x={pad} y={H - 5} fontSize="10" fill="var(--on-surface-variant)" fontFamily="JetBrains Mono">
              {dailyVolume[0]?.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </text>
            <text x={W - pad} y={H - 5} fontSize="10" fill="var(--on-surface-variant)" textAnchor="end" fontFamily="JetBrains Mono">
              {dailyVolume[dailyVolume.length - 1]?.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </text>
          </svg>
        </div>

        {/* Donut */}
        <div className="card">
          <div className="card-header">
            <h3>Répartition par catégorie</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <svg width="180" height="180" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={r} fill="none" stroke="var(--surface-bg)" strokeWidth={stroke} />
                {total > 0 && segs.map((s) => (
                  <circle key={s.cls} cx="100" cy="100" r={r} fill="none"
                          stroke={CLASS_META[s.cls].color}
                          strokeWidth={stroke}
                          strokeDasharray={`${s.len} ${c - s.len}`}
                          strokeDashoffset={s.offset}
                          transform="rotate(-90 100 100)"
                          strokeLinecap="butt" />
                ))}
              </svg>
              <div style={{
                position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>
                    {total || '—'}
                  </div>
                  <div className="t-label muted">Total</div>
                </div>
              </div>
            </div>
            <ul style={{ listStyle: 'none', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {CLASS_ORDER.map((cls) => (
                <li key={cls} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: CLASS_META[cls].color }} />
                    {CLASS_META[cls].fr}
                  </span>
                  <span className="t-tabular" style={{ fontWeight: 700, color: 'var(--on-surface)' }}>
                    {kpis.counts[cls]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Per-class sparklines */}
      <section style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <h3>Tendance par catégorie</h3>
            <span className="t-label muted">30 jours</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            {CLASS_ORDER.map((cls) => {
              const dailyForClass = Array.from({ length: 30 }, () => 0)
              const today = new Date(); today.setHours(0, 0, 0, 0)
              history.filter((h) => h.pred === cls).forEach((h) => {
                const diff = Math.floor((today - new Date(h.ts).setHours(0,0,0,0)) / (24 * 3600 * 1000))
                if (diff >= 0 && diff < 30) dailyForClass[29 - diff]++
              })
              const maxC = Math.max(1, ...dailyForClass)
              const sparkPath = dailyForClass.map((v, i) =>
                `${i === 0 ? 'M' : 'L'} ${i * (200 / 29)} ${40 - (v / maxC) * 30}`
              ).join(' ')
              return (
                <div key={cls}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                    <span className="t-label" style={{ color: CLASS_META[cls].color }}>{CLASS_META[cls].fr}</span>
                    <span className="t-tabular" style={{ color: 'var(--on-surface)', fontWeight: 700 }}>
                      {kpis.counts[cls]}
                    </span>
                  </div>
                  <svg viewBox="0 0 200 40" style={{ width: '100%', height: 40 }}>
                    <path d={sparkPath} fill="none" stroke={CLASS_META[cls].color}
                          strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
