@echo off
REM Question Seeding Control Script

if "%1"=="start" goto start
if "%1"=="pause" goto pause
if "%1"=="resume" goto resume
if "%1"=="status" goto status
if "%1"=="reset" goto reset
goto help

:start
echo Starting question generation in background...
start /B node scripts/seed-questions-bg.js --auto > scripts/seed-output.log 2>&1
echo Process started! Check scripts/seed-output.log for progress
goto end

:pause
echo Creating pause flag...
type nul > scripts\seed-pause.flag
echo Pause requested. Generation will stop after current batch.
goto end

:resume
echo Removing pause flag and resuming...
if exist scripts\seed-pause.flag del scripts\seed-pause.flag
start /B node scripts/seed-questions-bg.js --auto >> scripts/seed-output.log 2>&1
echo Resumed! Check scripts/seed-output.log for progress
goto end

:status
if exist scripts\seed-progress.json (
    echo Current progress:
    type scripts\seed-progress.json
) else (
    echo No active seeding session found.
)
if exist scripts\seed-pause.flag (
    echo Status: PAUSED
) else (
    echo Status: RUNNING or NOT STARTED
)
goto end

:reset
echo Resetting progress...
if exist scripts\seed-progress.json del scripts\seed-progress.json
if exist scripts\seed-pause.flag del scripts\seed-pause.flag
echo Progress reset!
goto end

:help
echo Question Seeding Control
echo =======================
echo.
echo Usage: seed-control.bat [command]
echo.
echo Commands:
echo   start    - Start generation in background
echo   pause    - Request pause (stops after current batch)
echo   resume   - Resume from where it left off
echo   status   - Show current progress
echo   reset    - Reset progress and start over
echo.
echo Logs: scripts/seed-output.log
echo Progress: scripts/seed-progress.json
goto end

:end
