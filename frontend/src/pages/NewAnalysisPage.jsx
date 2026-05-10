import UploadZone from '../components/UploadZone'
import ResultCard from '../components/ResultCard'

export default function NewAnalysisPage({
  file, previewUrl, loading, result, error,
  onFile, onAnalyze, onReset, onDownloadReport,
  threshold,
}) {
  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h2>Nouvelle analyse</h2>
          <p>Soumettez une IRM cérébrale pour obtenir une classification automatique en quatre catégories.</p>
        </div>
      </div>

      {!file && !result && (
        <section style={{ marginBottom: '2rem' }}>
          <UploadZone onFile={onFile} />
        </section>
      )}

      {file && !result && (
        <section style={{ marginBottom: '2rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Aperçu de l'IRM</h3>
              <span className="t-label muted">Pré-analyse</span>
            </div>
            <div className="preview">
              <div>
                <img src={previewUrl} alt="Aperçu IRM" />
                <div className="meta">{file.name} · {(file.size / 1024).toFixed(0)} Ko</div>
              </div>
              <div>
                <p className="desc">
                  L'image sera redimensionnée à 224 × 224, normalisée selon les
                  statistiques ImageNet, puis transmise au modèle ResNet34.
                  Inférence locale, ~1 seconde. Aucune donnée n'est conservée
                  côté serveur.
                </p>
                <div className="btn-row">
                  <button className="btn" onClick={onAnalyze} disabled={loading}>
                    {loading
                      ? <><span className="spinner" />Analyse en cours…</>
                      : <>
                          <span className="material-symbols-outlined">play_arrow</span>
                          Lancer l'analyse
                        </>}
                  </button>
                  <button className="btn outline" onClick={onReset} disabled={loading}>
                    <span className="material-symbols-outlined">refresh</span>
                    Changer d'image
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {error && <div className="error-box"><strong>Erreur :</strong> {error}</div>}

      {result && (
        <section style={{ marginBottom: '2rem' }}>
          <div className="stack">
            <ResultCard result={result} threshold={threshold} />
            <div className="btn-row">
              <button className="btn" onClick={onDownloadReport}>
                <span className="material-symbols-outlined">download</span>
                Télécharger le rapport
              </button>
              <button className="btn outline" onClick={onReset}>
                <span className="material-symbols-outlined">refresh</span>
                Nouvelle IRM
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
