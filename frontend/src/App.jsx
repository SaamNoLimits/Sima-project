import { useEffect, useState, useMemo } from 'react'
import LoginForm from './components/LoginForm'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import StatCard from './components/StatCard'
import ClassDistChart from './components/ClassDistChart'
import ConfidenceDonut from './components/ConfidenceDonut'
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

function todayLong() {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

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

  const filteredHistory = search.trim()
    ? history.filter((h) =>
        h.label_fr.toLowerCase().includes(search.toLowerCase()) ||
        h.filename?.toLowerCase().includes(search.toLowerCase()))
    : history

  let statusPill = null
  if (healthErr) {
    statusPill = <span className="status-pill err"><span className="dot" /> API hors ligne</span>
  } else if (health) {
    statusPill = health.model_loaded
      ? <span className="status-pill ok">
          <span className="dot" />
          Modèle chargé · {health.model_kind}{latencyMs != null ? ` · ${latencyMs} ms` : ''}
        </span>
      : <span className="status-pill warn"><span className="dot" /> Mode démo</span>
  }

  const Icon = {
    target:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    folder:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    chart:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 13l4-4 4 4 5-5"/></svg>,
    sun:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>,
  }

  // Helpers — turn empty data into meaningful displays
  const totalLabel    = stats.total === 0 ? 'En attente' : String(stats.total)
  const avgConfLabel  = stats.total === 0 ? '—'          : `${(stats.avgConf * 100).toFixed(1)}%`
  const todayLabel    = stats.todayCount === 0 ? '—'    : String(stats.todayCount)

  return (
    <div className="app">
      <div className="shell">
        <Sidebar active={activeNav} onNavigate={setActiveNav} onLogout={handleLogout} />

        <div>
          <TopBar user={user} query={search} onQuery={setSearch} latencyMs={latencyMs} />

          <main className="main">

            {/* ── EN-TÊTE DE PAGE ──────────────────────────────────── */}
            <div className="page-header">
              <div>
                <h1>Bonjour, {firstName(user.name)}</h1>
                <p>{todayLong()} · Vue d'ensemble du classifieur IRM cérébral.</p>
              </div>
              <div className="page-actions">
                {statusPill}
                <button className="btn" onClick={() => { handleReset(); setActiveNav('upload') }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Nouvelle analyse
                </button>
                <button className="btn outline" onClick={handleDownloadReport} disabled={!result}>
                  Exporter
                </button>
              </div>
            </div>

            {/* ── CARTES STATS ─────────────────────────────────────── */}
            <section className="stat-grid">
              <StatCard
                featured
                icon={Icon.target}
                num="96,79%"
                label="Précision du modèle"
                trend="ResNet34 · validation set (n=840)"
              />
              <StatCard
                icon={Icon.folder}
                num={totalLabel}
                label="Analyses totales"
                trend={stats.total === 0 ? 'Aucune analyse réalisée' : `+${stats.todayCount} aujourd'hui`}
              />
              <StatCard
                icon={Icon.chart}
                num={avgConfLabel}
                label="Confiance moyenne"
                trend={stats.total === 0 ? 'En attente d\'analyses' : `Sur ${stats.total} prédiction${stats.total > 1 ? 's' : ''}`}
              />
              <StatCard
                icon={Icon.sun}
                num={todayLabel}
                label="Analyses du jour"
                trend={stats.lastEntry ? `Dernière · ${formatRelative(stats.lastEntry.ts)}` : 'Aucune analyse aujourd\'hui'}
              />
            </section>

            {/* ── ROW 1 : analytics + info modèle ──────────────────── */}
            <section className="dash-row two-thirds-third">
              <ClassDistChart history={history} />

              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>Modèle d'inférence</h3>
                    <div className="sub">Fiche technique du classifieur en production.</div>
                  </div>
                </div>

                <ul className="model-spec">
                  <li><span>Architecture</span><strong>ResNet34</strong></li>
                  <li><span>Pré-entraînement</span><strong>ImageNet</strong></li>
                  <li><span>Framework</span><strong>fastai 2.8.7 · torch 2.10</strong></li>
                  <li><span>Entrée</span><strong>RGB 224 × 224</strong></li>
                  <li><span>Sortie</span><strong>4 classes (softmax)</strong></li>
                  <li><span>Macro F1</span><strong>0,9673</strong></li>
                  <li><span>Macro AUC</span><strong>0,9988</strong></li>
                  <li><span>Taille</span><strong>83,5 MB</strong></li>
                </ul>
              </div>
            </section>

            {/* ── UPLOAD / RÉSULTAT ────────────────────────────────── */}
            <section className="dash-row" style={{ gridTemplateColumns: '1fr', marginBottom: '1.5rem' }}>
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>{result ? 'Résultat de l\'analyse' : 'Soumettre une IRM'}</h3>
                    <div className="sub">Image ≥ 224 × 224 px · JPG ou PNG · inférence locale, ~1 s.</div>
                  </div>
                </div>

                {!file && !result && <UploadZone onFile={handleFile} />}

                {file && !result && (
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
                            : <>Lancer l'analyse <span className="arrow">→</span></>}
                        </button>
                        <button className="btn outline" onClick={handleReset} disabled={loading}>
                          Changer d'image
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {error && <div className="error-box" style={{ marginTop: '1rem' }}><strong>Erreur :</strong> {error}</div>}

                {result && (
                  <div className="stack">
                    <ResultCard result={result} threshold={CONFIDENCE_THRESHOLD} />
                    <div className="btn-row">
                      <button className="btn" onClick={handleDownloadReport}>
                        Télécharger le rapport <span className="arrow">→</span>
                      </button>
                      <button className="btn outline" onClick={handleReset}>
                        Nouvelle IRM
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ── ROW 3 : analyses récentes + classes + donut ──────── */}
            <section className="dash-row thirds">
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>Analyses récentes</h3>
                    <div className="sub">{history.length} entrée{history.length === 1 ? '' : 's'} (max 20).</div>
                  </div>
                  {history.length > 0 && (
                    <button className="link-btn" onClick={handleClearHistory}>Effacer</button>
                  )}
                </div>

                {filteredHistory.length === 0 ? (
                  <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {search ? 'Aucun résultat pour cette recherche.' : 'Vos prédictions s\'afficheront ici.'}
                  </div>
                ) : (
                  <ul className="recent-list">
                    {filteredHistory.slice(0, 6).map((h, i) => (
                      <li key={`${h.ts}-${i}`} className="recent-item">
                        <span className="recent-check">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                        <div className="recent-body">
                          <div className="recent-top">
                            <span className="recent-title">{h.label_fr}</span>
                            <span className="recent-conf">{(h.confidence * 100).toFixed(0)}%</span>
                          </div>
                          <div className="recent-meta">{h.filename || '—'} · {formatRelative(h.ts)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>Classes détectées</h3>
                    <div className="sub">Sortie ResNet34 · softmax 4 classes.</div>
                  </div>
                </div>
                <ul className="team-list">
                  {CLASS_ORDER.map((c) => {
                    const meta = CLASS_META[c]
                    const sevBadge =
                      c === 'glioma' ? 'badge-high' :
                      c === 'notumor' ? 'badge-normal' : 'badge-moderate'
                    const sevLbl =
                      c === 'glioma' ? 'Sévérité élevée' :
                      c === 'notumor' ? 'Normale' : 'Modérée'
                    return (
                      <li key={c} className="team-item">
                        <span className="team-avatar" style={{ background: meta.color }}>
                          {meta.fr.charAt(0)}
                        </span>
                        <div className="team-body">
                          <div className="team-name">{meta.fr}</div>
                          <div className="team-tech"><code>{c}</code></div>
                        </div>
                        <span className={`team-badge ${sevBadge}`}>{sevLbl}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <ConfidenceDonut history={history} />
            </section>

            <div className="footer">
              NeuroVista v1.0 · Mémoire de fin d'études · 2026 · Outil de recherche, ne remplace pas un avis médical.
            </div>

          </main>
        </div>
      </div>
    </div>
  )
}
