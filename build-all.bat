@echo off
REM Callisto Multi-Platform Build Script for Windows
REM Builds the application for Windows and organizes outputs

setlocal enabledelayedexpansion

echo ╔══════════════════════════════════════════════════════════════╗
echo ║          Callisto Multi-Platform Build Script              ║
echo ║                     Windows Build                           ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Get version from package.json
for /f "tokens=2 delims=:, " %%a in ('findstr /r "\"version\"" package.json') do set VERSION=%%~a

set BUILD_DIR=builds
set OS=windows

echo ✓ Version: %VERSION%
echo ✓ Platform: %OS%
echo.

REM Create build directory structure
echo 📁 Creating build directory structure...
if not exist "%BUILD_DIR%\%OS%\v%VERSION%" mkdir "%BUILD_DIR%\%OS%\v%VERSION%"
if not exist "%BUILD_DIR%\latest" mkdir "%BUILD_DIR%\latest"
echo ✓ Build directories created
echo.

REM Clean previous builds
echo 🧹 Cleaning previous builds...
if exist "src-tauri\target\release\bundle" rmdir /s /q "src-tauri\target\release\bundle"
echo ✓ Cleaned
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call pnpm install
    echo ✓ Dependencies installed
    echo.
)

REM Build frontend
echo 🔨 Building frontend...
call pnpm run build
if errorlevel 1 (
    echo ✗ Frontend build failed!
    exit /b 1
)
echo ✓ Frontend built
echo.

REM Build Tauri app
echo 🚀 Building Tauri app for Windows...
echo    This may take several minutes...
call pnpm tauri build
if errorlevel 1 (
    echo ✗ Tauri build failed!
    exit /b 1
)
echo ✓ Tauri build completed
echo.

REM Copy builds to organized directory
echo 📦 Organizing build artifacts...

if exist "src-tauri\target\release\bundle\msi" (
    xcopy /y "src-tauri\target\release\bundle\msi\*.msi" "%BUILD_DIR%\%OS%\v%VERSION%\" >nul 2>&1
    xcopy /y "src-tauri\target\release\bundle\msi\*.msi" "%BUILD_DIR%\latest\" >nul 2>&1
    echo ✓ Copied MSI installers
)

if exist "src-tauri\target\release\bundle\nsis" (
    xcopy /y "src-tauri\target\release\bundle\nsis\*.exe" "%BUILD_DIR%\%OS%\v%VERSION%\" >nul 2>&1
    xcopy /y "src-tauri\target\release\bundle\nsis\*.exe" "%BUILD_DIR%\latest\" >nul 2>&1
    echo ✓ Copied NSIS installers
)

echo.

REM Create build info file
echo Callisto v%VERSION% > "%BUILD_DIR%\%OS%\v%VERSION%\BUILD_INFO.txt"
echo Built on: %date% %time% >> "%BUILD_DIR%\%OS%\v%VERSION%\BUILD_INFO.txt"
echo Platform: %OS% >> "%BUILD_DIR%\%OS%\v%VERSION%\BUILD_INFO.txt"
echo ✓ Created build info file
echo.

REM Success message
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                  ✓ BUILD SUCCESSFUL!                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Build artifacts stored in: %BUILD_DIR%\%OS%\v%VERSION%
echo Latest builds also copied to: %BUILD_DIR%\latest
echo.
echo Next steps:
echo   1. Test the build: Run the installer from the builds directory
echo   2. Distribute: Share files from %BUILD_DIR%\%OS%\v%VERSION%
echo.

endlocal

