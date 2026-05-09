#!/bin/bash
# ─── Script de configuration du projet Brain Tumor MRI ─────────────────────
# Usage : bash setup.sh

set -e
echo "======================================"
echo "  Brain Tumor MRI Classifier — Setup  "
echo "======================================"

# 1. Création des dossiers
echo ""
echo "→ Création de la structure de dossiers..."
mkdir -p data outputs/models outputs/logs notebooks

# 2. Installation des dépendances
echo ""
echo "→ Installation des dépendances Python..."
pip install -r requirements.txt --quiet

# 3. Vérification Kaggle API
echo ""
echo "→ Vérification de l'API Kaggle..."
if [ ! -f "$HOME/.kaggle/kaggle.json" ]; then
    echo ""
    echo "  ⚠️  Fichier ~/.kaggle/kaggle.json non trouvé."
    echo "  Instructions :"
    echo "  1. Allez sur https://www.kaggle.com → votre compte → API"
    echo "  2. Cliquez sur 'Create New API Token'"
    echo "  3. Copiez le fichier kaggle.json dans ~/.kaggle/"
    echo "  4. Relancez ce script"
    echo ""
    exit 1
fi

chmod 600 "$HOME/.kaggle/kaggle.json"
echo "  ✓ Kaggle API configurée"

# 4. Téléchargement du dataset
echo ""
echo "→ Téléchargement du dataset Kaggle..."
if [ -d "data/Training" ]; then
    echo "  Dataset déjà présent, skip."
else
    kaggle datasets download masoudnickparvar/brain-tumor-mri-dataset -p .
    unzip -q brain-tumor-mri-dataset.zip -d data/
    rm brain-tumor-mri-dataset.zip
    echo "  ✓ Dataset téléchargé dans data/"
fi

# 5. Afficher le résumé
echo ""
echo "======================================"
echo "  Setup terminé avec succès !         "
echo "======================================"
echo ""
echo "Étapes suivantes :"
echo "  1. Entraîner le modèle :"
echo "     python src/train.py --data_dir data/ --explore"
echo ""
echo "  2. Lancer l'application :"
echo "     streamlit run app.py"
echo ""
echo "  3. Ou utiliser le notebook Google Colab :"
echo "     notebooks/training_notebook.ipynb"
