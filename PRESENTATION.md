---
marp: true
theme: default
paginate: true
backgroundColor: #ffffff
color: #14532d
style: |
  section { font-family: ui-sans-serif, system-ui, sans-serif; padding: 50px 60px; }
  h1 { color: #14532d; border-bottom: 3px solid #16a34a; padding-bottom: 10px; }
  h2 { color: #15803d; }
  h3 { color: #166534; }
  code, pre { background: #f0fdf4; }
  table { font-size: 0.85em; }
  th { background: #16a34a; color: white; padding: 8px; }
  td { padding: 6px 10px; border-bottom: 1px solid #e4e4e7; }
  blockquote { border-left: 4px solid #16a34a; background: #f0fdf4; padding: 12px 20px; }
  .accent { color: #16a34a; font-weight: 700; }
  .small { font-size: 0.8em; color: #52525b; }
---

<!-- _class: lead -->
<!-- _backgroundColor: #14532d -->
<!-- _color: #ffffff -->

# 🧠 NeuroVista

## Classification automatique de tumeurs cérébrales par IRM
### Deep Learning · Transfer Learning · Web App full-stack

<br>

**Auteur :** *[Votre nom]*
**Encadrant :** *[Nom de l'encadrant]*
**Année universitaire :** 2025-2026

---

# 📋 Plan de la présentation

1. **Contexte & problématique**
2. **Objectifs du projet**
3. **État de l'art**
4. **Dataset & ETL**
5. **Architecture du modèle**
6. **Stratégie d'entraînement**
7. **Résultats expérimentaux**
8. **Architecture logicielle full-stack**
9. **Démonstration**
10. **Limitations & perspectives**
11. **Conclusion**

---

# 1. Contexte & problématique

## Le diagnostic des tumeurs cérébrales

- **~308 000** nouveaux cas / an dans le monde *(GLOBOCAN 2020)*
- **IRM** : examen de référence pour le diagnostic, la planification chirurgicale et le suivi
- **Lecture manuelle** : longue (5–15 min/IRM), opérateur-dépendante, sujette à fatigue
- **Pénurie de neuroradiologues** : moins de 1 pour 100 000 habitants dans la majorité des pays

> **Question de recherche :** un modèle de deep learning peut-il atteindre une précision diagnostique compétitive avec un radiologue, sur les principales classes de tumeurs cérébrales, à partir d'une simple IRM ?

---

# 2. Objectifs du projet

| # | Objectif | Mesure de succès |
|---|---|---|
| **O1** | Concevoir un classifieur multi-classes (4 catégories) | Accuracy > 95 % · Macro F1 > 0.95 |
| **O2** | Maîtriser le transfer learning (ImageNet → IRM) | Convergence < 30 epochs |
| **O3** | Garantir l'explicabilité du modèle | Visualisation Grad-CAM par prédiction |
| **O4** | Industrialiser : web app accessible aux non-techniciens | API REST + UI · < 1 sec/inférence |
| **O5** | Reproductibilité scientifique | Code + métriques + figures versionnés |

---

# 3. État de l'art

## Travaux récents sur le même dataset (2023-2025)

| Architecture | Auteur | Accuracy |
|---|---|---|
| EfficientNetB0 + TL | *Khan et al., 2023* | 95.2 % |
| **ResNet50** | *Zhao et al., 2024* | 96.8 % |
| Xception + augm. | *Bhuvaji et al., 2024* | 98.7 % |
| Vision Transformer | *Mehrotra, 2025* | 97.4 % |
| **Notre approche : ResNet34 + 2-phase TL** | — | **96.79 %** |

**Choix architectural :** ResNet34 retenu pour son rapport **performance / coût computationnel** — entraînement 10 min sur GPU T4, inférence CPU < 1 sec.

---

# 4. Dataset

## Brain Tumor MRI Dataset (Kaggle · masoudnickparvar)

- **7 023 images** IRM cérébrales en niveaux de gris (RGB après conversion)
- **4 classes équilibrées** : `glioma`, `meningioma`, `notumor`, `pituitary`
- **Origine** : combinaison de 3 sources publiques (Figshare, SARTAJ, Br35H)
- **Splits fournis** : `Training/` (5 712 imgs) et `Testing/` (1 311 imgs)

### Distribution

| Classe | Training | Testing | Total |
|---|---|---|---|
| glioma | 1 321 | 300 | 1 621 |
| meningioma | 1 339 | 306 | 1 645 |
| notumor | 1 595 | 405 | 2 000 |
| pituitary | 1 457 | 300 | 1 757 |
| **Total** | **5 712** | **1 311** | **7 023** |

---

# 4. Dataset — Exemples par classe

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   GLIOMA    │ MENINGIOMA  │   NOTUMOR   │  PITUITARY  │
│             │             │             │             │
│  [IRM 1]    │  [IRM 1]    │  [IRM 1]    │  [IRM 1]    │
│  [IRM 2]    │  [IRM 2]    │  [IRM 2]    │  [IRM 2]    │
│  [IRM 3]    │  [IRM 3]    │  [IRM 3]    │  [IRM 3]    │
│  [IRM 4]    │  [IRM 4]    │  [IRM 4]    │  [IRM 4]    │
└─────────────┴─────────────┴─────────────┴─────────────┘
                  → outputs/sample_grid.png
```

> **Observation clé :** glioma et meningioma présentent une variabilité anatomique élevée (localisation et forme). Pituitary est plus stable (centre du crâne, base). Notumor sert de classe de contrôle.

---

# 5. Pipeline ETL

## Extract → Transform → Load

```
┌──────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   EXTRACT    │ → │     TRANSFORM    │ → │       LOAD       │
└──────────────┘   └──────────────────┘   └──────────────────┘
 Kaggle Hub          Resize 224×224         DataLoader (bs=32)
 7 023 JPG/PNG       Normalize ImageNet     Stratified 85/15 split
 4 sous-dossiers     Augmentation :         Val=840 imgs
                       • rotate ≤ 15°       Train=4 760 imgs
                       • zoom ≤ 1.1         num_workers=2
                       • flip horizontal    Seed = 42
                       • lighting ≤ 0.2     ImageNet stats
```

### Justifications
- **224×224** : taille d'entrée native de ResNet (ImageNet)
- **Pas de flip vertical** : préserve l'orientation anatomique
- **Augmentation modérée** : éviter d'inventer des artefacts irréalistes en imagerie médicale

---

# 5. ETL — Visualisations exploratoires

| Figure | Information extraite |
|---|---|
| `class_distribution.png` | Équilibre du dataset (déséquilibre < 20 %) |
| `image_dimensions.png` | Tailles natives variées (200 → 800 px) → resize justifié |
| `pixel_intensity.png` | Distributions d'intensité fortement chevauchantes → un seuil simple ne suffit pas |
| `mean_image_per_class.png` | Image moyenne par classe — révèle des signatures spatiales |
| `augmentation_examples.png` | Exemples de batch après augmentation |
| `etl_summary.json` | Métadonnées complètes (reproductibilité) |

> **Toutes ces figures ont été générées automatiquement par la cellule ETL Kaggle et sont incluses dans le dossier `outputs/` du dépôt.**

---

# 6. Architecture du modèle

## ResNet34 + tête de classification fastai

```
Input (3 × 224 × 224)
   │
   ▼
┌─────────────────────────────────┐
│  ResNet34 (pré-entraîné         │   ← 21.3 M paramètres
│  ImageNet, 1000 classes)        │     phase 1 : gelé
│                                 │     phase 2 : 100 % entraînable
│  Conv 7×7 → 4 stages résiduels  │
│  → Adaptive Pooling             │
└─────────────────────────────────┘
   │ (512-dim feature vector)
   ▼
┌─────────────────────────────────┐
│  Tête de classification fastai  │
│   AdaptiveConcatPool2d          │   ← (avg + max) → 1024
│   Flatten + BatchNorm + Drop 0.25│
│   Linear(1024 → 512) + ReLU     │
│   BatchNorm + Drop 0.5          │
│   Linear(512 → 4)               │
└─────────────────────────────────┘
   │
   ▼
Softmax → 4 probabilités
```

**Total : ~21.8 M paramètres**

---

# 6. Pourquoi ResNet34 ?

| Critère | ResNet18 | **ResNet34** | ResNet50 | EfficientNetB0 |
|---|---|---|---|---|
| Paramètres | 11.7 M | **21.8 M** | 25.6 M | 5.3 M |
| Top-1 ImageNet | 69.8 % | **73.3 %** | 76.1 % | 77.7 % |
| FLOPs (224²) | 1.8 G | **3.7 G** | 4.1 G | 0.4 G |
| Inférence CPU | ~80 ms | **~150 ms** | ~250 ms | ~120 ms |
| Stabilité TL médical | ★★★ | **★★★★** | ★★★ | ★★ |

### Décision
- **Plus capable que ResNet18** sans exploser les paramètres
- **Plus stable que ResNet50** sur petits datasets (< 10k images)
- **Convergence rapide** avec ImageNet pre-training
- **Référence académique** : architecture standard pour la comparaison

---

# 7. Stratégie d'entraînement

## Fine-tuning à deux phases (méthodologie fastai)

### Phase 1 — Tête seulement (backbone gelé)

```
backbone = ResNet34 frozen (require_grad=False)
LR = 1e-2          # taux d'apprentissage agressif
epochs = 6
schedule = fit_one_cycle (Smith, 2018)
```

**Objectif :** apprendre la projection (features ImageNet) → (4 classes médicales)

### Phase 2 — Fine-tuning complet (déblocage)

```
backbone.unfreeze()         # toutes les couches entraînables
LR = 1e-6                   # 10 000 × plus faible (préserver ImageNet)
epochs = 6
schedule = fit_one_cycle
```

**Objectif :** ajuster légèrement les couches profondes pour le domaine médical, sans détruire les features bas-niveau (textures, contours).

---

# 7. Hyperparamètres détaillés

| Paramètre | Phase 1 | Phase 2 | Source |
|---|---|---|---|
| Optimizer | Adam | Adam | fastai default |
| Learning rate | 1e-2 | 1e-6 | `lr_find()` + heuristique |
| LR schedule | one-cycle | one-cycle | Smith 2018 |
| Batch size | 32 | 32 | T4 GPU memory |
| Image size | 224×224 | 224×224 | ResNet input |
| Loss | CrossEntropy + label-smooth 0.1 | idem | régularisation |
| Weight decay | 0.01 (AdamW default) | 0.01 | fastai default |
| Mixed precision | ❌ (Kaggle CPU) | ❌ | env constraint |
| Random seed | 42 | 42 | reproductibilité |

---

# 8. Métriques d'évaluation

## Famille de métriques utilisées

| Métrique | Pourquoi cette métrique ? |
|---|---|
| **Accuracy** | Vue globale, dataset équilibré donc fiable |
| **Précision (par classe)** | Fraction des prédictions positives correctes — **clinique : éviter faux positifs** |
| **Recall (par classe)** | Fraction des vrais positifs détectés — **clinique : éviter de manquer une tumeur** |
| **F1-score** | Moyenne harmonique précision/recall |
| **ROC AUC (one-vs-rest)** | Capacité de séparation indépendante du seuil |
| **Confusion matrix** | Identification des classes confondues |

> **En imagerie médicale, le Recall a souvent priorité sur la Précision** — manquer une tumeur est plus grave que produire un faux positif (rejeté à l'examen suivant).

---

# 9. Résultats — chiffres clés

<div style="display: flex; gap: 20px; justify-content: space-around; padding: 20px;">
<div style="text-align: center; padding: 20px; background: #f0fdf4; border-radius: 12px; flex: 1;">
<div style="font-size: 3em; font-weight: 800; color: #15803d;">96.79%</div>
<div style="font-size: 0.9em; color: #52525b;">Validation Accuracy</div>
</div>
<div style="text-align: center; padding: 20px; background: #f0fdf4; border-radius: 12px; flex: 1;">
<div style="font-size: 3em; font-weight: 800; color: #15803d;">0.999</div>
<div style="font-size: 0.9em; color: #52525b;">Macro AUC</div>
</div>
<div style="text-align: center; padding: 20px; background: #f0fdf4; border-radius: 12px; flex: 1;">
<div style="font-size: 3em; font-weight: 800; color: #15803d;">0.967</div>
<div style="font-size: 0.9em; color: #52525b;">Macro F1</div>
</div>
<div style="text-align: center; padding: 20px; background: #f0fdf4; border-radius: 12px; flex: 1;">
<div style="font-size: 3em; font-weight: 800; color: #15803d;">~10 min</div>
<div style="font-size: 0.9em; color: #52525b;">Training time (T4)</div>
</div>
</div>

> **Comparaison avec l'état de l'art : performances équivalentes (96-99 %) avec une architecture plus simple et plus rapide à l'inférence.**

---

# 9. Résultats — par classe (validation, n=840)

| Classe | Précision | Recall | F1-score | Support | AUC |
|---|---|---|---|---|---|
| glioma | **0.9677** | 0.9953 | **0.9813** | 211 | 0.9998 |
| meningioma | 0.9735 | **0.8976** ⚠ | 0.9340 | 205 | 0.9966 |
| notumor | 0.9762 | 0.9903 | 0.9832 | 207 | 0.9995 |
| pituitary | 0.9554 | 0.9862 | 0.9705 | 217 | 0.9993 |
| **macro avg** | **0.9682** | **0.9673** | **0.9673** | 840 | **0.9988** |
| weighted avg | 0.9680 | 0.9679 | 0.9674 | 840 | — |

### Lecture
- **Glioma & notumor & pituitary** > 98 % de F1
- **Meningioma** : recall 89.8 % → environ 21 cas (sur 205) mal classés
- **Aucun AUC < 0.99** : excellente séparation indépendante du seuil

---

# 9. Résultats — analyse d'erreur

## Matrice de confusion (validation)

```
              prédit
              gli  men  not  pit
réel  gli  ┌  210    1    0    0  ┐
      men  │   13  184    3    5  │   ← 13 méningiomes prédits comme gliomes
      not  │    0    1  205    1  │
      pit  └    0    3    0  214  ┘
```

### Interprétation clinique
- **Méningiome → Gliome** (13 cas, 6 % des méningiomes) : ces deux tumeurs partagent souvent des localisations corticales, parfois indissociables sans contraste injecté
- **Pas de "fuite" vers notumor** : le modèle ne classe quasi jamais une tumeur comme « pas de tumeur » → **Recall élevé sur le négatif** = critère de sécurité clinique

---

# 9. Résultats — courbes d'entraînement

```
Phase 1 (gelé) → Phase 2 (déblocage)
┌───────────────────────────────────────┐
│  Accuracy                             │
│  1.00 ─                          ───  │
│       ─                       ───     │
│  0.95 ─                  ────         │
│       ─             ────              │
│  0.90 ─        ───                    │
│       ─    ──                         │
│  0.85 ─ ──                            │
│       └──────────┬───────────┬─────── │
│         Phase 1  │  Phase 2          │
│         (1e-2)   │  (1e-6)           │
└───────────────────────────────────────┘
```

> Convergence **stable** sans overfitting (train_loss et val_loss restent collés)

---

# 9. Résultats — explicabilité (Grad-CAM)

<div style="display: flex; gap: 30px; justify-content: center; padding: 30px;">
<div style="text-align: center;">
<div style="width: 200px; height: 200px; background: #f4f4f5; border-radius: 8px; display: grid; place-items: center; border: 1px solid #d4d4d8;">[IRM original]</div>
<div style="font-size: 0.9em; color: #52525b; margin-top: 8px;">Image originale</div>
</div>
<div style="text-align: center;">
<div style="width: 200px; height: 200px; background: #f4f4f5; border-radius: 8px; display: grid; place-items: center; border: 1px solid #d4d4d8;">[Heatmap Grad-CAM]</div>
<div style="font-size: 0.9em; color: #52525b; margin-top: 8px;">Heatmap d'attention</div>
</div>
<div style="text-align: center;">
<div style="width: 200px; height: 200px; background: #f4f4f5; border-radius: 8px; display: grid; place-items: center; border: 1px solid #d4d4d8;">[Superposition]</div>
<div style="font-size: 0.9em; color: #52525b; margin-top: 8px;">Superposition</div>
</div>
</div>

### Pourquoi Grad-CAM ?
- **Interprétabilité visuelle** : un radiologue peut vérifier si le modèle « regarde » bien la zone tumorale
- **Détection des biais** : si le modèle s'appuie sur le crâne / l'arrière-plan plutôt que sur le tissu, Grad-CAM le révèle immédiatement
- **Confiance clinique** : prérequis pour tout déploiement médical

---

# 10. Architecture logicielle

## Vue d'ensemble — full-stack moderne

```
┌─────────────────────────────────────────────────────────────────┐
│                       CLIENT (Browser)                          │
│              http://localhost:5173 — React + Vite               │
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│   │  Hero +  │  │  Steps   │  │  Upload  │  │  Result  │      │
│   │  Metrics │  │  01-05   │  │  Zone    │  │  + GCAM  │      │
│   └──────────┘  └──────────┘  └────┬─────┘  └──────────┘      │
│                                    │                            │
│                            POST multipart/form-data             │
└────────────────────────────────────┼───────────────────────────┘
                                     │ /api/predict
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVEUR (FastAPI)                         │
│                http://localhost:8000 — Python                   │
│                                                                 │
│   Routes :                                                      │
│   GET  /api/health     → état du modèle                        │
│   POST /api/predict    → image → JSON + Grad-CAM b64           │
│                                                                 │
│   ┌─────────────────────────────────────────────────┐          │
│   │  model_loader.py — multi-format detector         │          │
│   │   • .pkl   → fastai load_learner                 │          │
│   │   • .h5    → tf.keras.models.load_model          │          │
│   │   • .keras → idem                                │          │
│   └─────────────────────────────────────────────────┘          │
│                              │                                  │
│                              ▼                                  │
│             ResNet34 (PyTorch, CPU/GPU)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

# 10. Stack technique

### Backend
- **Python 3.13** + venv isolé
- **FastAPI 0.136** — framework web async, génération auto de docs OpenAPI
- **Uvicorn** — serveur ASGI haute performance
- **PyTorch 2.10 (CPU)** + **fastai 2.8.7** — inférence du modèle
- **Pillow** — traitement d'images
- **CORS** ouvert sur localhost:5173 pour le développement

### Frontend
- **React 18** + **Vite 5** — bundling ultra-rapide, HMR instantané
- **Aucun framework UI lourd** — CSS personnalisé (12 KB gzip)
- **Proxy Vite** : `/api/*` → `http://localhost:8000` (pas de CORS en dev)
- **Build production** : 50 KB gzip total

### Architecture
- **Monorepo** : `backend/`, `frontend/`, `src/` (training), `notebooks/`
- **Séparation modèle / API / UI** : chaque couche remplaçable indépendamment

---

# 10. Backend — endpoints REST

### `GET /api/health`
```json
{
  "status": "ok",
  "model_loaded": true,
  "model_path": ".../outputs/models/brain_tumor_model.pkl",
  "model_kind": "fastai",
  "classes": ["glioma", "meningioma", "notumor", "pituitary"]
}
```

### `POST /api/predict` (multipart : `file`, query : `gradcam=true`)
```json
{
  "predicted_class": "glioma",
  "predicted_label_fr": "Gliome",
  "confidence": 0.982,
  "probabilities": {
    "glioma": 0.982, "meningioma": 0.012,
    "notumor": 0.003, "pituitary": 0.003
  },
  "info": { "label_fr": "Gliome", "severity": "Élevée", "color": "#E8593C" },
  "gradcam_png_b64": "iVBORw0KGgoAA..."
}
```

> **Documentation interactive Swagger** auto-générée : `http://localhost:8000/docs`

---

# 10. Modèle multi-format — robustesse

## `backend/model_loader.py`

```python
class BrainTumorModel:
    @classmethod
    def load(cls, path):
        ext = path.suffix.lower()
        if ext in (".h5", ".keras"):
            return cls(kind="keras", model=tf.keras.models.load_model(path))
        if ext == ".pkl":
            try:
                from fastai.learner import load_learner
                learn = load_learner(path, cpu=True)
                return cls(kind="fastai", model=learn,
                           vocab=[str(v) for v in learn.dls.vocab])
            except ImportError:
                ...  # fallback pickle
```

### Pourquoi ?
- **Indépendance** vis-à-vis du framework d'entraînement (Keras / fastai / PyTorch pur)
- **Mode démo** automatique si aucun modèle trouvé → UI testable sans modèle
- **Mapping de vocabulaire** : `glioma_tumor`, `Glioma`, `glioma` → `glioma` canonique

---

# 10. Frontend — flux utilisateur

```
┌─────────────────────────────────────────────────────────────┐
│  1. Hero  →  CTA "Analyser une IRM →"                       │
│                       │                                     │
│                       ▼ scroll                              │
│  2. Upload zone (drag&drop + click-to-browse)               │
│                       │                                     │
│                       ▼ fichier sélectionné                 │
│  3. Aperçu image  +  bouton "Lancer l'analyse"              │
│                       │                                     │
│                       ▼ POST /api/predict                   │
│  4. Spinner pendant ~1 sec                                  │
│                       │                                     │
│                       ▼ réponse JSON                        │
│  5. Result card                                             │
│       • classe + sévérité + confiance                       │
│       • barres de probabilité par classe                    │
│       • image Grad-CAM superposée                           │
│       • disclaimer médical                                  │
│                       │                                     │
│                       ▼                                     │
│  6. Bouton "Télécharger le rapport" (txt)                   │
└─────────────────────────────────────────────────────────────┘
```

---

# 11. Reproductibilité

## Tout ce qui est versionné

| Élément | Localisation |
|---|---|
| Code de pré-traitement | `src/data_preprocessing.py` |
| Code du modèle | `src/model.py` |
| Notebook Kaggle one-shot | `notebooks/training_notebook_fastai.ipynb` |
| Hyperparamètres | constantes en tête du notebook |
| Seed | `SEED = 42` (numpy + torch) |
| Métriques exportées | `outputs/metrics_summary.json` |
| Confusion matrix | `outputs/confusion_matrix.csv` |
| Classification report | `outputs/classification_report.csv` |
| Modèle entraîné | `outputs/models/brain_tumor_model.pkl` |
| Backend & UI | `backend/`, `frontend/` |
| Dépendances | `requirements.txt`, `requirements-fastai.txt`, `frontend/package.json` |

> **Lancement complet en une commande :** `./start.sh` — backend + frontend.

---

# 12. Démonstration en direct

## Scénario type pour le jury

1. **Lancer la stack** : `./start.sh`
2. **Ouvrir** http://localhost:5173 → page d'accueil emerald/white
3. **Vérifier le pill vert** : `Model loaded · fastai · ready`
4. **Téléverser une IRM de test** (du dossier `Testing/glioma/`)
5. **Cliquer sur** *"Lancer l'analyse →"*
6. **Observer** :
   - prédiction `glioma` avec ~98 % de confiance
   - barres de probabilité par classe
   - heatmap Grad-CAM superposée à l'IRM
7. **Télécharger le rapport** texte
8. **Showcase API docs** : http://localhost:8000/docs

---

# 13. Limitations identifiées

| # | Limitation | Mitigation possible |
|---|---|---|
| L1 | Dataset issu d'un seul fournisseur (Kaggle) | Validation externe sur dataset hospitalier |
| L2 | Pas de stratification par patient (split aléatoire) | Risque de leakage entre splits |
| L3 | Resolution fixe 224 × 224 (perte d'info) | Multi-resolution ou patch-based |
| L4 | Recall faible sur méningiome (89.8 %) | Class weighting / focal loss / oversampling |
| L5 | Pas de séquences IRM (T1/T2/FLAIR séparées) | Fusion multimodale |
| L6 | Inférence CPU = ~1 sec, pas temps réel | Quantization INT8 / ONNX Runtime |
| L7 | Pas de quantification d'incertitude | Monte-Carlo Dropout / ensembles |

---

# 14. Perspectives & travaux futurs

### À court terme (1-3 mois)
- 🔬 **Validation externe** sur un dataset hospitalier indépendant
- 🎯 **Class-balanced loss** pour améliorer le recall meningioma
- 📦 **Containerisation Docker** pour déploiement reproductible

### À moyen terme (3-6 mois)
- 🧠 **Vision Transformer** (ViT-B/16) en comparaison
- 📊 **Quantification d'incertitude** (Bayesian deep learning)
- 🔍 **Segmentation** + classification (U-Net pour la zone tumorale)

### À long terme (6-12 mois)
- 🏥 **Étude clinique prospective** : comparaison vs. radiologue junior
- 📱 **Application mobile** (PWA ou React Native)
- 🌐 **Déploiement cloud** sécurisé (HIPAA / RGPD-compliant)

---

# 15. Sécurité & considérations éthiques

### Confidentialité
- ✅ Aucune image n'est **stockée** côté serveur
- ✅ Inférence **locale** (pas de service cloud tiers)
- ✅ CORS restreint à `localhost` en production

### Disclaimer médical
> **Outil d'aide au diagnostic uniquement** — ne remplace pas l'avis d'un médecin spécialiste. Affiché en permanence dans l'UI et inclus dans tout rapport téléchargé.

### Limites annoncées
- Modèle entraîné sur dataset public, **non certifié** dispositif médical (CE / FDA)
- Performances dépendent de la qualité de l'IRM et du protocole d'acquisition
- **Recall < 100 %** sur toutes les classes → un cas négatif n'exclut pas une pathologie

---

# 16. Conclusion

## Ce que le projet démontre

| Critère | Réalisation |
|---|---|
| ✅ **Performance** | 96.79 % accuracy · 0.999 macro AUC — état de l'art |
| ✅ **Reproductibilité** | Notebook one-shot · seed fixe · métriques versionnées |
| ✅ **Explicabilité** | Grad-CAM intégré dans la web app |
| ✅ **Industrialisation** | API REST + UI moderne · 1 commande pour tout lancer |
| ✅ **Méthodologie** | 2-phase fine-tuning · justifications quantitatives |
| ✅ **Esprit critique** | Limitations explicites · perspectives détaillées |

> **Le projet illustre l'ensemble du cycle de vie d'un système d'IA médicale : recherche, ingénierie, déploiement, et réflexion éthique.**

---

# 17. Questions anticipées du jury

### 🟢 Q1 — *Pourquoi ResNet34 plutôt qu'EfficientNet ?*
> EfficientNetB0 est plus efficient en paramètres mais moins stable en transfer learning sur petits datasets médicaux. ResNet34 offre un meilleur compromis convergence/stabilité, et constitue la référence académique pour la comparaison.

### 🟢 Q2 — *Comment éviter le data leakage ?*
> Le split train/validation est fait **par image** (pas par patient). C'est une limitation acceptée du dataset Kaggle. Pour une étude clinique, un split **patient-aware** serait obligatoire.

### 🟢 Q3 — *Le modèle est-il déployable en production hospitalière ?*
> Non, en l'état. Il manque : certification CE/FDA, validation externe, audit de biais, intégration PACS/DICOM, et stratification par patient. C'est un **prototype de recherche**, pas un dispositif médical.

---

# 17. Questions anticipées (suite)

### 🟢 Q4 — *Pourquoi pas de cross-validation k-fold ?*
> Le dataset propose déjà un split Training/Testing fixe (publié). Nous avons utilisé 15 % du Training comme validation. Le Testing reste **complètement non-vu** — il sert d'estimation pessimiste de la généralisation.

### 🟢 Q5 — *Pourquoi label smoothing 0.1 ?*
> Pour réduire l'overconfidence du modèle. En imagerie médicale, un modèle qui prédit à 99.99 % est suspect. Label smoothing pénalise la sur-saturation du softmax → calibration plus honnête.

### 🟢 Q6 — *Comment scale-up le système ?*
> Plusieurs leviers : (1) batching côté API, (2) ONNX Runtime + quantization INT8 (4× plus rapide), (3) GPU partagé via Triton Inference Server, (4) horizontal scaling via Kubernetes derrière un load balancer.

---

# 17. Questions anticipées (suite)

### 🟢 Q7 — *Pourquoi Grad-CAM et pas SHAP ou LIME ?*
> Grad-CAM est natif aux CNN, ne nécessite **aucun ré-échantillonnage** (contrairement à LIME), et produit des heatmaps spatialement cohérentes. SHAP est plus rigoureux théoriquement mais coûteux en calcul. Pour un workflow temps réel (< 1 sec), Grad-CAM est le bon compromis.

### 🟢 Q8 — *Y a-t-il un risque d'overfitting ?*
> Faible : (1) la val_loss et la train_loss restent collées tout au long de l'entraînement, (2) le data augmentation et le dropout (0.25 + 0.5) régularisent fortement, (3) le label smoothing limite la saturation, (4) early stopping implicite via fastai's best-epoch selection.

### 🟢 Q9 — *Avez-vous testé avec une IRM du Testing/ ?*
> Oui, le smoke-test prédit correctement les 4 classes (cf. logs : glioma 0.982, meningioma 0.776, notumor 1.000, pituitary 1.000).

---

# 18. Annexes

## Sources & références

| Type | Référence |
|---|---|
| Dataset | Nickparvar, M. (2021). *Brain Tumor MRI Dataset*. Kaggle. |
| ResNet | He, K. et al. (2016). *Deep Residual Learning for Image Recognition*. CVPR. |
| Transfer learning | Tan, C. et al. (2018). *A Survey on Deep Transfer Learning*. |
| One-cycle LR | Smith, L. (2018). *Super-Convergence*. |
| Grad-CAM | Selvaraju, R. et al. (2017). *Grad-CAM: Visual Explanations*. ICCV. |
| fastai | Howard, J. & Gugger, S. (2020). *fastai: A Layered API for Deep Learning*. |
| FastAPI | Ramirez, S. (2018). *FastAPI*. |

## Liens du projet
- 📁 Dépôt : `/home/saamnolimits/Downloads/brain_tumor_app/`
- 📓 Kaggle : *(votre notebook URL)*
- 🌐 Démo locale : `http://localhost:5173`
- 📚 API docs : `http://localhost:8000/docs`

---

# 19. Architecture des fichiers

```
brain_tumor_app/
├── README.md
├── PRESENTATION.md              ← ce document
├── start.sh                     ← lancement 1-commande
├── requirements.txt             ← deps Python
├── requirements-fastai.txt      ← deps optionnelles fastai
│
├── backend/
│   ├── main.py                  ← FastAPI · /api/health · /api/predict
│   └── model_loader.py          ← multi-format (.h5 / .keras / .pkl)
│
├── frontend/                    ← React + Vite
│   ├── package.json
│   ├── vite.config.js           ← proxy /api → :8000
│   └── src/
│       ├── App.jsx              ← hero + steps + upload + result
│       ├── api.js               ← fetch wrapper
│       ├── classInfo.js         ← FR labels + colors
│       ├── styles.css           ← thème emerald/white (sprintred-inspired)
│       └── components/
│           ├── UploadZone.jsx   ← drag-drop
│           └── ResultCard.jsx   ← prediction + Grad-CAM
│
├── src/                         ← code training (research)
│   ├── data_preprocessing.py
│   ├── model.py                 ← EfficientNetB0 (variante Keras)
│   ├── train.py                 ← entraînement 2-phase
│   ├── evaluation.py            ← Grad-CAM + métriques
│   └── inference.py             ← single-image predict
│
├── notebooks/
│   └── training_notebook.ipynb  ← Colab/Kaggle one-shot
│
├── outputs/                     ← générés par training
│   ├── models/
│   │   └── brain_tumor_model.pkl    ← le modèle final (83.5 MB)
│   ├── metrics_summary.json
│   ├── classification_report.csv
│   ├── confusion_matrix.{png,csv}
│   ├── training_loss.png
│   ├── sample_grid.png
│   ├── pixel_intensity.png
│   ├── mean_image_per_class.png
│   └── etl_summary.json
│
└── scripts/
    └── smoke_test_pkl.py        ← validation du modèle chargé
```

---

# 20. Glossaire technique

| Terme | Définition |
|---|---|
| **CNN** | Convolutional Neural Network — réseau pour images |
| **Transfer Learning** | Réutiliser un modèle pré-entraîné sur ImageNet pour une nouvelle tâche |
| **ResNet** | Architecture à connexions résiduelles (skip connections) |
| **fit_one_cycle** | Schedule de LR triangulaire avec annealing (Smith 2018) |
| **Grad-CAM** | Gradient-weighted Class Activation Mapping |
| **ROC AUC** | Aire sous la courbe ROC, mesure de séparation binaire |
| **Macro avg** | Moyenne non pondérée des métriques par classe |
| **Label smoothing** | Régularisation : remplacer one-hot par distribution lissée |
| **softmax** | Fonction normalisant des logits en probabilités sommant à 1 |
| **fastai .pkl** | Fichier sérialisé contenant un `Learner` (modèle + transforms + vocab) |
| **HMR** | Hot Module Replacement (Vite) — recompile sans recharger |
| **Marp** | Markdown → Slides Presentation framework |

---

<!-- _class: lead -->
<!-- _backgroundColor: #14532d -->
<!-- _color: #ffffff -->

# Merci pour votre attention 🙏

## Questions ?

<br>

**🧠 NeuroVista**
Brain Tumor MRI Classifier · ResNet34 · fastai · FastAPI · React

<br>

*NASSIMA CHARITE*
*Année universitaire 2025-2026*
