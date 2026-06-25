@echo off
title Movister Local Server
echo =======================================
echo Starting Movister Local Server...
echo =======================================
echo.
echo [1/2] Installing requirements...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install requirements. Make sure Python is installed and added to PATH.
    pause
    exit /b %errorlevel%
)
echo.
echo [2/2] Running main.py...
echo Server will be available at http://127.0.0.1:5055
echo.
python main.py
pause
