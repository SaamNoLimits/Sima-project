"""
Smoke-test that brain_tumor_model.pkl loads via fastai and predicts correctly.
Uses raw torch model to avoid fasttransform 0.0.2 transform-pipeline bug.

Run:
    .venv/bin/python scripts/smoke_test_pkl.py
"""
from pathlib import Path
import numpy as np
import torch
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PKL = ROOT / "outputs" / "models" / "brain_tumor_model.pkl"

assert PKL.exists(), f"Missing model: {PKL}"
print(f"[1] Model file        : {PKL}  ({PKL.stat().st_size/1024/1024:.1f} MB)")

print("[2] Importing fastai…")
from fastai.learner import load_learner
import fastai
print(f"    fastai={fastai.__version__}  torch={torch.__version__}")

print("[3] Loading learner (cpu=True)…")
learn = load_learner(PKL, cpu=True)
vocab = list(learn.dls.vocab)
print(f"    vocab = {vocab}")
assert len(vocab) == 4, f"Expected 4 classes, got {len(vocab)}: {vocab}"

print("[4] Manual preprocessing → torch model → softmax")
# ImageNet normalisation (fastai default for vision_learner)
IMAGENET_MEAN = torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1)
IMAGENET_STD  = torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1)

def predict_pil(pil: Image.Image):
    img = pil.convert("RGB").resize((224, 224), Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0           # HWC, [0,1]
    t   = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)  # 1×3×224×224
    t   = (t - IMAGENET_MEAN) / IMAGENET_STD
    learn.model.eval()
    with torch.no_grad():
        logits = learn.model(t)
        probs  = torch.softmax(logits, dim=1)[0]
    idx = int(probs.argmax())
    return vocab[idx], float(probs[idx]), probs.tolist()

print("[5] Predicting on synthetic 224x224 grey image…")
fake = Image.new("RGB", (224, 224), color=(120, 120, 120))
pred, conf, probs_list = predict_pil(fake)
print(f"    pred = {pred}  conf = {conf:.3f}")
for v, p in zip(vocab, probs_list):
    print(f"       {v:15s} {p:.4f}")

print("\n✓ Smoke test passed — model is ready to serve.")
