"""
Module d'inférence — prédiction sur une image unique.
"""

import numpy as np
from PIL import Image
from pathlib import Path


CLASSES = ["glioma", "meningioma", "notumor", "pituitary"]

CLASS_INFO = {
    "glioma": {
        "label_fr": "Gliome",
        "description": (
            "Tumeur qui prend naissance dans les cellules gliales du cerveau ou de la moelle épinière. "
            "Les gliomes représentent environ 30% de toutes les tumeurs cérébrales."
        ),
        "severity": "Élevée",
        "color": "#E8593C",
    },
    "meningioma": {
        "label_fr": "Méningiome",
        "description": (
            "Tumeur qui se développe dans les méninges, les membranes entourant le cerveau. "
            "Généralement bénigne et à croissance lente."
        ),
        "severity": "Modérée",
        "color": "#EF9F27",
    },
    "notumor": {
        "label_fr": "Pas de tumeur détectée",
        "description": (
            "L'analyse de l'IRM ne montre pas de signe de tumeur cérébrale. "
            "Un suivi médical régulier reste recommandé."
        ),
        "severity": "Normale",
        "color": "#1D9E75",
    },
    "pituitary": {
        "label_fr": "Tumeur pituitaire",
        "description": (
            "Tumeur qui se développe dans la glande pituitaire (hypophyse). "
            "La plupart sont bénignes mais peuvent affecter la production hormonale."
        ),
        "severity": "Modérée",
        "color": "#3B8BD4",
    },
}


def load_model(model_path: str):
    """Charge le modèle Keras depuis un fichier .h5 ou SavedModel."""
    import tensorflow as tf
    model = tf.keras.models.load_model(model_path)
    print(f"Modèle chargé : {model_path}")
    return model


def predict(model, image_input, return_all: bool = True) -> dict:
    """
    Effectue une prédiction sur une image.

    Args:
        model       : modèle Keras chargé.
        image_input : chemin (str/Path) ou objet PIL.Image.
        return_all  : si True, retourne les probabilités pour toutes les classes.

    Returns:
        dict avec :
            predicted_class    (str)
            predicted_label_fr (str)
            confidence         (float, 0-1)
            probabilities      (dict class → float)
            info               (dict avec description, severity, color)
    """
    # Prétraitement
    if isinstance(image_input, (str, Path)):
        img = Image.open(image_input).convert("RGB")
    else:
        img = image_input.convert("RGB")

    img_resized = img.resize((224, 224), Image.LANCZOS)
    arr = np.array(img_resized, dtype=np.float32) / 255.0
    arr = np.expand_dims(arr, axis=0)

    # Prédiction
    probs = model.predict(arr, verbose=0)[0]
    pred_idx = int(np.argmax(probs))
    pred_class = CLASSES[pred_idx]
    confidence = float(probs[pred_idx])

    probabilities = {cls: float(p) for cls, p in zip(CLASSES, probs)}

    return {
        "predicted_class":    pred_class,
        "predicted_label_fr": CLASS_INFO[pred_class]["label_fr"],
        "confidence":         confidence,
        "probabilities":      probabilities,
        "info":               CLASS_INFO[pred_class],
        "preprocessed_image": img_resized,
    }


def predict_batch(model,
                  image_paths: list,
                  batch_size: int = 16) -> list:
    """
    Prédictions sur un lot d'images.

    Returns:
        Liste de dicts (même format que predict()).
    """
    results = []
    for i in range(0, len(image_paths), batch_size):
        batch_paths = image_paths[i:i + batch_size]
        batch_arrays = []

        for path in batch_paths:
            img = Image.open(path).convert("RGB").resize((224, 224), Image.LANCZOS)
            arr = np.array(img, dtype=np.float32) / 255.0
            batch_arrays.append(arr)

        batch = np.stack(batch_arrays, axis=0)
        probs_batch = model.predict(batch, verbose=0)

        for path, probs in zip(batch_paths, probs_batch):
            pred_idx   = int(np.argmax(probs))
            pred_class = CLASSES[pred_idx]
            results.append({
                "path":               str(path),
                "predicted_class":    pred_class,
                "predicted_label_fr": CLASS_INFO[pred_class]["label_fr"],
                "confidence":         float(probs[pred_idx]),
                "probabilities":      {c: float(p) for c, p in zip(CLASSES, probs)},
            })

    return results
