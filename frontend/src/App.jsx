import { useEffect, useState, useMemo } from 'react'
import LoginForm from './components/LoginForm'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import StatCard from './components/StatCard'
import UploadZone from './components/UploadZone'
import ResultCard from './components/ResultCard'
import { CLASS_ORDER, CLASS_META } from './classInfo'
import { getHealth, predictImage } from './api'
import { loadHistory, pushHistory, clearHistory, summarize, formatRelative } from './lib/history'

const CONFIDENCE_THRESHOLD = 70
const USER_STORAGE_KEY = 'brainscan_user'

function firstName(full) {
  if (!full) return ''
  const cleaned = full.replace(/^(Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Prof\.?)\s+/i, '').trim()
  return cleaned.split(/\s+/)[0] || cleaned || full
}

const CLASS_CHIP_KEY = (cls) => cls

export default function App() {
  const [user, setUser]       = useState(null)
  const [activeNav, setActiveNav] = useState('dashboard')
  const [health, setHealth]   = useState(null)
  const [healthErr, setHealthErr] = useState(null)
  const [latencyMs, setLatencyMs] = useState(null)
  const [history, setHistory] = useState([])
  const [search, setSearch]   = useState('')
  const [file, setFile]       = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY)
      if (saved) setUser(JSON.parse(saved))
    } catch {}
    setHistory(loadHistory())
  }, [])

  useEffect(() => {
    if (!user) return
    const t0 = performance.now()
    getHealth()
      .then((h) => { setHealth(h); setLatencyMs(Math.round(performance.now() - t0)) })
      .catch((e) => setHealthErr(e.message))
  }, [user])

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const stats = useMemo(() => summarize(history), [history])

  // Class distribution counts
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

  const handleLogin = (u) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u))
    setUser(u)
  }
  const handleLogout = () => {
    localStorage.removeItem(USER_STORAGE_KEY)
    setUser(null); setFile(null); setResult(null); setError(null)
  }
  const handleFile = (f) => { setFile(f); setResult(null); setError(null); setActiveNav('upload') }
  const handleReset = () => { setFile(null); setResult(null); setError(null) }
  const handleClearHistory = () => { clearHistory(); setHistory([]) }

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true); setError(null); setResult(null)
    try {
      const r = await predictImage(file, true)
      setResult(r)
      const updated = pushHistory({
        ts: Date.now(),
        pred: r.predicted_class,
        confidence: r.confidence,
        label_fr: r.info.label_fr,
        severity: r.info.severity,
        color: r.info.color,
        filename: file.name,
      })
      setHistory(updated)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = () => {
    if (!result) return
    const conf = (result.confidence * 100).toFixed(2)
    const uncertain = result.confidence * 100 < CONFIDENCE_THRESHOLD
    const lines = [
      "RAPPORT D'ANALYSE IRM — NeuroVista",
      '='.repeat(50),
      `Praticien        : ${user?.name || '—'}  (${user?.email || '—'})`,
      `Profil           : ${user?.role || '—'}`,
      `Date             : ${new Date().toLocaleString('fr-FR')}`,
      '',
      `Résultat         : ${result.info.label_fr}`,
      `Classe technique : ${result.predicted_class}`,
      `Confiance        : ${conf}%`,
      `Sévérité         : ${result.info.severity}`,
      `Statut           : ${uncertain ? 'Incertain' : 'Confiant'}`,
      '',
      'Probabilités par classe :',
      '─'.repeat(30),
      ...CLASS_ORDER.map((c) => {
        const p = (result.probabilities[c] || 0) * 100
        return `  ${CLASS_META[c].fr.padEnd(22)}: ${p.toFixed(2)}%`
      }),
      '',
      '─'.repeat(50),
      `Description : ${result.info.description}`,
      '',
      'AVERTISSEMENT : ce rapport est généré automatiquement par un',
      "système d'IA. Il ne remplace pas l'avis d'un médecin.",
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'rapport_irm.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  if (!user) return <LoginForm onLogin={handleLogin} />

  // Filter recent items by search
  const filteredHistory = search.trim()
    ? history.filter((h) =>
        h.label_fr.toLowerCase().includes(search.toLowerCase()) ||
        h.filename?.toLowerCase().includes(search.toLowerCase()))
    : history

  // Display values for stat cards
  const totalLabel    = stats.total === 0 ? '—' : String(stats.total)
  const tumorCount    = history.filter((h) => h.pred !== 'notumor').length
  const tumorPct      = stats.total ? ((tumorCount / stats.total) * 100).toFixed(1) : '0'
  const avgConfLabel  = stats.total === 0 ? '—' : `${(stats.avgConf * 100).toFixed(1)}%`
  const todayLabel    = String(stats.todayCount)

  return (
    <div className="app">
      <div className="shell">
        <Sidebar
          active={activeNav}
          onNavigate={setActiveNav}
          onCta={() => { handleReset(); setActiveNav('upload') }}
        />

        <div>
          <TopBar
            user={user}
            query={search}
            onQuery={setSearch}
            latencyMs={latencyMs}
            onLogout={handleLogout}
          />

          <main className="main">

            {/* ── PAGE HEADER (display-lg) ─────────────────────────── */}
            <div className="page-header">
              <div>
                <h2>Bonjour, {firstName(user.name)}</h2>
                <p>Voici un résumé de l'activité diagnostique.</p>
              </div>
              <div className="page-actions">
                <button className="btn" onClick={() => { handleReset(); setActiveNav('upload') }}>
                  <span className="material-symbols-outlined">add</span>
                  Nouvelle analyse
                </button>
              </div>
            </div>

            {/* ── STATS GRID ──────────────────────────────────────── */}
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
                trend={stats.total === 0 ? 'En attente d\'analyses' : `Sur ${stats.total} prédiction${stats.total > 1 ? 's' : ''}`}
                trendIcon="trending_up"
              />
            </section>

            {/* ── ROW : bar chart + activity feed ─────────────────── */}
            <section className="dash-row eight-four">
              {/* Bar chart */}
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

              {/* Activity feed */}
              <div className="card">
                <div className="card-header">
                  <h3>Activité récente</h3>
                  {history.length > 0 && (
                    <button className="link-btn" onClick={handleClearHistory}>Effacer</button>
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

            {/* ── UPLOAD / RESULT ─────────────────────────────────── */}
            {!file && !result && (
              <section style={{ marginBottom: '2rem' }}>
                <UploadZone onFile={handleFile} />
              </section>
            )}

            {file && !result && (
              <section style={{ marginBottom: '2rem' }}>
                <div className="card">
                  <div className="card-header">
                    <h3>Aperçu de l'IRM</h3>
                  </div>
                  <div className="preview">
                    <div>
                      <img src={previewUrl} alt="Aperçu IRM" />
                      <div className="meta">{file.name} · {(file.size / 1024).toFixed(0)} Ko</div>
                    </div>
                    <div>
                      <p className="desc">
                        L'image sera redimensionnée à 224 × 224, normalisée selon les
                        statistiques ImageNet, puis transmise au modèle ResNet34. Aucune
                        donnée n'est conservée côté serveur.
                      </p>
                      <div className="btn-row">
                        <button className="btn" onClick={handleAnalyze} disabled={loading}>
                          {loading
                            ? <><span className="spinner" />Analyse en cours…</>
                            : <>
                                <span className="material-symbols-outlined">play_arrow</span>
                                Lancer l'analyse
                              </>}
                        </button>
                        <button className="btn outline" onClick={handleReset} disabled={loading}>
                          Changer d'image
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {error && <div className="error-box"><strong>Erreur :</strong> {error}</div>}

            {result && (
              <section style={{ marginBottom: '2rem' }}>
                <div className="stack">
                  <ResultCard result={result} threshold={CONFIDENCE_THRESHOLD} />
                  <div className="btn-row">
                    <button className="btn" onClick={handleDownloadReport}>
                      <span className="material-symbols-outlined">download</span>
                      Télécharger le rapport
                    </button>
                    <button className="btn outline" onClick={handleReset}>
                      <span className="material-symbols-outlined">refresh</span>
                      Nouvelle IRM
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ── RECENT ANALYSES TABLE (Stitch-style) ────────────── */}
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
                            <span className={`class-chip ${CLASS_CHIP_KEY(h.pred)}`}>
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
        </div>
      </div>
    </div>
  )
}
