@echo off
REM Employee Management System - Setup Script (Windows)
REM This script helps set up the EMS project

echo.
echo ==================================================
echo Employee Management System - Setup
echo ==================================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Node.js is not installed
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo + Node.js installed: 
node --version

echo + npm installed: 
npm --version
echo.

REM Install dependencies
echo Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo X Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo + Dependencies installed successfully!
echo.
echo ==================================================
echo Available commands:
echo ==================================================
echo   npm run dev       - Start development server
echo   npm run build     - Build for production
echo   npm run preview   - Preview production build
echo   npm run type-check - Run TypeScript type checking
echo.
echo To start development: npm run dev
echo ==================================================
echo.
pause
