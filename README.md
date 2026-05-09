# 🧠 Brain Tumor MRI Classifier

Classification automatique de tumeurs cérébrales par IRM grâce au Deep Learning (EfficientNetB0 + Transfer Learning).

Trois interfaces disponibles :
- **Web app moderne** (FastAPI + React/Vite) — recommandée
- Application Streamlit (`app.py`)
- Notebook Jupyter / Google Colab

## 📋 Classes détectées

| Classe | Description | Sévérité |
|--------|-------------|----------|
| `glioma` | Tumeur gliale du cerveau | 🔴 Élevée |
| `meningioma` | Tumeur des méninges | 🟡 Modérée |
| `notumor` | Pas de tumeur détectée | 🟢 Normale |
| `pituitary` | Tumeur de la glande pituitaire | 🔵 Modérée |

## 🗂️ Structure du projet

```
brain_tumor_app/
├── app.py                          # Application Streamlit
├── requirements.txt                # Dépendances Python
├── README.md
├── src/
│   ├── data_preprocessing.py       # Chargement et prétraitement des IRM
│   ├── model.py                    # Architecture EfficientNetB0
│   ├── train.py                    # Script d'entraînement (2 phases)
│   ├── evaluation.py               # Métriques + Grad-CAM
│   └── inference.py                # Prédiction sur image unique
├── notebooks/
│   └── training_notebook.ipynb    # Notebook complet (Google Colab)
├── start.sh                       # Démarre backend + frontend (Ctrl-C pour stop)
├── requirements-fastai.txt        # Optionnel — pour les .pkl fastai
├── backend/
│   ├── main.py                    # API FastAPI (POST /api/predict, /api/health)
│   └── model_loader.py            # Loader multi-format (.h5 / .keras / .pkl)
├── frontend/                      # React + Vite (web app)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       ├── classInfo.js
│       ├── styles.css
│       └── components/
│           ├── UploadZone.jsx
│           └── ResultCard.jsx
└── outputs/                        # Généré automatiquement
    ├── models/
    │   ├── brain_tumor_model.h5   # Modèle final
    │   └── model_info.json
    ├── training_curves.png
    ├── confusion_matrix.png
    ├── roc_curves.png
    └── distribution.png
```

## ⚡ Installation rapide

### 1. Cloner et installer les dépendances

```bash
cd brain_tumor_app
pip install -r requirements.txt
```

### 2. Télécharger le dataset Kaggle

```bash
# Configurer l'API Kaggle (copier kaggle.json dans ~/.kaggle/)
kaggle datasets download masoudnickparvar/brain-tumor-mri-dataset
unzip brain-tumor-mri-dataset.zip -d data/
```

Structure attendue :
```
data/
  Training/
    glioma/        (1321 images)
    meningioma/    (1339 images)
    notumor/       (1595 images)
    pituitary/     (1457 images)
  Testing/
    glioma/        (300 images)
    meningioma/    (306 images)
    notumor/       (405 images)
    pituitary/     (300 images)
```

### 3. Entraîner le modèle

```bash
python src/train.py --data_dir data/ --explore --epochs_phase1 20 --epochs_phase2 15
```

Options disponibles :
```
--data_dir        Dossier du dataset (requis)
--output_dir      Dossier de sortie (défaut: outputs/)
--epochs_phase1   Epochs phase 1 - base gelée (défaut: 20)
--epochs_phase2   Epochs phase 2 - fine-tuning (défaut: 15)
--batch_size      Taille des batches (défaut: 32)
--explore         Afficher l'exploration des données
```

### 4. Lancer l'application

#### Option A — Web app FastAPI + React (recommandée)

**Démarrage en une commande :**
```bash
./start.sh
```
Lance le backend sur `:8000` et le frontend sur `:5173`. Ctrl-C arrête les deux.

**Ou en deux terminaux :**

Backend (terminal 1) :
```bash
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

Frontend (terminal 2) :
```bash
cd frontend
npm install
npm run dev
```

Ouvrir : http://localhost:5173 · API docs : http://localhost:8000/docs

#### Format de modèle accepté

Déposer un fichier dans `outputs/models/` — l'API détecte automatiquement :
| Extension | Type | Dépendance |
|-----------|------|------------|
| `.h5`, `.keras` | Keras / TensorFlow | `tensorflow` (déjà dans requirements.txt) |
| `.pkl` (fastai) | fastai `Learner` | `pip install -r requirements-fastai.txt` |
| `.pkl` (pickled Keras) | Modèle Keras pickled | `tensorflow` |

L'ordre de priorité des noms : `brain_tumor_model.{h5,keras,pkl}`,
`export.pkl`, `model.pkl`, `best_model.h5`. Vous pouvez aussi forcer un chemin
avec la variable d'environnement `BRAIN_TUMOR_MODEL_PATH`.

> Si aucun modèle n'est trouvé, l'API démarre en **mode démo** (probabilités
> aléatoires) afin que l'interface reste testable sans entraînement.

> Grad-CAM n'est disponible que pour les modèles Keras (les `.pkl` fastai
> retournent simplement `gradcam_png_b64: null`).

#### Option B — Streamlit
```bash
streamlit run app.py
```
Ouvrir : http://localhost:8501

## 🚀 Google Colab (recommandé)

Ouvrir `notebooks/training_notebook.ipynb` dans Google Colab pour bénéficier d'un GPU gratuit.

## 🧬 Architecture du modèle

```
Input (224×224×3)
    ↓
EfficientNetB0 (pré-entraîné ImageNet)
    ↓ Phase 1: base gelée
    ↓ Phase 2: 20 dernières couches dégelées
GlobalAveragePooling2D
BatchNormalization
Dense(256, relu, L2)  →  Dropout(0.4)
Dense(128, relu, L2)  →  Dropout(0.3)
Dense(4, softmax)
```

**Stratégie d'entraînement :**
- Phase 1 : LR = 1e-3, base gelée → ~15-20 epochs
- Phase 2 : LR = 1e-5, fine-tuning des 20 dernières couches → ~10-15 epochs

## 📊 Performances attendues

| Métrique | Valeur attendue |
|----------|----------------|
| Accuracy (test) | ~95-97% |
| AUC moyen | ~0.99 |
| F1-score moyen | ~0.95 |

## 🔍 Fonctionnalités de l'application

- ✅ Upload d'IRM (JPG, PNG)
- ✅ Prédiction avec score de confiance
- ✅ Graphique des probabilités par classe (Plotly)
- ✅ Visualisation Grad-CAM (régions d'attention)
- ✅ Seuil de confiance configurable
- ✅ Rapport téléchargeable
- ✅ Avertissement médical

## ⚕️ Avertissement

Ce projet est un **outil éducatif et de recherche**. Il ne constitue pas un dispositif médical certifié. Ne pas utiliser pour des diagnostics médicaux réels sans validation clinique par un médecin spécialiste.
