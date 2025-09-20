@echo off
title Wynk Music Server
echo ===============================================
echo           WYNK MUSIC SERVER
echo ===============================================
echo.
echo Starting HTTP server on port 8000...
echo.
echo Access your Wynk Music player at:
echo   http://localhost:8000
echo   http://localhost:8000/wynk-index.html
echo.
echo Press Ctrl+C to stop the server
echo ===============================================
echo.

cd /d "%~dp0"
python -m http.server 8000