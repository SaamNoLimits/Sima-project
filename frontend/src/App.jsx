import { useEffect, useState, useMemo } from 'react'
import LoginForm from './components/LoginForm'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import DashboardPage  from './pages/DashboardPage'
import NewAnalysisPage from './pages/NewAnalysisPage'
import HistoryPage    from './pages/HistoryPage'
import ReportsPage    from './pages/ReportsPage'
import ClassesPage    from './pages/ClassesPage'
import SettingsPage   from './pages/SettingsPage'
import HelpPage       from './pages/HelpPage'
import { CLASS_ORDER, CLASS_META } from './classInfo'
import { getHealth, predictImage } from './api'
import { loadHistory, pushHistory, clearHistory, summarize } from './lib/history'

const CONFIDENCE_THRESHOLD = 70
const USER_STORAGE_KEY = 'brainscan_user'
const HISTORY_KEY      = 'brainscan_history'

// When the URL has ?reset=1 (set by start.bat for a fresh launch),
// wipe localStorage and strip the query so the page reloads clean.
function applyResetFlag() {
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('reset') === '1') {
      localStorage.clear()
      sessionStorage.clear()
      params.delete('reset')
      params.delete('t')
      const clean = window.location.pathname + (params.toString() ? '?' + params.toString() : '')
      window.history.replaceState({}, '', clean)
      console.info('[NeuroVista] Fresh session — localStorage cleared.')
      return true
    }
  } catch {}
  return false
}
applyResetFlag()

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
  const handleClearAllData = () => {
    if (!confirm('Effacer toutes les données locales (analyses + profil) ?')) return
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(HISTORY_KEY)
    setUser(null); setHistory([]); setFile(null); setResult(null)
  }

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

  // ── Page routing ─────────────────────────────────────────────
  let page = null
  switch (activeNav) {
    case 'upload':
      page = (
        <NewAnalysisPage
          file={file}
          previewUrl={previewUrl}
          loading={loading}
          result={result}
          error={error}
          onFile={handleFile}
          onAnalyze={handleAnalyze}
          onReset={handleReset}
          onDownloadReport={handleDownloadReport}
          threshold={CONFIDENCE_THRESHOLD}
        />
      )
      break
    case 'history':
      page = <HistoryPage history={history} onClear={handleClearHistory} />
      break
    case 'reports':
      page = <ReportsPage history={history} />
      break
    case 'classes':
      page = <ClassesPage />
      break
    case 'settings':
      page = <SettingsPage user={user} onClearData={handleClearAllData} />
      break
    case 'help':
      page = <HelpPage />
      break
    case 'dashboard':
    default:
      page = (
        <DashboardPage
          user={user}
          history={history}
          stats={stats}
          latencyMs={latencyMs}
          health={health}
          search={search}
          onClearHistory={handleClearHistory}
          onNewAnalysis={() => { handleReset(); setActiveNav('upload') }}
        />
      )
  }

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
          {page}
        </div>
      </div>
    </div>
  )
}
