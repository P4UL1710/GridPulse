#!/usr/bin/env bash
echo "========================================================"
echo " Starting GridPulse: React + FastAPI + MongoDB Stack"
echo "========================================================"

# Start FastAPI Backend
echo "[1/2] Launching FastAPI Backend on http://localhost:8000 ..."
(cd backend && python run.py) &
BACKEND_PID=$!

sleep 2

# Start React Frontend
echo "[2/2] Launching React Vite Frontend on http://localhost:5173 ..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "========================================================"
echo " GridPulse is running!"
echo " - Frontend: http://localhost:5173"
echo " - Backend API Docs: http://localhost:8000/docs"
echo "========================================================"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
