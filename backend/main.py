"""
FastAPI backend for Brain Tumor MRI Classifier.
Run: uvicorn backend.main:app --reload --port 8000
"""

import io
import os
import sys
import base64
import random
from pathlib import Path
from typing import Optional, List

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT))

from inference import CLASSES, CLASS_INFO  # noqa: E402
from backend.model_loader import BrainTumorModel  # noqa: E402


# ─── Model path resolution ─────────────────────────────────────────────────────
# 1) explicit env var BRAIN_TUMOR_MODEL_PATH wins
# 2) otherwise scan outputs/models/ for the first matching file
SUPPORTED_EXTS = (".h5", ".keras", ".pkl")
MODELS_DIR = ROOT / "outputs" / "models"


def _resolve_model_path() -> Optional[str]:
    env_path = os.environ.get("BRAIN_TUMOR_MODEL_PATH")
    if env_path:
        return env_path

    if not MODELS_DIR.is_dir():
        return None

    # Prefer canonical names first, then any matching extension.
    preferred = [
        "brain_tumor_model.h5",
        "brain_tumor_model.keras",
        "brain_tumor_model.pkl",
        "export.pkl",
        "model.pkl",
        "best_model.h5",
    ]
    for name in preferred:
        p = MODELS_DIR / name
        if p.is_file():
            return str(p)

    for p in sorted(MODELS_DIR.iterdir()):
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXTS:
            return str(p)

    return None


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="Brain Tumor MRI Classifier API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


_model: Optional[BrainTumorModel] = None
_model_error: Optional[str] = None
_model_path: Optional[str] = None
_load_attempted = False


def get_model() -> Optional[BrainTumorModel]:
    global _model, _model_error, _model_path, _load_attempted
    if _load_attempted:
        return _model
    _load_attempted = True

    _model_path = _resolve_model_path()
    if _model_path is None:
        _model_error = (
            f"No model file found. Place a .h5/.keras/.pkl in {MODELS_DIR} "
            f"or set BRAIN_TUMOR_MODEL_PATH."
        )
        print(f"[backend] {_model_error}")
        return None

    try:
        _model = BrainTumorModel.load(_model_path)
        print(f"[backend] Model loaded: {_model_path} (kind={_model.kind})")
    except Exception as e:
        _model_error = f"{type(e).__name__}: {e}"
        print(f"[backend] Model load failed: {_model_error}")

    return _model


def _gradcam_base64(model: BrainTumorModel, pil_img: Image.Image,
                    pred_class: str) -> Optional[str]:
    """Grad-CAM overlay (Keras only). Returns None for fastai or on failure."""
    if model.kind not in ("keras", "keras_pickle"):
        return None
    try:
        import tensorflow as tf
        from evaluation import make_gradcam_heatmap, overlay_gradcam

        arr = np.array(pil_img.resize((224, 224)), dtype=np.float32) / 255.0
        arr = np.expand_dims(arr, axis=0)

        last_conv = "top_conv"
        for layer in model.model.layers:
            if hasattr(layer, "layers"):
                for l in reversed(layer.layers):
                    if isinstance(l, tf.keras.layers.Conv2D):
                        last_conv = l.name
                        break
                break

        heatmap = make_gradcam_heatmap(
            arr, model.model,
            last_conv_layer_name=last_conv,
            pred_index=CLASSES.index(pred_class),
        )
        overlay = overlay_gradcam(pil_img, heatmap, alpha=0.45)

        buf = io.BytesIO()
        overlay.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode("ascii")
    except Exception as e:
        print(f"[backend] Grad-CAM failed: {e}")
        return None


# ─── Schemas ───────────────────────────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_path: Optional[str] = None
    model_kind: Optional[str] = None
    error: Optional[str] = None
    classes: List[str]


# ─── Routes ────────────────────────────────────────────────────────────────────
@app.get("/api/health", response_model=HealthResponse)
def health():
    model = get_model()
    return HealthResponse(
        status="ok",
        model_loaded=model is not None,
        model_path=_model_path,
        model_kind=model.kind if model else None,
        error=_model_error,
        classes=list(CLASSES),
    )


@app.post("/api/predict")
async def predict(
    file: UploadFile = File(...),
    gradcam: bool = True,
    tta: bool = True,
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an image (JPG/JPEG/PNG).",
        )

    try:
        contents = await file.read()
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not decode image: {e}")

    model = get_model()
    demo_mode = model is None

    if demo_mode:
        # Sample a peaky Dirichlet so one class dominates, then take argmax
        # (keeps predicted_class consistent with the probability distribution).
        raw = np.random.dirichlet(np.ones(len(CLASSES)) * 0.3)
        probabilities = {c: float(p) for c, p in zip(CLASSES, raw)}
        pred_class = max(probabilities, key=probabilities.get)
        confidence = probabilities[pred_class]
        info = CLASS_INFO[pred_class]
        gradcam_b64 = None
        model_kind = "demo"
    else:
        result = model.predict(pil_img, use_tta=tta)
        pred_class = result.predicted_class
        confidence = result.confidence
        probabilities = result.probabilities
        info = result.info
        gradcam_b64 = _gradcam_base64(model, pil_img, pred_class) if gradcam else None
        model_kind = model.kind

    return {
        "demo_mode": demo_mode,
        "model_kind": model_kind,
        "predicted_class": pred_class,
        "predicted_label_fr": info["label_fr"],
        "confidence": confidence,
        "probabilities": probabilities,
        "info": {
            "label_fr": info["label_fr"],
            "description": info["description"],
            "severity": info["severity"],
            "color": info["color"],
        },
        "image_size": list(pil_img.size),
        "gradcam_png_b64": gradcam_b64,
    }


@app.get("/api")
def api_root():
    return {
        "service": "NeuroVista API",
        "docs": "/docs",
        "health": "/api/health",
        "predict": "POST /api/predict (multipart 'file', optional ?gradcam=true|false)",
    }


# ─── Serve the pre-built React UI at "/" ──────────────────────────────────
# After running `npm run build` in frontend/, the bundle lands in
# frontend/dist/. FastAPI serves it directly so users only need Python.
# /api/* routes above take precedence (they're declared first).
from fastapi.responses import FileResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

DIST_DIR = ROOT / "frontend" / "dist"
if DIST_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")
    if (DIST_DIR / "favicon.ico").exists():
        @app.get("/favicon.ico", include_in_schema=False)
        def _favicon():
            return FileResponse(DIST_DIR / "favicon.ico")

    @app.get("/", include_in_schema=False)
    def _index():
        return FileResponse(DIST_DIR / "index.html")

    # SPA fallback — anything not matched by /api/*, /docs, /openapi.json,
    # /assets/*, or /favicon.ico returns index.html so client-side routing works.
    @app.get("/{full_path:path}", include_in_schema=False)
    def _spa_fallback(full_path: str):
        # Don't shadow the /api docs and openapi
        if full_path.startswith(("api", "docs", "redoc", "openapi.json")):
            raise HTTPException(status_code=404, detail="Not found")
        candidate = DIST_DIR / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(DIST_DIR / "index.html")
else:
    @app.get("/", include_in_schema=False)
    def _no_dist():
        return {
            "warning": (
                "frontend/dist not found. Build the React UI with "
                "`cd frontend && npm run build`, or open http://localhost:5173 "
                "if you're running `npm run dev` separately."
            ),
            "api_root": "/api",
            "docs": "/docs",
        }
