#!/usr/bin/env bash
# Launch the FastAPI backend (port 8000) and Vite frontend (port 5173).
# Both processes share this terminal; Ctrl-C stops both.

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

cleanup() {
    echo ""
    echo "→ Stopping backend and frontend…"
    [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
    [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
    wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "======================================"
echo "  Brain Tumor MRI Classifier — start  "
echo "======================================"

# 1. Frontend deps
if [ ! -d "frontend/node_modules" ]; then
    echo "→ Installing frontend deps (npm install)…"
    (cd frontend && npm install --silent)
fi

# 2. Backend — prefer the project venv if it exists
if [ -x ".venv/bin/python" ]; then
    PY=".venv/bin/python"
    echo "→ Using project venv: $PY"
else
    PY="python"
    echo "→ Using system python (consider: python -m venv .venv && .venv/bin/pip install -r requirements.txt)"
fi
echo "→ Starting backend on http://localhost:8000 …"
"$PY" -m uvicorn backend.main:app --reload --port 8000 --host 0.0.0.0 &
BACKEND_PID=$!

# 3. Frontend
echo "→ Starting frontend on http://localhost:5173 …"
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "▶ Backend  : http://localhost:8000   (docs: /docs)"
echo "▶ Frontend : http://localhost:5173"
echo "  Press Ctrl-C to stop."
echo ""

wait
