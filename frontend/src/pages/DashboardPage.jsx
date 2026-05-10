import { useMemo } from 'react'
import StatCard from '../components/StatCard'
import { CLASS_ORDER, CLASS_META } from '../classInfo'
import { formatRelative } from '../lib/history'

export default function DashboardPage({
  user, history, stats, latencyMs, health,
  onClearHistory, onNewAnalysis, search,
}) {
  const classCounts = useMemo(() => {
    const counts = Object.fromEntries(CLASS_ORDER.map((c) => [c, 0]))
    history.forEach((h) => { if (counts[h.pred] !== undefined) counts[h.pred]++ })
    return counts
  }, [history])
  const maxCount = Math.max(1, ...Object.values(classCounts))
  const topClass = CLASS_ORDER.reduce(
    (a, c) => (classCounts[c] > classCounts[a] ? c : a),
    CLASS_ORDER[0],
  )

  const filteredHistory = search.trim()
    ? history.filter((h) =>
        h.label_fr.toLowerCase().includes(search.toLowerCase()) ||
        h.filename?.toLowerCase().includes(search.toLowerCase()))
    : history

  const totalLabel    = stats.total === 0 ? '—' : String(stats.total)
  const tumorCount    = history.filter((h) => h.pred !== 'notumor').length
  const tumorPct      = stats.total ? ((tumorCount / stats.total) * 100).toFixed(1) : '0'
  const avgConfLabel  = stats.total === 0 ? '—' : `${(stats.avgConf * 100).toFixed(1)}%`

  const firstName = (full) => {
    if (!full) return ''
    const cleaned = full.replace(/^(Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Prof\.?)\s+/i, '').trim()
    return cleaned.split(/\s+/)[0] || cleaned || full
  }

  return (
    <main className="main">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h2>Bonjour, {firstName(user.name)}</h2>
          <p>Voici un résumé de l'activité diagnostique.</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={onNewAnalysis}>
            <span className="material-symbols-outlined">add</span>
            Nouvelle analyse
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <section className="stat-grid">
        <StatCard
          featured
          bgIcon="biotech"
          icon="biotech"
          label="Analyses totales"
          num={totalLabel}
          trend={stats.total === 0 ? 'En attente' : `${stats.todayCount} aujourd'hui`}
          trendIcon={stats.total === 0 ? 'hourglass_empty' : 'trending_up'}
        />
        <StatCard
          icon="coronavirus"
          label="Tumorales détectées"
          num={tumorCount === 0 ? '—' : String(tumorCount)}
          trend={stats.total === 0 ? '—' : `${tumorPct}% du total`}
          trendIcon=""
        />
        <StatCard
          icon="timer"
          label="Latence API"
          num={latencyMs != null ? `${latencyMs} ms` : '—'}
          trend={health?.model_kind ? `${health.model_kind} · CPU` : '—'}
          trendIcon="bolt"
        />
        <StatCard
          icon="verified"
          label="Confiance moyenne"
          num={avgConfLabel}
          trend={stats.total === 0 ? "En attente d'analyses" : `Sur ${stats.total} prédiction${stats.total > 1 ? 's' : ''}`}
          trendIcon="trending_up"
        />
      </section>

      {/* Bar chart + Activity feed */}
      <section className="dash-row eight-four">
        <div className="card">
          <div className="card-header">
            <h3>Distribution des catégories</h3>
            <button className="card-action">Voir tout</button>
          </div>
          <div className="barchart">
            {CLASS_ORDER.map((cls) => {
              const v = classCounts[cls]
              const heightPct = (v / maxCount) * 100
              const isTop = stats.total > 0 && cls === topClass && v > 0
              return (
                <div className="bar-col" key={cls}>
                  <span className="val">{v || ''}</span>
                  <div
                    className={`bar${isTop ? ' active' : ''}`}
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  />
                  <span className="lbl">{CLASS_META[cls].fr}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Activité récente</h3>
            {history.length > 0 && (
              <button className="link-btn" onClick={onClearHistory}>Effacer</button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="muted" style={{ fontSize: 14 }}>
              Vos analyses apparaîtront ici.
            </p>
          ) : (
            <div className="activity-feed">
              {history.slice(0, 4).map((h, i) => (
                <div className="activity-item" key={`${h.ts}-${i}`}>
                  <div className={`activity-icon ${h.pred === 'notumor' ? 'ok' : h.pred === 'glioma' ? 'warn' : 'info'}`}>
                    <span className="material-symbols-outlined">
                      {h.pred === 'notumor' ? 'done_all' : h.pred === 'glioma' ? 'warning' : 'biotech'}
                    </span>
                  </div>
                  <div className="activity-body">
                    <p>
                      <strong>{h.filename || '—'}</strong> · {h.label_fr.toLowerCase()}.
                    </p>
                    <p className="ts">{formatRelative(h.ts)} · confiance {(h.confidence * 100).toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent analyses table */}
      <section style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', background: 'var(--surface-soft)', borderBottom: '1px solid rgba(193,201,192,0.15)', margin: 0 }}>
            <h3>Analyses récentes</h3>
            <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)' }}>more_horiz</span>
          </div>
          {filteredHistory.length === 0 ? (
            <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              {search ? 'Aucun résultat pour cette recherche.' : 'Aucune analyse pour le moment.'}
            </div>
          ) : (
            <table className="analyses-table">
              <thead>
                <tr>
                  <th>FICHIER</th>
                  <th>DATE</th>
                  <th>CATÉGORIE</th>
                  <th style={{ textAlign: 'right' }}>CONFIANCE</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.slice(0, 8).map((h, i) => (
                  <tr key={`${h.ts}-${i}`}>
                    <td className="filename">{h.filename || '—'}</td>
                    <td>{formatRelative(h.ts)}</td>
                    <td>
                      <span className={`class-chip ${h.pred}`}>
                        <span className="dot" style={{ background: h.color }} />
                        {h.label_fr}
                      </span>
                    </td>
                    <td className="conf" style={{ textAlign: 'right' }}>
                      {(h.confidence * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <div style={{ textAlign: 'center', padding: '2rem', fontSize: 12, color: 'var(--outline-variant)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
        NeuroVista v1.0 · Mémoire de fin d'études · 2026
      </div>
    </main>
  )
}
