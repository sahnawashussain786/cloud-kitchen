@echo off
rem ============================================================
rem  Shahnaz Kitchen - one-command launcher
rem  Starts the Express API (in-memory MongoDB) and the Vite
rem  frontend together. Press Ctrl+C in this window to stop both.
rem ============================================================

cd /d "%~dp0"

echo Starting Shahnaz Kitchen (backend + frontend)...
npm run dev
pause
