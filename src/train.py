"""
Script d'entraînement complet — 2 phases de fine-tuning.

Usage:
    python src/train.py --data_dir /chemin/vers/dataset --epochs 30
"""

import argparse
import os
import json
import numpy as np
import matplotlib.pyplot as plt
import tensorflow as tf
from pathlib import Path

from data_preprocessing import get_data_generators, explore_dataset, show_sample_images
from model import (
    build_model, compile_model, get_callbacks,
    unfreeze_top_layers, print_model_summary
)


# ─── Arguments CLI ────────────────────────────────────────────────────────────
def parse_args():
    parser = argparse.ArgumentParser(description="Entraînement — Brain Tumor Classifier")
    parser.add_argument("--data_dir",  type=str, required=True,
                        help="Dossier racine du dataset (contient Training/ et Testing/)")
    parser.add_argument("--output_dir", type=str, default="outputs",
                        help="Dossier de sortie (modèles, graphiques, logs)")
    parser.add_argument("--epochs_phase1", type=int, default=20,
                        help="Epochs phase 1 (base gelée)")
    parser.add_argument("--epochs_phase2", type=int, default=15,
                        help="Epochs phase 2 (fine-tuning)")
    parser.add_argument("--batch_size",  type=int, default=32)
    parser.add_argument("--explore",     action="store_true",
                        help="Afficher des statistiques exploratoires")
    return parser.parse_args()


# ─── Visualisation de l'historique ────────────────────────────────────────────
def plot_history(history_p1, history_p2, save_path: str):
    """Trace les courbes d'accuracy et de loss pour les 2 phases."""
    # Concaténer les 2 historiques
    acc  = history_p1.history["accuracy"]     + history_p2.history["accuracy"]
    vacc = history_p1.history["val_accuracy"] + history_p2.history["val_accuracy"]
    loss = history_p1.history["loss"]         + history_p2.history["loss"]
    vloss= history_p1.history["val_loss"]     + history_p2.history["val_loss"]
    ep1  = len(history_p1.history["accuracy"])

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle("Courbes d'entraînement — Brain Tumor Classifier", fontsize=13)
    x = range(1, len(acc) + 1)

    # Accuracy
    ax1.plot(x, acc,  label="Train", color="#3B8BD4")
    ax1.plot(x, vacc, label="Val",   color="#E8593C")
    ax1.axvline(ep1, color="#888", linestyle="--", alpha=0.6, label="Fine-tuning")
    ax1.set_title("Accuracy"); ax1.set_xlabel("Epoch"); ax1.set_ylabel("Accuracy")
    ax1.legend(); ax1.grid(alpha=0.3)

    # Loss
    ax2.plot(x, loss,  label="Train", color="#3B8BD4")
    ax2.plot(x, vloss, label="Val",   color="#E8593C")
    ax2.axvline(ep1, color="#888", linestyle="--", alpha=0.6, label="Fine-tuning")
    ax2.set_title("Loss"); ax2.set_xlabel("Epoch"); ax2.set_ylabel("Loss")
    ax2.legend(); ax2.grid(alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()
    print(f"Courbes sauvegardées → {save_path}")


def save_training_info(history_p1, history_p2, test_results, output_dir):
    """Sauvegarde les métriques finales en JSON."""
    info = {
        "phase1_epochs":      len(history_p1.history["accuracy"]),
        "phase2_epochs":      len(history_p2.history["accuracy"]),
        "best_val_accuracy":  float(max(
            history_p1.history["val_accuracy"] + history_p2.history["val_accuracy"]
        )),
        "test_loss":          float(test_results[0]),
        "test_accuracy":      float(test_results[1]),
        "test_auc":           float(test_results[2]),
    }
    path = os.path.join(output_dir, "training_info.json")
    with open(path, "w") as f:
        json.dump(info, f, indent=2)
    print(f"Infos d'entraînement → {path}")
    return info


# ─── Pipeline principal ───────────────────────────────────────────────────────
def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)
    model_dir = os.path.join(args.output_dir, "models")
    os.makedirs(model_dir, exist_ok=True)

    # GPU check
    gpus = tf.config.list_physical_devices("GPU")
    print(f"GPU disponibles : {gpus if gpus else 'Aucun (CPU utilisé)'}")

    # ── 1. Exploration ─────────────────────────────────────────────────────────
    if args.explore:
        print("\n=== Exploration du dataset ===")
        explore_dataset(args.data_dir, save_dir=args.output_dir)
        show_sample_images(args.data_dir, save_dir=args.output_dir)

    # ── 2. Données ────────────────────────────────────────────────────────────
    print("\n=== Chargement des données ===")
    train_gen, val_gen, test_gen, class_weights = get_data_generators(args.data_dir)

    # ── 3. Modèle ─────────────────────────────────────────────────────────────
    print("\n=== Construction du modèle ===")
    model = build_model()
    model = compile_model(model, learning_rate=1e-3)
    print_model_summary(model)

    # ── 4. Phase 1 : tête seule ────────────────────────────────────────────────
    print("\n=== Phase 1 : Entraînement de la tête (base gelée) ===")
    callbacks_p1 = get_callbacks(
        checkpoint_path=os.path.join(model_dir, "phase1_best.h5"),
        log_dir=os.path.join(args.output_dir, "logs/phase1"),
        patience=8,
    )

    history_p1 = model.fit(
        train_gen,
        epochs=args.epochs_phase1,
        validation_data=val_gen,
        class_weight=class_weights,
        callbacks=callbacks_p1,
        verbose=1,
    )

    # ── 5. Phase 2 : fine-tuning ───────────────────────────────────────────────
    print("\n=== Phase 2 : Fine-tuning (20 dernières couches) ===")
    unfreeze_top_layers(model, num_layers=20)
    model = compile_model(model, learning_rate=1e-5)  # LR très faible

    callbacks_p2 = get_callbacks(
        checkpoint_path=os.path.join(model_dir, "best_model.h5"),
        log_dir=os.path.join(args.output_dir, "logs/phase2"),
        patience=6,
    )

    history_p2 = model.fit(
        train_gen,
        epochs=args.epochs_phase2,
        validation_data=val_gen,
        class_weight=class_weights,
        callbacks=callbacks_p2,
        verbose=1,
    )

    # ── 6. Évaluation finale ───────────────────────────────────────────────────
    print("\n=== Évaluation sur le jeu de test ===")
    test_results = model.evaluate(test_gen, verbose=1)
    metrics = ["loss", "accuracy", "auc", "precision", "recall"]
    for name, val in zip(metrics, test_results):
        print(f"  {name:12s}: {val:.4f}")

    # ── 7. Sauvegarde ─────────────────────────────────────────────────────────
    model.save(os.path.join(model_dir, "brain_tumor_model.h5"))
    print(f"\nModèle sauvegardé → {model_dir}/brain_tumor_model.h5")

    plot_history(
        history_p1, history_p2,
        save_path=os.path.join(args.output_dir, "training_curves.png")
    )

    info = save_training_info(history_p1, history_p2, test_results, args.output_dir)
    print(f"\n✓ Accuracy finale sur le test : {info['test_accuracy']:.4f}")
    print(f"✓ AUC finale sur le test      : {info['test_auc']:.4f}")


if __name__ == "__main__":
    main()
