@echo off
echo ========================================================
echo  Starting GridPulse: React + FastAPI + MongoDB Stack
echo ========================================================
echo.

:: Start FastAPI Backend
echo [1/2] Launching FastAPI Backend on http://localhost:8000 ...
start "GridPulse FastAPI Backend" cmd /k "cd /d %~dp0backend && python run.py"

:: Wait 2 seconds
timeout /t 2 /nobreak >nul

:: Start React Frontend
echo [2/2] Launching React Vite Frontend on http://localhost:5173 ...
start "GridPulse React Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo  GridPulse is running!
echo  - Frontend: http://localhost:5173
echo  - Backend API Docs: http://localhost:8000/docs
echo  - Default Demo Citizen: demo@gridpulse.app / demo1234
echo  - Default Admin: admin@gridpulse.app / admin
echo ========================================================
pause
