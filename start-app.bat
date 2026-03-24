@echo off
echo Starting WhatsApp CRM Backend...
start cmd /k "cd backend && npm run dev"

echo Starting WhatsApp CRM Frontend...
start cmd /k "cd frontend && npm run dev"

echo Servers are starting in new windows. You can close this window.
pause
