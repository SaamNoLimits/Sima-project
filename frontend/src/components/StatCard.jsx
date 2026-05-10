// Donezo/Stitch-style stat card. `featured=true` for the filled deep-green
// hero card with decorative bg-icon; otherwise white card with side-icon.
export default function StatCard({ icon, bgIcon, num, label, trend, trendIcon = 'trending_up', featured = false }) {
  return (
    <div className={`stat-card${featured ? ' featured' : ''}`}>
      {featured && bgIcon && (
        <span className="material-symbols-outlined stat-bg-icon">{bgIcon}</span>
      )}
      <div className="stat-top">
        <div className="stat-label">{label}</div>
        <div className="stat-icon">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <div className="stat-num">{num}</div>
      {trend && (
        <div className="stat-trend">
          {trendIcon && <span className="material-symbols-outlined">{trendIcon}</span>}
          <span>{trend}</span>
        </div>
      )}
    </div>
  )
}
