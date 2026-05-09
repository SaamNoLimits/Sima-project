"""
Module d'évaluation — matrice de confusion, rapport de classification, Grad-CAM.
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.cm as cm
from PIL import Image
# seaborn / sklearn are only needed for plotting/metrics helpers — lazy-imported.


CLASSES         = ["glioma", "meningioma", "notumor", "pituitary"]
CLASS_LABELS_FR = {
    "glioma":     "Gliome",
    "meningioma": "Méningiome",
    "notumor":    "Pas de tumeur",
    "pituitary":  "Tumeur pituitaire",
}
FR_LABELS = [CLASS_LABELS_FR[c] for c in CLASSES]


# ─── Prédictions complètes ────────────────────────────────────────────────────
def get_predictions(model, test_gen):
    """Retourne (y_true, y_pred, y_pred_proba) sur tout le jeu de test."""
    test_gen.reset()
    y_pred_proba = model.predict(test_gen, verbose=1)
    y_pred = np.argmax(y_pred_proba, axis=1)
    y_true = test_gen.classes
    return y_true, y_pred, y_pred_proba


# ─── Matrice de confusion ─────────────────────────────────────────────────────
def plot_confusion_matrix(y_true, y_pred, save_path: str = None):
    """Affiche et sauvegarde la matrice de confusion normalisée."""
    import seaborn as sns
    from sklearn.metrics import confusion_matrix
    cm = confusion_matrix(y_true, y_pred)
    cm_norm = cm.astype("float") / cm.sum(axis=1, keepdims=True)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle("Matrice de confusion — Brain Tumor Classifier", fontsize=13)

    for i, (data, title) in enumerate([(cm, "Valeurs brutes"), (cm_norm, "Normalisée")]):
        sns.heatmap(
            data, annot=True,
            fmt=".2f" if i == 1 else "d",
            cmap="Blues",
            xticklabels=FR_LABELS,
            yticklabels=FR_LABELS,
            ax=axes[i],
            linewidths=0.5,
        )
        axes[i].set_title(title)
        axes[i].set_xlabel("Prédit")
        axes[i].set_ylabel("Réel")
        axes[i].tick_params(axis="x", rotation=15)

    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches="tight")
        print(f"Matrice de confusion → {save_path}")
    return fig


# ─── Rapport de classification ────────────────────────────────────────────────
def print_classification_report(y_true, y_pred):
    """Affiche le rapport precision/recall/F1 par classe."""
    from sklearn.metrics import classification_report
    report = classification_report(
        y_true, y_pred,
        target_names=FR_LABELS,
        digits=4,
    )
    print("\n=== Rapport de classification ===")
    print(report)
    return report


# ─── Courbes ROC ─────────────────────────────────────────────────────────────
def plot_roc_curves(y_true, y_pred_proba, save_path: str = None):
    """Trace les courbes ROC pour chaque classe (one-vs-rest)."""
    from sklearn.metrics import roc_curve, auc
    n_classes = len(CLASSES)
    y_true_bin = np.eye(n_classes)[y_true]  # one-hot

    colors = ["#E8593C", "#3B8BD4", "#1D9E75", "#EF9F27"]
    fig, ax = plt.subplots(figsize=(8, 6))

    for i, (cls, color) in enumerate(zip(CLASSES, colors)):
        fpr, tpr, _ = roc_curve(y_true_bin[:, i], y_pred_proba[:, i])
        roc_auc = auc(fpr, tpr)
        ax.plot(fpr, tpr, color=color, lw=2,
                label=f"{CLASS_LABELS_FR[cls]} (AUC = {roc_auc:.3f})")

    ax.plot([0, 1], [0, 1], "k--", lw=1, alpha=0.5)
    ax.set_xlim([0, 1]); ax.set_ylim([0, 1.02])
    ax.set_xlabel("Taux de faux positifs"); ax.set_ylabel("Taux de vrais positifs")
    ax.set_title("Courbes ROC — One-vs-Rest")
    ax.legend(loc="lower right"); ax.grid(alpha=0.3)

    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, dpi=150)
        print(f"Courbes ROC → {save_path}")
    return fig


# ─── Grad-CAM ─────────────────────────────────────────────────────────────────
def make_gradcam_heatmap(img_array, model, last_conv_layer_name="top_conv",
                          pred_index=None):
    import tensorflow as tf
    """
    Génère une heatmap Grad-CAM pour visualiser l'attention du modèle.

    Args:
        img_array         : np.ndarray (1, H, W, 3), valeurs dans [0, 1].
        model             : modèle Keras chargé.
        last_conv_layer_name : nom de la dernière couche convolutionnelle.
        pred_index        : classe cible (None = classe prédite).

    Returns:
        heatmap np.ndarray (H, W) dans [0, 1].
    """

    # Modèle intermédiaire : input → conv → prédictions
    grad_model = tf.keras.Model(
        inputs=model.inputs,
        outputs=[
            model.get_layer(last_conv_layer_name).output,
            model.output,
        ],
    )

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array, training=False)
        if pred_index is None:
            pred_index = tf.argmax(predictions[0])
        class_channel = predictions[:, pred_index]

    grads = tape.gradient(class_channel, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-8)
    return heatmap.numpy()


def overlay_gradcam(img_pil: Image.Image, heatmap: np.ndarray,
                    alpha: float = 0.4) -> Image.Image:
    """Superpose la heatmap Grad-CAM sur l'image originale."""
    img = img_pil.convert("RGB").resize((224, 224))
    img_arr = np.array(img)

    # Redimensionner la heatmap à la taille de l'image
    heatmap_resized = np.uint8(255 * heatmap)
    heatmap_img = Image.fromarray(heatmap_resized).resize((224, 224), Image.LANCZOS)
    heatmap_arr = np.array(heatmap_img)

    # Colormap jet
    colormap = cm.get_cmap("jet")
    colored = colormap(heatmap_arr / 255.0)[:, :, :3]
    colored = np.uint8(colored * 255)

    # Superposition
    overlay = (1 - alpha) * img_arr + alpha * colored
    overlay = np.clip(overlay, 0, 255).astype(np.uint8)
    return Image.fromarray(overlay)


def visualize_gradcam(img_pil, model, pred_class, true_class=None,
                      save_path=None):
    """
    Crée une figure avec l'image originale et la visualisation Grad-CAM côte à côte.
    """
    import tensorflow as tf
    from data_preprocessing import preprocess_image
    img_array = preprocess_image(img_pil)

    # Trouver automatiquement la dernière couche conv d'EfficientNet
    last_conv = None
    for layer in model.layers:
        if "efficientnetb0" in layer.name:
            base = layer
            for l in reversed(base.layers):
                if isinstance(l, tf.keras.layers.Conv2D):
                    last_conv = l.name
                    break
            break

    if last_conv is None:
        last_conv = "top_conv"

    heatmap = make_gradcam_heatmap(img_array, model,
                                    last_conv_layer_name=last_conv,
                                    pred_index=CLASSES.index(pred_class))
    gradcam_img = overlay_gradcam(img_pil, heatmap)

    fig, axes = plt.subplots(1, 3, figsize=(12, 4))
    titles = ["Image originale", "Heatmap Grad-CAM", "Superposition"]
    images = [img_pil.convert("RGB").resize((224, 224)),
              Image.fromarray(np.uint8(255 * plt.cm.jet(heatmap)[:, :, :3])),
              gradcam_img]

    for ax, img, title in zip(axes, images, titles):
        ax.imshow(img)
        ax.set_title(title)
        ax.axis("off")

    suptitle = f"Prédit : {CLASS_LABELS_FR[pred_class]}"
    if true_class:
        suptitle += f" | Réel : {CLASS_LABELS_FR.get(true_class, true_class)}"
    fig.suptitle(suptitle, fontsize=12)
    plt.tight_layout()

    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches="tight")
    return fig, gradcam_img
