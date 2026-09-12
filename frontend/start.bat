@echo off
title RConnect - LAN
color 0A
echo ============================================
echo [1/3] Demarrage MongoDB...
start "MongoDB" mongod --dbpath C:\data\db --bind_ip 0.0.0.0
timeout /t 3 /nobreak > nul

echo [2/3] Demarrage Backend (port 5001)...
cd /d C:\Users\frede\RCconnect\backend
start "Backend" cmd /k "set PORT=5001 && npm start"
timeout /t 3 /nobreak > nul

echo [3/3] Demarrage Frontend (port 5173)...
cd /d C:\Users\frede\RCconnect\frontend
start "Frontend" cmd /k "npm run dev -- --host 0.0.0.0"
timeout /t 2 /nobreak > nul

echo ============================================
echo IP du serveur :
ipconfig | findstr "IPv4"
echo.
echo ACCES DEPUIS LE TELEPHONE :
echo Frontend : http://192.168.1.171:5173
echo Backend  : http://192.168.1.171:5001
echo ============================================
pause