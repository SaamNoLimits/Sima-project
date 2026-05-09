@echo off
REM ════════════════════════════════════════════════════════════════════════
REM  NeuroVista — Windows one-click installer + launcher
REM  Double-click this file (or run from cmd) to install everything on first
REM  run and launch the stack on every run.
REM
REM  Requires : Python 3.10+ (https://python.org)  ·  Node.js 18+ (https://nodejs.org)
REM ════════════════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================================
echo   NeuroVista — Brain Tumor MRI Classifier
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

REM ── 2. Node check ───────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo         Install Node.js 18+ from https://nodejs.org
    pause & exit /b 1
)
for /f "delims=" %%v in ('node --version') do echo [OK] Node %%v

echo.

REM ── 3. Create venv if missing ───────────────────────────────────────────
if not exist ".venv\Scripts\python.exe" (
    echo --^> Creating Python virtual environment .venv ...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create venv. Aborting.
        pause & exit /b 1
    )
)

REM ── 4. Install Python deps if fastai missing ────────────────────────────
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

REM ── 5. Install npm deps if missing ──────────────────────────────────────
if not exist "frontend\node_modules" (
    echo --^> Installing frontend dependencies ^(npm install^)...
    pushd frontend
    call npm install --silent
    if errorlevel 1 (
        echo [ERROR] npm install failed. Aborting.
        popd & pause & exit /b 1
    )
    popd
    echo [OK] Frontend dependencies installed.
) else (
    echo [OK] Frontend dependencies already installed.
)

echo.
echo ============================================================
echo   Launching the stack
echo ============================================================
echo.

REM ── 6. Start backend in new window ──────────────────────────────────────
echo --^> Starting backend on http://localhost:8000 ...
start "NeuroVista API"  cmd /k ".venv\Scripts\python -m uvicorn backend.main:app --port 8000 --host 127.0.0.1"

REM ── 7. Wait briefly for backend to bind ─────────────────────────────────
timeout /t 3 /nobreak >nul

REM ── 8. Start frontend in new window ─────────────────────────────────────
echo --^> Starting frontend on http://localhost:5173 ...
start "NeuroVista UI"   cmd /k "cd frontend && npm run dev"

REM ── 9. Wait then open browser ───────────────────────────────────────────
timeout /t 4 /nobreak >nul
echo --^> Opening browser...
start http://localhost:5173

echo.
echo ============================================================
echo   Running !
echo ============================================================
echo   - Frontend : http://localhost:5173
echo   - Backend  : http://localhost:8000
echo   - API docs : http://localhost:8000/docs
echo ------------------------------------------------------------
echo  To STOP : close the two terminal windows that just opened.
echo ============================================================
echo.
pause
