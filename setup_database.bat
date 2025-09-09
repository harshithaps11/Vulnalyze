@echo off
setlocal enabledelayedexpansion

echo Starting database setup...

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

echo Running database setup...
py setup_db.py
if errorlevel 1 (
    echo.
    echo Setup failed! Please check the error messages above.
    pause
    exit /b 1
)

cd /d "%~dp0"
echo Database setup completed successfully!
pause 