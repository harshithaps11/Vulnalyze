@echo off
setlocal enabledelayedexpansion

echo Starting Vulnalyze...

:: Start backend
cd /d "%~dp0backend"
if not exist venv (
    echo Creating virtual environment...
    py -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
py -m pip install --upgrade pip
py -m pip install -r requirements.txt

echo Starting backend server...
start /B py -m uvicorn app.main:app --reload

:: Wait for backend to start
timeout /t 5

:: Start frontend
cd /d "%~dp0frontend"
echo Installing frontend dependencies...
call npm install

echo Starting frontend server...
start /B call npm run dev

echo Vulnalyze is starting up...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000 