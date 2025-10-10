@echo off
title Starting Frontend and Backend Servers

echo Starting frontend and backend development servers...

REM Start frontend in a new command window
start "Frontend Server" cmd /k "cd /d frontend && npm run dev"

REM Start backend in a new command window  
start "Backend Server" cmd /k "cd /d backend && npm run dev"

REM Wait a moment for the dev server to start
timeout /t 5 /nobreak >nul

REM Open the frontend URL in default browser
start "" "http://localhost:5173"
