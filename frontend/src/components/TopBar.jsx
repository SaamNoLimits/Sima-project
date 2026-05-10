export default function TopBar({ user, query, onQuery, latencyMs, onLogout }) {
  const initials = (user?.name || '')
    .split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

  return (
    <header className="topbar">
      <label className="search">
        <span className="material-symbols-outlined">search</span>
        <input
          type="search"
          placeholder="Rechercher…"
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

      <button className="topbar-icon-btn" title="Notifications" type="button">
        <span className="material-symbols-outlined">notifications</span>
        <span className="badge-dot" />
      </button>

      <div className="topbar-user" title={user?.email || ''}>
        <span className="avatar">{initials}</span>
        <span className="name">{user?.name || ''}</span>
        <button
          className="logout-btn"
          onClick={onLogout}
          title="Logout"
          type="button"
        >
          <span className="material-symbols-outlined sm">logout</span>
        </button>
      </div>
    </header>
  )
}
