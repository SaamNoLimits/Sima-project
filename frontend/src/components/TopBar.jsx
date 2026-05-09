export default function TopBar({ user, query, onQuery, latencyMs }) {
  const initials = (user?.name || '')
    .split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

  return (
    <header className="topbar">
      <label className="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="search"
          placeholder="Rechercher une analyse, un fichier…"
          value={query || ''}
          onChange={(e) => onQuery?.(e.target.value)}
        />
      </label>

      <div className="topbar-spacer" />

      {latencyMs != null && (
        <span className="topbar-latency" title="Temps de réponse de l'API">
          <span className="lat-dot" />
          API · {latencyMs} ms
        </span>
      )}

      <div className="topbar-icons">
        <button className="icon-btn" title="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="badge-dot" />
        </button>
        <button className="icon-btn" title="Messages">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </button>
      </div>

      <div className="topbar-user">
        <div className="text">
          <span className="name">{user?.name || ''}</span>
          <span className="mail">{user?.email || ''}</span>
        </div>
        <span className="avatar">{initials}</span>
      </div>
    </header>
  )
}
