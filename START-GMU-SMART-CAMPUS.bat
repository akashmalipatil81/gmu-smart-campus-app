@echo off
cd /d "%~dp0"
start "GMU Java Backend" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0backend\run-backend.ps1"
start "GMU React Frontend" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0frontend\run-frontend.ps1"
timeout /t 5 >nul
start http://localhost:5173
