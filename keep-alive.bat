@echo off
cd /d C:\Users\Administrator\.qclaw\workspace-agent-e87418f0\GuardianNew
:loop
node server/index.js
echo Server crashed, restarting in 3s...
timeout /t 3 >nul
goto loop
