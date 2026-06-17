@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
set "PS1_FILE=%SCRIPT_DIR%sync-upstream.ps1"

if not exist "%PS1_FILE%" (
    echo sync-upstream.ps1 not found in "%SCRIPT_DIR%"
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PS1_FILE%" %*
exit /b %errorlevel%
