import { CLASS_ORDER, CLASS_META, severityClass, severityBadge } from '../classInfo'

export default function ResultCard({ result, threshold = 70 }) {
  const { confidence, probabilities, info, demo_mode, gradcam_png_b64 } = result
  const conf = confidence * 100
  const uncertain = conf < threshold

  return (
    <>
      <div className={`result ${severityClass(info.severity)}`}>
        <h2>
          Résultat&nbsp;: <strong>{info.label_fr}</strong>
          <span className={`badge ${severityBadge(info.severity)}`}>
            {info.severity}
          </span>
          {uncertain && <span className="badge badge-warn">⚠ Incertain</span>}
          {demo_mode && <span className="badge badge-demo">Démo</span>}
        </h2>
        <p className="description">{info.description}</p>
        <div className="confidence" style={{ color: info.color }}>
          Confiance · {conf.toFixed(1)}%
        </div>
        <div className="confidence-bar">
          <div style={{ width: `${conf}%`, background: info.color }} />
        </div>
        {uncertain && (
          <p style={{ color: '#fbbf24', fontSize: '0.88rem', marginTop: '0.85rem' }}>
            ⚠ Confiance inférieure au seuil de {threshold}%. Consultez un médecin spécialiste.
          </p>
        )}
      </div>

      <div className="probabilities">
        <h3>Probabilités par classe</h3>
        {CLASS_ORDER.map((cls) => {
          const p = (probabilities[cls] || 0) * 100
          const meta = CLASS_META[cls]
          return (
            <div className="prob-row" key={cls}>
              <div className="label">
                <span className="swatch" style={{ background: meta.color }} />
                {meta.fr}
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${p}%`, background: meta.color }} />
              </div>
              <div className="pct">{p.toFixed(1)}%</div>
            </div>
          )
        })}
      </div>

      {gradcam_png_b64 && (
        <div className="gradcam-card">
          <h3>Grad-CAM Attention Map</h3>
          <p>Régions de l'IRM sur lesquelles le modèle s'est concentré pour sa décision.</p>
          <img
            src={`data:image/png;base64,${gradcam_png_b64}`}
            alt="Grad-CAM overlay"
          />
        </div>
      )}

      <div className="disclaimer">
        ⚕ <strong>Avertissement médical</strong> — Ce système est un outil d'aide
        au diagnostic basé sur l'intelligence artificielle. Les résultats ne
        constituent pas un diagnostic médical. Consultez toujours un médecin
        spécialiste (neurologue ou neuroradiologue) pour l'interprétation des
        IRM cérébrales.
      </div>
    </>
  )
}
