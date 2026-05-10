@echo off
REM ════════════════════════════════════════════════════════════════════════
REM  NeuroVista — Windows one-click installer + launcher
REM
REM  Every double-click is a FRESH start:
REM    1. Kills any uvicorn already listening on :8000 (clean restart)
REM    2. Drops Python __pycache__ to avoid stale imports
REM    3. Opens browser at /?reset=1 — the React app clears localStorage
REM       (user, history, all cached state) so the session is brand new
REM
REM  Pre-req : Python 3.10+  (https://python.org — tick "Add Python to PATH")
REM  Stack   : single port 8000 (FastAPI serves UI + API).
REM ════════════════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================================
echo   NeuroVista - Brain Tumor MRI Classifier
echo ============================================================
echo.

REM ── 1. Python check ─────────────────────────────────────────────────────
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo         Install Python 3.10+ from https://python.org/downloads
    echo         Make sure to tick "Add Python to PATH" during install.
    pause & exit /b 1
)
for /f "delims=" %%v in ('python --version') do echo [OK] %%v
echo.

REM ── 2. Kill any old uvicorn on port 8000 (clean slate) ──────────────────
echo --^> Cleaning old session ^(killing any uvicorn on :8000^)...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":8000.*LISTENING" 2^>nul') do (
    taskkill /F /PID %%P >nul 2>&1
    echo [OK] Stopped previous backend ^(PID %%P^)
)

REM ── 3. Drop any stale Python bytecode cache ─────────────────────────────
if exist "backend\__pycache__"  rmdir /s /q "backend\__pycache__"  >nul 2>&1
if exist "src\__pycache__"      rmdir /s /q "src\__pycache__"      >nul 2>&1

REM ── 4. Create venv if missing ───────────────────────────────────────────
if not exist ".venv\Scripts\python.exe" (
    echo --^> Creating Python virtual environment .venv ...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create venv. Aborting.
        pause & exit /b 1
    )
)

REM ── 5. Install Python deps if fastai missing ────────────────────────────
.venv\Scripts\python -c "import fastai" >nul 2>&1
if errorlevel 1 (
    echo --^> Installing PyTorch CPU + fastai + FastAPI ^(takes 5-15 min on first run^)...
    .venv\Scripts\python -m pip install --upgrade pip --quiet
    .venv\Scripts\python -m pip install --extra-index-url https://download.pytorch.org/whl/cpu "torch>=2.0,<2.11" torchvision || (echo [ERROR] torch install failed & pause & exit /b 1)
    .venv\Scripts\python -m pip install --no-deps "fastai==2.8.7" fastcore fastdownload fastprogress "fastapi>=0.110" "uvicorn[standard]>=0.27" python-multipart pandas scikit-learn pyyaml requests packaging matplotlib || (echo [ERROR] fastai install failed & pause & exit /b 1)
    .venv\Scripts\python -m pip install --quiet starlette pydantic anyio sniffio pyparsing kiwisolver cycler fonttools contourpy python-dateutil pytz tzdata scipy joblib threadpoolctl h11 click annotated_doc urllib3 charset-normalizer idna certifi plum-dispatch fasttransform python-fasthtml cloudpickle ipython || (echo [WARN] some transitive deps failed - may need manual install)
    echo [OK] Python dependencies installed.
) else (
    echo [OK] Python dependencies already installed.
)

REM ── 6. Sanity-check the pre-built UI ─────────────────────────────────────
if not exist "frontend\dist\index.html" (
    echo [WARN] frontend\dist\ is missing. The UI will not render.
    echo        If you have Node.js, run:  cd frontend ^&^& npm install ^&^& npm run build
) else (
    echo [OK] Built UI present in frontend\dist\.
)

echo.
echo ============================================================
echo   Launching NeuroVista
echo ============================================================
echo.
echo   Browser will open at http://localhost:8000/?reset=1
echo   ^(?reset=1 wipes the previous session - user, history, cache^)
echo.
echo   To STOP : press Ctrl+C in this window, or close it.
echo.

REM ── 7. Open browser AFTER backend has bound the port (4 s delay) ────────
REM    Use a unique cache-buster (%RANDOM%) so the browser bypasses any URL
REM    cache from a previous launch.
start /b "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:8000/?reset=1&t=%RANDOM%"

REM ── 8. Run uvicorn in foreground so Ctrl+C stops the whole stack ────────
.venv\Scripts\python -m uvicorn backend.main:app --port 8000 --host 127.0.0.1
