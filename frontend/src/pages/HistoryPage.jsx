import { useMemo, useState } from 'react'
import { CLASS_ORDER, CLASS_META } from '../classInfo'
import { formatRelative } from '../lib/history'

export default function HistoryPage({ history, onClear }) {
  const [classFilter, setClassFilter] = useState('all')
  const [minConf, setMinConf]         = useState(0)
  const [search, setSearch]           = useState('')

  const filtered = useMemo(() => {
    return history.filter((h) => {
      if (classFilter !== 'all' && h.pred !== classFilter) return false
      if (h.confidence * 100 < minConf) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!h.label_fr.toLowerCase().includes(q) &&
            !h.filename?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [history, classFilter, minConf, search])

  const exportCSV = () => {
    const rows = [
      ['Date', 'Fichier', 'Catégorie', 'Confiance', 'Sévérité'],
      ...filtered.map((h) => [
        new Date(h.ts).toISOString(),
        h.filename || '',
        h.label_fr,
        (h.confidence * 100).toFixed(2) + '%',
        h.severity,
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'historique_neurovista.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h2>Historique des analyses</h2>
          <p>{history.length} entrée{history.length === 1 ? '' : 's'} · stockées localement uniquement</p>
        </div>
        <div className="page-actions">
          <button className="btn outline" onClick={exportCSV} disabled={filtered.length === 0}>
            <span className="material-symbols-outlined">download</span>
            Exporter CSV
          </button>
          {history.length > 0 && (
            <button className="btn outline danger-link" onClick={onClear}>
              <span className="material-symbols-outlined">delete</span>
              Effacer tout
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="card filter-bar">
        <div className="filter-group">
          <span className="material-symbols-outlined">search</span>
          <input
            type="search"
            placeholder="Rechercher un fichier ou une catégorie…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <span className="t-label muted">Catégorie</span>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="all">Toutes</option>
            {CLASS_ORDER.map((c) => (
              <option key={c} value={c}>{CLASS_META[c].fr}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <span className="t-label muted">Confiance ≥ {minConf}%</span>
          <input
            type="range" min="0" max="100" step="5"
            value={minConf}
            onChange={(e) => setMinConf(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '1rem' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined xl" style={{ color: 'var(--outline-variant)', display: 'block', margin: '0 auto 1rem' }}>folder_open</span>
            {history.length === 0
              ? 'Aucune analyse enregistrée. Lancez votre première classification depuis le tableau de bord.'
              : 'Aucun résultat pour ces critères.'}
          </div>
        ) : (
          <table className="analyses-table">
            <thead>
              <tr>
                <th>FICHIER</th>
                <th>DATE</th>
                <th>CATÉGORIE</th>
                <th>SÉVÉRITÉ</th>
                <th style={{ textAlign: 'right' }}>CONFIANCE</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h, i) => (
                <tr key={`${h.ts}-${i}`}>
                  <td className="filename">{h.filename || '—'}</td>
                  <td>{formatRelative(h.ts)}</td>
                  <td>
                    <span className={`class-chip ${h.pred}`}>
                      <span className="dot" style={{ background: h.color }} />
                      {h.label_fr}
                    </span>
                  </td>
                  <td>
                    <span className="t-tabular muted">{h.severity}</span>
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
    </main>
  )
}
