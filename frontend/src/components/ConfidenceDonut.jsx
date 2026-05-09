// Donut showing the breakdown of analyses by confidence band.
export default function ConfidenceDonut({ history }) {
  const buckets = { high: 0, med: 0, low: 0 }
  history.forEach((h) => {
    const c = (h.confidence || 0) * 100
    if (c >= 90) buckets.high++
    else if (c >= 70) buckets.med++
    else buckets.low++
  })
  const total = history.length
  const highPct = total ? (buckets.high / total) * 100 : 0
  const medPct  = total ? (buckets.med  / total) * 100 : 0
  const lowPct  = total ? (buckets.low  / total) * 100 : 0

  // SVG donut params
  const r = 60
  const c = 2 * Math.PI * r
  const stroke = 18
  const seg = (pct) => (pct / 100) * c
  const offsetH = 0
  const offsetM = -seg(highPct)
  const offsetL = -seg(highPct + medPct)

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Confidence Breakdown</h3>
          <div className="sub">Répartition des prédictions par seuil de confiance.</div>
        </div>
      </div>

      <div className="donut-wrap">
        <div className="donut-pos">
          <svg className="donut-svg" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={r} fill="none" stroke="#F0EFE9" strokeWidth={stroke} />
            {total > 0 && (
              <>
                {highPct > 0 && (
                  <circle cx="80" cy="80" r={r} fill="none" stroke="#1F4F35" strokeWidth={stroke}
                          strokeDasharray={`${seg(highPct)} ${c - seg(highPct)}`}
                          strokeDashoffset={offsetH}
                          transform="rotate(-90 80 80)" strokeLinecap="round" />
                )}
                {medPct > 0 && (
                  <circle cx="80" cy="80" r={r} fill="none" stroke="#4A9F6F" strokeWidth={stroke}
                          strokeDasharray={`${seg(medPct)} ${c - seg(medPct)}`}
                          strokeDashoffset={offsetM}
                          transform="rotate(-90 80 80)" strokeLinecap="round" />
                )}
                {lowPct > 0 && (
                  <circle cx="80" cy="80" r={r} fill="none" stroke="#B8DCC4" strokeWidth={stroke}
                          strokeDasharray={`${seg(lowPct)} ${c - seg(lowPct)}`}
                          strokeDashoffset={offsetL}
                          transform="rotate(-90 80 80)" strokeLinecap="round" />
                )}
              </>
            )}
          </svg>
          <div className="donut-center">
            <div>
              <div className="pct">{total === 0 ? '—' : `${Math.round(highPct)}%`}</div>
              <div className="lbl">High Conf.</div>
            </div>
          </div>
        </div>

        <ul className="donut-legend">
          <li>
            <span className="left">
              <span className="dot-color" style={{ background: '#1F4F35' }} />
              ≥ 90% (High)
            </span>
            <span className="pct">{buckets.high}</span>
          </li>
          <li>
            <span className="left">
              <span className="dot-color" style={{ background: '#4A9F6F' }} />
              70 – 90% (Medium)
            </span>
            <span className="pct">{buckets.med}</span>
          </li>
          <li>
            <span className="left">
              <span className="dot-color" style={{ background: '#B8DCC4' }} />
              &lt; 70% (Low)
            </span>
            <span className="pct">{buckets.low}</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
