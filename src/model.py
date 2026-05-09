"""
Architecture du modèle — Transfer Learning avec EfficientNetB0.
Stratégie : fine-tuning en 2 phases.
  Phase 1 : entraîner uniquement la tête de classification (base gelée).
  Phase 2 : dégeler les 20 dernières couches et fine-tuner avec un très faible LR.
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, regularizers
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.callbacks import (
    EarlyStopping, ModelCheckpoint, ReduceLROnPlateau, TensorBoard
)


# ─── Constantes ───────────────────────────────────────────────────────────────
NUM_CLASSES  = 4
IMG_SIZE     = (224, 224)
INPUT_SHAPE  = (224, 224, 3)
DROPOUT_RATE = 0.4


# ─── Construction du modèle ───────────────────────────────────────────────────
def build_model(num_classes: int = NUM_CLASSES,
                dropout_rate: float = DROPOUT_RATE,
                l2_reg: float = 1e-4) -> tf.keras.Model:
    """
    Construit le modèle EfficientNetB0 avec tête de classification custom.

    Architecture :
        EfficientNetB0 (pré-entraîné ImageNet, base gelée)
        → GlobalAveragePooling2D
        → BatchNormalization
        → Dense(256, relu, L2)
        → Dropout(0.4)
        → Dense(128, relu, L2)
        → Dropout(0.3)
        → Dense(num_classes, softmax)
    """
    base_model = EfficientNetB0(
        include_top=False,
        weights="imagenet",
        input_shape=INPUT_SHAPE,
    )
    base_model.trainable = False  # Phase 1 : base gelée

    inputs = tf.keras.Input(shape=INPUT_SHAPE, name="input_image")

    # Passer par le modèle de base (en mode inférence pour le BN)
    x = base_model(inputs, training=False)

    # Tête de classification
    x = layers.GlobalAveragePooling2D(name="gap")(x)
    x = layers.BatchNormalization(name="bn_top")(x)

    x = layers.Dense(
        256, activation="relu",
        kernel_regularizer=regularizers.l2(l2_reg),
        name="dense_256"
    )(x)
    x = layers.Dropout(dropout_rate, name="drop_1")(x)

    x = layers.Dense(
        128, activation="relu",
        kernel_regularizer=regularizers.l2(l2_reg),
        name="dense_128"
    )(x)
    x = layers.Dropout(dropout_rate * 0.75, name="drop_2")(x)

    outputs = layers.Dense(num_classes, activation="softmax", name="predictions")(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name="BrainTumorClassifier")
    return model


def unfreeze_top_layers(model: tf.keras.Model, num_layers: int = 20):
    """Dégèle les `num_layers` dernières couches de la base pour le fine-tuning."""
    base = model.get_layer("efficientnetb0")
    base.trainable = True
    for layer in base.layers[:-num_layers]:
        layer.trainable = False
    print(f"Couches entraînables après dégel : {sum(1 for l in model.layers if l.trainable)}")


# ─── Compilation ──────────────────────────────────────────────────────────────
def compile_model(model: tf.keras.Model,
                  learning_rate: float = 1e-3,
                  label_smoothing: float = 0.1):
    """Compile le modèle avec Adam et categorical crossentropy + label smoothing."""
    model.compile(
        optimizer=optimizers.Adam(learning_rate=learning_rate),
        loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=label_smoothing),
        metrics=[
            "accuracy",
            tf.keras.metrics.AUC(name="auc"),
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
        ],
    )
    return model


# ─── Callbacks ────────────────────────────────────────────────────────────────
def get_callbacks(checkpoint_path: str = "models/best_model.h5",
                  log_dir: str = "logs/fit",
                  patience: int = 10):
    """Retourne la liste des callbacks pour l'entraînement."""
    os.makedirs(os.path.dirname(checkpoint_path), exist_ok=True)
    os.makedirs(log_dir, exist_ok=True)

    return [
        EarlyStopping(
            monitor="val_accuracy",
            patience=patience,
            restore_best_weights=True,
            verbose=1,
        ),
        ModelCheckpoint(
            filepath=checkpoint_path,
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1,
        ),
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=4,
            min_lr=1e-7,
            verbose=1,
        ),
        TensorBoard(log_dir=log_dir, histogram_freq=1),
    ]


# ─── Résumé du modèle ─────────────────────────────────────────────────────────
def print_model_summary(model: tf.keras.Model):
    """Affiche un résumé lisible du modèle."""
    model.summary()
    trainable = sum(np.prod(w.shape) for w in model.trainable_weights)
    total     = sum(np.prod(w.shape) for w in model.weights)
    print(f"\nParamètres entraînables : {trainable:,}")
    print(f"Paramètres totaux       : {total:,}")
    print(f"Paramètres gelés        : {total - trainable:,}")
