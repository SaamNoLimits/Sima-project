// Donezo-style stat card. First card uses `featured=true` for the filled emerald look.
export default function StatCard({ icon, num, label, trend, featured = false }) {
  return (
    <div className={`stat-card${featured ? ' featured' : ''}`}>
      <div className="stat-top">
        <span className="stat-icon">{icon}</span>
        <span className="stat-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="7" y1="17" x2="17" y2="7"/>
            <polyline points="7,7 17,7 17,17"/>
          </svg>
        </span>
      </div>
      <div className="stat-num">{num}</div>
      <div className="stat-lbl">{label}</div>
      {trend && (
        <div className="stat-trend">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
          </svg>
          {trend}
        </div>
      )}
    </div>
  )
}
