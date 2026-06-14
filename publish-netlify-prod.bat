@echo off
setlocal
cd /d "%~dp0"

pwsh -ExecutionPolicy Bypass -File ".\scripts\deploy-netlify-prod.ps1"

if errorlevel 1 (
  echo.
  echo Netlify production deploy failed.
  pause
)
