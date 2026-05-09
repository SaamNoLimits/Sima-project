import { useState } from 'react'

const STATS = [
  { num: '96.79%', lbl: 'Accuracy' },
  { num: '0.999',  lbl: 'Macro AUC' },
  { num: '4',      lbl: 'Classes' },
  { num: '7,023',  lbl: 'MRI Scans' },
]

export default function LoginForm({ onLogin }) {
  const [name, setName]   = useState('Dr NASSIMA')
  const [email, setEmail] = useState('nassima@hopital.fr')
  const [role, setRole]   = useState('Radiologist')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!name.trim() || name.trim().length < 2) errs.name = 'Au moins 2 caractères.'
    if (!email.trim() || !/.+@.+\..+/.test(email)) errs.email = 'Email invalide.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSubmitting(true)
    setTimeout(() => {
      onLogin({ name: name.trim(), email: email.trim(), role })
    }, 400)
  }

  return (
    <div className="split">
      {/* ── LEFT : form ─────────────────────────────────────────────── */}
      <div className="split-form">
        <div className="split-form-inner">
          <div className="brand">
            <img src="/assets/icons/logo-icon.svg" alt="" className="mark" />
            NeuroVista
          </div>

          <h1 className="text-32-bold" style={{ marginBottom: '0.4rem' }}>
            Connexion praticien
          </h1>
          <p className="text-14-regular" style={{ marginBottom: '2rem' }}>
            Accédez au classifieur d'IRM cérébrales pour démarrer une analyse.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Nom complet</label>
              <div className="form-input-wrap">
                <img src="/assets/icons/user.svg" alt="" className="icon-svg" />
                <input id="name" type="text" autoComplete="name"
                       placeholder="Dr NASSIMA"
                       value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <div className="form-input-wrap">
                <img src="/assets/icons/email.svg" alt="" className="icon-svg" />
                <input id="email" type="email" autoComplete="email"
                       placeholder="nassima@hopital.fr"
                       value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="role">Profil</label>
              <div className="form-input-wrap">
                <img src="/assets/icons/appointments.svg" alt="" className="icon-svg" />
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option>Radiologist</option>
                  <option>Neurologist</option>
                  <option>Researcher</option>
                  <option>Student</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn block lg" disabled={submitting} style={{ marginTop: '0.5rem' }}>
              {submitting
                ? <><span className="spinner" />Connexion…</>
                : <>Commencer l'analyse <span className="arrow">→</span></>}
            </button>
          </form>

          <p className="text-12-regular" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            Données stockées localement uniquement. Aucun envoi à un service tiers.
          </p>

          <p className="text-12-regular" style={{ marginTop: '3rem', textAlign: 'center' }}>
            © 2026 NeuroVista · Outil éducatif et de recherche
          </p>
        </div>
      </div>

      {/* ── RIGHT : CarePulse onboarding-img + stat overlay ─────────── */}
      <div
        className="split-side"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(13,15,16,0.4) 0%, rgba(13,15,16,0.85) 100%), url('/assets/images/onboarding-img.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="split-side-content">
          {STATS.map((s) => (
            <div className="side-stat" key={s.lbl}>
              <div className="num">{s.num}</div>
              <div className="lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
