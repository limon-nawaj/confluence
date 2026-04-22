@echo off
echo Starting UniDocs Servers...

echo [1/2] Launching Backend API...
start cmd /title "UniDocs Backend" /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo [2/2] Launching Frontend App...
start cmd /title "UniDocs Frontend" /k "cd frontend && npm run dev"

echo Done! Both servers are starting in separate windows.
echo You can safely close this window.
