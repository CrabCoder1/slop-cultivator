@echo off
echo Clearing Supabase MCP cached credentials...
echo.

REM Clear npx cache directories
if exist "%LOCALAPPDATA%\npm-cache\_npx" (
    echo Clearing LOCALAPPDATA npm cache...
    rmdir /s /q "%LOCALAPPDATA%\npm-cache\_npx" 2>nul
)

if exist "%APPDATA%\npm-cache\_npx" (
    echo Clearing APPDATA npm cache...
    rmdir /s /q "%APPDATA%\npm-cache\_npx" 2>nul
)

REM Clear Supabase temp data
if exist "%TEMP%\.supabase" (
    echo Clearing TEMP Supabase data...
    rmdir /s /q "%TEMP%\.supabase" 2>nul
)

if exist "%USERPROFILE%\.supabase" (
    echo Clearing user Supabase data...
    rmdir /s /q "%USERPROFILE%\.supabase" 2>nul
)

REM Clear npx cache using npm tool
echo Running npx cache clear...
call npx clear-npx-cache

echo.
echo Done! Restart Kiro or reconnect the MCP server.
pause
