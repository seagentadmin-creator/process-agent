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

rem === setup.bat은 반드시 Extension 폴더 안에 있어야 함 ===
set EXT_DIR=%~dp0
if "%EXT_DIR:~-1%"=="\" set EXT_DIR=%EXT_DIR:~0,-1%

echo.
echo  ==================================================
echo    Process Agent - Setup / Update
echo  ==================================================
echo.
echo    Extension folder: %EXT_DIR%
echo.

rem Extension 파일 존재 확인
if not exist "%EXT_DIR%\manifest.json" (
    echo  [WARNING] manifest.json not found in this folder.
    echo  This setup.bat must be in the Extension folder.
    echo.
    echo  Expected structure:
    echo    %EXT_DIR%\
    echo      manifest.json
    echo      sidepanel.js
    echo      setup.bat   ^<-- you are here
    echo.
    set /p CUSTOM_DIR="  Enter Extension folder path (or Enter to skip): "
    if not "!CUSTOM_DIR!"=="" set EXT_DIR=!CUSTOM_DIR!
)

echo    [A] Admin  (Initial Setup / Config)
echo    [U] User   (Install / Update)
echo    [S] Status Check
echo.
set /p ROLE="  (A/U/S): "

if /i "%ROLE%"=="a" goto :ADMIN_MENU
if /i "%ROLE%"=="u" goto :USER_MENU
if /i "%ROLE%"=="s" goto :STATUS
goto :END

rem ============================================================
rem  ADMIN
rem ============================================================
:ADMIN_MENU
cls
echo.
echo  ==================================================
echo    Admin Setup
echo  ==================================================
echo.
echo    Extension folder: %EXT_DIR%
echo.
echo    [1] Initial Setup (GitHub URL + Extension)
echo    [2] Update (Download latest to this folder)
echo    [3] Change GitHub URL
echo.
set /p AM="  (1-3): "

if "%AM%"=="1" goto :ADMIN_SETUP
if "%AM%"=="2" goto :DO_UPDATE
if "%AM%"=="3" goto :CHANGE_GITHUB
goto :END

:ADMIN_SETUP
cls
echo.
echo  ==================================================
echo    Step 1/2 : Register Extension in Browser
echo  ==================================================
echo.
echo  [Chrome]
echo    1. Open chrome://extensions
echo    2. Enable "Developer mode" (top right)
echo    3. Click "Load unpacked"
echo    4. Select folder: %EXT_DIR%
echo.
echo  [Edge]
echo    1. Open edge://extensions
echo    2. Enable "Developer mode"
echo    3. Click "Load unpacked"
echo    4. Select folder: %EXT_DIR%
echo.
echo  IMPORTANT:
echo    Always load from THIS folder: %EXT_DIR%
echo    Updates overwrite files here. ID stays the same.
echo    Settings are preserved automatically.
echo.
set /p REG="  Already registered? (Y/n): "
if /i "%REG%"=="n" (
    start chrome://extensions
    echo.
    echo  Press any key after registration...
    pause >nul
)

:CHANGE_GITHUB
cls
echo.
echo  ==================================================
echo    Step 2/2 : GitHub Repository URL
echo  ==================================================
echo.
echo    Public:     https://github.com/owner/repo
echo    Enterprise: https://github.company.com/owner/repo
echo.

set DEFAULT_URL=https://github.com/seagentadmin-creator/process-agent

set /p GH_URL="  GitHub URL [%DEFAULT_URL%]: "
if "%GH_URL%"=="" set GH_URL=%DEFAULT_URL%

if "%GH_URL:~-1%"=="/" set GH_URL=%GH_URL:~0,-1%

for /f "tokens=1,2,3,4,5 delims=/" %%a in ("%GH_URL%") do (
    set GH_PROTO=%%a
    set GH_HOST=%%c
    set GH_OWNER=%%d
    set GH_REPO=%%e
)

echo %GH_HOST% | findstr /c:"github.com" >nul
if %ERRORLEVEL%==0 (
    set GH_API=https://api.github.com
) else (
    set GH_API=https://%GH_HOST%/api/v3
)

echo.
echo    Host:  %GH_HOST%
echo    Owner: %GH_OWNER%
echo    Repo:  %GH_REPO%
echo    API:   %GH_API%

echo [ProcessAgent] > "%EXT_DIR%\pa-config.ini"
echo GITHUB_URL=%GH_URL% >> "%EXT_DIR%\pa-config.ini"
echo GITHUB_API=%GH_API% >> "%EXT_DIR%\pa-config.ini"
echo GITHUB_OWNER=%GH_OWNER% >> "%EXT_DIR%\pa-config.ini"
echo GITHUB_REPO=%GH_REPO% >> "%EXT_DIR%\pa-config.ini"
echo INSTALL_DIR=%EXT_DIR% >> "%EXT_DIR%\pa-config.ini"

echo.
echo  [OK] Config saved.
echo  Press any key...
pause >nul
goto :END

rem ============================================================
rem  USER
rem ============================================================
:USER_MENU
cls
echo.
echo  ==================================================
echo    User Menu
echo  ==================================================
echo.
echo    Extension folder: %EXT_DIR%
echo.
echo    [1] First Install (register extension)
echo    [2] Update (download latest to this folder)
echo.
set /p UM="  (1/2): "

if "%UM%"=="1" goto :USER_INSTALL
if "%UM%"=="2" goto :DO_UPDATE
goto :END

:USER_INSTALL
cls
echo.
echo  ==================================================
echo    Register Extension
echo  ==================================================
echo.
echo  Open Chrome or Edge:
echo    chrome://extensions  or  edge://extensions
echo.
echo  1. Enable "Developer mode"
echo  2. Click "Load unpacked"
echo  3. Select: %EXT_DIR%
echo.
echo  After registration, open Extension settings:
echo    Click Process Agent icon (side panel opens)
echo    Click gear icon → enter Jira URL, PAT, Project Key
echo.
echo  Press any key after registration...
pause >nul
echo  [OK] Done.
pause >nul
goto :END

rem ============================================================
rem  UPDATE
rem ============================================================
:DO_UPDATE
cls
echo.
echo  ==================================================
echo    Update - Download Latest Release
echo  ==================================================
echo.
echo    Target folder: %EXT_DIR%
echo.

if not exist "%EXT_DIR%\pa-config.ini" (
    echo  [ERROR] pa-config.ini not found in %EXT_DIR%
    echo  Run Admin Setup first.
    pause >nul
    goto :END
)

for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_API" "%EXT_DIR%\pa-config.ini"') do set GH_API=%%b
for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_OWNER" "%EXT_DIR%\pa-config.ini"') do set GH_OWNER=%%b
for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_REPO" "%EXT_DIR%\pa-config.ini"') do set GH_REPO=%%b

echo    GitHub: %GH_OWNER%/%GH_REPO%
echo    API:    %GH_API%
echo.

curl -s --connect-timeout 5 %GH_API% >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Cannot reach %GH_API%
    echo  Check network or VPN.
    pause >nul
    goto :END
)

echo  [1/4] Checking latest release...
set TEMP_DIR=%TEMP%\pa-update
if exist "%TEMP_DIR%" rd /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

curl -s "%GH_API%/repos/%GH_OWNER%/%GH_REPO%/releases/latest" > "%TEMP_DIR%\release.json" 2>nul

set NEW_VER=
for /f "usebackq tokens=2 delims=:, " %%a in (`findstr "tag_name" "%TEMP_DIR%\release.json"`) do set NEW_VER=%%~a
if "%NEW_VER%"=="" (
    echo  [ERROR] No release found. Check GitHub URL.
    pause >nul
    goto :END
)

rem Current version
set CUR_VER=unknown
if exist "%EXT_DIR%\manifest.json" (
    for /f "usebackq tokens=2 delims=:, " %%a in (`findstr "version" "%EXT_DIR%\manifest.json"`) do set CUR_VER=%%~a
)

echo    Current: %CUR_VER%
echo    Latest:  %NEW_VER%
echo.

set ZIP_URL=
for /f "usebackq tokens=2 delims=: " %%a in (`findstr "browser_download_url" "%TEMP_DIR%\release.json"`) do set ZIP_URL=%%~a
set ZIP_URL=https:%ZIP_URL%

if "%ZIP_URL%"=="https:" (
    echo  [ERROR] No download asset in release.
    pause >nul
    goto :END
)

echo  [2/4] Downloading %NEW_VER%...
curl -sL -o "%TEMP_DIR%\update.zip" "%ZIP_URL%"

if not exist "%TEMP_DIR%\update.zip" (
    echo  [ERROR] Download failed.
    pause >nul
    goto :END
)

echo  [3/4] Extracting to %EXT_DIR% ...
echo.
echo    Files will be overwritten in:
echo    %EXT_DIR%
echo.
echo    Your settings (Jira URL, PAT, etc) are stored
echo    in Chrome sync storage, NOT in these files.
echo    pa-config.ini (GitHub URL) is also preserved.
echo.
set /p CONFIRM="  Continue? (Y/n): "
if /i "%CONFIRM%"=="n" goto :END

rem Backup pa-config.ini
copy "%EXT_DIR%\pa-config.ini" "%TEMP_DIR%\pa-config.ini.bak" >nul 2>&1

rem Extract (overwrite)
powershell -command "Expand-Archive -Path '%TEMP_DIR%\update.zip' -DestinationPath '%EXT_DIR%' -Force" 2>nul

rem Restore pa-config.ini
copy "%TEMP_DIR%\pa-config.ini.bak" "%EXT_DIR%\pa-config.ini" >nul 2>&1

echo  [4/4] Cleaning up...
rd /s /q "%TEMP_DIR%" 2>nul

echo.
echo  ====================================
echo    Updated: %CUR_VER% → %NEW_VER%
echo  ====================================
echo.
echo  Next step:
echo    Chrome → chrome://extensions
echo    → Process Agent → Click reload icon
echo    (or Edge → edge://extensions → reload)
echo.
echo  Press any key...
pause >nul
goto :END

rem ============================================================
rem  STATUS
rem ============================================================
:STATUS
cls
echo.
echo  ==================================================
echo    Status Check
echo  ==================================================
echo.
echo    Extension folder: %EXT_DIR%
echo.

if exist "%EXT_DIR%\manifest.json" (
    echo    [OK] Extension files found
    for /f "usebackq tokens=2 delims=:, " %%a in (`findstr "version" "%EXT_DIR%\manifest.json"`) do echo       Version: %%~a
) else (
    echo    [!!] Extension files NOT found in %EXT_DIR%
)
echo.

if exist "%EXT_DIR%\pa-config.ini" (
    echo    [OK] pa-config.ini found
    for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_URL" "%EXT_DIR%\pa-config.ini"') do echo       GitHub: %%b
    echo.

    for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_API" "%EXT_DIR%\pa-config.ini"') do set GH_API=%%b
    for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_OWNER" "%EXT_DIR%\pa-config.ini"') do set GH_OWNER=%%b
    for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_REPO" "%EXT_DIR%\pa-config.ini"') do set GH_REPO=%%b

    curl -s --connect-timeout 5 "!GH_API!/repos/!GH_OWNER!/!GH_REPO!/releases/latest" > "%TEMP%\pa-status.json" 2>nul
    for /f "usebackq tokens=2 delims=:, " %%a in (`findstr "tag_name" "%TEMP%\pa-status.json"`) do echo    Latest release: %%~a
    del "%TEMP%\pa-status.json" 2>nul
) else (
    echo    [!!] pa-config.ini NOT found (run Admin Setup)
)
echo.
echo  Press any key...
pause >nul
goto :END

:END
echo.
echo  Bye!
endlocal
