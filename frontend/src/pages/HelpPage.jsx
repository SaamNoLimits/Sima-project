const STEPS = [
  { num: '01', title: 'Téléverser une IRM', body: 'Glissez-déposez une image cérébrale (JPG ou PNG) dans la zone d\'envoi du tableau de bord ou de la page « Nouvelle analyse ».' },
  { num: '02', title: 'Lancer l\'analyse', body: 'Cliquez sur « Lancer l\'analyse ». L\'image est prétraitée localement (224 × 224, normalisation ImageNet) puis transmise au modèle.' },
  { num: '03', title: 'Consulter le résultat', body: 'Le système renvoie une catégorie diagnostique parmi quatre, un score de confiance et une carte d\'attention Grad-CAM.' },
  { num: '04', title: 'Télécharger le rapport', body: 'Exportez un rapport texte structuré contenant la prédiction, les probabilités par classe et les métadonnées du praticien.' },
]

const FAQ = [
  {
    q: 'Le modèle peut-il diagnostiquer ?',
    a: 'Non. Le système est un outil d\'aide au diagnostic à finalité éducative et de recherche. Le diagnostic médical relève toujours d\'un professionnel qualifié.',
  },
  {
    q: 'Mes images IRM sont-elles transmises à un service externe ?',
    a: 'Non. Toute l\'inférence est réalisée localement par le backend FastAPI. Aucune image n\'est stockée ni transmise à un service tiers.',
  },
  {
    q: 'Quels formats d\'image sont acceptés ?',
    a: 'Les formats JPG, JPEG et PNG sont supportés. Pour des résultats optimaux, l\'image doit faire au moins 224 × 224 pixels et représenter un scan cérébral en coupe axiale, sagittale ou coronale.',
  },
  {
    q: 'Que signifie la carte d\'attention Grad-CAM ?',
    a: 'C\'est une visualisation des régions de l\'IRM sur lesquelles le modèle s\'est concentré pour produire sa décision. Elle aide à vérifier que la prédiction repose sur des zones cliniquement pertinentes.',
  },
  {
    q: 'Comment effacer mon historique ?',
    a: 'Rendez-vous dans Paramètres → Données puis cliquez sur « Effacer toutes les données locales », ou utilisez le bouton « Effacer tout » de la page Historique.',
  },
]

export default function HelpPage() {
  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h2>Aide &amp; documentation</h2>
          <p>Démarrage rapide, foire aux questions et ressources.</p>
        </div>
      </div>

      {/* Quick links */}
      <section className="dash-row thirds">
        <div className="card help-link-card">
          <span className="material-symbols-outlined lg" style={{ color: 'var(--secondary)' }}>play_circle</span>
          <h3>Démarrage rapide</h3>
          <p>Guide en quatre étapes pour réaliser votre première analyse.</p>
        </div>
        <div className="card help-link-card">
          <span className="material-symbols-outlined lg" style={{ color: 'var(--secondary)' }}>quiz</span>
          <h3>FAQ</h3>
          <p>Réponses aux questions les plus fréquentes des praticiens.</p>
        </div>
        <div className="card help-link-card">
          <span className="material-symbols-outlined lg" style={{ color: 'var(--secondary)' }}>contact_support</span>
          <h3>Contact</h3>
          <p>Pour toute question : <code>oussama.ahjli@edu.uiz.ac.ma</code></p>
        </div>
      </section>

      {/* Steps */}
      <section className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header"><h3>Démarrage rapide</h3></div>
        <div className="help-steps">
          {STEPS.map((s) => (
            <div className="help-step" key={s.num}>
              <span className="help-step-num">{s.num}</span>
              <div>
                <h4>{s.title}</h4>
                <p>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="card">
        <div className="card-header"><h3>Foire aux questions</h3></div>
        <div className="help-faq">
          {FAQ.map((f, i) => (
            <details key={i} className="help-faq-item">
              <summary>
                {f.q}
                <span className="material-symbols-outlined sm">expand_more</span>
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div style={{ textAlign: 'center', padding: '2rem', fontSize: 12, color: 'var(--outline-variant)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
        NeuroVista v1.0 · Mémoire de fin d'études · 2026
      </div>
    </main>
  )
}
