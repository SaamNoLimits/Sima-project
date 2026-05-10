# CLAUDE.md — Agent Runbook (Windows)

> Read this **first** if you (Claude / Copilot / any code agent) are asked to
> run, debug, or extend NeuroVista on a Windows machine. It's a deterministic
> recipe with verification checkpoints. Total cold start: ~10 min.

---

## 0. What is NeuroVista?

A full-stack medical AI demo: practitioners upload a brain MRI, the app
classifies it into one of **4 categories** (glioma · meningioma · notumor ·
pituitary) and returns a confidence score + Grad-CAM overlay.

- **Backend** : FastAPI · loads a fastai `.pkl` ResNet34 model on startup
- **Frontend**: React + Vite, **pre-built and shipped** in `frontend/dist/`
- **One port** : everything is served from `http://localhost:8000`
  (FastAPI mounts the React bundle as static files at `/`)
- **No Node.js needed** to *run* the project. Node is only required if the
  agent is asked to *modify* the UI and rebuild it.

---

## 1. Prerequisites (one-time, on a fresh Windows machine)

The agent must verify these are installed before doing anything else.

```cmd
python --version
git --version
```

| Tool | Required | Install link | Critical detail |
|---|---|---|---|
| **Python** | **3.10+** | https://python.org/downloads | ⚠ Tick **"Add Python to PATH"** during install |
| **Git** | any recent | https://git-scm.com/download/win | Default options are fine |
| Node.js | optional | https://nodejs.org | Only for `npm run dev` (HMR) — not for running |

If `python --version` returns `command not found`, **stop** and ask the user
to install Python 3.10+ with "Add to PATH" enabled. Don't try to work around
it; PATH issues will recur at every step.

---

## 2. One-command start (the happy path)

```cmd
git clone https://github.com/SaamNoLimits/Sima-project.git
cd Sima-project
start.bat
```

`start.bat` is idempotent. It:

1. Verifies Python (and Node, if present) — fails fast with a clear message
2. Creates `.venv\` if missing (skips if already there)
3. Installs PyTorch CPU + fastai 2.8.7 + FastAPI **only on first run**
   (idempotency check: `python -c "import fastai"`)
4. Confirms `frontend\dist\index.html` exists
5. Opens the browser at `http://localhost:8000` after a 4-second wait
6. Runs `uvicorn` in the foreground so **Ctrl+C** stops the whole stack

**First run** takes **5–15 min** because torch CPU is ~190 MB. **Subsequent
runs** complete in ~10 seconds.

---

## 3. Verification checkpoints

Run these in order. Each command's expected output is shown.

### 3.1 — venv created
```cmd
dir .venv\Scripts\python.exe
```
Must exist. If not, `python -m venv .venv` failed → check Python install.

### 3.2 — fastai imports
```cmd
.venv\Scripts\python -c "import fastai, torch; print(fastai.__version__, torch.__version__)"
```
Expect: `2.8.7 2.10.0+cpu` (or close). If it fails:
- `ModuleNotFoundError: No module named 'fastai'` → re-run `start.bat` to install
- `OSError: [WinError 126]` → corrupted torch wheel; delete `.venv\` and re-run

### 3.3 — model file present
```cmd
dir outputs\models\brain_tumor_model.pkl
```
Must show ~83 MB. The .pkl is committed in the repo at
`outputs/models/brain_tumor_model.pkl`. **Never** try to re-train it from
the agent; the repo ships with it ready to load.

### 3.4 — backend serves API + UI
After `start.bat` is running, in a **second cmd**:
```cmd
curl -s http://localhost:8000/api/health
```
Expect JSON containing `"model_loaded": true` and `"model_kind": "fastai"`.

```cmd
curl -s http://localhost:8000/ | findstr "<title>"
```
Expect: `<title>NeuroVista — Classification IRM cérébrale</title>`

### 3.5 — End-to-end prediction
```cmd
.venv\Scripts\python -c "from PIL import Image; Image.new('RGB',(224,224),(120,120,120)).save('test_mri.png')"
curl -s -X POST -F "file=@test_mri.png" "http://localhost:8000/api/predict?gradcam=false"
```
Expect a JSON response with one of: `glioma | meningioma | notumor | pituitary`,
plus a `confidence` between 0 and 1 and `model_kind: "fastai"`.

If everything above succeeds, the project is **fully running**.

---

## 4. Project layout (so you know where to edit what)

```
Sima-project/
├── start.bat                     ← Windows installer + launcher (Python only)
├── start.sh                      ← Linux/macOS equivalent
├── CLAUDE.md                     ← THIS FILE (agent runbook)
├── README.md                     ← Human-facing readme (French)
├── PRESENTATION.md               ← Marp slides for the thesis defense
├── requirements.txt              ← Python deps (Keras-era; legacy)
├── requirements-fastai.txt       ← Optional fastai pinning
│
├── backend/
│   ├── main.py                   ← FastAPI app · /api/* + SPA static fallback
│   └── model_loader.py           ← Multi-format loader (.h5 / .keras / .pkl)
│
├── frontend/                     ← Vite + React (only edit if rebuilding UI)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/assets/            ← static images, CarePulse SVG icons, favicon
│   ├── dist/                     ← PRE-BUILT bundle (committed; served by FastAPI)
│   └── src/
│       ├── App.jsx               ← Router (switch on activeNav)
│       ├── api.js                ← fetch wrappers for /api/health, /api/predict
│       ├── classInfo.js          ← Class names + colors (FR labels)
│       ├── styles.css            ← Material You palette · all design tokens
│       ├── lib/history.js        ← localStorage analysis history helpers
│       ├── components/
│       │   ├── Sidebar.jsx       ← Deep-green nav with Material icons
│       │   ├── TopBar.jsx        ← Search + latency pill + user chip
│       │   ├── StatCard.jsx      ← featured (filled) vs default
│       │   ├── UploadZone.jsx    ← Drag-drop file input
│       │   ├── ResultCard.jsx    ← Prediction + confidence bar + Grad-CAM
│       │   └── LoginForm.jsx     ← Split layout login screen
│       └── pages/
│           ├── DashboardPage.jsx
│           ├── NewAnalysisPage.jsx
│           ├── HistoryPage.jsx
│           ├── ReportsPage.jsx
│           ├── ClassesPage.jsx
│           ├── SettingsPage.jsx
│           └── HelpPage.jsx
│
├── outputs/
│   └── models/
│       └── brain_tumor_model.pkl ← 83 MB · ResNet34 · fastai 2.8 export
│
├── design/stitch/                ← Source-of-truth Stitch HTML + screenshots
│   ├── neurovista/DESIGN.md      ← Color palette + typography tokens
│   └── neurovista_*/code.html    ← Reference Tailwind structure per screen
│
├── src/                          ← Legacy training code (Keras EfficientNetB0)
├── notebooks/                    ← Original Colab/Kaggle training notebook
└── scripts/
    └── smoke_test_pkl.py         ← Standalone .pkl load+predict test
```

---

## 5. Common tasks (Windows)

### 5.1 — "Run the project"
```cmd
start.bat
```
Then open http://localhost:8000.

### 5.2 — "I changed the UI; rebuild and redeploy"
Requires Node.js. From the repo root:
```cmd
cd frontend
npm install
npm run build
cd ..
```
The new bundle lands in `frontend\dist\`. Restart `start.bat` and the
backend automatically serves the updated bundle.

### 5.3 — "Run dev server with HMR" (frontend hot-reload while iterating)
Two terminals required.

Terminal 1 — backend:
```cmd
.venv\Scripts\python -m uvicorn backend.main:app --port 8000 --host 127.0.0.1
```

Terminal 2 — frontend dev server:
```cmd
cd frontend
npm run dev
```
Now use **http://localhost:5173** for live HMR. Vite proxies `/api/*` to
:8000 automatically (configured in `vite.config.js`).

### 5.4 — "Re-install Python deps from scratch"
Delete the venv and re-run start.bat:
```cmd
rmdir /s /q .venv
start.bat
```

### 5.5 — "Run the standalone model smoke test"
```cmd
.venv\Scripts\python scripts\smoke_test_pkl.py
```
Loads the .pkl, runs a prediction on a synthetic 224×224 grey image, and
prints the per-class probabilities. Use this to verify the model file
itself before debugging the API layer.

### 5.6 — "Pull the latest from GitHub"
```cmd
git pull
```
If `start.bat` was changed, just re-run it. If new Python deps were added,
the idempotency check (`import fastai`) will pass but new packages won't
install — force a re-install with `rmdir /s /q .venv && start.bat`.

---

## 6. Troubleshooting (Windows-specific)

| Symptom | Root cause | Fix |
|---|---|---|
| `'python' is not recognized` | Python not in PATH | Re-install Python with **"Add to PATH"** checked. Restart cmd. |
| `'pip' is not recognized` after venv creation | Venv didn't activate; agent should always use `.venv\Scripts\python -m pip ...` | Don't run `pip` directly. Use `.venv\Scripts\python -m pip`. |
| `pip install` hangs forever | Slow CDN (torch CPU is 190 MB) | Wait. Check `dir /tmp\pip-unpack-*` for partial wheels. Don't kill until ≥ 30 min stalled. |
| `pip install` errors on `spacy` | spacy is a heavy fastai dep on Python 3.13 | `start.bat` already uses `--no-deps` for fastai. If you see this, you bypassed start.bat. Re-read section 5.4. |
| `error: Microsoft Visual C++ 14.0 is required` | Some pip wheel is building from source | Should never happen with `start.bat` — all deps have prebuilt cp310/cp311/cp312 wheels. Confirm Python version is 3.10–3.13. |
| `ModuleNotFoundError: No module named 'starlette'` | Used `--no-deps` and missed a transitive | start.bat installs the explicit transitive list. If you customised the install, run `.venv\Scripts\python -m pip install starlette pydantic anyio sniffio urllib3 plum-dispatch fasttransform python-fasthtml ipython cloudpickle`. |
| Browser opens but page is blank | Vite dev server hasn't bundled yet OR `frontend\dist\` is empty | Hard refresh `Ctrl+F5`. If still blank, check `dir frontend\dist\index.html` exists. If not, `cd frontend && npm install && npm run build`. |
| Page renders but pill says "API offline" | uvicorn died or port blocked | Check the second cmd window opened by start.bat for tracebacks. Often a missing dep. |
| Pill says "Demo mode · no model" | `outputs\models\brain_tumor_model.pkl` is missing | Re-clone with `git clone` (don't use ZIP download — the .pkl is committed; LFS is not used). Verify size is ~83 MB. |
| `TypeError: unsupported operand type(s) for +: 'PILImage' and 'dict'` | fasttransform 0.0.2 bug | Already worked around in `backend/model_loader.py` — it bypasses `learn.predict()` and runs `learn.model` directly with manual ImageNet preprocessing. Verify your `model_loader.py` matches `main` branch. |
| `pkill` / `kill` doesn't work | Wrong OS instructions | Windows: close the cmd window or `taskkill /F /PID <pid>`. To find PIDs: `netstat -ano \| findstr :8000`. |
| Antivirus quarantines start.bat | Some AV flag .bat files | Add the `Sima-project` folder to AV exclusions, or open the .bat in a text editor and verify the contents before running. |
| Path with spaces breaks something | Cloned to `C:\Users\My Name\…` | Move the repo to a path with no spaces, e.g. `C:\dev\Sima-project`. |
| `port 8000 already in use` | Previous run didn't stop cleanly | `netstat -ano \| findstr :8000` → `taskkill /F /PID <pid>` → restart |

---

## 7. What NOT to do (agent guardrails)

- **Don't try to retrain the model.** It's a 2.5-hour CPU job on a fresh
  setup. The .pkl is shipped. Use it.
- **Don't update Python or PyTorch versions** without checking
  compatibility. fastai 2.8.7 + torch 2.10 (CPU) is the tested combo.
- **Don't change `backend/main.py`'s static-file mount logic** without
  understanding the SPA fallback — the `/api/*` routes must be registered
  *before* the catch-all `/{full_path}` route, otherwise the API breaks.
- **Don't `pip install --upgrade fastai`** — it'll pull spacy and the slow
  resolver. Always use `--no-deps` for fastai.
- **Don't run `git push --force`** to fix anything. The repo is shared.
- **Don't store credentials anywhere.** No `.env` is needed; everything
  runs locally without auth.
- **Don't use Git LFS** — the .pkl is regular git-tracked binary at 83 MB,
  under GitHub's 100 MB hard limit. LFS would complicate the clone.

---

## 8. When to escalate to the user

Stop and ask the user before proceeding if any of the following happen:

1. **Python is missing** and you don't have permission to install software
2. **Network is blocked** for `download.pytorch.org` or `pypi.org`
3. **Antivirus** quarantines start.bat or `.venv\Scripts\python.exe`
4. **Disk full**: `.venv\` needs ~2 GB
5. **Windows version too old** (< Windows 10 1607) — torch wheels won't
   load (UCRT requirements)
6. **Anything related to credentials, API tokens, or pushing to remotes**
   — never proceed without explicit user authorization

---

## 9. Quick reference card

```
CLONE      git clone https://github.com/SaamNoLimits/Sima-project.git
RUN        start.bat
URL        http://localhost:8000
HEALTH     curl http://localhost:8000/api/health
DOCS       http://localhost:8000/docs (Swagger)
STOP       Ctrl+C in the cmd window running start.bat
RESET      rmdir /s /q .venv && start.bat
DEV-HMR    Terminal 1: .venv\Scripts\python -m uvicorn backend.main:app --port 8000
           Terminal 2: cd frontend && npm run dev   (then open http://localhost:5173)
SMOKE      .venv\Scripts\python scripts\smoke_test_pkl.py
LOG-PUSH   git status && git log -3   (NEVER push without user approval)
```

---

## 10. Tested environment

This runbook was last verified against:
- Windows 10/11
- Python 3.10 / 3.11 / 3.12 / 3.13
- Node.js 18+ (optional)
- torch `2.10.0+cpu` · fastai `2.8.7` · fastapi `0.136.1` · uvicorn `0.46.0`
- Git 2.40+

If you find a step that doesn't work on a newer environment, update this
file and commit your change with a `chore(claude.md): …` message.
