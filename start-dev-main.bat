@echo off
setlocal
cd /d "%~dp0"

echo Starting Vite dev server on http://127.0.0.1:5173
call npm run dev:main

if errorlevel 1 (
  echo.
  echo Failed to start the dev server.
  pause
)
