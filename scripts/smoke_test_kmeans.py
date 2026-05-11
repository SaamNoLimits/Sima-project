"""
Smoke-test the K-means pipeline bundle.
Run from project root with the venv:

    .venv/bin/python scripts/smoke_test_kmeans.py
"""
from pathlib import Path
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.kmeans_loader import KMeansPipeline  # noqa: E402

km = KMeansPipeline.load()
assert km is not None, "kmeans_pipeline.pkl not found in outputs/models/"

print(f"[1] Bundle loaded.")
print(f"    feature_names    : {km.feature_names}")
print(f"    img_proc_size    : {km.img_proc}")
print(f"    n_clusters       : {km.kmeans.n_clusters}")
print(f"    cluster_to_class : {km.cluster_to_class}")
print(f"    metrics          : {km.metrics}")

print(f"\n[2] Predict on a synthetic 224x224 grey image…")
fake = Image.new("RGB", (224, 224), color=(120, 120, 120))
out = km.predict(fake)
print(f"    cluster        : {out['cluster']}")
print(f"    majority_class : {out['majority_class']}")
print(f"    distances      : {out['distances']}")
print(f"    features       : {out['features']}")

print("\n✓ K-means smoke test passed.")
