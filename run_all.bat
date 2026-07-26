@echo off
echo Starting Sports Event Manager Services...

start "FastAPI AI Microservice (Port 8000)" cmd /k "cd Backend\ai_service && python -m uvicorn main:app --port 8000"
start "Express Backend API (Port 5000)" cmd /k "cd Backend\server && node index.js"
start "React Client Frontend (Port 3000)" cmd /k "cd Client && npm run dev"

echo All services launched!
echo Open http://localhost:3000 in your browser.
