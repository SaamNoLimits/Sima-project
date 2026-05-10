"""
Multi-format model loader.

Supports:
  - .h5 / .keras       -> tf.keras.models.load_model (Keras / TensorFlow)
  - .pkl (fastai)      -> fastai.learner.load_learner
  - .pkl (plain)       -> pickle.load (assumed pickled Keras model)

Returns a uniform `BrainTumorModel` interface with .predict(pil_image).
"""

from __future__ import annotations

import io
import os
import pickle
import sys
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from inference import CLASSES, CLASS_INFO  # noqa: E402


# ─── Uniform predict result ───────────────────────────────────────────────────
class PredictResult:
    def __init__(self, predicted_class: str, confidence: float,
                 probabilities: dict, info: dict):
        self.predicted_class = predicted_class
        self.confidence = float(confidence)
        self.probabilities = probabilities
        self.info = info


# ─── Loaders ──────────────────────────────────────────────────────────────────
class BrainTumorModel:
    """Wrapper around any underlying model with a unified .predict() API."""

    def __init__(self, kind: str, model, vocab: Optional[list] = None):
        self.kind = kind
        self.model = model
        self.vocab = vocab  # for fastai: ordered list of class strings

    @classmethod
    def load(cls, path: str) -> "BrainTumorModel":
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found: {path}")

        ext = os.path.splitext(path)[1].lower()

        if ext in (".h5", ".keras"):
            import tensorflow as tf
            model = tf.keras.models.load_model(path)
            return cls(kind="keras", model=model)

        if ext == ".pkl":
            # Try fastai first, then plain pickle.
            try:
                from fastai.learner import load_learner
                learn = load_learner(path, cpu=True)
                vocab = [str(v) for v in learn.dls.vocab]
                return cls(kind="fastai", model=learn, vocab=vocab)
            except ImportError:
                pass  # fastai not installed — fall through
            except Exception as e:
                # fastai installed but failed -> try plain pickle
                print(f"[model_loader] fastai load failed ({e}), trying pickle…")

            with open(path, "rb") as f:
                model = pickle.load(f)
            # Heuristic: if it has .predict(np.ndarray), assume Keras-like.
            if hasattr(model, "predict"):
                return cls(kind="keras_pickle", model=model)
            raise ValueError(
                f"Pickle file at {path} is not a recognised model "
                f"(no .predict method; install fastai if it's a fastai .pkl)."
            )

        raise ValueError(f"Unsupported model file extension: {ext}")

    # ─── Predict ──────────────────────────────────────────────────────────────
    def predict(self, pil_img: Image.Image) -> PredictResult:
        if self.kind in ("keras", "keras_pickle"):
            return self._predict_keras(pil_img)
        if self.kind == "fastai":
            return self._predict_fastai(pil_img)
        raise RuntimeError(f"Unknown model kind: {self.kind}")

    def _predict_keras(self, pil_img: Image.Image) -> PredictResult:
        img = pil_img.convert("RGB").resize((224, 224), Image.LANCZOS)
        arr = np.array(img, dtype=np.float32) / 255.0
        arr = np.expand_dims(arr, axis=0)
        probs = self.model.predict(arr, verbose=0)[0]
        pred_idx = int(np.argmax(probs))
        pred_class = CLASSES[pred_idx]
        probabilities = {c: float(p) for c, p in zip(CLASSES, probs)}
        return PredictResult(
            predicted_class=pred_class,
            confidence=float(probs[pred_idx]),
            probabilities=probabilities,
            info=CLASS_INFO[pred_class],
        )

    def _predict_fastai(self, pil_img: Image.Image) -> PredictResult:
        # We bypass learn.predict() because fasttransform 0.0.2 has a bug in
        # the transform pipeline. Instead, run the underlying torch model
        # directly with the EXACT preprocessing fastai used at training:
        #
        # 1. PIL: resize-with-CROP (bilinear) so the shorter side matches the
        #    target, then center-crop to (224, 224). This is fastai's
        #    `Resize(size=(224,224), method='crop', resample=BILINEAR)`.
        # 2. div by 255 (matches `IntToFloatTensor`)
        # 3. ImageNet normalization (matches fastai's `Normalize.from_stats(*imagenet_stats)`)
        #
        # Using LANCZOS+stretch here was producing wrong predictions on
        # non-square MRIs. Fixed: use BILINEAR + center-crop.
        import torch  # noqa: F401

        IMAGENET_MEAN = torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1)
        IMAGENET_STD  = torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1)
        TARGET = 224

        img = pil_img.convert("RGB")
        w, h = img.size

        # Step 1: scale so shorter side >= TARGET (preserve aspect ratio)
        scale = max(TARGET / w, TARGET / h)
        new_w, new_h = int(round(w * scale)), int(round(h * scale))
        img = img.resize((new_w, new_h), Image.BILINEAR)

        # Step 2: center-crop to TARGET x TARGET
        left = (new_w - TARGET) // 2
        top  = (new_h - TARGET) // 2
        img  = img.crop((left, top, left + TARGET, top + TARGET))

        arr = np.array(img, dtype=np.float32) / 255.0
        t   = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)  # 1×3×224×224
        t   = (t - IMAGENET_MEAN) / IMAGENET_STD

        learn = self.model
        learn.model.eval()
        with torch.no_grad():
            logits = learn.model(t)
            probs_tensor = torch.softmax(logits, dim=1)[0]
        probs_list = probs_tensor.tolist()

        # Map fastai vocab -> our canonical CLASSES.
        probabilities = {c: 0.0 for c in CLASSES}
        unmapped = []
        for i, v in enumerate(self.vocab or []):
            key = _normalise_class_name(v)
            if key in probabilities:
                probabilities[key] = float(probs_list[i])
            else:
                unmapped.append(v)

        if unmapped:
            print(f"[model_loader] fastai vocab classes not in canonical set: {unmapped}")

        pred_class = max(probabilities, key=probabilities.get)
        return PredictResult(
            predicted_class=pred_class,
            confidence=probabilities[pred_class],
            probabilities=probabilities,
            info=CLASS_INFO[pred_class],
        )


def _normalise_class_name(s: str) -> str:
    """Normalise a fastai vocab label to one of CLASSES."""
    t = s.strip().lower().replace("-", "").replace("_", "").replace(" ", "")
    aliases = {
        "glioma": "glioma", "gliomatumor": "glioma",
        "meningioma": "meningioma", "meningiomatumor": "meningioma",
        "notumor": "notumor", "nottumor": "notumor",
        "no": "notumor", "none": "notumor", "healthy": "notumor", "normal": "notumor",
        "pituitary": "pituitary", "pituitarytumor": "pituitary",
    }
    return aliases.get(t, t)
