"""
K-means pipeline loader — secondary unsupervised "opinion" alongside the CNN.

The bundle (outputs/models/kmeans_pipeline.pkl) was produced by the notebook's
advanced-ETL cell. It contains:
    feature_names      ordered list of the 12 handcrafted descriptors
    img_proc_size      grayscale resize used during feature extraction (128)
    classes            canonical class order
    scaler             fitted StandardScaler
    pca                fitted PCA (12 -> <=8 components)
    kmeans             fitted KMeans(k=4) on the PCA space
    cluster_to_class   {cluster_id: majority_class_name}
    metrics            ARI / NMI / silhouette / explained variance

This module re-implements the SAME feature extraction (functions don't pickle
cleanly across environments) and exposes a small predict() that returns the
cluster id, its majority class, and the distance to each centroid.

K-means is purely unsupervised — it never saw the labels. Its agreement with
the true classes is modest (ARI ~0.17), which is itself a finding: handcrafted
descriptors alone don't separate the tumor types, motivating the CNN.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_KMEANS_PATH = ROOT / "outputs" / "models" / "kmeans_pipeline.pkl"


# ─── Feature extraction (must match the notebook's extract_features) ──────────
def extract_features(pil_img: Image.Image, img_proc: int = 128) -> dict:
    """12 lightweight descriptors: intensity, contrast, histogram shape,
    texture (gradient), centre/border layout, aspect ratio."""
    from scipy import stats as sps  # lazy — only needed when K-means is used

    w0, h0 = pil_img.size
    g = np.asarray(pil_img.convert("L").resize((img_proc, img_proc)), dtype=np.float32)
    flat = g.ravel()
    hist = np.histogram(flat, bins=64, range=(0, 255), density=True)[0] + 1e-12
    gx, gy = np.gradient(g)
    grad = np.sqrt(gx ** 2 + gy ** 2)
    c0, c1 = img_proc // 4, 3 * img_proc // 4
    centre = g[c0:c1, c0:c1]
    border_mask = np.ones_like(g, bool)
    border_mask[c0:c1, c0:c1] = False
    std = float(flat.std())
    # skew/kurtosis are undefined for (near-)constant data — guard against NaN
    if std < 1e-6:
        skew = kurt = 0.0
    else:
        with np.errstate(all="ignore"):
            skew = float(np.nan_to_num(sps.skew(flat)))
            kurt = float(np.nan_to_num(sps.kurtosis(flat)))
    return {
        "mean_int":            float(flat.mean()),
        "std_int":             std,
        "skew":                skew,
        "kurtosis":            kurt,
        "entropy":             float(sps.entropy(hist)),
        "p10":                 float(np.percentile(flat, 10)),
        "p90":                 float(np.percentile(flat, 90)),
        "dark_frac":           float((flat < 30).mean()),
        "bright_frac":         float((flat > 200).mean()),
        "edge_density":        float((grad > grad.mean() + grad.std()).mean()) if grad.std() > 0 else 0.0,
        "center_minus_border": float(centre.mean() - g[border_mask].mean()),
        "aspect_ratio":        float(w0 / max(h0, 1)),
    }


# ─── Pipeline wrapper ────────────────────────────────────────────────────────
class KMeansPipeline:
    def __init__(self, bundle: dict):
        self.bundle = bundle
        self.feature_names = list(bundle["feature_names"])
        self.img_proc      = int(bundle.get("img_proc_size", 128))
        self.scaler        = bundle["scaler"]
        self.pca           = bundle["pca"]
        self.kmeans        = bundle["kmeans"]
        self.cluster_to_class = {int(k): v for k, v in bundle["cluster_to_class"].items()}
        self.metrics       = bundle.get("metrics", {})

    @classmethod
    def load(cls, path: str | os.PathLike = DEFAULT_KMEANS_PATH) -> Optional["KMeansPipeline"]:
        path = Path(path)
        if not path.is_file():
            return None
        import joblib  # lazy
        bundle = joblib.load(path)
        if not isinstance(bundle, dict) or "kmeans" not in bundle:
            raise ValueError(f"{path} is not a K-means bundle dict")
        return cls(bundle)

    def predict(self, pil_img: Image.Image) -> dict:
        feats = extract_features(pil_img, img_proc=self.img_proc)
        x = np.array([[feats[k] for k in self.feature_names]], dtype=np.float64)
        x = np.nan_to_num(x, nan=0.0, posinf=0.0, neginf=0.0)  # belt-and-braces
        xp = self.pca.transform(self.scaler.transform(x))
        cluster = int(self.kmeans.predict(xp)[0])
        # distance to each centroid (lower = closer)
        dists = np.linalg.norm(self.kmeans.cluster_centers_ - xp[0], axis=1)
        return {
            "cluster": cluster,
            "majority_class": self.cluster_to_class.get(cluster, "?"),
            "distances": {int(i): round(float(d), 4) for i, d in enumerate(dists)},
            "features": {k: round(v, 4) for k, v in feats.items()},
        }
