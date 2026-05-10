export default function SettingsPage({ user, onClearData }) {
  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h2>Paramètres</h2>
          <p>Configuration du compte et préférences locales.</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Compte */}
        <section className="card">
          <div className="card-header">
            <h3>Compte</h3>
          </div>
          <div className="settings-list">
            <div className="settings-row">
              <span className="muted t-label">Nom complet</span>
              <span className="t-tabular">{user?.name || '—'}</span>
            </div>
            <div className="settings-row">
              <span className="muted t-label">Email</span>
              <span className="t-tabular">{user?.email || '—'}</span>
            </div>
            <div className="settings-row">
              <span className="muted t-label">Profil</span>
              <span className="t-tabular">{user?.role || '—'}</span>
            </div>
          </div>
        </section>

        {/* Préférences */}
        <section className="card">
          <div className="card-header">
            <h3>Préférences</h3>
          </div>
          <div className="settings-list">
            <div className="settings-row">
              <span className="muted t-label">Langue</span>
              <span className="t-tabular">Français</span>
            </div>
            <div className="settings-row">
              <span className="muted t-label">Seuil de confiance</span>
              <span className="t-tabular">70 %</span>
            </div>
            <div className="settings-row">
              <span className="muted t-label">Format de rapport</span>
              <span className="t-tabular">Texte (.txt)</span>
            </div>
          </div>
        </section>

        {/* Confidentialité */}
        <section className="card">
          <div className="card-header">
            <h3>Confidentialité</h3>
          </div>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: '1rem', fontSize: 14 }}>
            Toutes les analyses et préférences sont stockées localement dans
            votre navigateur. Aucune donnée n'est transmise à un service tiers.
          </p>
          <div className="settings-list">
            <div className="settings-row">
              <span className="muted t-label">Historique local</span>
              <span className="status-pill ok">
                <span className="dot" /> Activé
              </span>
            </div>
            <div className="settings-row">
              <span className="muted t-label">Inférence</span>
              <span className="status-pill ok">
                <span className="dot" /> Locale
              </span>
            </div>
          </div>
        </section>

        {/* Données */}
        <section className="card">
          <div className="card-header">
            <h3>Données</h3>
          </div>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: '1rem', fontSize: 14 }}>
            Effacer toutes les données stockées localement (analyses,
            préférences, profil utilisateur).
          </p>
          <button className="btn outline" onClick={onClearData} style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
            <span className="material-symbols-outlined">delete_forever</span>
            Effacer toutes les données locales
          </button>
        </section>
      </div>
    </main>
  )
}
