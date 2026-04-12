@echo off
if not "%1"=="__run__" (
    cmd /k "%~f0" __run__
    exit /b
)
chcp 65001 >nul
setlocal enabledelayedexpansion
title Process Agent Setup
color 0A
cls

echo.
echo  ==================================================
echo    Process Agent - Setup
echo  ==================================================
echo.
echo    [A] Admin
echo    [U] User
echo.
set /p ROLE="  (A/U): "

if /i "%ROLE%"=="a" goto :ADMIN_MENU
if /i "%ROLE%"=="u" goto :USER_MENU
goto :END

:ADMIN_MENU
cls
echo.
echo  ==================================================
echo    Admin Menu
echo  ==================================================
echo.
echo    [1] Initial Setup
echo    [2] Status Check
echo    [3] Reinstall Native Host
echo    [4] Uninstall
echo.
set /p AM="  (1-4): "

if "%AM%"=="1" goto :ADMIN_SETUP
if "%AM%"=="2" goto :STATUS
if "%AM%"=="3" goto :INSTALL_NH
if "%AM%"=="4" goto :UNINSTALL
goto :END

:ADMIN_SETUP
cls
echo.
echo  ==================================================
echo    Step 1/2 : Extension Registration
echo  ==================================================
echo.
echo  [Chrome]
echo    1. chrome://extensions
echo    2. Developer mode ON
echo    3. Load unpacked
echo    4. Select downloaded folder
echo.
echo  [Edge]
echo    1. edge://extensions
echo    2. Developer mode ON
echo    3. Load unpacked
echo    4. Select downloaded folder
echo.
set /p REG="  Already registered? (Y/n): "
if /i "%REG%"=="n" (
    start chrome://extensions
    echo.
    echo  Press any key after registration...
    pause >nul
)

cls
echo.
echo  ==================================================
echo    Step 2/2 : GitHub Info
echo  ==================================================
echo.
echo    URL example: https://github.com/owner/repo
echo.

set DEFAULT_OWNER=seagentadmin-creator
set DEFAULT_REPO=process-agent

set /p GH_OWNER="  GitHub Owner [%DEFAULT_OWNER%]: "
if "%GH_OWNER%"=="" set GH_OWNER=%DEFAULT_OWNER%

set /p GH_REPO="  GitHub Repo [%DEFAULT_REPO%]: "
if "%GH_REPO%"=="" set GH_REPO=%DEFAULT_REPO%

echo [ProcessAgent] > "%~dp0pa-config.ini"
echo GITHUB_OWNER=%GH_OWNER% >> "%~dp0pa-config.ini"
echo GITHUB_REPO=%GH_REPO% >> "%~dp0pa-config.ini"

echo.
call :INSTALL_NH

cls
echo.
echo  ==================================================
echo    Admin Setup Complete
echo  ==================================================
echo.
echo    Repository: %GH_OWNER%/%GH_REPO%
echo    Config: pa-config.ini
echo.
echo    Share with team:
echo      1. GitHub Release URL
echo      2. pa-config.ini
echo.
goto :END

:USER_MENU
cls
echo.
echo  ==================================================
echo    User Menu
echo  ==================================================
echo.
echo    [1] Install
echo    [2] Update
echo    [3] Status Check
echo    [4] Uninstall
echo.
set /p UM="  (1-4): "

if "%UM%"=="1" goto :USER_INSTALL
if "%UM%"=="2" goto :USER_UPDATE
if "%UM%"=="3" goto :STATUS
if "%UM%"=="4" goto :UNINSTALL
goto :END

:USER_INSTALL
cls
echo.
echo  ==================================================
echo    Install Extension
echo  ==================================================
echo.

if not exist "%~dp0pa-config.ini" (
    echo  [ERROR] pa-config.ini not found.
    echo  Please get pa-config.ini from Admin.
    goto :END
)

for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_OWNER" "%~dp0pa-config.ini"') do set GH_OWNER=%%b
for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_REPO" "%~dp0pa-config.ini"') do set GH_REPO=%%b

echo  Repository: %GH_OWNER%/%GH_REPO%
echo.

set DEFAULT_DIR=C:\Extensions\process-agent
set /p INSTALL_DIR="  Install path [%DEFAULT_DIR%]: "
if "%INSTALL_DIR%"=="" set INSTALL_DIR=%DEFAULT_DIR%

echo [User] > "%~dp0pa-user.ini"
echo INSTALL_DIR=%INSTALL_DIR% >> "%~dp0pa-user.ini"

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo.
echo  [1/3] Downloading latest version...
call :DO_DOWNLOAD
if errorlevel 1 goto :ERROR

echo.
echo  [2/3] Register Extension in browser
echo.
echo  [Chrome]
echo    1. chrome://extensions
echo    2. Developer mode ON
echo    3. Load unpacked
echo    4. Select: %INSTALL_DIR%
echo.
echo  [Edge]
echo    1. edge://extensions
echo    2. Developer mode ON
echo    3. Load unpacked
echo    4. Select: %INSTALL_DIR%
echo.

set /p OPEN_EXT="  Open Extensions page? (Y/n): "
if /i not "%OPEN_EXT%"=="n" start chrome://extensions

echo.
echo  Press any key after registration...
pause >nul

echo.
echo  [3/3] Native Host (auto-update)
call :INSTALL_NH

cls
echo.
echo  ==================================================
echo    Install Complete
echo  ==================================================
echo.
echo  Click Process Agent icon in browser.
echo  Side Panel opens = Success!
echo.
echo  --------------------------------------------------
echo    How to Update
echo  --------------------------------------------------
echo.
echo    [Auto] Native Host installed
echo      Extension updates automatically.
echo.
echo    [Manual] No Native Host
echo      Run Setup tool - [U] - [2] Update
echo      Then refresh in chrome://extensions
echo.
goto :END

:USER_UPDATE
cls
echo.
echo  ==================================================
echo    Update
echo  ==================================================
echo.

if not exist "%~dp0pa-config.ini" (
    echo  [ERROR] pa-config.ini not found.
    echo  Run [1] Install first.
    goto :END
)

for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_OWNER" "%~dp0pa-config.ini"') do set GH_OWNER=%%b
for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_REPO" "%~dp0pa-config.ini"') do set GH_REPO=%%b

if exist "%~dp0pa-user.ini" (
    for /f "tokens=1,* delims==" %%a in ('findstr "INSTALL_DIR" "%~dp0pa-user.ini"') do set INSTALL_DIR=%%b
) else (
    set INSTALL_DIR=C:\Extensions\process-agent
)

echo  Repository: %GH_OWNER%/%GH_REPO%
echo  Path: %INSTALL_DIR%
echo.

echo  Downloading latest version...
call :DO_DOWNLOAD
if errorlevel 1 goto :ERROR

echo.
echo  ==================================================
echo    Update Complete
echo  ==================================================
echo.
echo  Refresh Process Agent in chrome://extensions
echo.
set /p OE="  Open Extensions page? (Y/n): "
if /i not "%OE%"=="n" start chrome://extensions
goto :END

:STATUS
cls
echo.
echo  ==================================================
echo    Status Check
echo  ==================================================
echo.

if exist "%~dp0pa-config.ini" (
    echo  [OK] Config file exists
    for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_OWNER" "%~dp0pa-config.ini"') do echo       GitHub: %%b
) else (
    echo  [--] Config file not found
)

if exist "%~dp0pa-user.ini" (
    for /f "tokens=1,* delims==" %%a in ('findstr "INSTALL_DIR" "%~dp0pa-user.ini"') do echo  [OK] Install path: %%b
) else (
    echo  [--] User config not found
)

if exist "%LOCALAPPDATA%\ProcessAgent\updater.py" (
    echo  [OK] Native Host installed
) else (
    echo  [--] Native Host not installed
)

reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.process_agent.updater" >nul 2>&1
if %errorlevel%==0 (echo  [OK] Registry Chrome) else (echo  [--] Registry Chrome)

reg query "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.process_agent.updater" >nul 2>&1
if %errorlevel%==0 (echo  [OK] Registry Edge) else (echo  [--] Registry Edge)

python --version >nul 2>&1
if %errorlevel%==0 (echo  [OK] Python installed) else (echo  [--] Python not installed)

curl -s --connect-timeout 5 https://api.github.com >nul 2>&1
if %errorlevel%==0 (echo  [OK] GitHub accessible) else (echo  [--] GitHub not accessible)

echo.
goto :END

:UNINSTALL
cls
echo.
echo  ==================================================
echo    Uninstall
echo  ==================================================
echo.
set /p CF="  Continue? (y/N): "
if /i not "%CF%"=="y" goto :END

echo.
reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.process_agent.updater" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.process_agent.updater" /f >nul 2>&1
echo  [OK] Registry removed

if exist "%LOCALAPPDATA%\ProcessAgent" (
    rmdir /s /q "%LOCALAPPDATA%\ProcessAgent"
    echo  [OK] Native Host removed
)

if exist "%~dp0pa-config.ini" del "%~dp0pa-config.ini"
if exist "%~dp0pa-user.ini" del "%~dp0pa-user.ini"
echo  [OK] Config removed

echo.
echo  Also remove Extension from chrome://extensions
echo.
goto :END

:: ==================================================
::  Native Host Install
:: ==================================================
:INSTALL_NH
echo.
python --version >nul 2>&1
if errorlevel 1 (
    echo  --------------------------------------------------
    echo    Python not installed - Auto-update disabled
    echo  --------------------------------------------------
    echo.
    echo    Manual update method:
    echo      1. Run Setup tool
    echo      2. Select [U] User
    echo      3. Select [2] Update
    echo      4. Refresh in chrome://extensions
    echo.
    echo    Install Python for auto-update:
    echo    https://www.python.org/downloads/
    echo    Check "Add Python to PATH"
    echo.
    exit /b 0
)

echo  Extension ID auto-detection...
set EXT_ID=

set PREFS_FILE=%LOCALAPPDATA%\Google\Chrome\User Data\Default\Preferences
if exist "%PREFS_FILE%" (
    for /f "tokens=*" %%a in ('powershell -Command "try { $j = Get-Content '%PREFS_FILE%' -Raw | ConvertFrom-Json; $j.extensions.settings.PSObject.Properties | ForEach-Object { if ($_.Value.manifest.name -eq 'Process Agent') { $_.Name } } } catch {}" 2^>nul') do set EXT_ID=%%a
)

if "%EXT_ID%"=="" (
    set PREFS_FILE=%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Preferences
    if exist "!PREFS_FILE!" (
        for /f "tokens=*" %%a in ('powershell -Command "try { $j = Get-Content '!PREFS_FILE!' -Raw | ConvertFrom-Json; $j.extensions.settings.PSObject.Properties | ForEach-Object { if ($_.Value.manifest.name -eq 'Process Agent') { $_.Name } } } catch {}" 2^>nul') do set EXT_ID=%%a
    )
)

if not "%EXT_ID%"=="" (
    echo  [OK] Detected: %EXT_ID%
) else (
    echo  Auto-detection failed.
    echo  Copy Extension ID from chrome://extensions
    echo.
    set /p EXT_ID="  Extension ID: "
    if "!EXT_ID!"=="" (
        echo  Skipped. Use manual update.
        exit /b 0
    )
)

set NH_DIR=%LOCALAPPDATA%\ProcessAgent
if not exist "%NH_DIR%" mkdir "%NH_DIR%"

for /f "tokens=*" %%a in ('where python 2^>nul') do set PY_PATH=%%a

copy "%~dp0updater.py" "%NH_DIR%\updater.py" >nul 2>&1

echo @echo off > "%NH_DIR%\run_updater.bat"
echo "%PY_PATH%" "%NH_DIR%\updater.py" >> "%NH_DIR%\run_updater.bat"

echo {"name":"com.process_agent.updater","description":"PA Updater","path":"%NH_DIR:\=\\%\\run_updater.bat","type":"stdio","allowed_origins":["chrome-extension://%EXT_ID%/"]} > "%NH_DIR%\manifest.chrome.json"
echo {"name":"com.process_agent.updater","description":"PA Updater","path":"%NH_DIR:\=\\%\\run_updater.bat","type":"stdio","allowed_origins":["chrome-extension://%EXT_ID%/"]} > "%NH_DIR%\manifest.edge.json"

reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.process_agent.updater" /ve /t REG_SZ /d "%NH_DIR%\manifest.chrome.json" /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.process_agent.updater" /ve /t REG_SZ /d "%NH_DIR%\manifest.edge.json" /f >nul 2>&1

echo  [OK] Native Host installed (auto-update enabled)
exit /b 0

:: ==================================================
::  Download
:: ==================================================
:DO_DOWNLOAD
set TEMP_DIR=%TEMP%\pa-update
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

curl -s "https://api.github.com/repos/%GH_OWNER%/%GH_REPO%/releases/latest" > "%TEMP_DIR%\release.json" 2>nul
if errorlevel 1 (
    echo  [ERROR] GitHub connection failed.
    exit /b 1
)

for /f "tokens=2 delims=:," %%a in ('findstr "tag_name" "%TEMP_DIR%\release.json"') do (
    set NEW_VER=%%~a
    echo  Latest: %%~a
)

set ZIP_URL=
for /f "usebackq tokens=2 delims=: " %%a in (`findstr "browser_download_url" "%TEMP_DIR%\release.json"`) do set ZIP_URL=%%~a
set ZIP_URL=https:%ZIP_URL%

if "%ZIP_URL%"=="https:" (
    echo  [ERROR] No zip in Release.
    exit /b 1
)

curl -sL -o "%TEMP_DIR%\update.zip" "%ZIP_URL%"
powershell -Command "Expand-Archive -Force '%TEMP_DIR%\update.zip' '%INSTALL_DIR%'" 2>nul

del /q "%TEMP_DIR%\release.json" "%TEMP_DIR%\update.zip" 2>nul
echo  [OK] Download complete
exit /b 0

:ERROR
echo.
echo  [ERROR] Something went wrong.
goto :END

:END
echo.
echo  Press any key to close...
pause >nul
