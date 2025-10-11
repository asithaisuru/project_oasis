@echo off
title Auto Updating & Starting Frontend and Backend Servers

echo ================================================
echo   Pulling latest code from GitHub repository...
echo ================================================
git pull origin main

if %errorlevel% neq 0 (
    echo.
    echo Failed to pull latest code. Check your internet connection or repo access.
    echo Press any key to exit...
    pause >nul
    exit /b
)

echo.
echo ================================================
echo   Installing dependencies for Frontend...
echo ================================================
cd /d frontend
call npm install
if %errorlevel% neq 0 (
    echo.
    echo Frontend dependencies installation failed.
    echo Press any key to exit...
    pause >nul
    exit /b
)
cd ..

echo.
echo ================================================
echo   Installing dependencies for Backend...
echo ================================================
cd /d backend
call npm install
if %errorlevel% neq 0 (
    echo.
    echo Backend dependencies installation failed.
    echo Press any key to exit...
    pause >nul
    exit /b
)
cd ..

echo.
echo ================================================
echo   Starting Frontend and Backend Servers...
echo ================================================

REM Start frontend in a new command window
start "Frontend Server" cmd /k "cd /d frontend && npm run dev"

REM Start backend in a new command window
start "Backend Server" cmd /k "cd /d backend && npm run dev"

REM Wait a few seconds for servers to boot
timeout /t 5 /nobreak >nul

REM Open frontend in browser
start "" "http://localhost:5173"

echo.
echo Servers started successfully.
pause
