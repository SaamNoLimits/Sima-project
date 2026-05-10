import { CLASS_ORDER, CLASS_META } from '../classInfo'

const CLASS_INFO = {
  glioma: {
    severity: 'Élevée',
    badge: 'badge-high',
    icon: 'warning',
    description: "Les gliomes sont des tumeurs qui prennent naissance dans les cellules gliales du cerveau ou de la moelle épinière. Ils représentent environ 30 % des tumeurs cérébrales et sont souvent malins, nécessitant une prise en charge rapide.",
    keys: ['Origine : cellules gliales', 'Localisation : cerveau, moelle', 'Pronostic : variable selon le grade'],
  },
  meningioma: {
    severity: 'Modérée',
    badge: 'badge-moderate',
    icon: 'priority_high',
    description: "Les méningiomes se développent dans les méninges, les membranes qui entourent le cerveau et la moelle épinière. Généralement bénins et à croissance lente, ils peuvent néanmoins comprimer les structures avoisinantes.",
    keys: ['Origine : méninges', 'Croissance : lente', 'Pronostic : généralement favorable'],
  },
  notumor: {
    severity: 'Normale',
    badge: 'badge-normal',
    icon: 'check_circle',
    description: "L'analyse de l'IRM ne révèle pas de signe de tumeur cérébrale détectable. Un suivi médical régulier reste néanmoins recommandé en cas de symptômes persistants.",
    keys: ['Aucune masse tumorale détectée', 'Suivi clinique recommandé', 'Examens complémentaires possibles'],
  },
  pituitary: {
    severity: 'Modérée',
    badge: 'badge-moderate',
    icon: 'priority_high',
    description: "Les tumeurs de la glande pituitaire (hypophyse) sont majoritairement bénignes (adénomes). Elles peuvent perturber la production hormonale et entraîner divers symptômes endocriniens et visuels.",
    keys: ['Origine : glande pituitaire', 'Type : généralement bénin', 'Impact : équilibre hormonal'],
  },
}

export default function ClassesPage() {
  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h2>Catégories diagnostiques détectées</h2>
          <p>
            Le système classe chaque IRM dans l'une de ces quatre catégories.
            Les descriptions ci-dessous sont à titre informatif uniquement.
          </p>
        </div>
      </div>

      <div className="classes-grid">
        {CLASS_ORDER.map((cls) => {
          const meta = CLASS_META[cls]
          const info = CLASS_INFO[cls]
          return (
            <article className="class-detail-card" key={cls}>
              <div className="class-detail-header" style={{ background: `linear-gradient(135deg, ${meta.color}15 0%, ${meta.color}05 100%)` }}>
                <span className="class-bullet" style={{ background: meta.color }}>
                  {meta.fr.charAt(0)}
                </span>
                <div className="class-detail-titles">
                  <h3>{meta.fr}</h3>
                  <code>{cls}</code>
                </div>
                <span className={`status-pill ${info.badge}`}>
                  <span className="material-symbols-outlined sm">{info.icon}</span>
                  {info.severity}
                </span>
              </div>

              <div className="class-detail-body">
                <p>{info.description}</p>
                <ul className="class-keys">
                  {info.keys.map((k, i) => (
                    <li key={i}>
                      <span className="material-symbols-outlined sm" style={{ color: meta.color }}>arrow_right</span>
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          )
        })}
      </div>

      <div className="disclaimer" style={{ marginTop: '2rem' }}>
        <span className="material-symbols-outlined sm" style={{ verticalAlign: '-3px', marginRight: 4 }}>info</span>
        <strong>Note clinique</strong> — Ces définitions sont fournies à titre éducatif.
        Le diagnostic médical définitif relève toujours d'un médecin spécialiste
        (neurologue, neuroradiologue) après examen clinique complet.
      </div>
    </main>
  )
}
