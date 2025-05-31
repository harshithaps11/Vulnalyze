@echo off
echo Starting Vulnalyze...

:: Start backend
start cmd /k "cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python main.py"

:: Wait for backend to start
timeout /t 5

:: Start frontend
start cmd /k "npm start"

echo Vulnalyze is starting up...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000 