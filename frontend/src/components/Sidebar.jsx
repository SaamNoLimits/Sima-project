const NAV = [
  { id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
  { id: 'upload',    label: 'Nouvelle analyse', icon: 'biotech' },
  { id: 'history',   label: 'Historique', icon: 'history' },
  { id: 'reports',   label: 'Rapports', icon: 'assessment' },
  { id: 'classes',   label: 'Classes', icon: 'category' },
]

const GENERAL = [
  { id: 'settings', label: 'Paramètres', icon: 'settings' },
  { id: 'help',     label: 'Aide', icon: 'help' },
]

export default function Sidebar({ active, onNavigate, onCta }) {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="mark">
          <span className="material-symbols-outlined">psychiatry</span>
        </span>
        <div className="text">
          <h1>NEUROVISTA</h1>
          <p>Système Clinique</p>
        </div>
      </div>

      {/* CTA — Lancer Diagnostic */}
      <button className="sidebar-cta" onClick={onCta}>
        <span className="material-symbols-outlined">add</span>
        Lancer Diagnostic
      </button>

      {/* Main nav */}
      <nav className="sidebar-nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-item${active === n.id ? ' active' : ''}`}
            onClick={() => onNavigate?.(n.id)}
          >
            <span className="material-symbols-outlined">{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* General section */}
      <div className="sidebar-divider">
        <nav className="sidebar-nav">
          {GENERAL.map((n) => (
            <button
              key={n.id}
              className={`nav-item${active === n.id ? ' active' : ''}`}
              onClick={() => onNavigate?.(n.id)}
            >
              <span className="material-symbols-outlined">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  )
}
