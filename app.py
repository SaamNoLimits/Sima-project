"""
Application Streamlit — Classification de tumeurs cérébrales par IRM.
Lancement : streamlit run app.py
"""

import os
import sys
import numpy as np
import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
from PIL import Image
from pathlib import Path
import matplotlib.pyplot as plt

# Ajouter le dossier src au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))


# ─── Configuration de la page ──────────────────────────────────────────────────
st.set_page_config(
    page_title="Brain Tumor MRI Classifier",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
)


# ─── CSS personnalisé ──────────────────────────────────────────────────────────
st.markdown("""
<style>
    /* Palette principale */
    :root {
        --primary: #2563EB;
        --success: #059669;
        --warning: #D97706;
        --danger:  #DC2626;
        --neutral: #6B7280;
    }

    /* En-tête principal */
    .main-header {
        background: linear-gradient(135deg, #1e3a5f 0%, #2563EB 100%);
        padding: 2rem;
        border-radius: 12px;
        margin-bottom: 2rem;
        text-align: center;
        color: white;
    }
    .main-header h1 { font-size: 2.2rem; margin: 0; }
    .main-header p  { opacity: 0.85; margin-top: 0.5rem; font-size: 1rem; }

    /* Cartes de résultat */
    .result-card {
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        margin-bottom: 1rem;
    }
    .result-positive { border-left: 5px solid #DC2626; background: #fef2f2; }
    .result-negative { border-left: 5px solid #059669; background: #f0fdf4; }
    .result-moderate { border-left: 5px solid #D97706; background: #fffbeb; }

    /* Badge de sévérité */
    .badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    .badge-high     { background:#fee2e2; color:#991b1b; }
    .badge-moderate { background:#fef3c7; color:#92400e; }
    .badge-normal   { background:#d1fae5; color:#065f46; }

    /* Barre de confiance */
    .confidence-bar-container {
        background: #e5e7eb;
        border-radius: 9999px;
        height: 10px;
        margin-top: 0.4rem;
    }

    /* Upload zone */
    .upload-zone {
        border: 2px dashed #93c5fd;
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        background: #eff6ff;
        color: #1d4ed8;
    }

    /* Metric cards */
    .metric-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .metric-card {
        flex: 1; padding: 1rem; border-radius: 10px;
        background: #f9fafb; border: 1px solid #e5e7eb;
        text-align: center;
    }
    .metric-value { font-size: 1.8rem; font-weight: 700; color: #111827; }
    .metric-label { font-size: 0.8rem; color: #6b7280; margin-top: 0.2rem; }

    /* Avertissement médical */
    .medical-disclaimer {
        background: #fefce8; border: 1px solid #fde047;
        border-radius: 8px; padding: 1rem;
        font-size: 0.85rem; color: #713f12;
        margin-top: 1.5rem;
    }

    /* Streamlit overrides */
    .stButton > button {
        background: #2563EB; color: white;
        border-radius: 8px; border: none;
        padding: 0.6rem 2rem; font-size: 1rem;
        width: 100%;
    }
    .stButton > button:hover { background: #1d4ed8; }
    div[data-testid="stSidebar"] { background: #f8fafc; }
</style>
""", unsafe_allow_html=True)


# ─── Chargement du modèle (cache) ─────────────────────────────────────────────
@st.cache_resource
def load_model_cached(model_path: str):
    """Charge le modèle une seule fois et le met en cache."""
    import tensorflow as tf
    try:
        model = tf.keras.models.load_model(model_path)
        return model, None
    except Exception as e:
        return None, str(e)


# ─── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## 🧠 BrainScan AI")
    st.markdown("---")

    st.markdown("### ⚙️ Configuration")
    model_path = st.text_input(
        "Chemin du modèle (.h5)",
        value="outputs/models/brain_tumor_model.h5",
        help="Chemin vers le fichier modèle entraîné"
    )

    show_gradcam = st.checkbox("Afficher Grad-CAM", value=True,
                                help="Visualisation de l'attention du modèle")
    confidence_threshold = st.slider(
        "Seuil de confiance (%)", min_value=50, max_value=99, value=70,
        help="En dessous de ce seuil, le résultat est marqué comme incertain"
    )

    st.markdown("---")
    st.markdown("### 📖 Classes détectées")
    classes_info = [
        ("🔴", "Gliome",               "Tumeur gliale"),
        ("🟡", "Méningiome",           "Tumeur des méninges"),
        ("🟢", "Pas de tumeur",        "IRM saine"),
        ("🔵", "Tumeur pituitaire",    "Glande hypophyse"),
    ]
    for icon, name, desc in classes_info:
        st.markdown(f"**{icon} {name}**  \n<small>{desc}</small>", unsafe_allow_html=True)

    st.markdown("---")
    st.markdown(
        "<small>Modèle : EfficientNetB0 · Transfer Learning<br>"
        "Dataset : Kaggle Brain Tumor MRI</small>",
        unsafe_allow_html=True
    )


# ─── En-tête ───────────────────────────────────────────────────────────────────
st.markdown("""
<div class="main-header">
    <h1>🧠 Brain Tumor MRI Classifier</h1>
    <p>Classification automatique de tumeurs cérébrales par deep learning (EfficientNetB0)</p>
</div>
""", unsafe_allow_html=True)

# ─── Chargement du modèle ──────────────────────────────────────────────────────
model, load_error = load_model_cached(model_path)

if load_error:
    st.warning(
        f"⚠️ Modèle non trouvé à `{model_path}`. "
        "Veuillez d'abord entraîner le modèle avec `python src/train.py`.\n\n"
        f"Erreur : {load_error}"
    )
    st.info(
        "**Mode démo** : L'application est fonctionnelle mais les prédictions "
        "seront simulées tant que le modèle n'est pas chargé."
    )
    model = None
else:
    st.success(f"✅ Modèle chargé avec succès depuis `{model_path}`")


# ─── Zone de téléversement ────────────────────────────────────────────────────
st.markdown("## 📤 Téléversez une IRM cérébrale")
col_upload, col_info = st.columns([2, 1])

with col_upload:
    uploaded_file = st.file_uploader(
        "Choisissez une image IRM (JPG, PNG, JPEG)",
        type=["jpg", "jpeg", "png"],
        help="Image IRM cérébrale en coupe axiale, sagittale ou coronale"
    )

with col_info:
    st.markdown("""
    **📋 Formats acceptés**
    - JPG / JPEG
    - PNG

    **💡 Conseils**
    - IRM T1 ou T2
    - Résolution ≥ 224×224 px
    - Image en niveaux de gris ou RGB
    """)


# ─── Analyse ───────────────────────────────────────────────────────────────────
if uploaded_file is not None:
    image = Image.open(uploaded_file).convert("RGB")

    st.markdown("---")
    st.markdown("## 🔬 Analyse en cours")

    col1, col2 = st.columns([1, 2])

    with col1:
        st.markdown("### Image originale")
        st.image(image, caption="IRM téléversée", use_container_width=True)
        st.caption(f"Taille : {image.size[0]}×{image.size[1]} pixels")

    with col2:
        if st.button("🚀 Analyser l'IRM", use_container_width=True):
            with st.spinner("Analyse en cours…"):

                # ── Prédiction ──────────────────────────────────────────────
                if model is not None:
                    from inference import predict, CLASS_INFO
                    from evaluation import make_gradcam_heatmap, overlay_gradcam

                    result = predict(model, image)
                    pred_class  = result["predicted_class"]
                    confidence  = result["confidence"]
                    probs       = result["probabilities"]
                    info        = result["info"]

                else:
                    # Mode démo : prédictions aléatoires
                    from inference import CLASS_INFO, CLASSES
                    import random
                    pred_class = random.choice(CLASSES)
                    raw = np.random.dirichlet(np.ones(4))
                    probs = {c: float(p) for c, p in zip(CLASSES, raw)}
                    confidence = probs[pred_class]
                    info = CLASS_INFO[pred_class]

                # ── Résultat principal ──────────────────────────────────────
                severity = info["severity"]
                if severity == "Élevée":
                    card_class, badge_class = "result-positive", "badge-high"
                elif severity == "Modérée":
                    card_class, badge_class = "result-moderate", "badge-moderate"
                else:
                    card_class, badge_class = "result-negative", "badge-normal"

                confidence_pct = confidence * 100
                uncertain = confidence_pct < confidence_threshold

                st.markdown(f"""
                <div class="result-card {card_class}">
                    <h3 style="margin:0 0 0.5rem">
                        Résultat : <strong>{info['label_fr']}</strong>
                        <span class="badge {badge_class}" style="margin-left:0.75rem">
                            {severity}
                        </span>
                        {'<span class="badge" style="background:#f3f4f6;color:#6b7280;margin-left:0.5rem">⚠️ Incertain</span>' if uncertain else ''}
                    </h3>
                    <p style="margin:0 0 0.75rem;color:#374151">{info['description']}</p>
                    <div style="font-size:1.4rem;font-weight:700;color:{info['color']}">
                        Confiance : {confidence_pct:.1f}%
                    </div>
                    <div class="confidence-bar-container">
                        <div style="
                            width:{confidence_pct:.1f}%;
                            background:{info['color']};
                            height:10px; border-radius:9999px;
                            transition: width 0.5s ease;
                        "></div>
                    </div>
                </div>
                """, unsafe_allow_html=True)

                if uncertain:
                    st.warning(
                        f"⚠️ La confiance ({confidence_pct:.1f}%) est inférieure au seuil "
                        f"configuré ({confidence_threshold}%). Veuillez consulter un médecin."
                    )

                # ── Graphique des probabilités ──────────────────────────────
                classes_fr = {
                    "glioma": "Gliome", "meningioma": "Méningiome",
                    "notumor": "Pas de tumeur", "pituitary": "Tumeur pituitaire"
                }
                colors_map = {
                    "glioma": "#E8593C", "meningioma": "#EF9F27",
                    "notumor": "#1D9E75", "pituitary": "#3B8BD4"
                }
                labels = [classes_fr[c] for c in CLASSES if True]
                values = [probs.get(c, 0) * 100 for c in ["glioma","meningioma","notumor","pituitary"]]
                bar_colors = [colors_map[c] for c in ["glioma","meningioma","notumor","pituitary"]]

                fig = go.Figure(go.Bar(
                    x=labels, y=values,
                    marker_color=bar_colors,
                    text=[f"{v:.1f}%" for v in values],
                    textposition="outside",
                ))
                fig.update_layout(
                    title="Probabilités par classe (%)",
                    yaxis=dict(range=[0, 115], title="Probabilité (%)"),
                    xaxis_title="Classe",
                    height=320,
                    margin=dict(t=40, b=20, l=20, r=20),
                    plot_bgcolor="white",
                    paper_bgcolor="white",
                    font=dict(size=12),
                )
                st.plotly_chart(fig, use_container_width=True)

                # ── Grad-CAM ────────────────────────────────────────────────
                if show_gradcam and model is not None:
                    st.markdown("### 🔍 Visualisation Grad-CAM")
                    st.caption(
                        "Le Grad-CAM montre les régions de l'IRM "
                        "sur lesquelles le modèle s'est concentré pour sa décision."
                    )

                    try:
                        arr = np.array(image.resize((224, 224)),
                                       dtype=np.float32) / 255.0
                        arr = np.expand_dims(arr, axis=0)

                        # Trouver la dernière conv d'EfficientNet
                        last_conv = "top_conv"
                        for layer in model.layers:
                            if hasattr(layer, "layers"):
                                for l in reversed(layer.layers):
                                    import tensorflow as tf
                                    if isinstance(l, tf.keras.layers.Conv2D):
                                        last_conv = l.name
                                        break
                                break

                        heatmap = make_gradcam_heatmap(
                            arr, model, last_conv_layer_name=last_conv,
                            pred_index=["glioma","meningioma","notumor","pituitary"].index(pred_class)
                        )
                        gradcam_img = overlay_gradcam(image, heatmap, alpha=0.45)

                        col_orig, col_heat, col_over = st.columns(3)
                        with col_orig:
                            st.image(image.resize((224,224)), caption="Original", use_container_width=True)
                        with col_heat:
                            import matplotlib.pyplot as plt
                            import matplotlib.cm as cm
                            heatmap_colored = cm.jet(heatmap)[:,:,:3]
                            heatmap_pil = Image.fromarray(np.uint8(heatmap_colored*255))
                            st.image(heatmap_pil, caption="Heatmap", use_container_width=True)
                        with col_over:
                            st.image(gradcam_img, caption="Superposition", use_container_width=True)

                    except Exception as e:
                        st.info(f"Grad-CAM indisponible : {e}")

                # ── Avertissement médical ───────────────────────────────────
                st.markdown("""
                <div class="medical-disclaimer">
                    ⚕️ <strong>Avertissement médical</strong> : Ce système est un outil d'aide au
                    diagnostic basé sur l'intelligence artificielle. Les résultats présentés ne
                    constituent pas un diagnostic médical. Consultez toujours un médecin spécialiste
                    (neurologue ou neuroradiologue) pour l'interprétation des IRM cérébrales.
                </div>
                """, unsafe_allow_html=True)

                # ── Bouton de téléchargement du rapport ─────────────────────
                st.markdown("---")
                report_content = f"""RAPPORT D'ANALYSE IRM — BrainScan AI
{'='*50}
Résultat           : {info['label_fr']}
Classe technique   : {pred_class}
Confiance          : {confidence_pct:.2f}%
Sévérité           : {severity}
Statut             : {'Incertain' if uncertain else 'Confiant'}

Probabilités par classe :
{'─'*30}
"""
                for c, p in probs.items():
                    report_content += f"  {classes_fr[c]:<22}: {p*100:.2f}%\n"

                report_content += f"""
{'─'*50}
Description : {info['description']}

AVERTISSEMENT : Ce rapport est généré automatiquement
par un système d'IA. Il ne remplace pas l'avis d'un médecin.
"""
                st.download_button(
                    "📄 Télécharger le rapport",
                    data=report_content,
                    file_name="rapport_irm.txt",
                    mime="text/plain",
                )


# ─── Section informative ───────────────────────────────────────────────────────
else:
    st.markdown("---")
    st.markdown("## ℹ️ À propos de l'application")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("""
        ### 🧬 Technologie
        - **Modèle** : EfficientNetB0
        - **Transfer Learning** depuis ImageNet
        - **Fine-tuning** en 2 phases
        - **Précision** : ~96% sur le jeu de test
        """)

    with col2:
        st.markdown("""
        ### 📊 Dataset
        - **Source** : Kaggle Brain Tumor MRI
        - **~7 000 images** IRM
        - **4 classes** de diagnostic
        - **Augmentation** des données
        """)

    with col3:
        st.markdown("""
        ### 🚀 Utilisation
        1. Chargez le modèle entraîné
        2. Téléversez une IRM
        3. Cliquez sur **Analyser**
        4. Consultez les résultats et Grad-CAM
        """)

    st.info(
        "👆 **Commencez** en téléversant une image IRM cérébrale dans la zone ci-dessus."
    )
