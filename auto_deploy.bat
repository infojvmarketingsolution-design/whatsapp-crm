@echo off
setlocal
color 0A
title WhatsApp CRM Auto-Deployment

echo =======================================================
echo     WhatsApp API + CRM Auto-Deployment Script
echo =======================================================
echo.

:: 1. Build the Frontend
echo [STEP 1] Building React Frontend...
cd /d "%~dp0"
echo Running from: %cd%

if exist "frontend" goto :start_build
echo [ERROR] Could not find the 'frontend' directory!
echo Looked in: %cd%
dir /B
pause
exit /b 1

:start_build
cd "frontend"
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b %errorlevel%
)
cd ..

echo [SUCCESS] Frontend build complete. Files updated in backend/public.
echo.

:: 2. Git Synchronization
echo [STEP 2] Preparing to push changes to server...
git status
echo.

set /p confirm="Do you want to commit and push these changes now? (Y/N): "
if /i "%confirm%" neq "Y" (
    echo [INFO] Deployment cancelled. Changes are local only.
    pause
    exit /b 0
)

set /p msg="Enter commit message (e.g. Deploy 30 March 6PM Revert): "
git add .
git commit -m "%msg%"
echo.
echo [STEP 3] Pushing to Remote Repository...
git push origin main

if %errorlevel% neq 0 (
    echo [ERROR] Git push failed! Check your connection or SSH keys.
    pause
    exit /b %errorlevel%
)

echo.
echo =======================================================
echo   DEPLOYMENT SUCCESSFUL!
echo   Restart your Hostinger Node.js app to apply changes.
echo =======================================================
pause
