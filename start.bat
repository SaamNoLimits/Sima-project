@echo off
REM ════════════════════════════════════════════════════════════════════════
REM  NeuroVista — Windows one-click installer + launcher  (NO Node.js needed)
REM
REM  This script only requires Python 3.10+. The React UI is served by the
REM  FastAPI backend as pre-built static files (frontend/dist/, shipped in
REM  the repo). Everything runs on a single port: http://localhost:8000
REM
REM  Usage : double-click start.bat (or run from cmd in this folder).
REM  Pre-req: Python 3.10+  -->  https://python.org/downloads
REM           (tick "Add Python to PATH" during install)
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

REM ── 2. Create venv if missing ───────────────────────────────────────────
if not exist ".venv\Scripts\python.exe" (
    echo --^> Creating Python virtual environment .venv ...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create venv. Aborting.
        pause & exit /b 1
    )
)

REM ── 3. Install Python deps if fastai missing ────────────────────────────
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

REM ── 4. Sanity-check the pre-built UI ─────────────────────────────────────
if not exist "frontend\dist\index.html" (
    echo [WARN] frontend\dist\ is missing. The app may not render the UI.
    echo        If you have Node.js, run:  cd frontend ^&^& npm install ^&^& npm run build
) else (
    echo [OK] Built UI present in frontend\dist\.
)

echo.
echo ============================================================
echo   Launching NeuroVista
echo ============================================================
echo.
echo   The browser will open at http://localhost:8000
echo   (UI + API both served from this single port)
echo.
echo   To STOP : press Ctrl+C in this window, or close it.
echo.

REM ── 5. Open browser after a short delay (background) ────────────────────
start /b "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:8000"

REM ── 6. Run uvicorn in foreground so Ctrl+C stops the whole stack ────────
.venv\Scripts\python -m uvicorn backend.main:app --port 8000 --host 127.0.0.1
