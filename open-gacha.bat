@echo off
setlocal
cd /d "%~dp0"

set "PORT=5173"
set "URL=http://127.0.0.1:%PORT%/gacha"

netstat -ano | findstr /C:":%PORT%" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo Dev server is not running. Starting it in a new window...
  start "study-musume dev" cmd /k "cd /d ""%~dp0"" && npm run dev:main"
)

echo Waiting for http://127.0.0.1:%PORT% ...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$deadline=(Get-Date).AddSeconds(30);" ^
  "do {" ^
  "  try {" ^
  "    $r=Invoke-WebRequest -Uri 'http://127.0.0.1:%PORT%' -UseBasicParsing -TimeoutSec 2;" ^
  "    if ($r.StatusCode -eq 200) { exit 0 }" ^
  "  } catch {}" ^
  "  Start-Sleep -Milliseconds 700" ^
  "} while ((Get-Date) -lt $deadline);" ^
  "exit 1"

if errorlevel 1 (
  echo.
  echo The dev server did not become ready in time.
  pause
  exit /b 1
)

start "" "%URL%"
echo Opened %URL%
