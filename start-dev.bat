@echo off
echo Starting Slop Cultivator Development Servers...
echo.
echo Game:       http://localhost:5173/
echo Admin Tool: http://localhost:5177/
echo.
echo Press Ctrl+C to stop both servers
echo.

start "Game Server" cmd /k "npm run dev"
start "Admin Server" cmd /k "npm run dev:admin"
