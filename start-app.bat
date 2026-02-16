@echo off
cd /d "%~dp0"
echo Starting Job Notification Tracker...
echo.
echo Server running at: http://localhost:5500/job-notification-tracker/
echo Keep this window open. Close it to stop the server.
echo.
start "JNT Server" cmd /k "cd /d %~dp0 && python -m http.server 5500"
timeout /t 3 /nobreak >nul
start http://localhost:5500/job-notification-tracker/
echo.
echo Browser should open automatically. If not, visit:
echo http://localhost:5500/job-notification-tracker/
pause
