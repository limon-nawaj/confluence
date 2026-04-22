#!/bin/bash
echo "Starting UniDocs Servers..."

# Start Backend
echo "[1/2] Launching Backend API..."
(cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000) &
BACKEND_PID=$!

# Start Frontend
echo "[2/2] Launching Frontend App..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# Automatically kill both child processes when you press Ctrl+C
trap "echo -e '\nStopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

echo "Both servers are running! Press Ctrl+C to stop them."
# Wait for background jobs to prevent the script from exiting immediately
wait $BACKEND_PID $FRONTEND_PID
