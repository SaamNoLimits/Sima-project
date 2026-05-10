import { useState } from 'react'

export default function LoginForm({ onLogin }) {
  const [name, setName]   = useState('Dr NASSIMA')
  const [email, setEmail] = useState('nassima@hopital.fr')
  const [role, setRole]   = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!name.trim() || name.trim().length < 2) errs.name = 'Au moins 2 caractères.'
    if (!email.trim() || !/.+@.+\..+/.test(email)) errs.email = 'Email invalide.'
    if (!role) errs.role = 'Sélectionnez un profil.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSubmitting(true)
    setTimeout(() => onLogin({ name: name.trim(), email: email.trim(), role }), 300)
  }

  return (
    <main className="split">

      {/* ── LEFT : auth form ────────────────────────────────────── */}
      <section className="split-form">
        {/* Top branding */}
        <div className="split-form-top">
          <img src="/assets/icons/logo-icon.svg" alt="" />
          <span className="brand-text">NEUROVISTA</span>
        </div>

        {/* Form area */}
        <div className="split-form-inner">
          <header style={{ marginBottom: '2.5rem' }}>
            <h1 className="login-h1">Connexion praticien</h1>
            <p className="login-sub">Accédez au classifieur d'IRM cérébrales</p>
          </header>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Nom complet</label>
              <div className="form-input-wrap">
                <span className="material-symbols-outlined">person</span>
                <input id="name" type="text" autoComplete="name"
                       placeholder="Dr NASSIMA"
                       value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <div className="form-input-wrap">
                <span className="material-symbols-outlined">mail</span>
                <input id="email" type="email" autoComplete="email"
                       placeholder="nassima@hopital.fr"
                       value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="role">Profil</label>
              <div className="form-input-wrap">
                <span className="material-symbols-outlined">description</span>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="" disabled>Sélectionnez votre profil</option>
                  <option>Radiologue</option>
                  <option>Neurologue</option>
                  <option>Chercheur</option>
                  <option>Interne</option>
                  <option>Étudiant</option>
                </select>
                <span className="material-symbols-outlined right">expand_more</span>
              </div>
              {errors.role && <div className="form-error">{errors.role}</div>}
            </div>

            <button type="submit" className="btn block lg" disabled={submitting}
                    style={{ marginTop: '0.5rem', padding: '1rem' }}>
              {submitting
                ? <><span className="spinner" /> Connexion…</>
                : <>
                    <span>Commencer l'analyse</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>}
            </button>
          </form>
        </div>

        <footer className="split-form-footer">
          © 2026 NEUROVISTA · OUTIL ÉDUCATIF ET DE RECHERCHE
        </footer>
      </section>

      {/* ── RIGHT : visual context (brain MRI + glass bento) ─────── */}
      <section className="split-side">
        <div className="bg-image">
          <img src="/assets/images/onboarding-img.png" alt="" />
        </div>
        <div className="blur-orb-1" />
        <div className="blur-orb-2" />

        <div className="split-side-content">
          <div className="glass-bento">
            <div className="glass-card">
              <p className="lbl">Précision</p>
              <p className="num">96,79%</p>
              <div className="bar"><div style={{ width: '96.79%' }} /></div>
            </div>
            <div className="glass-card">
              <p className="lbl">Score AUC</p>
              <p className="num">0,999</p>
              <p className="small">
                <span className="material-symbols-outlined fill">verified</span>
                Standard Or
              </p>
            </div>
            <div className="glass-card">
              <p className="lbl">Classes</p>
              <p className="num">4 Classes</p>
              <p className="meta">Détectées par analyse de segmentation</p>
            </div>
            <div className="glass-card">
              <p className="lbl">Entraînement</p>
              <p className="num">7 023</p>
              <p className="meta">IRMs traitées en phase de validation</p>
            </div>
          </div>

          <div className="split-side-tagline">
            "L'intelligence artificielle au service de la précision diagnostique neurologique."
          </div>
        </div>
      </section>
    </main>
  )
}
