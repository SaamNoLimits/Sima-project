// SVG icons inlined to avoid extra HTTP calls
const Icon = {
  dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
      <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
    </svg>
  ),
  upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  history: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  classes: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 2 7l10 5 10-5-10-5z"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  reports: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
    </svg>
  ),
  settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  help: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  logout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
}

const NAV = [
  { id: 'dashboard', label: 'Tableau de bord', icon: Icon.dashboard },
  { id: 'upload',    label: 'Nouvelle analyse', icon: Icon.upload },
  { id: 'history',   label: 'Historique', icon: Icon.history },
  { id: 'classes',   label: 'Classes', icon: Icon.classes },
  { id: 'reports',   label: 'Rapports', icon: Icon.reports },
]

const GENERAL = [
  { id: 'settings', label: 'Paramètres', icon: Icon.settings },
  { id: 'help',     label: 'Aide', icon: Icon.help },
]

export default function Sidebar({ active, onNavigate, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/assets/icons/logo-icon.svg" alt="" className="mark" />
        NeuroVista
      </div>

      <div className="sidebar-section-label">PRINCIPAL</div>
      <nav className="sidebar-nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-item${active === n.id ? ' active' : ''}`}
            onClick={() => onNavigate?.(n.id)}
          >
            <n.icon />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-section-label">GÉNÉRAL</div>
      <nav className="sidebar-nav">
        {GENERAL.map((n) => (
          <button
            key={n.id}
            className={`nav-item${active === n.id ? ' active' : ''}`}
            onClick={() => onNavigate?.(n.id)}
          >
            <n.icon />
            <span>{n.label}</span>
          </button>
        ))}
        <button className="nav-item" onClick={onLogout}>
          <Icon.logout />
          <span>Logout</span>
        </button>
      </nav>

      <div className="sidebar-promo">
        <div className="promo-tag">PROJET DE RECHERCHE</div>
        <h4>Mémoire de fin d'études</h4>
        <p>Classification automatique de tumeurs cérébrales par IRM — ResNet34 + transfer learning.</p>
        <div className="pillrow">
          <span className="pill">fastai 2.8</span>
          <span className="pill">torch 2.10</span>
        </div>
      </div>
    </aside>
  )
}
