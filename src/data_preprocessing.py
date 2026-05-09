"""
Module de prétraitement des données IRM cérébrales.
Dataset: https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset
Classes: glioma, meningioma, notumor, pituitary
"""

import os
import numpy as np
import pandas as pd
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns
from PIL import Image
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.utils.class_weight import compute_class_weight


# ─── Constantes ───────────────────────────────────────────────────────────────
IMG_SIZE        = (224, 224)
BATCH_SIZE      = 32
CLASSES         = ["glioma", "meningioma", "notumor", "pituitary"]
CLASS_LABELS_FR = {
    "glioma":     "Gliome",
    "meningioma": "Méningiome",
    "notumor":    "Pas de tumeur",
    "pituitary":  "Tumeur pituitaire",
}
SEED = 42


# ─── Chargement & split ───────────────────────────────────────────────────────
def get_data_generators(data_dir: str, val_split: float = 0.15):
    """
    Crée les générateurs train / validation / test avec augmentation.

    Args:
        data_dir : chemin vers le dossier racine du dataset.
                   Doit contenir un sous-dossier Training/ et Testing/.
        val_split: fraction de Training utilisée pour la validation.

    Returns:
        train_gen, val_gen, test_gen, class_weights
    """
    train_dir = os.path.join(data_dir, "Training")
    test_dir  = os.path.join(data_dir, "Testing")

    # Augmentation pour l'entraînement
    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        validation_split=val_split,
        rotation_range=15,
        width_shift_range=0.1,
        height_shift_range=0.1,
        shear_range=0.1,
        zoom_range=0.1,
        horizontal_flip=True,
        fill_mode="nearest",
    )

    # Pas d'augmentation pour validation / test
    val_test_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        validation_split=val_split,
    )
    test_datagen = ImageDataGenerator(rescale=1.0 / 255)

    train_gen = train_datagen.flow_from_directory(
        train_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        subset="training",
        seed=SEED,
        shuffle=True,
    )

    val_gen = val_test_datagen.flow_from_directory(
        train_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        subset="validation",
        seed=SEED,
        shuffle=False,
    )

    test_gen = test_datagen.flow_from_directory(
        test_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        shuffle=False,
    )

    # Poids des classes pour gérer le déséquilibre
    labels = train_gen.classes
    cw = compute_class_weight("balanced", classes=np.unique(labels), y=labels)
    class_weights = dict(enumerate(cw))

    print(f"Train:      {train_gen.n} images")
    print(f"Validation: {val_gen.n} images")
    print(f"Test:       {test_gen.n} images")
    print(f"Classes:    {train_gen.class_indices}")
    print(f"Poids:      {class_weights}")

    return train_gen, val_gen, test_gen, class_weights


# ─── Analyse exploratoire ─────────────────────────────────────────────────────
def explore_dataset(data_dir: str, save_dir: str = "outputs"):
    """Affiche des statistiques et exemples du dataset."""
    os.makedirs(save_dir, exist_ok=True)
    counts = {}

    for split in ["Training", "Testing"]:
        split_path = os.path.join(data_dir, split)
        for cls in CLASSES:
            cls_path = os.path.join(split_path, cls)
            n = len(list(Path(cls_path).glob("*.jpg"))) + \
                len(list(Path(cls_path).glob("*.png")))
            counts[f"{split}/{cls}"] = n

    df = pd.DataFrame(list(counts.items()), columns=["Classe", "Nombre"])
    print(df.to_string(index=False))

    # Graphique de distribution
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle("Distribution des classes — Brain Tumor MRI Dataset", fontsize=14)

    for i, split in enumerate(["Training", "Testing"]):
        vals = [counts.get(f"{split}/{c}", 0) for c in CLASSES]
        colors = ["#E8593C", "#3B8BD4", "#1D9E75", "#EF9F27"]
        axes[i].bar([CLASS_LABELS_FR[c] for c in CLASSES], vals, color=colors)
        axes[i].set_title(split)
        axes[i].set_ylabel("Nombre d'images")
        axes[i].tick_params(axis="x", rotation=15)
        for j, v in enumerate(vals):
            axes[i].text(j, v + 10, str(v), ha="center", fontsize=9)

    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, "distribution.png"), dpi=150)
    plt.close()
    print(f"Graphique sauvegardé → {save_dir}/distribution.png")


def show_sample_images(data_dir: str, save_dir: str = "outputs", n: int = 4):
    """Affiche n exemples par classe."""
    os.makedirs(save_dir, exist_ok=True)
    fig, axes = plt.subplots(len(CLASSES), n, figsize=(n * 3, len(CLASSES) * 3))
    fig.suptitle("Exemples d'IRM par classe", fontsize=14)

    for i, cls in enumerate(CLASSES):
        cls_path = Path(data_dir) / "Training" / cls
        images = list(cls_path.glob("*.jpg"))[:n]
        for j, img_path in enumerate(images):
            img = Image.open(img_path).convert("RGB").resize((224, 224))
            axes[i][j].imshow(img, cmap="gray")
            axes[i][j].axis("off")
            if j == 0:
                axes[i][j].set_title(CLASS_LABELS_FR[cls], fontsize=10, loc="left")

    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, "samples.png"), dpi=150)
    plt.close()
    print(f"Exemples sauvegardés → {save_dir}/samples.png")


# ─── Prétraitement d'une image unique (pour l'inférence) ─────────────────────
def preprocess_image(image_input, target_size=IMG_SIZE):
    """
    Prétraite une image pour l'inférence.

    Args:
        image_input : chemin (str/Path) ou objet PIL.Image.

    Returns:
        np.ndarray de shape (1, H, W, 3), valeurs dans [0, 1].
    """
    if isinstance(image_input, (str, Path)):
        img = Image.open(image_input).convert("RGB")
    else:
        img = image_input.convert("RGB")

    img = img.resize(target_size, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)
